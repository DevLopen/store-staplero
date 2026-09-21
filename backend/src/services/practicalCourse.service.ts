import PracticalCourseParticipant, { PracticalCourseParticipantDoc } from "../models/PracticalCourseParticipant";
import Location from "../models/Location";
import { OrderDoc } from "../models/Order";
import { resolveName } from "../utils/name";

/**
 * Zapisz na kurs WSZYSTKIE osoby z opłaconego zamówienia:
 * kupującego (seatIndex 0) + dodatkowych uczestników (seatIndex 1..n).
 *
 * Funkcja jest idempotentna — można ją bezpiecznie wywołać ponownie (retry webhooka,
 * ręczna synchronizacja z panelu admina). Tworzy tylko brakujące miejsca.
 *
 * @returns created — uczestnicy utworzeni w tym wywołaniu (do zmniejszenia liczby wolnych miejsc),
 *          all     — wszyscy uczestnicy tego zamówienia
 */
export const addParticipantsToCourse = async (
    order: OrderDoc,
    buyer: { userId: string; name: string; firstName?: string; lastName?: string; email: string; phone?: string }
): Promise<{ created: PracticalCourseParticipantDoc[]; all: PracticalCourseParticipantDoc[] }> => {

    if (order.type !== "practical" || !order.practicalCourseDetails) {
        throw new Error("Order is not a practical course");
    }

    const details = order.practicalCourseDetails;
    const orderId = order._id.toString();
    const dateId = details.dateId || generateDateId(details.startDate, details.endDate);

    // Lista osób: kupujący + dodatkowi. Dodatkowi nie mają własnego e-maila ani konta —
    // dostają dane kontaktowe kupującego (certyfikat trafi na jego adres).
    const buyerNames = resolveName({ firstName: buyer.firstName, lastName: buyer.lastName, name: buyer.name });
    const people = [
        { seatIndex: 0, ...buyerNames },
        ...(details.additionalParticipants || []).map((p, i) => ({
            seatIndex: i + 1,
            ...resolveName({ firstName: p.firstName, lastName: p.lastName, name: p.name }),
        })),
    ];

    const existing = await PracticalCourseParticipant.find({ orderId });
    const existingSeats = new Set(existing.map((p) => p.seatIndex ?? 0));

    const created: PracticalCourseParticipantDoc[] = [];
    for (const person of people) {
        if (existingSeats.has(person.seatIndex)) continue;

        try {
            const participant = await PracticalCourseParticipant.create({
                userId: buyer.userId,
                userName: person.name,
                firstName: person.firstName,
                lastName: person.lastName,
                userEmail: buyer.email,
                userPhone: buyer.phone,
                seatIndex: person.seatIndex,
                orderId,
                orderNumber: order.orderNumber,
                paidAt: order.paidAt || new Date(),
                locationId: details.locationId,
                locationName: details.locationName,
                locationAddress: details.locationAddress,
                dateId,
                startDate: details.startDate,
                endDate: details.endDate,
                time: details.time,
                status: "confirmed",
                invoiceId: order.invoiceId,
                invoiceNumber: order.invoiceNumber,
            });
            created.push(participant);
            console.log(`✅ Participant added: ${person.name} (seat ${person.seatIndex}) for ${details.locationName} (${details.startDate})`);
        } catch (err: any) {
            // 11000 = duplicate key — równoległe wywołanie zdążyło utworzyć to miejsce, pomijamy
            if (err?.code !== 11000) throw err;
        }
    }

    const all = await PracticalCourseParticipant.find({ orderId }).sort({ seatIndex: 1 });
    return { created, all };
};

/**
 * Znajdź uczestnika po _id (preferowane — jednoznaczne) lub, dla wstecznej zgodności,
 * po numerze zamówienia (wtedy zwracana jest osoba kupująca, seatIndex 0).
 */
export const findParticipantByRef = async (ref: string) => {
    if (/^[a-f\d]{24}$/i.test(ref)) {
        const byId = await PracticalCourseParticipant.findById(ref);
        if (byId) return byId;
    }
    return PracticalCourseParticipant.findOne({ orderNumber: ref }).sort({ seatIndex: 1 });
};

