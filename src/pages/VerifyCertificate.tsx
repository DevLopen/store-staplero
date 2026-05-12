import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Search, Shield, ChevronDown, ChevronUp } from "lucide-react";

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
    instructorName?: string;
    stufen?: string[];
    message?: string;
}

const STUFEN_LABELS: Record<string, string> = {
    stufe1:       "Stufe 1 – Frontgabelstapler / Mitgänger-Flurförderzeuge",
    stufe2:       "Stufe 2 – Schubmaststapler / Teleskopstapler / Containerstapler",
    stufe2_anbau: "Stufe 2 – Zusatzqualifizierung Anbaugeräte",
};

const TH = [
    { n:"1",  t:"Rechtliche Grundlagen",                             p:"10–15%" },
    { n:"2",  t:"Unfallgeschehen",                                   p:"5%"     },
    { n:"3",  t:"Aufbau/Funktion von Flurförderzeugen/Anbaugeräten", p:"5–10%"  },
    { n:"4",  t:"Antriebsarten",                                     p:"5–10%"  },
    { n:"5",  t:"Standsicherheit",                                   p:"10–15%" },
    { n:"6",  t:"Betrieb allgemein",                                 p:"15–20%" },
    { n:"7",  t:"Regelmäßige Prüfung",                               p:"5%"     },
    { n:"8",  t:"Umgang mit Last",                                   p:"10–15%" },
    { n:"9",  t:"Sondereinsätze",                                    p:"10–15%" },
    { n:"10", t:"Verkehrsregeln / Verkehrswege",                     p:""       },
];
const PR = [
    { n:"1",  t:"Einweisung am Flurförderzeug",                      p:"10–20%" },
    { n:"2",  t:"Tägliche Einsatzprüfung",                           p:""       },
    { n:"3",  t:"Lastschwerpunkt, Gewichtsverteilung, zul. Lasten",  p:""       },
    { n:"4",  t:"Gefahrstellen am Flurförderzeug",                   p:""       },
    { n:"5",  t:"Gewöhnung an das Flurförderzeug",                   p:"5%"     },
    { n:"6",  t:"Verlassen des Flurförderzeugs",                     p:""       },
    { n:"7",  t:"Fahr- und Stapelübungen",                           p:"55–65%" },
    { n:"8",  t:"Abschlussprüfung (15–20 min/Teilnehmer)",           p:"20%"    },
];

const fmtLong = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { year:"numeric", month:"long", day:"numeric" });

const TopicList = ({ topics, acc }: { topics: typeof TH; acc: string }) => (
    <div style={{ border:"1px solid #e5e7eb", borderTop:"none", borderRadius:"0 0 6px 6px", overflow:"hidden" }}>
        {topics.map((t, i) => (
            <div key={t.n} style={{
                display:"flex", alignItems:"center", gap:8, padding:"5px 10px",
                background: i%2===0?"#fff":"#f9fafb",
                borderTop: i>0?"1px solid #f3f4f6":"none",
            }}>
                <span style={{ fontSize:9, fontWeight:800, color:acc, width:16, flexShrink:0 }}>{t.n}.</span>
                <span style={{ fontSize:10, color:"#374151", flex:1 }}>{t.t}</span>
                {t.p && <span style={{ fontSize:9, color:"#9ca3af", fontWeight:600, flexShrink:0 }}>{t.p}</span>}
            </div>
        ))}
    </div>
);

const VerifyCertificate = () => {
    const { code } = useParams<{ code: string }>();
    const [result,      setResult]      = useState<VerifyResult | null>(null);
    const [loading,     setLoading]     = useState(false);
    const [manualCode,  setManualCode]  = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [showCurr,    setShowCurr]    = useState(false);

    const verify = async (c: string) => {
        setLoading(true);
        setHasSearched(true);
        setShowCurr(false);
        try {
            const res = await fetch(`${API_URL}/certificates/verify/${c.trim().toUpperCase()}`);
            setResult(await res.json());
        } catch {
            setResult({ valid:false, message:"Verbindungsfehler. Bitte erneut versuchen." });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (code) { setManualCode(code); verify(code); }
    }, [code]);

    const isP = result?.type === "practical";
    const acc = isP ? "#f59e0b" : "#2563eb";

    return (
        <div style={{ minHeight:"100vh", background:"#f3f4f6",
            display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", padding:"32px 16px", fontFamily:"'Inter','Helvetica Neue',sans-serif" }}>

            <div style={{ width:"100%", maxWidth:680 }}>

                {/* Logo */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                    <Link to="/" style={{ fontWeight:900, fontSize:22, color:"#111827",
                        textDecoration:"none", letterSpacing:-0.5 }}>
                        STAPLER<span style={{ color:"#f59e0b" }}>O</span>
                    </Link>
                    <p style={{ fontSize:10, fontWeight:700, color:"#9ca3af",
                        textTransform:"uppercase", letterSpacing:"0.1em" }}>
                        Zertifikatsverifizierung
                    </p>
                </div>

                {/* Card */}
                <div style={{ background:"#FAFAF7", borderRadius:20, overflow:"hidden",
                    boxShadow:"0 8px 32px rgba(0,0,0,0.1)", border:"2px solid #1e3a5f" }}>

                    <div style={{ height:5, background:"linear-gradient(90deg,#f59e0b,#d97706,#f59e0b)" }} />

                    {/* Header + search */}
                    <div style={{ padding:"24px 28px 20px" }}>
                        <div style={{ textAlign:"center", marginBottom:20 }}>
                            <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em",
                                color:"#f59e0b", textTransform:"uppercase", marginBottom:4 }}>Staplero</p>
                            <h1 style={{ fontSize:22, fontWeight:900, color:"#1e3a5f", marginBottom:4 }}>
                                Echtheitsprüfung
                            </h1>
                            <p style={{ fontSize:12, color:"#9ca3af" }}>
                                Prüfen Sie die Echtheit eines STAPLERO-Zertifikats — kostenlos, ohne Anmeldung
                            </p>
                        </div>

                        {/* Ornament */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                            <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
                            <div style={{ width:6, height:6, background:"#f59e0b", transform:"rotate(45deg)" }} />
                            <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
                        </div>

                        {/* Search */}
                        <form onSubmit={e => { e.preventDefault(); if (manualCode.trim()) verify(manualCode); }}
                              style={{ display:"flex", gap:8 }}>
                            <input
                                type="text" value={manualCode}
                                onChange={e => setManualCode(e.target.value.toUpperCase())}
                                placeholder="Zertifikat-Nummer, z.B. STPL-2025-AB7X"
                                style={{ flex:1, background:"#fff", border:"2px solid #e5e7eb",
                                    borderRadius:12, padding:"12px 16px", fontSize:13, fontFamily:"monospace",
                                    fontWeight:700, letterSpacing:"0.1em", color:"#111827",
                                    outline:"none", transition:"border-color .15s" }}
                                onFocus={e => e.currentTarget.style.borderColor="#f59e0b"}
                                onBlur={e  => e.currentTarget.style.borderColor="#e5e7eb"}
                            />
                            <button type="submit" disabled={loading || !manualCode.trim()}
                                    style={{ display:"flex", alignItems:"center", gap:6, padding:"12px 20px",
                                        borderRadius:12, border:"none", cursor:"pointer", fontFamily:"inherit",
                                        fontSize:13, fontWeight:700, whiteSpace:"nowrap",
                                        background: loading||!manualCode.trim() ? "#e5e7eb" : "#1e3a5f",
                                        color: loading||!manualCode.trim() ? "#9ca3af" : "#fff",
                                        transition:"all .15s" }}>
                                {loading ? <Loader2 size={14} style={{animation:"spin .7s linear infinite"}} /> : <Search size={14} />}
                                Prüfen
                            </button>
                        </form>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div style={{ borderTop:"1px solid #e5e7eb", display:"flex",
                            flexDirection:"column", alignItems:"center", padding:"32px", gap:10 }}>
                            <div style={{ width:36, height:36, borderRadius:"50%",
                                border:"3px solid #f59e0b", borderTopColor:"transparent",
                                animation:"spin .7s linear infinite" }} />
                            <p style={{ fontSize:12, color:"#9ca3af" }}>Verifizierung läuft…</p>
                        </div>
                    )}

                    {/* Placeholder */}
                    {!loading && !hasSearched && (
                        <div style={{ borderTop:"1px solid #e5e7eb", display:"flex",
                            flexDirection:"column", alignItems:"center", padding:"32px", textAlign:"center" }}>
                            <Search size={28} color="#d1d5db" style={{ marginBottom:10 }} />
                            <p style={{ fontSize:13, color:"#9ca3af" }}>
                                Zertifikat-Nummer eingeben oder QR-Code auf dem Dokument scannen
                            </p>
                        </div>
                    )}

                    {/* Result */}
                    {!loading && result && (
                        <div style={{ borderTop:"1px solid #e5e7eb" }}>

                            {/* Status */}
                            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 28px",
                                background: result.valid?"#f0fdf4":result.revoked?"#fff7ed":"#fef2f2",
                                borderBottom:"1px solid #e5e7eb" }}>
                                {result.valid
                                    ? <CheckCircle size={22} color="#16a34a" />
                                    : result.revoked
                                        ? <AlertTriangle size={22} color="#ea580c" />
                                        : <XCircle size={22} color="#dc2626" />}
                                <p style={{ fontWeight:700, fontSize:14,
                                    color: result.valid?"#15803d":result.revoked?"#c2410c":"#b91c1c" }}>
                                    {result.valid ? "✓ Zertifikat gültig und echt"
                                        : result.revoked ? "⚠ Zertifikat wurde widerrufen"
                                            : "✗ Zertifikat nicht gefunden"}
                                </p>
                                {!result.valid && result.message && (
                                    <p style={{ fontSize:11, color:"#6b7280" }}>{result.message}</p>
                                )}
                            </div>

                            {result.valid && result.userName && (
                                <div style={{ padding:"20px 28px 24px" }}>

                                    {/* Two-col: name+qual | cert-nr */}
                                    <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:16, flexWrap:"wrap" }}>
                                        <div style={{ flex:1, minWidth:200 }}>
                                            <p style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>
                                                Hiermit wird bestätigt, dass
                                            </p>
                                            <h2 style={{ fontWeight:900, color:"#111827", lineHeight:1.2,
                                                wordBreak:"break-word", marginBottom:6,
                                                fontSize: (result.userName?.length??0)>26?"20px":(result.userName?.length??0)>18?"24px":"28px" }}>
                                                {result.userName}
                                            </h2>
                                            <div style={{ height:3, background:"#f59e0b", borderRadius:2,
                                                width:Math.min((result.userName?.length??10)*10+30,200)+"px", marginBottom:10 }} />
                                            <p style={{ fontSize:11, color:"#6b7280", marginBottom:3 }}>
                                                die Ausbildung zum Führen von Gabelstaplern gemäß
                                            </p>
                                            <p style={{ fontSize:12, fontWeight:700, color:"#1e3a5f", marginBottom:3 }}>
                                                DGUV Vorschrift 68 · DGUV Grundsatz 308-001
                                            </p>
                                            {isP ? (
                                                <p style={{ fontSize:11, color:"#6b7280" }}>
                                                    erfolgreich abgeschlossen hat und ist{" "}
                                                    <strong style={{ color:"#1e3a5f" }}>berechtigt, Flurförderzeuge selbstständig zu führen.</strong>
                                                </p>
                                            ) : (
                                                <div style={{ background:"#FEF2F2", borderLeft:"3px solid #dc2626",
                                                    padding:"6px 10px", borderRadius:"0 4px 4px 0" }}>
                                                    <p style={{ fontSize:10, color:"#991b1b", fontWeight:700, marginBottom:2 }}>HINWEIS</p>
                                                    <p style={{ fontSize:10, color:"#7f1d1d" }}>
                                                        Dieser Nachweis berechtigt nicht zum selbstständigen Führen von Flurförderzeugen.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Cert number box */}
                                        {result.verificationCode && (
                                            <div style={{ background:"#1e3a5f", borderRadius:12,
                                                padding:"12px 16px", textAlign:"center", flexShrink:0, minWidth:160 }}>
                                                <p style={{ fontSize:8, fontWeight:700, color:"rgba(255,255,255,0.5)",
                                                    textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                                                    Zertifikat-Nr.
                                                </p>
                                                <p style={{ fontFamily:"monospace", fontSize:14, fontWeight:900,
                                                    color:"#f59e0b", letterSpacing:"0.1em", wordBreak:"break-all" }}>
                                                    {result.verificationCode}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta grid */}
                                    <div style={{ display:"flex", flexWrap:"wrap", gap:"10px 28px",
                                        padding:"12px 0", borderTop:"1px solid #f3f4f6",
                                        borderBottom:"1px solid #f3f4f6", marginBottom:12 }}>
                                        {result.trainingDate && (
                                            <div>
                                                <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                                                    textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>
                                                    {isP ? "Kursdatum" : "Ausbildungsdatum"}
                                                </p>
                                                <p style={{ fontSize:13, fontWeight:800, color:"#1e3a5f" }}>
                                                    {fmtLong(result.trainingDate)}
                                                </p>
                                            </div>
                                        )}
                                        {result.trainingLocation && (
                                            <div>
                                                <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                                                    textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>
                                                    Ausbildungsort
                                                </p>
                                                <p style={{ fontSize:12, fontWeight:700, color:"#1e3a5f" }}>
                                                    {result.trainingLocation}
                                                </p>
                                            </div>
                                        )}
                                        {result.score !== undefined && (
                                            <div>
                                                <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                                                    textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>
                                                    Prüfungsergebnis
                                                </p>
                                                <p style={{ fontSize:12, fontWeight:700, color:"#1e3a5f" }}>
                                                    {result.score} %
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stufen */}
                                    {result.stufen && result.stufen.length > 0 && (
                                        <div style={{ marginBottom:12 }}>
                                            <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                                                textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                                                Qualifizierungsstufen (DGUV G 308-001)
                                            </p>
                                            {result.stufen.map(s => (
                                                <div key={s} style={{ display:"flex", alignItems:"flex-start",
                                                    gap:7, marginBottom:4 }}>
                                                    <div style={{ width:5, height:5, background:"#f59e0b",
                                                        transform:"rotate(45deg)", flexShrink:0, marginTop:4 }} />
                                                    <p style={{ fontSize:11, fontWeight:600, color:"#1e3a5f" }}>
                                                        {STUFEN_LABELS[s] || s}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Curriculum expandable */}
                                    <button onClick={() => setShowCurr(o => !o)}
                                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                                                width:"100%", padding:"10px 0", background:"none", border:"none",
                                                borderTop:"1px solid #e5e7eb", cursor:"pointer", fontFamily:"inherit",
                                                marginBottom: showCurr ? 10 : 0 }}>
                                        <span style={{ fontSize:11, fontWeight:700, color:"#4b5563" }}>
                                            {isP ? "Ausbildungsinhalte Theorie & Praxis" : "Theoretische Ausbildungsinhalte"}
                                        </span>
                                        {showCurr ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
                                    </button>

                                    {showCurr && (
                                        <div>
                                            <div style={{ background:"#1e3a5f", borderRadius:"6px 6px 0 0",
                                                padding:"5px 10px", marginBottom:1 }}>
                                                <span style={{ fontSize:9, fontWeight:800, color:"#fff", letterSpacing:"0.1em" }}>THEORIE</span>
                                            </div>
                                            <TopicList topics={TH} acc={acc} />

                                            {isP && (
                                                <div style={{ marginTop:8 }}>
                                                    <div style={{ background:"#f59e0b", borderRadius:"6px 6px 0 0",
                                                        padding:"5px 10px", marginBottom:1 }}>
                                                        <span style={{ fontSize:9, fontWeight:800, color:"#000", letterSpacing:"0.1em" }}>PRAXIS</span>
                                                    </div>
                                                    <TopicList topics={PR} acc={acc} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div style={{ display:"flex", alignItems:"center", gap:8,
                                        paddingTop:12, marginTop:12, borderTop:"1px solid #f3f4f6" }}>
                                        <Shield size={12} color="#f59e0b" />
                                        <p style={{ fontSize:10, color:"#9ca3af" }}>
                                            DGUV Vorschrift 68 · DGUV Grundsatz 308-001 · Ausgestellt von STAPLERO Ausbildungszentrum Görlitz
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p style={{ textAlign:"center", fontSize:11, color:"#9ca3af", marginTop:20 }}>
                    STAPLERO Ausbildungszentrum · Jakobstr. 13, 02826 Görlitz ·{" "}
                    <Link to="/" style={{ color:"#6b7280", textDecoration:"none" }}>staplero.com</Link>
                </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default VerifyCertificate;