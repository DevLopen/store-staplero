import { useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export interface EditableParticipant {
    _id: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    userEmail: string;
    userPhone?: string;
    notes?: string;
    photoUrl?: string;
    status?: string;
}

interface Props {
    participant: EditableParticipant;
    onClose: () => void;
    /** Wywoływane po każdej zmianie (zapis danych, wgranie lub usunięcie zdjęcia), żeby odświeżyć listę */
    onSaved: () => void;
}

// Dla starych wpisów bez firstName/lastName rozbijamy pełne imię i nazwisko
const splitName = (p: EditableParticipant) => {
    if (p.firstName || p.lastName) return { first: p.firstName || "", last: p.lastName || "" };
    const parts = (p.userName || "").trim().split(/\s+/);
    return { first: parts[0] || "", last: parts.slice(1).join(" ") };
};

const EditParticipantModal = ({ participant, onClose, onSaved }: Props) => {
    const initial = splitName(participant);
    const [form, setForm] = useState({
        firstName: initial.first,
        lastName: initial.last,
        userEmail: participant.userEmail || "",
        userPhone: participant.userPhone || "",
        notes: participant.notes || "",
    });
    const [photoUrl, setPhotoUrl] = useState<string | undefined>(participant.photoUrl);
    const [saving, setSaving] = useState(false);
    const [photoBusy, setPhotoBusy] = useState(false);
    const [error, setError] = useState("");
    const [savedMsg, setSavedMsg] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const authOnly = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
    const base = `${API}/admin/practical-courses/participants/${participant._id}`;

    const save = async () => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.userEmail.trim()) {
            setError("Vorname, Nachname und E-Mail sind Pflichtfelder."); return;
        }
        setSaving(true); setError(""); setSavedMsg("");
        try {
            const res = await fetch(base, {
                method: "PUT",
                headers: { ...authOnly(), "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Fehler beim Speichern");
            setSavedMsg("Gespeichert.");
            onSaved();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // dozwól ponowny wybór tego samego pliku
        if (!file) return;
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setError("Nur JPG- und PNG-Dateien sind erlaubt."); return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            setError("Das Foto ist zu groß (max. 5 MB)."); return;
        }
        setPhotoBusy(true); setError(""); setSavedMsg("");
        try {
            const fd = new FormData();
            fd.append("photo", file);
            const res = await fetch(`${base}/photo`, { method: "POST", headers: authOnly(), body: fd });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Upload fehlgeschlagen");
            setPhotoUrl(data.participant?.photoUrl);
            setSavedMsg("Foto gespeichert.");
            onSaved();
        } catch (err: any) { setError(err.message); }
        finally { setPhotoBusy(false); }
    };

    const removePhoto = async () => {
        setPhotoBusy(true); setError(""); setSavedMsg("");
        try {
            const res = await fetch(`${base}/photo`, { method: "DELETE", headers: authOnly() });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Fehler beim Entfernen");
            setPhotoUrl(undefined);
            setSavedMsg("Foto entfernt.");
            onSaved();
        } catch (err: any) { setError(err.message); }
        finally { setPhotoBusy(false); }
    };

    const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary";
    const labelCls = "text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                            <Pencil className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold">Kursant bearbeiten</h3>
                            <p className="text-xs text-muted-foreground">{participant.userName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Schließen">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Foto: wykorzystywane na certyfikacie */}
                <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="w-[70px] h-[90px] shrink-0 rounded-md overflow-hidden bg-muted border border-border flex items-center justify-center">
                        {photoUrl
                            ? <img src={photoUrl} alt={`Foto ${participant.userName}`} className="w-full h-full object-cover" />
                            : <Camera className="w-7 h-7 text-muted-foreground/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Foto für das Zertifikat</p>
                        <p className="text-xs text-muted-foreground mb-2.5">
                            JPG oder PNG, max. 5 MB. Ideal: Passfoto im Hochformat (35 × 45 mm). Es wird auf dem Zertifikat abgedruckt.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onFile} />
                            <Button size="sm" variant="outline" className="h-8" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                                {photoBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
                                {photoUrl ? "Foto ersetzen" : "Foto hochladen"}
                            </Button>
                            {photoUrl && (
                                <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={removePhoto} disabled={photoBusy}>
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Entfernen
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className={labelCls}>Vorname *</label>
                        <input type="text" value={form.firstName} className={inputCls}
                               onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Nachname *</label>
                        <input type="text" value={form.lastName} className={inputCls}
                               onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>E-Mail *</label>
                        <input type="email" value={form.userEmail} className={inputCls}
                               onChange={e => setForm(f => ({ ...f, userEmail: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Telefon</label>
                        <input type="text" value={form.userPhone} className={inputCls}
                               onChange={e => setForm(f => ({ ...f, userPhone: e.target.value }))} />
                    </div>
                </div>
                <div className="mb-3">
                    <label className={labelCls}>Notizen (intern)</label>
                    <textarea value={form.notes} rows={2} className={`${inputCls} resize-none`}
                              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                {participant.status === "completed" && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-3">
                        Ein bereits ausgestelltes Zertifikat übernimmt Namensänderungen nicht. Das Foto wird beim erneuten Senden bzw. Herunterladen des Zertifikats aktualisiert.
                    </p>
                )}

                {error && (
                    <p className="text-red-400 text-xs mb-3 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                    </p>
                )}
                {savedMsg && !error && (
                    <p className="text-green-600 text-xs mb-3 bg-green-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {savedMsg}
                    </p>
                )}

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Schließen</Button>
                    <Button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black" onClick={save} disabled={saving || photoBusy}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                        Speichern
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditParticipantModal;
