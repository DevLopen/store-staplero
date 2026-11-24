import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/i18n/translations";
import { API, authHeaders, fill, fmtDate } from "./panelUtils";

// Panel kupującego: lista miejsc zamówienia (kilka osób albo kupujący bez udziału).
// Wolne miejsce → e-mail; zaproszone → zmiana e-maila, ponowna wysyłka, cofnięcie; zajęte → tylko odczyt.

type SeatStatus = "open" | "invited" | "claimed" | "expired";
export type OwnerSeat = {
    id: string; seatIndex: number; kind: "online" | "practical"; status: SeatStatus; isBuyer: boolean;
    email: string | null; firstName: string | null; lastName: string | null;
    expiresAt: string | null; onlineExpiresAt: string | null; courseEndsAt: string | null;
    invitedAt: string | null; linkExpiresAt: string | null; claimedAt: string | null; sendsLeft: number;
};

const S = {
    title:      { de: "Plätze", en: "Places", uk: "Місця", pl: "Miejsca" },
    seatN:      { de: "Platz {n}", en: "Place {n}", uk: "Місце {n}", pl: "Miejsce {n}" },
    hint:       { de: "Jede Person bekommt ihren eigenen Zugang, sobald Sie ihre E-Mail-Adresse eintragen. Der Zugang läuft ab dem Kauf bis {d}.", en: "Each person gets their own access as soon as you enter their email address. Access runs from the purchase until {d}.", uk: "Кожна особа отримає власний доступ, щойно ви вкажете її електронну адресу. Доступ діє з моменту покупки до {d}.", pl: "Każda osoba dostaje własny dostęp, gdy tylko wpiszesz jej adres e-mail. Dostęp liczy się od zakupu do {d}." },
    hintPack:   { de: "Jede Person bekommt ihren eigenen Zugang, sobald Sie ihre E-Mail-Adresse eintragen. Der Online-Zugang läuft ab dem Kauf bis {d}, der Platz im Kurs gilt für den Kurstag am {c}.", en: "Each person gets their own access as soon as you enter their email address. Online access runs from the purchase until {d}; the course place is for the course day on {c}.", uk: "Кожна особа отримає власний доступ, щойно ви вкажете її адресу. Онлайн-доступ діє з моменту покупки до {d}, місце на курсі — на день курсу {c}.", pl: "Każda osoba dostaje własny dostęp, gdy tylko wpiszesz jej adres e-mail. Dostęp online liczy się od zakupu do {d}, miejsce na kursie obowiązuje w dniu kursu {c}." },
    hintPract:  { de: "Jede Person bekommt eine eigene Einladung, sobald Sie ihre E-Mail-Adresse eintragen, und sieht den Termin in ihrem Kundenkonto. Eintragen können Sie bis zum Kurstag am {d}.", en: "Each person gets their own invitation as soon as you enter their email address and sees the date in their account. You can add addresses until the course day on {d}.", uk: "Кожна особа отримає власне запрошення, щойно ви вкажете її адресу, і бачитиме дату у своєму кабінеті. Додати адреси можна до дня курсу, {d}.", pl: "Każda osoba dostaje własne zaproszenie, gdy tylko wpiszesz jej adres e-mail, i widzi termin w swoim panelu. Adresy możesz wpisać do dnia kursu, {d}." },
    open:       { de: "offen", en: "open", uk: "вільне", pl: "wolne" },
    invited:    { de: "eingeladen", en: "invited", uk: "запрошено", pl: "zaproszono" },
    claimed:    { de: "aktiviert", en: "activated", uk: "активовано", pl: "aktywowane" },
    expired:    { de: "abgelaufen", en: "expired", uk: "минуло", pl: "wygasło" },
    you:        { de: "Sie", en: "You", uk: "Ви", pl: "Ty" },
    noName:     { de: "Noch niemand eingetragen", en: "Nobody added yet", uk: "Ще нікого не додано", pl: "Nikt jeszcze nie został wpisany" },
    noEmail:    { de: "Keine E-Mail-Adresse", en: "No email address", uk: "Без електронної адреси", pl: "Brak adresu e-mail" },
    accessTo:   { de: "Zugang bis {d}", en: "Access until {d}", uk: "Доступ до {d}", pl: "Dostęp do {d}" },
    courseOn:   { de: "Kurstag {d}", en: "Course day {d}", uk: "День курсу {d}", pl: "Dzień kursu {d}" },
    invitedOn:  { de: "Einladung gesendet am {d}", en: "Invitation sent on {d}", uk: "Запрошення надіслано {d}", pl: "Zaproszenie wysłane {d}" },
    addEmail:   { de: "E-Mail eintragen", en: "Add email", uk: "Додати ел. пошту", pl: "Wpisz e-mail" },
    changeEmail:{ de: "Ändern", en: "Change", uk: "Змінити", pl: "Zmień" },
    resend:     { de: "Erneut senden", en: "Send again", uk: "Надіслати ще раз", pl: "Wyślij ponownie" },
    withdraw:   { de: "Zurückziehen", en: "Withdraw", uk: "Відкликати", pl: "Wycofaj" },
    withdrawQ:  { de: "Einladung wirklich zurückziehen? Der Link funktioniert dann nicht mehr.", en: "Really withdraw the invitation? The link will stop working.", uk: "Справді відкликати запрошення? Посилання перестане працювати.", pl: "Na pewno wycofać zaproszenie? Link przestanie działać." },
    withdrawYes:{ de: "Ja, zurückziehen", en: "Yes, withdraw", uk: "Так, відкликати", pl: "Tak, wycofaj" },
    send:       { de: "Einladung senden", en: "Send invitation", uk: "Надіслати запрошення", pl: "Wyślij zaproszenie" },
    save:       { de: "Speichern", en: "Save", uk: "Зберегти", pl: "Zapisz" },
    cancel:     { de: "Abbrechen", en: "Cancel", uk: "Скасувати", pl: "Anuluj" },
    email:      { de: "E-Mail-Adresse", en: "Email address", uk: "Електронна адреса", pl: "Adres e-mail" },
    firstName:  { de: "Vorname", en: "First name", uk: "Ім’я", pl: "Imię" },
    lastName:   { de: "Nachname", en: "Last name", uk: "Прізвище", pl: "Nazwisko" },
    changeNote: { de: "Die alte Einladung funktioniert nach dem Ändern nicht mehr.", en: "The old invitation stops working after the change.", uk: "Після зміни старе запрошення перестане працювати.", pl: "Po zmianie stare zaproszenie przestanie działać." },
    claimedNote:{ de: "Aktiviert. Änderungen nur über [info@staplero.de].", en: "Activated. Changes only via [info@staplero.de].", uk: "Активовано. Зміни лише через [info@staplero.de].", pl: "Aktywowane. Zmiany tylko przez [info@staplero.de]." },
    expiredNote:{ de: "Dieser Platz ist abgelaufen und kann nicht mehr vergeben werden.", en: "This place has expired and can no longer be assigned.", uk: "Термін цього місця минув, його вже не можна призначити.", pl: "To miejsce wygasło i nie można go już przydzielić." },
    sent:       { de: "Einladung an {e} gesendet", en: "Invitation sent to {e}", uk: "Запрошення надіслано на {e}", pl: "Zaproszenie wysłane na {e}" },
    withdrawn:  { de: "Einladung zurückgezogen", en: "Invitation withdrawn", uk: "Запрошення відкликано", pl: "Zaproszenie wycofane" },
    saved:      { de: "Gespeichert", en: "Saved", uk: "Збережено", pl: "Zapisano" },
    loadErr:    { de: "Plätze konnten nicht geladen werden.", en: "Places could not be loaded.", uk: "Не вдалося завантажити місця.", pl: "Nie udało się wczytać miejsc." },
    errEmail:   { de: "Bitte prüfen Sie die E-Mail-Adresse.", en: "Please check the email address.", uk: "Перевірте електронну адресу.", pl: "Sprawdź adres e-mail." },
    errDup:     { de: "Diese E-Mail-Adresse ist in der Bestellung schon eingetragen.", en: "This email address is already used in this order.", uk: "Ця адреса вже вказана в цьому замовленні.", pl: "Ten adres e-mail jest już wpisany w tym zamówieniu." },
    errName:    { de: "Bitte Vor- und Nachname eintragen.", en: "Please enter first and last name.", uk: "Вкажіть ім’я та прізвище.", pl: "Wpisz imię i nazwisko." },
    errRate:    { de: "Zu viele Einladungen in kurzer Zeit. Bitte versuchen Sie es morgen erneut.", en: "Too many invitations in a short time. Please try again tomorrow.", uk: "Забагато запрошень за короткий час. Спробуйте завтра.", pl: "Zbyt wiele zaproszeń w krótkim czasie. Spróbuj jutro." },
    errExpired: { de: "Dieser Platz ist abgelaufen.", en: "This place has expired.", uk: "Термін цього місця минув.", pl: "To miejsce wygasło." },
    errClaimed: { de: "Dieser Platz ist schon aktiviert. Änderungen nur über info@staplero.de.", en: "This place is already activated. Changes only via info@staplero.de.", uk: "Це місце вже активовано. Зміни лише через info@staplero.de.", pl: "To miejsce jest już aktywowane. Zmiany tylko przez info@staplero.de." },
    errMail:    { de: "Die E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.", en: "The email could not be sent. Please try again.", uk: "Не вдалося надіслати лист. Спробуйте ще раз.", pl: "Nie udało się wysłać wiadomości. Spróbuj ponownie." },
    errServer:  { de: "Das hat nicht geklappt. Bitte laden Sie die Seite neu.", en: "That did not work. Please reload the page.", uk: "Не вдалося. Оновіть сторінку.", pl: "Nie udało się. Odśwież stronę." },
    sendsLeft:  { de: "Heute noch {n}× senden möglich", en: "{n} more sends possible today", uk: "Сьогодні ще {n} надсилань", pl: "Dziś jeszcze {n} wysyłek" },
} as const;
type SK = keyof typeof S;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERR: Record<string, SK> = {
    INVALID_EMAIL: "errEmail", DUPLICATE_EMAIL: "errDup", NAME_REQUIRED: "errName", NAME_TOO_LONG: "errName",
    RATE_LIMITED: "errRate", SEAT_EXPIRED: "errExpired", SEAT_CLAIMED: "errClaimed", MAIL_FAILED: "errMail",
};
const PILL: Record<SeatStatus, string> = { open: "draft", invited: "warn", claimed: "ok", expired: "bad" };