/**
 * Get single participant by order number
 */
export const getParticipantByOrderNumber = async (ref: string) => {
    const participant = await findParticipantByRef(ref);
    return participant ? participant.toObject() : null;
};

/**
 * Mark participant as completed
 */
export const completeParticipant = async (ref: string) => {
    const found = await findParticipantByRef(ref);
    if (!found) throw new Error(`Teilnehmer ${ref} nicht gefunden`);
    found.status = "completed";
    await found.save();
    return found;
};

/**
 * Generuj ID terminu z dat (jeśli nie ma w order)
 */
const generateDateId = (startDate: string, endDate: string): string => {
    return `${startDate}_${endDate}`.replace(/\-/g, '');
};

/**
 * Zmniejsz liczbę dostępnych miejsc dla danego terminu
 */

/**
 * POPRAWKA: Znajdź indeks terminu w lokalizacji obsługując oba formaty dateId:
 * - Format timestamp: 'd1770293875752' (id z Location.dates[].id)
 * - Format dat: '20260302_20260303' (generowany ze startDate_endDate)
 */
export const findDateIndex = (location: any, dateId: string): number => {
    // 1. Szukaj bezpośrednio po id
    let idx = location.dates.findIndex((d: any) => d.id === dateId);
    if (idx !== -1) return idx;

    // 2. Jeśli format dat YYYYMMDD_YYYYMMDD, wyciągnij startDate i szukaj po nim
    const m = dateId.match(/^(\d{4})(\d{2})(\d{2})_(\d{4})(\d{2})(\d{2})$/);
    if (m) {
        const startDate = `${m[1]}-${m[2]}-${m[3]}`;
        idx = location.dates.findIndex((d: any) => d.startDate === startDate);
        if (idx !== -1) return idx;
    }

    return -1;
};

export const decreaseAvailableSpots = async (
    locationId: string,
    dateId: string,
    count: number = 1
): Promise<void> => {
    if (count <= 0) return;
    try {
        const location = await Location.findById(locationId);

        if (!location) {
            console.error(`❌ Location not found: ${locationId}`);
            return;
        }

        const dateIndex = findDateIndex(location, dateId);

        if (dateIndex === -1) {
            console.error(`❌ Date not found: ${dateId} in location ${locationId} (tried both id and startDate)`);
            return;
        }

        const currentSpots = location.dates[dateIndex].availableSpots;

        if (currentSpots > 0) {
            // Nie schodzimy poniżej 0 (schema ma min: 0) — nadwyżkę zgłaszamy w logu
            const newSpots = Math.max(0, currentSpots - count);
            location.dates[dateIndex].availableSpots = newSpots;
            await location.save();

            console.log(`✅ Decreased spots for ${location.city} (${dateId}): ${currentSpots} → ${newSpots}`);
            if (currentSpots < count) {
                console.warn(`⚠️ Overbooked ${location.city} (${dateId}): needed ${count}, had ${currentSpots}`);
            }
        } else {
            console.warn(`⚠️ No available spots for ${location.city} (${dateId})`);
        }
    } catch (error: any) {
        console.error(`❌ Failed to decrease available spots:`, error.message);
    }
};

/**
 * Pobierz listę uczestników dla danego terminu
 */
/**
 * Pobierz startDate dla danego dateId z lokalizacji.
 * Potrzebne bo dateId może być w formacie timestamp ('d1770293875752')
 * a uczestnicy mają dateId w formacie '20260302_20260303'.
 */
const getStartDateFromLocation = async (locationId: string, dateId: string): Promise<string | null> => {
    const location = await Location.findById(locationId).lean();
    if (!location) return null;
    const date = (location as any).dates?.find((d: any) => d.id === dateId);
    return date?.startDate || null;
};

