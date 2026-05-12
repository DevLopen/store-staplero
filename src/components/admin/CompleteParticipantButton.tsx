import { useState } from "react";
import { CheckCircle, Mail, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompleteParticipantButtonProps {
    orderNumber: string;
    participantName: string;
    participantEmail: string;
    currentStatus: "confirmed" | "cancelled" | "completed";
    onCompleted: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CompleteParticipantButton = ({
                                       orderNumber,
                                       participantName,
                                       participantEmail,
                                       currentStatus,
                                       onCompleted,
                                   }: CompleteParticipantButtonProps) => {
    const [showModal, setShowModal] = useState(false);
    const [instructorName, setInstructorName] = useState("");
    const [stufen, setStufen] = useState(["stufe1"]);
    const [loading, setLoading] = useState(false);

    const STUFEN_LABELS: Record<string, string> = {
        stufe1:       "Stufe 1 – Frontgabelstapler / Mitgänger",
        stufe2:       "Stufe 2 – Schubmaststapler / Teleskopstapler",
        stufe2_anbau: "Stufe 2 – Zusatzqualifizierung Anbaugeräte",
    };
    const toggleStufe = (s: string) =>
        setStufen(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    const [resendLoading, setResendLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const authHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const handleComplete = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `${API_URL}/admin/practical-courses/participants/${orderNumber}/complete`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({ instructorName: instructorName.trim() || undefined, stufen }),
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Fehler");
            setDone(true);
            onCompleted();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError("");
        try {
            const res = await fetch(
                `${API_URL}/admin/practical-courses/participants/${orderNumber}/resend-certificate`,
                { method: "POST", headers: authHeaders() }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Fehler");
            alert(`E-Mail erneut gesendet an ${participantEmail}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setResendLoading(false);
        }
    };

    if (currentStatus === "cancelled") {
        return (
            <span className="text-xs text-muted-foreground italic">Storniert</span>
        );
    }

    if (currentStatus === "completed") {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Abgeschlossen
                </div>
                <button
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    title="Zertifikats-E-Mail erneut senden"
                >
                    {resendLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Mail className="w-3 h-3" />
                    )}
                    Erneut senden
                </button>
            </div>
        );
    }

    // confirmed state
    return (
        <>
            <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="bg-green-600 hover:bg-green-500 text-white text-xs h-8 px-3"
            >
                <Award className="w-3.5 h-3.5 mr-1.5" />
                Abschließen
            </Button>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
                        {done ? (
                            <div className="text-center py-6">
                                <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-7 h-7 text-green-400" />
                                </div>
                                <h3 className="font-bold text-foreground text-lg mb-2">Fertig!</h3>
                                <p className="text-muted-foreground text-sm mb-1">
                                    Zertifikat wurde ausgestellt.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    E-Mail mit PDF + Wallet-Links gesendet an{" "}
                                    <strong>{participantEmail}</strong>
                                </p>
                                <Button
                                    className="mt-6 w-full"
                                    onClick={() => setShowModal(false)}
                                >
                                    Schließen
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">Kurs abschließen</h3>
                                        <p className="text-muted-foreground text-xs">{participantName}</p>
                                    </div>
                                </div>

                                <div className="bg-muted/30 rounded-xl p-4 mb-4 text-sm text-muted-foreground space-y-1">
                                    <p>✓ Participant wird als <strong>completed</strong> markiert</p>
                                    <p>✓ Staplerschein-Zertifikat wird ausgestellt</p>
                                    <p>✓ E-Mail mit PDF + Apple/Google Wallet an <strong>{participantEmail}</strong></p>
                                </div>

                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                                    Qualifizierungsstufen
                                </label>
                                <div className="space-y-1.5 mb-4">
                                    {Object.entries(STUFEN_LABELS).map(([key, label]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border hover:bg-muted/40 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={stufen.includes(key)}
                                                onChange={() => toggleStufe(key)}
                                                className="accent-amber-500"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>

                                <label className="block text-xs text-muted-foreground mb-1.5">
                                    Name des Ausbilders (optional)
                                </label>
                                <input
                                    type="text"
                                    value={instructorName}
                                    onChange={(e) => setInstructorName(e.target.value)}
                                    placeholder="z.B. Bohdan Kutko"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary"
                                />

                                {error && (
                                    <p className="text-red-400 text-xs mb-3 bg-red-500/10 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowModal(false)}
                                        disabled={loading}
                                    >
                                        Abbrechen
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                                        onClick={handleComplete}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <Award className="w-4 h-4 mr-2" />
                                        )}
                                        Bestätigen & Ausstellen
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default CompleteParticipantButton;