export default function OrderSeats({ orderId, title, orderNumber, onToast }: {
    orderId: string; title: string; orderNumber: string; onToast: (msg: string, error?: boolean) => void;
}) {
    const { language } = useLanguage();
    const lang = language as Language;
    const s = (k: SK, v: Record<string, string | number> = {}) => fill(S[k][lang] ?? S[k].de, v);
    const [seats, setSeats] = useState<OwnerSeat[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [edit, setEdit] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
    const [formErr, setFormErr] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(() => {
        fetch(`${API}/orders/${orderId}/seats`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((d) => { setSeats(d.seats || []); setFailed(false); })
            .catch(() => setFailed(true));
    }, [orderId]);
    useEffect(() => { load(); }, [load]);

    const replace = (seat: OwnerSeat) => setSeats((prev) => (prev || []).map((x) => (x.id === seat.id ? seat : x)));

    const call = async (seat: OwnerSeat, path: string, method: "PATCH" | "POST", body?: object) => {
        setBusy(seat.id);
        setFormErr(null);
        try {
            const r = await fetch(`${API}/orders/${orderId}/seats/${seat.id}${path}`, {
                method, headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(body || {}),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) {
                const key = ERR[d.code] || (r.status === 429 ? "errRate" : "errServer");
                if (edit === seat.id) setFormErr(s(key)); else onToast(s(key), true);
                if (d.code === "SEAT_CLAIMED" || d.code === "SEAT_STATE") load();
                return null;
            }
            replace(d.seat);
            return d.seat as OwnerSeat;
        } catch {
            onToast(s("errServer"), true);
            return null;
        } finally {
            setBusy(null);
        }
    };

    const startEdit = (seat: OwnerSeat) => {
        setConfirm(null);
        setFormErr(null);
        setForm({ email: seat.email || "", firstName: seat.firstName || "", lastName: seat.lastName || "" });
        setEdit(seat.id);
    };

    const save = async (seat: OwnerSeat) => {
        const email = form.email.trim();
        if (email && (!EMAIL_RE.test(email) || email.length > 254)) return setFormErr(s("errEmail"));
        const dup = email && (seats || []).some((x) => x.id !== seat.id && x.email && x.email.toLowerCase() === email.toLowerCase());
        if (dup) return setFormErr(s("errDup"));
        const body: Record<string, string> = {};
        if (seat.kind === "practical") {
            if (!form.firstName.trim() || !form.lastName.trim()) return setFormErr(s("errName"));
            if (form.firstName.trim() !== (seat.firstName || "") || form.lastName.trim() !== (seat.lastName || "")) {
                body.firstName = form.firstName.trim();
                body.lastName = form.lastName.trim();
            }
        }
        if (email) body.email = email;
        else if (seat.kind !== "practical") return setFormErr(s("errEmail"));
        const updated = await call(seat, "", "PATCH", body);
        if (!updated) return;
        setEdit(null);
        onToast(email && (updated.status === "invited" && (email !== seat.email || seat.status === "open")) ? s("sent", { e: email }) : s("saved"));
    };

    if (failed) return <section className="pn-card"><div className="pn-hd"><h3>{s("title")} · {title}</h3></div><p className="pn-muted" style={{ padding: 16 }}>{s("loadErr")}</p></section>;
    if (!seats) return null;
    if (!seats.length) return null;

    const online = seats.find((x) => x.onlineExpiresAt)?.onlineExpiresAt;
    const course = seats.find((x) => x.courseEndsAt)?.courseEndsAt;
    const hint = online && course ? s("hintPack", { d: fmtDate(online, lang), c: fmtDate(course, lang) })
        : online ? s("hint", { d: fmtDate(online, lang) }) : course ? s("hintPract", { d: fmtDate(course, lang) }) : "";
    const free = seats.filter((x) => x.status === "open").length;

    return (
        <section className="pn-card pn-seats" aria-label={`${s("title")} · ${orderNumber}`}>
            <div className="pn-hd">
                <div style={{ minWidth: 0 }}>
                    <h3>{s("title")} · {title}</h3>
                    <span className="pn-muted" style={{ fontSize: 12.5 }}>{orderNumber}</span>
                </div>
                {free > 0 && <span className="pn-pill draft">{free}× {s("open")}</span>}
            </div>
            {hint && <p className="pn-seats-hint">{hint}</p>}
            <ul className="pn-seat-list">
                {seats.map((seat) => {
                    const name = [seat.firstName, seat.lastName].filter(Boolean).join(" ");
                    const editing = edit === seat.id;
                    const until = seat.onlineExpiresAt ? s("accessTo", { d: fmtDate(seat.onlineExpiresAt, lang) })
                        : seat.courseEndsAt ? s("courseOn", { d: fmtDate(seat.courseEndsAt, lang) }) : "";
                    const claimedNote = s("claimedNote").split(/\[(.+?)\]/).map((part, i) =>
                        i % 2 ? <a key={i} href={`mailto:${part}`}>{part}</a> : part);
                    return (
                        <li key={seat.id} className={`pn-seat ${seat.status}`}>
                            <div className="pn-seat-top">
                                <b>{s("seatN", { n: seat.seatIndex + 1 })}</b>
                                <span className={`pn-pill ${PILL[seat.status]}`}>{s(seat.status)}</span>
                            </div>
                            <div className="pn-seat-who">
                                <span className="n">{seat.isBuyer ? `${name || s("you")} (${s("you")})` : name || (seat.status === "open" || seat.status === "expired" ? s("noName") : "")}</span>
                                <span className="e">{seat.email || s("noEmail")}</span>
                                <span className="m">{[until, seat.status === "invited" && seat.invitedAt ? s("invitedOn", { d: fmtDate(seat.invitedAt, lang) }) : ""].filter(Boolean).join(" · ")}</span>
                            </div>

                            {editing ? (
                                <form className="pn-seat-form" onSubmit={(e) => { e.preventDefault(); save(seat); }} noValidate>
                                    {seat.kind === "practical" && (
                                        <div className="row2">
                                            <label className="pn-field"><span>{s("firstName")}</span>
                                                <input autoComplete="off" value={form.firstName} maxLength={50} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
                                            <label className="pn-field"><span>{s("lastName")}</span>
                                                <input autoComplete="off" value={form.lastName} maxLength={50} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
                                        </div>
                                    )}
                                    <label className="pn-field"><span>{s("email")}</span>
                                        <input type="email" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="off" value={form.email}
                                            aria-invalid={!!formErr || undefined} onChange={(e) => { setForm({ ...form, email: e.target.value }); setFormErr(null); }} /></label>
                                    {seat.status === "invited" && <p className="pn-note">{s("changeNote")}</p>}
                                    {formErr && <p className="pn-seat-err" role="alert">{formErr}</p>}
                                    <div className="pn-acts">
                                        <button type="submit" className="pn-btn p" disabled={busy === seat.id}>{seat.status === "open" && form.email.trim() ? s("send") : seat.status === "invited" && form.email.trim().toLowerCase() !== (seat.email || "") ? s("send") : s("save")}</button>
                                        <button type="button" className="pn-btn o" onClick={() => { setEdit(null); setFormErr(null); }}>{s("cancel")}</button>
                                    </div>
                                </form>
                            ) : confirm === seat.id ? (
                                <div className="pn-seat-form">
                                    <p className="pn-note">{s("withdrawQ")}</p>
                                    <div className="pn-acts">
                                        <button type="button" className="pn-btn p" disabled={busy === seat.id}
                                            onClick={async () => { if (await call(seat, "/withdraw", "POST")) { setConfirm(null); onToast(s("withdrawn")); } }}>{s("withdrawYes")}</button>
                                        <button type="button" className="pn-btn o" onClick={() => setConfirm(null)}>{s("cancel")}</button>
                                    </div>
                                </div>
                            ) : seat.status === "open" ? (
                                <div className="pn-acts"><button type="button" className="pn-btn p" onClick={() => startEdit(seat)}>{s("addEmail")}</button></div>
                            ) : seat.status === "invited" ? (
                                <div className="pn-acts">
                                    <button type="button" className="pn-btn o" disabled={busy === seat.id || seat.sendsLeft <= 0}
                                        title={s("sendsLeft", { n: seat.sendsLeft })}
                                        onClick={async () => { if (await call(seat, "/resend", "POST")) onToast(s("sent", { e: seat.email || "" })); }}>{s("resend")}</button>
                                    <button type="button" className="pn-btn o" onClick={() => startEdit(seat)}>{s("changeEmail")}</button>
                                    <button type="button" className="pn-btn o" onClick={() => { setEdit(null); setConfirm(seat.id); }}>{s("withdraw")}</button>
                                </div>
                            ) : seat.status === "claimed" ? (
                                !seat.isBuyer && <p className="pn-note"><span>{claimedNote}</span></p>
                            ) : (
                                <p className="pn-note">{s("expiredNote")}</p>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
