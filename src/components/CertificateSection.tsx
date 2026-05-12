import { useState, useEffect } from "react";
import { Loader2, Download, CheckCircle, ExternalLink, Shield, Award, Wrench, ChevronDown, ChevronUp } from "lucide-react";

interface Certificate {
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

const API  = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE = window.location.origin;

const STUFEN_LABELS: Record<string, string> = {
    stufe1:      "Stufe 1 – Frontgabelstapler / Mitgänger-Flurförderzeuge",
    stufe2:      "Stufe 2 – Schubmaststapler / Teleskopstapler / Containerstapler",
    stufe2_anbau:"Stufe 2 – Zusatzqualifizierung Anbaugeräte",
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

const AppleIcon = () => (
    <svg viewBox="0 0 814 1000" width="13" height="15" fill="currentColor">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.5 0 663 0 541.8c0-207.5 135.4-317.5 268.4-317.5 99.8 0 183 65.8 245.8 65.8 59.2 0 152-69.1 269.1-69.1zm-135.2-84.8c-62 0-160 41.5-163.1 41.5-15.2 0-12.9-14.7-12.9-20.7 0-64.6 57.3-128.5 116.3-155.3 52.2-24 106.2-32.1 138-32.1 5.4 0 10.2.4 15.5 1.1 3.2 49.7-6.4 143.2-93.8 165.5z"/>
    </svg>
);
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="15" height="15">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("de-DE", { day:"2-digit", month:"long", year:"numeric" });

// Expandable curriculum section
const CurriculumSection = ({ isPractical }: { isPractical: boolean }) => {
    const [open, setOpen] = useState(false);
    const acc = isPractical ? "#f59e0b" : "#2563eb";
    const accBg = isPractical ? "#fffbeb" : "#eff6ff";

    return (
        <div style={{ borderTop: "1px solid #e5e7eb" }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "10px 20px",
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "inherit",
                }}
            >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4b5563" }}>
                    {isPractical ? "Ausbildungsinhalte Theorie & Praxis" : "Theoretische Ausbildungsinhalte"}
                </span>
                {open
                    ? <ChevronUp size={14} color="#9ca3af" />
                    : <ChevronDown size={14} color="#9ca3af" />}
            </button>

            {open && (
                <div style={{ padding: "0 20px 14px" }}>
                    {/* Theorie */}
                    <div style={{ background: "#1e3a5f", borderRadius: "6px 6px 0 0", padding: "5px 10px", marginBottom: 1 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>THEORIE</span>
                    </div>
                    <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 6px 6px", marginBottom: 8, overflow: "hidden" }}>
                        {TH.map((t, i) => (
                            <div key={t.n} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "5px 10px",
                                background: i % 2 === 0 ? "#fff" : "#f9fafb",
                                borderTop: i > 0 ? "1px solid #f3f4f6" : "none",
                            }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: acc, width: 16, flexShrink: 0 }}>{t.n}.</span>
                                <span style={{ fontSize: 10, color: "#374151", flex: 1 }}>{t.t}</span>
                                {t.p && <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, flexShrink: 0 }}>{t.p}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Praxis — only for practical */}
                    {isPractical && (
                        <>
                            <div style={{ background: acc, borderRadius: "6px 6px 0 0", padding: "5px 10px", marginBottom: 1 }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: "#000", letterSpacing: "0.1em" }}>PRAXIS</span>
                            </div>
                            <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
                                {PR.map((t, i) => (
                                    <div key={t.n} style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        padding: "5px 10px",
                                        background: i % 2 === 0 ? "#fff" : "#f9fafb",
                                        borderTop: i > 0 ? "1px solid #f3f4f6" : "none",
                                    }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: acc, width: 16, flexShrink: 0 }}>{t.n}.</span>
                                        <span style={{ fontSize: 10, color: "#374151", flex: 1 }}>{t.t}</span>
                                        {t.p && <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, flexShrink: 0 }}>{t.p}</span>}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// Main certificate card
const CertCard = ({ cert }: { cert: Certificate }) => {
    const [dlState,     setDlState]     = useState<"idle"|"loading"|"done">("idle");
    const [walletState, setWalletState] = useState<"idle"|"apple"|"google">("idle");
    const isP       = cert.type === "practical";
    const acc       = isP ? "#f59e0b" : "#2563eb";
    const accBg     = isP ? "#fffbeb" : "#eff6ff";
    const borderClr = isP ? "#1e3a5f" : "#1e40af";
    const verifyUrl = `${BASE}/verify/${cert.verificationCode}`;
    const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    const download = async () => {
        setDlState("loading");
        try {
            const res = await fetch(`${API}/certificates/${cert._id}/download`, { headers: authH() });
            if (!res.ok) throw new Error();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(await res.blob());
            a.download = `Staplerschein-${cert.verificationCode}.pdf`;
            a.click();
            setDlState("done");
            setTimeout(() => setDlState("idle"), 2800);
        } catch { alert("Download fehlgeschlagen."); setDlState("idle"); }
    };

    const wallet = async (type: "apple"|"google") => {
        setWalletState(type);
        try {
            const h = authH() as HeadersInit;
            if (type === "apple") {
                const res = await fetch(`${API}/certificates/${cert._id}/wallet/apple`, { headers: h });
                if (!res.ok) { const d = await res.json(); alert(d.setup || d.message); return; }
                const a = document.createElement("a");
                a.href = URL.createObjectURL(await res.blob());
                a.download = `Staplerschein-${cert.verificationCode}.pkpass`;
                a.click();
            } else {
                const res = await fetch(`${API}/certificates/${cert._id}/wallet/google`, { headers: h });
                const d = await res.json();
                if (!res.ok) { alert(d.setup || d.message); return; }
                window.open(d.url, "_blank");
            }
        } catch { alert("Fehler."); }
        finally { setWalletState("idle"); }
    };

    return (
        <div style={{ border: `2px solid ${borderClr}`, background: "#FAFAF7", borderRadius: 16,
            overflow: "hidden", boxShadow: "0 2px 16px rgba(30,58,95,0.08)" }}>

            {/* Top stripe */}
            <div style={{ height: 5, background: isP
                    ? "linear-gradient(90deg,#f59e0b,#d97706,#f59e0b)"
                    : "linear-gradient(90deg,#3b82f6,#2563eb,#3b82f6)" }} />

            {/* ── HEADER ── */}
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em",
                        color: acc, textTransform: "uppercase", marginBottom: 2 }}>Zertifikat</p>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
                        color: "#1e3a5f", textTransform: "uppercase", marginBottom: 3 }}>Befähigungsnachweis</p>
                    <p style={{ fontSize: 10, fontWeight: 600,
                        color: isP ? "#6b7280" : "#2563eb" }}>
                        {isP ? "Gabelstapler · Theorie & Praxis" : "Gabelstapler · Theoriekurs"}
                    </p>
                </div>

                {/* Ornament */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
                    <div style={{ width:6, height:6, background:acc, transform:"rotate(45deg)", flexShrink:0 }} />
                    <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
                </div>

                <p style={{ fontSize:11, color:"#9ca3af", marginBottom:5 }}>Hiermit wird bestätigt, dass</p>

                {/* NAME */}
                <h2 style={{ fontWeight:900, color:"#111827", lineHeight:1.15,
                    wordBreak:"break-word", marginBottom:6,
                    fontSize: cert.userName.length>28?"20px":cert.userName.length>20?"24px":"28px" }}>
                    {cert.userName}
                </h2>
                <div style={{ height:3, background:acc, borderRadius:2, marginBottom:10,
                    width: Math.min(cert.userName.length*11+20, 220)+"px" }} />

                <p style={{ fontSize:12, color:"#6b7280", marginBottom:3 }}>
                    die Ausbildung zum Führen von Gabelstaplern gemäß
                </p>
                <p style={{ fontSize:12, fontWeight:700, color:"#1e3a5f", marginBottom:3 }}>
                    DGUV Vorschrift 68 · DGUV Grundsatz 308-001
                </p>

                {isP ? (
                    <p style={{ fontSize:12, color:"#6b7280" }}>
                        erfolgreich abgeschlossen hat und berechtigt ist,{" "}
                        <strong style={{ color:"#1e3a5f" }}>Flurförderzeuge selbstständig zu führen.</strong>
                    </p>
                ) : (
                    <div style={{ background:"#FEF2F2", borderLeft:"3px solid #dc2626",
                        padding:"6px 10px", borderRadius:"0 4px 4px 0" }}>
                        <p style={{ fontSize:10, color:"#991b1b", fontWeight:700, marginBottom:2 }}>
                            HINWEIS
                        </p>
                        <p style={{ fontSize:10, color:"#7f1d1d" }}>
                            Dieser Nachweis berechtigt nicht zum selbstständigen Führen von Flurförderzeugen.
                            Praktische Ausbildung erforderlich.
                        </p>
                    </div>
                )}
                {cert.score !== undefined && (
                    <p style={{ fontSize:10, color:"#9ca3af", marginTop:6 }}>
                        Prüfungsergebnis Theorie: {cert.score} %
                    </p>
                )}
            </div>

            {/* ── META ── */}
            <div style={{ padding:"12px 20px", borderBottom:"1px solid #e5e7eb",
                display:"flex", flexWrap:"wrap", gap:"10px 24px", background:"#FAFAF7" }}>

                {/* Date */}
                <div>
                    <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                        textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:2 }}>
                        {isP ? "Kursdatum" : "Ausbildungsdatum"}
                    </p>
                    <p style={{ fontSize:13, fontWeight:800, color:"#1e3a5f" }}>
                        {fmtDate(cert.trainingDate)}
                    </p>
                </div>

