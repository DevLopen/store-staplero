import { useState, useEffect } from "react";
import { CheckCircle, Loader2, UserPlus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STUFEN_LABELS: Record<string, string> = {
    stufe1:       "Stufe 1 – Frontgabelstapler / Mitgänger",
    stufe2:       "Stufe 2 – Schubmaststapler / Teleskopstapler",
    stufe2_anbau: "Stufe 2 – Zusatzqualifizierung Anbaugeräte",
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

interface LocationDate { id: string; startDate: string; endDate: string; time: string; availableSpots: number }
interface LocationOption { _id: string; city: string; address: string; dates: LocationDate[] }

interface Props {
    onClose: () => void;
    onDone: () => void;
    /** Wstępnie wybrany termin (np. po kliknięciu "Kursant hinzufügen" na liście danego terminu) */
    presetLocationId?: string;
    presetDateId?: string;
}

/**
 * Ręczne dopisanie kursanta (np. rezerwacja telefoniczna).
 *  - "Termin aus Kalender": kursant trafia na listę wybranego terminu i zajmuje miejsce,
 *    opcjonalnie dostaje mail z potwierdzeniem.
 *  - "Archiv": wpis archiwalny bez wpływu na kalendarz (dawny tryb).
 */
const AddParticipantModal = ({ onClose, onDone, presetLocationId, presetDateId }: Props) => {
    const locked = !!(presetLocationId && presetDateId);
    const [mode, setMode] = useState<"calendar" | "archive">("calendar");
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [locationId, setLocationId] = useState(presetLocationId || "");
    const [dateId, setDateId] = useState(presetDateId || "");
    const [force, setForce] = useState(false);
    const [sendConfirmation, setSendConfirmation] = useState(true);
    const [form, setForm] = useState({
        firstName: "", lastName: "", userEmail: "", userPhone: "",
        locationName: "", startDate: "", instructorName: "",
        stufen: ["stufe1"], notes: "", issueNow: false,
    });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState<null | { confirmationSent?: boolean }>(null);
    const [error, setError] = useState("");

    const authH = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    useEffect(() => {
        fetch(`${API}/locations`)
            .then(r => (r.ok ? r.json() : []))
            .then((data: LocationOption[]) => setLocations(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const location = locations.find(l => l._id === locationId);
    const selectedDate = location?.dates.find(d => d.id === dateId);
    const dateFull = !!selectedDate && selectedDate.availableSpots <= 0;

    const changeMode = (m: "calendar" | "archive") => {
        setMode(m);
        setError("");
        setForm(f => ({ ...f, issueNow: m === "archive" }));
    };

    const toggleStufe = (s: string) =>
        setForm(f => ({ ...f, stufen: f.stufen.includes(s) ? f.stufen.filter(x => x !== s) : [...f.stufen, s] }));

    const submit = async () => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.userEmail.trim()) {
            setError("Vorname, Nachname und E-Mail sind Pflichtfelder."); return;
        }
        if (mode === "calendar" && (!locationId || !dateId)) {
            setError("Bitte Standort und Termin auswählen."); return;
        }
        if (mode === "archive" && !form.startDate) {
            setError("Kursdatum ist ein Pflichtfeld."); return;
        }
        setLoading(true); setError("");
        try {
            const body = mode === "calendar"
                ? { ...form, locationId, dateId, force, sendConfirmation }
                : { ...form };
            const res = await fetch(`${API}/admin/practical-courses/participants/manual`, {
                method: "POST",
                headers: authH(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Fehler");
            setDone({ confirmationSent: data.confirmationSent });
            onDone();
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary";
    const labelCls = "text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                {done ? (
                    <div className="text-center py-4">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-2">Kursant hinzugefügt!</h3>
                        {mode === "calendar" && selectedDate && location && (
                            <p className="text-sm text-muted-foreground">
                                {location.city} · {fmtDate(selectedDate.startDate)}: Platz wurde reserviert.
                            </p>
                        )}
                        {done.confirmationSent === true && (
                            <p className="text-sm text-green-600 mt-1">Bestätigungs-E-Mail wurde gesendet.</p>
                        )}
                        {done.confirmationSent === false && (
                            <p className="text-sm text-red-500 mt-1">Die Bestätigungs-E-Mail konnte nicht gesendet werden.</p>
                        )}
                        {form.issueNow && <p className="text-sm text-muted-foreground">Zertifikat ausgestellt und per E-Mail gesendet.</p>}
                        <Button className="mt-5 w-full" onClick={onClose}>Schließen</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Kursant hinzufügen</h3>
                                    <p className="text-xs text-muted-foreground">z. B. bei telefonischer Reservierung</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Schließen">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {!locked && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {([
                                    ["calendar", "Termin aus Kalender"],
                                    ["archive", "Archiv (freie Eingabe)"],
                                ] as const).map(([m, label]) => (
                                    <button key={m} type="button" onClick={() => changeMode(m)}
                                            className={`text-sm font-medium rounded-lg border-2 py-2 px-3 transition-colors ${
                                                mode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                                            }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className={labelCls}>Vorname *</label>
                                <input type="text" value={form.firstName} placeholder="Jan"
                                       onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Nachname *</label>
                                <input type="text" value={form.lastName} placeholder="Kowalski"
                                       onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>E-Mail *</label>
                                <input type="email" value={form.userEmail} placeholder="jan@example.com"
                                       onChange={e => setForm(f => ({ ...f, userEmail: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Telefon</label>
                                <input type="text" value={form.userPhone} placeholder="+48 123 456 789"
                                       onChange={e => setForm(f => ({ ...f, userPhone: e.target.value }))} className={inputCls} />
                            </div>
                        </div>

                        {mode === "calendar" ? (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={labelCls}>Standort *</label>
                                    <select value={locationId} disabled={locked}
                                            onChange={e => { setLocationId(e.target.value); setDateId(""); setForce(false); }}
                                            className={inputCls}>
                                        <option value="">– wählen –</option>
                                        {locations.map(l => <option key={l._id} value={l._id}>{l.city}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Termin *</label>
                                    <select value={dateId} disabled={!location || locked}
                                            onChange={e => { setDateId(e.target.value); setForce(false); }}
                                            className={inputCls}>
                                        <option value="">– wählen –</option>
                                        {(location?.dates || [])
                                            .slice()
                                            .sort((a, b) => a.startDate.localeCompare(b.startDate))
                                            .map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {fmtDate(d.startDate)} · {d.availableSpots} frei
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                {dateFull && (
                                    <label className="col-span-2 flex items-center gap-2 text-sm p-2.5 rounded-lg bg-red-500/10 text-red-500 cursor-pointer">
                                        <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="accent-red-500" />
                                        Termin ist voll, trotzdem hinzufügen
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={labelCls}>Kursdatum *</label>
                                    <input type="date" value={form.startDate}
                                           onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Ausbildungsort</label>
                                    <input type="text" value={form.locationName} placeholder="Berlin"
                                           onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} className={inputCls} />
                                </div>
                            </div>
                        )}

                        {mode === "calendar" && (
                            <label className="flex items-center gap-2.5 cursor-pointer mb-3 p-3 rounded-xl bg-muted/30 border border-border">
                                <input type="checkbox" checked={sendConfirmation}
                                       onChange={e => setSendConfirmation(e.target.checked)}
                                       className="accent-amber-500 w-4 h-4" />
                                <div>
                                    <p className="text-sm font-semibold">Bestätigungs-E-Mail senden</p>
                                    <p className="text-xs text-muted-foreground">Termine, Anreise und Ablauf gehen an die angegebene E-Mail</p>
                                </div>
                            </label>
                        )}

                        {form.issueNow && (
                            <>
                                <div className="mb-3">
                                    <label className={labelCls}>Ausbilder</label>
                                    <input type="text" value={form.instructorName} placeholder="Bohdan Kutko"
                                           onChange={e => setForm(f => ({ ...f, instructorName: e.target.value }))} className={inputCls} />
                                </div>
                                <div className="mb-3">
                                    <label className={`${labelCls} mb-2`}>Qualifizierungsstufen</label>
                                    <div className="space-y-1.5">
                                        {Object.entries(STUFEN_LABELS).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border hover:bg-muted/40">
                                                <input type="checkbox" checked={form.stufen.includes(key)}
                                                       onChange={() => toggleStufe(key)} className="accent-amber-500" />
                                                <span className="text-sm">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mb-3">
                            <label className={labelCls}>Notizen (intern)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="z. B. telefonisch reserviert am ..."
                                rows={2}
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <label className="flex items-center gap-2.5 cursor-pointer mb-4 p-3 rounded-xl bg-muted/30 border border-border">
                            <input type="checkbox" checked={form.issueNow}
                                   onChange={e => setForm(f => ({ ...f, issueNow: e.target.checked }))}
                                   className="accent-amber-500 w-4 h-4" />
                            <div>
                                <p className="text-sm font-semibold">Zertifikat sofort ausstellen</p>
                                <p className="text-xs text-muted-foreground">Kurs als abgeschlossen markieren, Zertifikat per E-Mail senden</p>
                            </div>
                        </label>

                        {error && (
                            <p className="text-red-400 text-xs mb-3 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" /> {error}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                                Abbrechen
                            </Button>
                            <Button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black" onClick={submit}
                                    disabled={loading || (dateFull && !force)}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                Hinzufügen
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddParticipantModal;
