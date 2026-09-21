import { useState, useEffect, useCallback } from "react";
import {
    Users, Search, Plus, CheckCircle, Mail, Loader2, Award,
    ChevronLeft, ChevronRight, RefreshCw, UserPlus, X,
    MapPin, Calendar, Filter, Download, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Participant {
    _id: string;
    orderNumber: string;
    seatIndex?: number;
    userName: string;
    userEmail: string;
    userPhone?: string;
    locationName: string;
    locationAddress: string;
    startDate: string;
    endDate: string;
    status: "confirmed" | "cancelled" | "completed";
    paidAt: string;
    createdAt: string;
    // manual entries
    isManual?: boolean;
    notes?: string;
}

interface CertificateInfo {
    verificationCode: string;
    issuedAt: string;
    stufen?: string[];
}

const STUFEN_LABELS: Record<string, string> = {
    stufe1:       "Stufe 1 – Frontgabelstapler / Mitgänger",
    stufe2:       "Stufe 2 – Schubmaststapler / Teleskopstapler",
    stufe2_anbau: "Stufe 2 – Zusatzqualifizierung Anbaugeräte",
};

const statusBadge = (s: string) => {
    if (s === "completed") return <Badge className="bg-green-500/15 text-green-600 border-green-200 text-xs">Abgeschlossen</Badge>;
    if (s === "cancelled") return <Badge className="bg-red-500/15 text-red-600 border-red-200 text-xs">Storniert</Badge>;
    return <Badge className="bg-blue-500/15 text-blue-600 border-blue-200 text-xs">Bestätigt</Badge>;
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric"
});