export const getParticipantsByDate = async (
    locationId: string,
    dateId: string
): Promise<PracticalCourseParticipantDoc[]> => {
    // POPRAWKA: obsłuż oba formaty dateId
    // Format timestamp 'd...' vs format dat '20260302_20260303'
    const isTimestampFormat = /^d\d+$/.test(dateId);

    let query: any = { locationId, status: { $ne: "cancelled" } };

    if (isTimestampFormat) {
        // Pobierz startDate z lokalizacji i szukaj po startDate
        const startDate = await getStartDateFromLocation(locationId, dateId);
        if (startDate) {
            query.startDate = startDate;
        } else {
            query.dateId = dateId;
        }
    } else {
        // Format dat - szukaj po dateId lub startDate (z dateId wyciągnij startDate)
        const m = dateId.match(/^(\d{4})(\d{2})(\d{2})_(\d{4})(\d{2})(\d{2})$/);
        const startDate = m ? `${m[1]}-${m[2]}-${m[3]}` : null;
        query.$or = [
            { dateId },
            ...(startDate ? [{ startDate }] : []),
        ];
        query.locationId = locationId;
        delete query.dateId;
    }

    return await PracticalCourseParticipant.find(query).sort({ createdAt: 1 });
};

/**
 * Pobierz listę uczestników dla danej lokalizacji
 */
export const getParticipantsByLocation = async (
    locationId: string
): Promise<PracticalCourseParticipantDoc[]> => {
    return await PracticalCourseParticipant.find({
        locationId,
        status: { $ne: "cancelled" }
    }).sort({ startDate: 1, createdAt: 1 });
};

/**
 * Pobierz wszystkich uczestników (z filtrowaniem)
 */
export const getAllParticipants = async (filters?: {
    locationId?: string;
    dateId?: string;
    startDate?: string;
    status?: string;
}): Promise<PracticalCourseParticipantDoc[]> => {
    const query: any = {};

    if (filters?.locationId) query.locationId = filters.locationId;
    if (filters?.dateId) query.dateId = filters.dateId;
    if (filters?.startDate) query.startDate = filters.startDate;
    if (filters?.status) query.status = filters.status;

    return await PracticalCourseParticipant.find(query).sort({ startDate: 1, createdAt: 1 });
};

/**
 * Pobierz liczbę uczestników dla danego terminu
 */
export const getParticipantsCount = async (
    locationId: string,
    dateId: string
): Promise<number> => {
    // POPRAWKA: użyj tej samej logiki co getParticipantsByDate
    const participants = await getParticipantsByDate(locationId, dateId);
    return participants.length;
};

/**
 * Anuluj uczestnictwo (np. przy storno)
 */
export const cancelParticipant = async (
    ref: string
): Promise<void> => {
    const participant = await findParticipantByRef(ref);

    if (participant && participant.status !== "cancelled") {
        participant.status = "cancelled";
        await participant.save();

        // Zwiększ z powrotem liczbę miejsc (wpisy ręczne spoza kalendarza nie mają terminu w Location)
        if (participant.locationId !== "manual" && !participant.overbooked) {
            await increaseAvailableSpots(participant.locationId, participant.dateId);
        }

        console.log(`✅ Participant cancelled: ${participant.userName} (${ref})`);
    }
};

/**
 * Zwiększ liczbę dostępnych miejsc (przy anulowaniu)
 */
export const increaseAvailableSpots = async (
    locationId: string,
    dateId: string
): Promise<void> => {
    try {
        const location = await Location.findById(locationId);

        if (!location) return;

        const dateIndex = findDateIndex(location, dateId);

        if (dateIndex !== -1) {
            location.dates[dateIndex].availableSpots += 1;
            await location.save();

            console.log(`✅ Increased spots for ${location.city} (${dateId})`);
        }
    } catch (error: any) {
        console.error(`❌ Failed to increase available spots:`, error.message);
    }
};

export default {
    addParticipantsToCourse,
    findParticipantByRef,
    findDateIndex,
    decreaseAvailableSpots,
    getParticipantsByDate,
    getParticipantsByLocation,
    getAllParticipants,
    getParticipantsCount,
    cancelParticipant,
    increaseAvailableSpots,
    getParticipantByOrderNumber,
    completeParticipant
};