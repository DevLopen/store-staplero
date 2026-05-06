import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Search, Shield } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface VerifyResult {
    valid: boolean;
    revoked?: boolean;
    type?: "online" | "practical";
    userName?: string;
    courseName?: string;
    trainingDate?: string;
    trainingLocation?: string;
    issuedAt?: string;
    verificationCode?: string;
    score?: number;
    message?: string;
}

const fmtLong = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });

const MetaCell = ({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) => (
    <div className={wide ? "col-span-2" : ""}>
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-[#1e3a5f] leading-snug">{value}</p>
    </div>
);

const VerifyCertificate = () => {
    const { code } = useParams<{ code: string }>();
    const [result,      setResult]      = useState<VerifyResult | null>(null);
    const [loading,     setLoading]     = useState(false);
    const [manualCode,  setManualCode]  = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    const verify = async (c: string) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const res = await fetch(`${API_URL}/certificates/verify/${c.trim().toUpperCase()}`);
            setResult(await res.json());
        } catch {
            setResult({ valid: false, message: "Verbindungsfehler. Bitte erneut versuchen." });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (code) { setManualCode(code); verify(code); }
    }, [code]);

    return (
        /* Full-screen centered, no inner scroll */
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full" style={{ maxWidth: 720 }}>

                {/* Logo row */}
                <div className="flex items-center justify-between mb-6">
                    <Link to="/" className="font-black text-2xl tracking-tight text-gray-900">
                        STAPLER<span className="text-amber-500">O</span>
                    </Link>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Zertifikatsverifizierung
                    </p>
                </div>

                {/* Main card */}
                <div className="rounded-2xl overflow-hidden shadow-lg"
                     style={{ border: "2px solid #1e3a5f", background: "#FAFAF7" }}>

                    {/* Amber top stripe */}
                    <div className="h-1.5" style={{ background: "linear-gradient(90deg,#f59e0b,#d97706,#f59e0b)" }} />

                    <div className="p-8">

                        {/* Header */}
                        <div className="text-center mb-6">
                            <p className="text-[10px] font-black tracking-[0.4em] text-amber-500 uppercase mb-1">
                                Staplero
                            </p>
                            <h1 className="text-2xl font-black text-[#1e3a5f] tracking-wide mb-1">
                                Echtheitsprüfung
                            </h1>
                            <p className="text-xs text-gray-400">
                                Prüfen Sie die Echtheit eines STAPLERO-Zertifikats — kostenlos und ohne Anmeldung
                            </p>
                        </div>

                        {/* Ornament */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className="w-1.5 h-1.5 rotate-45 bg-amber-400" />
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Search bar */}
                        <form onSubmit={e => { e.preventDefault(); if (manualCode.trim()) verify(manualCode); }}
                              className="flex gap-3 mb-6">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={e => setManualCode(e.target.value.toUpperCase())}
                                placeholder="Zertifikat-Nummer eingeben, z.B. STPL-2025-AB7X"
                                className="flex-1 bg-white border-2 border-gray-200 focus:border-amber-400 rounded-xl px-5 py-3 text-sm font-mono font-bold tracking-wider text-gray-800 placeholder-gray-300 focus:outline-none transition-colors uppercase"
                            />
                            <button
                                type="submit"
                                disabled={loading || !manualCode.trim()}
                                className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#163052] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap text-sm"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Prüfen
                            </button>
                        </form>

                        {/* ── Loading ── */}
                        {loading && (
                            <div className="flex flex-col items-center py-8 gap-3">
                                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs text-gray-400 tracking-wide">Verifizierung läuft…</p>
                            </div>
                        )}

                        {/* ── Placeholder ── */}
                        {!loading && !hasSearched && (
                            <div className="flex flex-col items-center py-8 gap-2 text-center">
                                <Search className="h-8 w-8 text-gray-300 mb-1" />
                                <p className="text-sm text-gray-400">
                                    Zertifikat-Nummer eingeben oder QR-Code auf dem Dokument scannen
                                </p>
                            </div>
                        )}

                        {/* ── Result ── */}
                        {!loading && result && (() => {
                            const isValid   = result.valid;
                            const isRevoked = result.revoked;

                            return (
                                <div className="rounded-xl overflow-hidden"
                                     style={{ border: `1.5px solid ${isValid ? "#bbf7d0" : isRevoked ? "#fed7aa" : "#fecaca"}` }}>

                                    {/* Status banner */}
                                    <div className={`flex items-center gap-3 px-5 py-3.5 ${
                                        isValid   ? "bg-green-50"
                                            : isRevoked ? "bg-orange-50"
                                                : "bg-red-50"
                                    }`}>
                                        {isValid
                                            ? <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                            : isRevoked
                                                ? <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0" />
                                                : <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />}
                                        <div>
                                            <p className={`font-bold text-sm ${
                                                isValid ? "text-green-700" : isRevoked ? "text-orange-700" : "text-red-700"
                                            }`}>
                                                {isValid   ? "✓ Zertifikat gültig und echt"
                                                    : isRevoked ? "⚠ Zertifikat wurde widerrufen"
                                                        : "✗ Zertifikat nicht gefunden"}
                                            </p>
                                            {!isValid && result.message && (
                                                <p className="text-xs text-gray-500 mt-0.5">{result.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Valid: full details in two-column layout */}
                                    {isValid && result.userName && (
                                        <div className="bg-white px-6 py-5">

                                            {/* Two columns: left text, right cert-number box */}
                                            <div className="flex gap-6 items-start">

                                                {/* Left */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-400 mb-1">Hiermit wird bestätigt, dass</p>
                                                    <h2 className="font-black text-gray-900 leading-tight break-words mb-2"
                                                        style={{ fontSize: (result.userName?.length ?? 0) > 28 ? "20px" : (result.userName?.length ?? 0) > 20 ? "24px" : "28px" }}>
                                                        {result.userName}
                                                    </h2>
                                                    <div className="h-0.5 bg-amber-400 rounded-full mb-3"
                                                         style={{ width: Math.min((result.userName?.length ?? 10) * 10 + 30, 220) + "px" }} />
                                                    <p className="text-xs text-gray-500 mb-0.5">
                                                        die Ausbildung zum Führen von Gabelstaplern gemäß
                                                    </p>
                                                    <p className="text-sm font-bold text-[#1e3a5f] mb-0.5">
                                                        DGUV Vorschrift 68 · DGUV Grundsatz 308-001
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        erfolgreich abgeschlossen hat.
                                                    </p>
                                                </div>

                                                {/* Right: cert number + shield */}
                                                <div className="flex-shrink-0 text-center">
                                                    <div className="rounded-xl px-5 py-3 text-center"
                                                         style={{ background: "#1e3a5f", minWidth: 160 }}>
                                                        <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mb-1">
                                                            Zertifikat-Nr.
                                                        </p>
                                                        <p className="font-mono font-black text-amber-400 tracking-widest leading-tight"
                                                           style={{ fontSize: (result.verificationCode?.length ?? 0) > 14 ? "12px" : "15px" }}>
                                                            {result.verificationCode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <div className="w-1.5 h-1.5 rotate-45 bg-amber-300" />
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>

                                            {/* Meta grid — 2 or 4 columns */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {result.trainingDate && (
                                                    <MetaCell label="Ausbildungsdatum" value={fmtLong(result.trainingDate)} />
                                                )}
                                                {result.issuedAt && (
                                                    <MetaCell label="Ausgestellt am" value={fmtLong(result.issuedAt)} />
                                                )}
                                                {result.courseName && (
                                                    <MetaCell label="Kurs" value={result.courseName} />
                                                )}
                                                {result.score !== undefined && (
                                                    <MetaCell label="Prüfungsergebnis" value={`${result.score} %`} />
                                                )}
                                                {result.trainingLocation && (
                                                    <MetaCell label="Ausbildungsort" value={result.trainingLocation} wide />
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                                <Shield className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                                <p className="text-[10px] text-gray-400">
                                                    DGUV Vorschrift 68 · DGUV Grundsatz 308-001 · Ausgestellt von STAPLERO Ausbildungszentrum Görlitz
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-5">
                    STAPLERO Ausbildungszentrum · Jakobstr. 13, 02826 Görlitz ·{" "}
                    <Link to="/" className="hover:text-gray-600 transition-colors">staplero.com</Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyCertificate;