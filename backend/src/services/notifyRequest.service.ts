import Location, { CourseDate, LocationDoc } from "../models/Location";
import NotifyRequest, { NotifyRequestDoc } from "../models/NotifyRequest";
import Product from "../models/Product";
import emailService from "./email.service";

const FRONTEND_URL = process.env.FRONTEND_URL || "https://staplero.de";

const todayIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date()); // "2026-09-29"

/** Termin, na który da się teraz zapisać: są wolne miejsca i jeszcze się nie zaczął */
const isBookable = (d: CourseDate) => d.availableSpots > 0 && d.startDate >= todayIso();

/**
 * Terminy, które właśnie stały się dostępne: nowe albo wcześniej pełne / bez miejsc.
 * `before` = stan lokalizacji przed zapisem (null przy tworzeniu nowej lokalizacji).
 */
export const findNewlyBookableDates = (before: LocationDoc | null, after: LocationDoc): CourseDate[] => {
  if (!after.isActive) return [];
  const wasBookable = new Set(
    before?.isActive ? before.dates.filter(isBookable).map((d) => d.id) : []
  );
  return after.dates.filter((d) => isBookable(d) && !wasBookable.has(d.id));
};

type LocationDates = { location: LocationDoc; dates: CourseDate[] };

/** Wysyła mail do jednego oczekującego i oznacza go jako powiadomionego */
const notifyOne = async (request: NotifyRequestDoc, groups: LocationDates[]): Promise<boolean> => {
  const product = await Product.findById(request.productId).select("slug").lean();
  const productUrl = product?.slug ? `${FRONTEND_URL}/kursy/${product.slug}` : `${FRONTEND_URL}/kursy`;

  const flat = groups.flatMap(({ location, dates }) =>
    dates.map((d) => ({ location, d }))
  ).sort((a, b) => a.d.startDate.localeCompare(b.d.startDate));

  try {
    await emailService.sendNewCourseDatesEmail({
      to: request.email,
      productTitle: request.productTitle || "Staplerschein",
      productUrl,
      dates: flat.map(({ location, d }) => ({
        city: location.city,
        address: location.address,
        startDate: d.startDate,
        endDate: d.endDate,
        time: d.time,
        availableSpots: d.availableSpots,
      })),
    });
  } catch (err: any) {
    await NotifyRequest.updateOne({ _id: request._id }, { $set: { lastError: err.message } });
    console.error(`❌ Termin-Benachrichtigung an ${request.email} fehlgeschlagen:`, err.message);
    return false;
  }

  await NotifyRequest.updateOne(
    { _id: request._id },
    {
      $set: {
        notified: true,
        notifiedAt: new Date(),
        notifiedManually: false,
        notifiedDates: flat.map(({ location, d }) => ({
          locationId: location._id.toString(),
          locationCity: location.city,
          dateId: d.id,
          startDate: d.startDate,
          endDate: d.endDate,
        })),
      },
      $unset: { lastError: 1 },
    }
  );
  return true;
};

/**
 * Po dodaniu terminu powiadamia wszystkich oczekujących na tę lokalizację
 * oraz tych, którzy zapisali się bez wyboru lokalizacji (wtedy nie było żadnej).
 */
export const notifyWaitingForLocation = async (
  location: LocationDoc,
  dates: CourseDate[]
): Promise<{ sent: number; failed: number }> => {
  if (dates.length === 0) return { sent: 0, failed: 0 };

  const locationId = location._id.toString();
  const waiting = await NotifyRequest.find({
    notified: false,
    $or: [{ locationId }, { locationId: { $in: [null, ""] } }],
  });

  let sent = 0;
  let failed = 0;
  for (const request of waiting) {
    // sendMail sam ponawia przy rate limit, więc wysyłamy po kolei
    (await notifyOne(request, [{ location, dates }])) ? sent++ : failed++;
  }
  if (waiting.length) {
    console.log(`🔔 Neue Termine ${location.city}: ${sent} benachrichtigt, ${failed} fehlgeschlagen`);
  }
  return { sent, failed };
};

/**
 * Ręczna wysyłka z panelu admina dla jednego zgłoszenia — bierze aktualnie dostępne terminy
 * jego lokalizacji (albo wszystkich lokalizacji, jeśli zgłoszenie było bez lokalizacji).
 */
export const notifyRequestNow = async (requestId: string): Promise<NotifyRequestDoc | null> => {
  const request = await NotifyRequest.findById(requestId);
  if (!request) return null;

  const locations = await Location.find(
    request.locationId ? { _id: request.locationId, isActive: true } : { isActive: true }
  );
  const groups = locations
    .map((location) => ({ location, dates: location.dates.filter(isBookable) }))
    .filter((g) => g.dates.length > 0);

  if (groups.length === 0) {
    throw new Error("Für diesen Standort gibt es aktuell keinen buchbaren Termin");
  }

  const ok = await notifyOne(request, groups);
  if (!ok) {
    const fresh = await NotifyRequest.findById(requestId);
    throw new Error(fresh?.lastError || "E-Mail konnte nicht gesendet werden");
  }
  return NotifyRequest.findById(requestId);
};

export default {
  findNewlyBookableDates,
  notifyWaitingForLocation,
  notifyRequestNow,
};