                {cert.trainingLocation && (
                    <div>
                        <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                            textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:2 }}>
                            Ausbildungsort
                        </p>
                        <p style={{ fontSize:12, fontWeight:700, color:"#1e3a5f" }}>
                            {cert.trainingLocation.split("–")[0].trim()}
                        </p>
                    </div>
                )}

                {cert.instructorName && (
                    <div>
                        <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                            textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:2 }}>
                            Ausbilder
                        </p>
                        <p style={{ fontSize:12, fontWeight:700, color:"#1e3a5f" }}>
                            {cert.instructorName}
                        </p>
                    </div>
                )}
            </div>

            {/* ── STUFEN ── */}
            {cert.stufen && cert.stufen.length > 0 && (
                <div style={{ padding:"10px 20px", borderBottom:"1px solid #e5e7eb", background:"#FAFAF7" }}>
                    <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                        textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
                        Qualifizierungsstufen (DGUV G 308-001)
                    </p>
                    {cert.stufen.map(s => (
                        <div key={s} style={{ display:"flex", alignItems:"flex-start", gap:7, marginBottom:4 }}>
                            <div style={{ width:5, height:5, background:acc, transform:"rotate(45deg)",
                                flexShrink:0, marginTop:4 }} />
                            <p style={{ fontSize:11, fontWeight:600, color:"#1e3a5f" }}>
                                {STUFEN_LABELS[s] || s}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── QR + CERT NR ── */}
            <div style={{ padding:"12px 20px", borderBottom:"1px solid #e5e7eb",
                background:"#F5F3EE", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                <div style={{ padding:5, background:"#fff", borderRadius:10,
                    border:`1.5px solid ${acc}`, flexShrink:0 }}>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}&color=${isP?"1e3a5f":"1e3a7f"}&bgcolor=ffffff&margin=4`}
                        width={80} height={80} alt="QR" style={{ display:"block", borderRadius:4 }}
                    />
                </div>
                <div style={{ flex:1, minWidth:150 }}>
                    <p style={{ fontSize:8, fontWeight:700, color:"#9ca3af",
                        letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:3 }}>
                        Zertifikat-Nr.
                    </p>
                    <p style={{ fontFamily:"monospace", fontSize:15, fontWeight:900,
                        color:"#1e3a5f", letterSpacing:"0.1em", wordBreak:"break-all", marginBottom:6 }}>
                        {cert.verificationCode}
                    </p>
                    <a href={verifyUrl} target="_blank" rel="noopener noreferrer"
                       style={{ display:"inline-flex", alignItems:"center", gap:4,
                           fontSize:10, fontWeight:600, color: isP ? "#d97706" : "#2563eb", textDecoration:"none" }}>
                        <Shield size={11} /> Echtheit prüfen <ExternalLink size={9} />
                    </a>
                </div>
            </div>

            {/* ── CURRICULUM expandable ── */}
            <CurriculumSection isPractical={isP} />

            {/* ── ACTIONS ── */}
            <div style={{ padding:"12px 20px", background:"#fff", display:"flex", flexWrap:"wrap", gap:8 }}>
                <button onClick={download} disabled={dlState==="loading"}
                        style={{ flex:"1 1 100%", display:"flex", alignItems:"center", justifyContent:"center",
                            gap:8, padding:"11px", borderRadius:12, border:"none", cursor:"pointer",
                            fontSize:13, fontWeight:700, fontFamily:"inherit",
                            background: dlState==="done"?"#16a34a":isP?"#1e3a5f":"#1e40af",
                            color:"#fff", opacity:dlState==="loading"?0.6:1, transition:"all .2s" }}>
                    {dlState==="loading" ? <Loader2 size={14} style={{animation:"spin .7s linear infinite"}} />
                        : dlState==="done" ? <CheckCircle size={14} /> : <Download size={14} />}
                    {dlState==="done" ? "Heruntergeladen ✓" : "Zertifikat als PDF herunterladen"}
                </button>

                <p style={{ flex:"1 1 100%", fontSize:10, color:"#9ca3af", textAlign:"center", margin:"2px 0" }}>
                    Fügen Sie Ihr Zertifikat zum digitalen Portemonnaie Ihres Telefons hinzu
                </p>

                <button onClick={() => wallet("apple")} disabled={walletState !== "idle"}
                        style={{ flex:"1 1 calc(50% - 4px)", display:"flex", alignItems:"center",
                            justifyContent:"center", gap:6, padding:"10px", borderRadius:12,
                            border:"1px solid #374151", background:"#000", color:"#fff",
                            fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                            opacity: walletState !== "idle" && walletState !== "apple" ? 0.4 : 1 }}>
                    {walletState==="apple" ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}} /> : <AppleIcon />}
                    Apple Wallet
                </button>

                <button onClick={() => wallet("google")} disabled={walletState !== "idle"}
                        style={{ flex:"1 1 calc(50% - 4px)", display:"flex", alignItems:"center",
                            justifyContent:"center", gap:6, padding:"10px", borderRadius:12,
                            border:"1px solid #e5e7eb", background:"#fff", color:"#374151",
                            fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                            boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                            opacity: walletState !== "idle" && walletState !== "google" ? 0.4 : 1 }}>
                    {walletState==="google" ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}} /> : <GoogleIcon />}
                    Google Wallet
                </button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// Admin seed banner
const SeedBanner = ({ isAdmin }: { isAdmin: boolean }) => {
    const [loading, setLoading] = useState(false);
    const [status,  setStatus]  = useState<"idle"|"done"|"deleting">("idle");
    if (!isAdmin) return null;
    const h = { Authorization: `Bearer ${localStorage.getItem("token")}` } as HeadersInit;

    const create = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/certificates/admin/seed-demo`, { method:"POST", headers:h });
            const d = await res.json();
            if (res.ok) { setStatus("done"); setTimeout(() => window.location.reload(), 700); }
            else alert(d.message);
        } catch { alert("Fehler."); }
        finally { setLoading(false); }
    };

    const remove = async () => {
        if (!confirm("Demo-Zertifikate löschen?")) return;
        setStatus("deleting");
        try {
            await fetch(`${API}/certificates/admin/seed-demo`, { method:"DELETE", headers:h });
            window.location.reload();
        } catch { setStatus("idle"); }
    };

    return (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Wrench className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                    <p className="text-sm font-bold text-amber-800">Admin-Vorschau</p>
                    <p className="text-xs text-amber-600">Demo-Zertifikat erstellen um das UI zu testen</p>
                </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <button onClick={create} disabled={loading || status==="done"}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                    {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                    {status==="done" ? "✓ Erstellt…" : "Demo erstellen"}
                </button>
                <button onClick={remove} disabled={status==="deleting"}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                    Löschen
                </button>
            </div>
        </div>
    );
};

// Section
const CertificateSection = ({ isAdmin = false }: { isAdmin?: boolean }) => {
    const [certs,   setCerts]   = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/certificates/my`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (res.ok) setCerts(await res.json());
            } catch { /* ignore */ }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Meine Zertifikate</h2>
                <p className="text-sm text-gray-500 mt-1">Staplerschein · DGUV Vorschrift 68 · Grundsatz 308-001</p>
            </div>

            <SeedBanner isAdmin={isAdmin} />

            {certs.length === 0 ? (
                <div style={{ border:"2px solid #1e3a5f", background:"#FAFAF7",
                    borderRadius:16, padding:"56px 32px", textAlign:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12,
                        justifyContent:"center", marginBottom:24 }}>
                        <div style={{ width:48, height:1, background:"#e5e7eb" }} />
                        <div style={{ width:6, height:6, background:"#f59e0b", transform:"rotate(45deg)" }} />
                        <div style={{ width:48, height:1, background:"#e5e7eb" }} />
                    </div>
                    <Award size={40} color="#f59e0b" style={{ margin:"0 auto 14px" }} />
                    <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.3em",
                        color:"#f59e0b", textTransform:"uppercase", marginBottom:10 }}>Zertifikat</p>
                    <p style={{ fontSize:18, fontWeight:800, color:"#1e3a5f", marginBottom:10 }}>
                        Noch kein Zertifikat vorhanden
                    </p>
                    <p style={{ fontSize:13, color:"#9ca3af", maxWidth:320, margin:"0 auto", lineHeight:1.7 }}>
                        Nach dem Abschluss Ihrer Ausbildung erscheint Ihr Staplerschein hier.
                    </p>
                </div>
            ) : (
                <div style={{ display:"grid",
                    gridTemplateColumns:"repeat(auto-fill, minmax(min(100%, 480px), 1fr))",
                    gap:20 }}>
                    {certs.map(c => <CertCard key={c._id} cert={c} />)}
                </div>
            )}
        </div>
    );
};

export default CertificateSection;