// ── Complete modal ────────────────────────────────────────────────────────────
const CompleteModal = ({
                           participant,
                           onClose,
                           onDone,
                       }: {
    participant: Participant;
    onClose: () => void;
    onDone: () => void;
}) => {
    const [instructorName, setInstructorName] = useState("");
    const [stufen, setStufen] = useState(["stufe1"]);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const authH = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const toggleStufe = (s: string) =>
        setStufen(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const submit = async () => {
        setLoading(true); setError("");
        try {
            const res = await fetch(
                `${API}/admin/practical-courses/participants/${participant._id}/complete`,
                {
                    method: "POST",
                    headers: authH(),
                    body: JSON.stringify({
                        instructorName: instructorName.trim() || undefined,
                        stufen,
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Fehler");
            setDone(true);
            onDone();
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                {done ? (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-7 h-7 text-green-500" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Zertifikat ausgestellt!</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                            PDF + Wallet-Links gesendet an
                        </p>
                        <p className="text-sm font-semibold">{participant.userEmail}</p>
                        <Button className="mt-5 w-full" onClick={onClose}>Schließen</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Kurs abschließen</h3>
                                    <p className="text-xs text-muted-foreground">{participant.userName}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Stufen selection */}
                        <div className="mb-4">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                                Qualifizierungsstufen (DGUV G 308-001)
                            </label>
                            <div className="space-y-2">
                                {Object.entries(STUFEN_LABELS).map(([key, label]) => (
                                    <label key={key} className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={stufen.includes(key)}
                                            onChange={() => toggleStufe(key)}
                                            className="mt-0.5 accent-amber-500"
                                        />
                                        <span className="text-sm leading-snug">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="mb-4">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                Name des Ausbilders (optional)
                            </label>
                            <input
                                type="text"
                                value={instructorName}
                                onChange={e => setInstructorName(e.target.value)}
                                placeholder="z.B. Bohdan Kutko"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="bg-muted/30 rounded-xl p-3 mb-4 text-xs text-muted-foreground space-y-1">
                            <p>✓ Kursant zostanie oznaczony jako <strong>ukończony</strong></p>
                            <p>✓ Certyfikat DGUV zostanie wystawiony</p>
                            <p>✓ Email z PDF + Apple/Google Wallet do <strong>{participant.userEmail}</strong></p>
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs mb-3 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                                Abbrechen
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                                onClick={submit}
                                disabled={loading || stufen.length === 0}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Award className="w-4 h-4 mr-2" />}
                                Bestätigen & Ausstellen
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ── Manual add modal ──────────────────────────────────────────────────────────
interface LocationDate { id: string; startDate: string; endDate: string; time: string; availableSpots: number }
interface LocationOption { _id: string; city: string; address: string; dates: LocationDate[] }

const AddManualModal = ({ onClose, onDone }: { onClose: () => void; onDone: () => void }) => {
    // "calendar" = zapis na konkretny termin w mieście (zajmuje miejsce),
    // "archive"  = wpis archiwalny z wolnym tekstem (bez wpływu na kalendarz)
    const [mode, setMode] = useState<"calendar" | "archive">("calendar");
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [locationId, setLocationId] = useState("");
    const [dateId, setDateId] = useState("");
    const [force, setForce] = useState(false);
    const [form, setForm] = useState({
        firstName: "", lastName: "", userEmail: "", userPhone: "",
        locationName: "", startDate: "", instructorName: "",
        stufen: ["stufe1"], notes: "", issueNow: false,
    });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
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
        // Archiwum: domyślnie od razu certyfikat (dawne zachowanie); kalendarz: dopiero po kursie
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
                ? { ...form, locationId, dateId, force }
                : { ...form };
            const res = await fetch(`${API}/admin/practical-courses/participants/manual`, {
                method: "POST",
                headers: authH(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Fehler");
            setDone(true);
            onDone();
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary";
    const labelCls = "text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                {done ? (
                    <div className="text-center py-4">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-2">Kursant hinzugefügt!</h3>
                        {mode === "calendar" && selectedDate && location && (
                            <p className="text-sm text-muted-foreground">
                                {location.city} · {fmtDate(selectedDate.startDate)} — Platz wurde reserviert.
                            </p>
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
                                    <h3 className="font-bold">Kursant manuell hinzufügen</h3>
                                    <p className="text-xs text-muted-foreground">Ręczne dopisanie kursanta</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tryb */}
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

                        {/* Kursant */}
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

                        {/* Termin */}
                        {mode === "calendar" ? (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={labelCls}>Standort *</label>
                                    <select value={locationId}
                                            onChange={e => { setLocationId(e.target.value); setDateId(""); setForce(false); }}
                                            className={inputCls}>
                                        <option value="">– wählen –</option>
                                        {locations.map(l => <option key={l._id} value={l._id}>{l.city}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Termin *</label>
                                    <select value={dateId} disabled={!location}
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
                                        Termin ist voll — trotzdem hinzufügen
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

                        {/* Zertifikat — nur gdy od razu wystawiamy */}
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

                        {/* Notes */}
                        <div className="mb-3">
                            <label className={labelCls}>Notizen (intern)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Uwagi wewnętrzne..."
                                rows={2}
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        {/* Issue now toggle */}
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

// ── Main component ────────────────────────────────────────────────────────────
const AdminParticipants = () => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState("");
    const [statusFilter, setStatusFilter] = useState<""|"confirmed"|"completed"|"cancelled">("");
    const [page, setPage]                 = useState(1);
    const [totalPages, setTotalPages]     = useState(1);
    const [total, setTotal]               = useState(0);
    const [completeModal, setCompleteModal] = useState<Participant | null>(null);
    const [addModal, setAddModal]           = useState(false);
    const [resendLoading, setResendLoading] = useState<string | null>(null);

    const authH = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const fetchParticipants = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page), limit: "20",
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
            });
            const res = await fetch(`${API}/admin/practical-courses/participants/all?${params}`, {
                headers: authH(),
            });
            if (res.ok) {
                const data = await res.json();
                setParticipants(data.participants || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            }
        } catch {}
        finally { setLoading(false); }
    }, [page, search, statusFilter]);

    useEffect(() => { fetchParticipants(); }, [fetchParticipants]);
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const resend = async (participantId: string, email: string) => {
        setResendLoading(participantId);
        try {
            const res = await fetch(
                `${API}/admin/practical-courses/participants/${participantId}/resend-certificate`,
                { method: "POST", headers: authH() }
            );
            if (res.ok) alert(`E-Mail erneut gesendet an ${email}`);
            else { const d = await res.json(); alert(d.message); }
        } catch {} finally { setResendLoading(null); }
    };

    const stats = {
        total,
        confirmed:  participants.filter(p => p.status === "confirmed").length,
        completed:  participants.filter(p => p.status === "completed").length,
        cancelled:  participants.filter(p => p.status === "cancelled").length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold">Kursanten-Archiv</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Alle Teilnehmer archivalisch · {total} gesamt
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchParticipants}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Aktualisieren
                    </Button>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black"
                            onClick={() => setAddModal(true)}>
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Manuell hinzufügen
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Gesamt", value: total, color: "text-foreground" },
                    { label: "Bestätigt", value: stats.confirmed, color: "text-blue-500" },
                    { label: "Abgeschlossen", value: stats.completed, color: "text-green-500" },
                    { label: "Storniert", value: stats.cancelled, color: "text-red-500" },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text" placeholder="Name oder E-Mail suchen…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                >
                    <option value="">Alle Status</option>
                    <option value="confirmed">Bestätigt</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="cancelled">Storniert</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : participants.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Keine Teilnehmer gefunden</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {["Teilnehmer", "Kurs", "Datum", "Status", "Aktionen"].map(h => (
                                    <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {participants.map((p, i) => (
                                <tr key={p._id}
                                    className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                                    {/* Teilnehmer */}
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-sm">{p.userName}</p>
                                            <p className="text-xs text-muted-foreground">{p.userEmail}</p>
                                            {p.userPhone && <p className="text-xs text-muted-foreground">{p.userPhone}</p>}
                                            {(p.seatIndex ?? 0) > 0 && (
                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium mr-1">Zusatzperson</span>
                                            )}
                                            {p.isManual && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Manuell</span>
                                            )}
                                        </div>
                                    </td>
                                    {/* Kurs */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-1.5">
                                            <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium">{p.locationName}</p>
                                                <p className="text-xs text-muted-foreground">{p.locationAddress}</p>
                                                <p className="text-xs text-muted-foreground">Bestellung: {p.orderNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Datum */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                            {fmtDate(p.startDate)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Registriert: {fmtDate(p.createdAt)}
                                        </p>
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        {statusBadge(p.status)}
                                    </td>
                                    {/* Aktionen */}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {p.status === "confirmed" && (
                                                <Button size="sm"
                                                        className="bg-green-600 hover:bg-green-500 text-white text-xs h-7 px-2.5"
                                                        onClick={() => setCompleteModal(p)}>
                                                    <Award className="w-3 h-3 mr-1" />
                                                    Bestehen
                                                </Button>
                                            )}
                                            {p.status === "completed" && (
                                                <button
                                                    onClick={() => resend(p._id, p.userEmail)}
                                                    disabled={resendLoading === p._id}
                                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 h-7"
                                                >
                                                    {resendLoading === p._id
                                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                                        : <Mail className="w-3 h-3" />}
                                                    Email senden
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Seite {page} von {totalPages} · {total} Teilnehmer
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p-1)} disabled={page <= 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page >= totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {completeModal && (
                <CompleteModal
                    participant={completeModal}
                    onClose={() => setCompleteModal(null)}
                    onDone={() => { setCompleteModal(null); fetchParticipants(); }}
                />
            )}
            {addModal && (
                <AddManualModal
                    onClose={() => setAddModal(false)}
                    onDone={() => { setAddModal(false); fetchParticipants(); }}
                />
            )}
        </div>
    );
};

export default AdminParticipants;