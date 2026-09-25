import { Language } from "@/i18n/translations";

export const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const authHeaders = (): HeadersInit => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const LOCALES: Record<Language, string> = { de: "de-DE", en: "en-GB", pl: "pl-PL", uk: "uk-UA" };
const TZ = "Europe/Berlin";

/** Tłumaczenie z podstawieniem {zmiennych} */
export const fill = (text: string, vars: Record<string, string | number> = {}) =>
    Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), text);

export const fmtDate = (d: string | Date, lang: Language, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) =>
    new Date(d).toLocaleDateString(LOCALES[lang], { timeZone: TZ, ...opts });

export const fmtShortDay = (d: string | Date, lang: Language) =>
    fmtDate(d, lang, { weekday: "short", day: "numeric", month: "short" });

export const fmtMoney = (v: number, lang: Language) =>
    new Intl.NumberFormat(LOCALES[lang], { style: "currency", currency: "EUR" }).format(v || 0);

export const addDays = (d: string | Date, days: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
};

/** Pełne dni do daty (0 = dziś) */
export const daysUntil = (d: string | Date) => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const target = new Date(d); target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - start.getTime()) / 86_400_000);
};

// Godziny kursu praktycznego (tak samo jak w mailu z potwierdzeniem)
const COURSE_FROM = "090000";
const COURSE_TO = "170000";

const calendarDay = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d).replace(/-/g, "");

export const calendarUrl = (start: string | Date, address: string, orderNumber: string) => {
    const day = calendarDay(new Date(start));
    return "https://calendar.google.com/calendar/render?action=TEMPLATE"
        + `&text=${encodeURIComponent("STAPLERO Gabelstaplerausbildung")}`
        + `&dates=${day}T${COURSE_FROM}/${day}T${COURSE_TO}`
        + `&ctz=${encodeURIComponent(TZ)}`
        + `&recur=${encodeURIComponent("RRULE:FREQ=DAILY;COUNT=2")}`
        + `&location=${encodeURIComponent(address)}`
        + `&details=${encodeURIComponent(`Bestellnummer ${orderNumber}`)}`;
};

export const routeUrl = (address: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export interface PanelCertificate {
    _id: string;
    verificationCode: string;
    type: "online" | "practical";
    userName: string;
    courseName: string;
    trainingDate: string;
    trainingLocation?: string;
    issuedAt: string;
    score?: number;
    instructorName?: string;
    stufen?: string[];
}

export interface Booking {
    orderNumber: string;
    start: Date;
    end: Date;
    city: string;
    address: string;
    participants: string[];
    daysLeft: number;
    finished: boolean;
}

/** Terminy kursów praktycznych z opłaconych zamówień, najbliższy pierwszy */
export const bookingsFromOrders = (orders: any[], userName: string): Booking[] =>
    (orders || [])
        .filter((o) => o.type === "practical" && o.status === "paid" && o.practicalCourseDetails?.startDate)
        .map((o) => {
            const d = o.practicalCourseDetails;
            const start = new Date(d.startDate);
            const end = addDays(start, 1);
            const left = daysUntil(start);
            return {
                orderNumber: o.orderNumber,
                start,
                end,
                city: d.locationName,
                address: d.locationAddress,
                participants: [userName, ...(d.additionalParticipants || []).map((p: any) => p.name)].filter(Boolean),
                daysLeft: left,
                finished: daysUntil(end) < 0,
            };
        })
        .sort((a, b) => Number(a.finished) - Number(b.finished) || a.start.getTime() - b.start.getTime());

export const verifyUrl = (code: string) => `${window.location.origin}/verify/${code}`;

export const walletBannerUrl = (code: string) => `${API}/certificates/wallet-banner/${code}.png`;

// Program szkolenia (DGUV G 308-001) — jak na certyfikacie, bez procentów
export const THEORY_TOPICS = [
    "Rechtliche Grundlagen", "Unfallgeschehen", "Aufbau/Funktion von Flurförderzeugen/Anbaugeräten", "Antriebsarten",
    "Standsicherheit", "Betrieb allgemein", "Regelmäßige Prüfung", "Umgang mit Last", "Sondereinsätze", "Verkehrsregeln / Verkehrswege",
];
export const PRACTICE_TOPICS = [
    "Einweisung am Flurförderzeug", "Tägliche Einsatzprüfung", "Lastschwerpunkt, Gewichtsverteilung, zul. Lasten",
    "Gefahrstellen am Flurförderzeug", "Gewöhnung an das Flurförderzeug", "Verlassen des Flurförderzeugs",
    "Fahr- und Stapelübungen", "Abschlussprüfung (15–20 min/Teilnehmer)",
];
