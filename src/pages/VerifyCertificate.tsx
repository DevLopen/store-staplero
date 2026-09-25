import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, Search, ShieldCheck, ShieldAlert, ShieldX, Phone, Mail } from "lucide-react";
import WalletCard from "@/components/dashboard/WalletCard";
import { PanelCertificate, THEORY_TOPICS, PRACTICE_TOPICS } from "@/components/dashboard/panelUtils";
import logo from "@/assets/staplero-white-cropped.svg";

/**
 * Publiczna strona weryfikacji (link z kodu QR na certyfikacie i w Wallet).
 * Czyta ją najczęściej pracodawca: status musi być jednoznaczny w kilka sekund,
 * a certyfikat online musi wyraźnie mówić, że nie daje uprawnień do jazdy.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface VerifyResult {
    valid: boolean;
    revoked?: boolean;
    revokedAt?: string;
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
    networkError?: boolean;
}

const STUFEN_LABELS: Record<string, string> = {
    stufe1: "Stufe 1 – Frontgabelstapler / Mitgänger-Flurförderzeuge",
    stufe2: "Stufe 2 – Schubmaststapler / Teleskopstapler / Containerstapler",
    stufe2_anbau: "Stufe 2 – Zusatzqualifizierung Anbaugeräte",
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" }) : "—");

const Row = ({ label, children, alert }: { label: string; children: React.ReactNode; alert?: boolean }) => (
    <div className="grid grid-cols-1 gap-0.5 border-b border-border py-3 sm:grid-cols-[190px_1fr] sm:gap-4">
        <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:pt-0.5">{label}</dt>
        <dd className={`text-[15px] font-semibold ${alert ? "text-[#b91c1c]" : "text-foreground"}`}>{children}</dd>
    </div>
);

const Status = ({ result }: { result: VerifyResult }) => {
    const theory = result.valid && result.type === "online";

    if (result.valid && !theory) {
        return (
            <div role="status" className="flex items-start gap-4 rounded-md bg-[#15803d] p-5 text-white sm:p-6">
                <ShieldCheck className="h-10 w-10 flex-shrink-0" aria-hidden="true" />
                <div>
                    <p className="font-display text-[34px] font-extrabold uppercase leading-none">Echt und gültig</p>
                    <p className="mt-2 text-[15px] text-white/90">
                        Befähigungsnachweis Gabelstapler nach DGUV Grundsatz 308-001. Der Inhaber ist berechtigt, Flurförderzeuge (Gabelstapler) selbstständig zu führen.
                    </p>
                </div>
            </div>
        );
    }

    if (theory) {
        return (
            <div role="status" className="overflow-hidden rounded-md">
                <div className="flex items-center gap-3 bg-[#15803d] px-5 py-3 text-white sm:px-6">
                    <ShieldCheck className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                    <p className="font-semibold">Echt: Dieser Theorienachweis wurde von STAPLERO ausgestellt.</p>
                </div>
                <div className="flex items-start gap-4 bg-[#b91c1c] p-5 text-white sm:p-6">
                    <ShieldX className="h-10 w-10 flex-shrink-0" aria-hidden="true" />
                    <div>
                        <p className="font-display text-[34px] font-extrabold uppercase leading-none">Keine Fahrberechtigung</p>
                        <p className="mt-2 text-[15px] text-white/95">
                            <b>Nur Theorieteil, kein Fahrausweis.</b> Dieser Nachweis berechtigt nicht zum Führen von Gabelstaplern oder anderen Flurförderzeugen. Dafür ist zusätzlich eine praktische Ausbildung mit Prüfung nach DGUV Grundsatz 308-001 nötig.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (result.revoked) {
        return (
            <div role="alert" className="flex items-start gap-4 rounded-md bg-[#b91c1c] p-5 text-white sm:p-6">
                <ShieldAlert className="h-10 w-10 flex-shrink-0" aria-hidden="true" />
                <div>
                    <p className="font-display text-[34px] font-extrabold uppercase leading-none">Widerrufen</p>
                    <p className="mt-2 text-[15px] text-white/95">
                        Dieses Zertifikat ist nicht mehr gültig{result.revokedAt ? ` (widerrufen am ${fmt(result.revokedAt)})` : ""}. Es berechtigt nicht zum Führen von Flurförderzeugen.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div role="alert" className="flex items-start gap-4 rounded-md border-2 border-[#b91c1c] bg-white p-5 sm:p-6">
            <ShieldX className="h-10 w-10 flex-shrink-0 text-[#b91c1c]" aria-hidden="true" />
            <div>
                <p className="font-display text-[34px] font-extrabold uppercase leading-none text-[#b91c1c]">
                    {result.networkError ? "Prüfung nicht möglich" : "Nicht gefunden"}
                </p>
                <p className="mt-2 text-[15px] text-foreground">
                    {result.networkError
                        ? "Die Verbindung zum Server ist fehlgeschlagen. Bitte versuchen Sie es in einem Moment erneut."
                        : "Zu dieser Nummer gibt es kein STAPLERO-Zertifikat. Prüfen Sie die Schreibweise (12 Zeichen, auf dem Zertifikat unter dem QR-Code). Wird die Nummer weiterhin nicht gefunden, ist das Dokument nicht von uns ausgestellt."}
                </p>
            </div>
        </div>
    );
};

const VerifyCertificate = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState(code?.toUpperCase() || "");
    const [checkedAt, setCheckedAt] = useState<Date | null>(null);

    const verify = async (c: string) => {
        const clean = c.trim().toUpperCase();
        if (!clean) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/certificates/verify/${encodeURIComponent(clean)}`);
            setResult(await res.json());
        } catch {
            setResult({ valid: false, networkError: true });
        } finally {
            setCheckedAt(new Date());
            setLoading(false);
        }
    };

    useEffect(() => {
        if (code) { setManualCode(code.toUpperCase()); verify(code); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = manualCode.trim().toUpperCase();
        if (!clean) return;
        if (clean === code?.toUpperCase()) verify(clean);
        else navigate(`/verify/${clean}`);
    };

    const isP = result?.type === "practical";
    const card: PanelCertificate | null = result?.valid && result.verificationCode
        ? {
            _id: result.verificationCode,
            verificationCode: result.verificationCode,
            type: result.type || "online",
            userName: result.userName || "",
            courseName: result.courseName || "",
            trainingDate: result.trainingDate || "",
            trainingLocation: result.trainingLocation,
            issuedAt: result.issuedAt || result.trainingDate || "",
            score: result.score,
            instructorName: result.instructorName,
            stufen: result.stufen,
        }
        : null;

    return (
        <div className="min-h-screen bg-secondary text-foreground">
            <header className="bg-[#212121]">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <Link to="/"><img src={logo} alt="STAPLERO" className="h-8" /></Link>
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#bdbdbd]">Echtheitsprüfung</span>
                </div>
                <div className="h-1 bg-primary" />
            </header>

            <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6">
                <div>
                    <h1 className="font-display text-[40px] font-extrabold uppercase leading-[0.95] sm:text-[48px]">Zertifikat prüfen</h1>
                    <p className="mt-2 max-w-[62ch] text-muted-foreground">
                        Arbeitgeber und Behörden prüfen hier kostenlos und ohne Anmeldung, ob ein Nachweis von STAPLERO ausgestellt wurde und wozu er berechtigt.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="rounded-md border border-border bg-white p-4 sm:p-5">
                    <label htmlFor="cert-code" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Zertifikat-Nr.</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            id="cert-code"
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            spellCheck={false}
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                            placeholder="z. B. K7QX2M9PLA4B"
                            className="min-h-[48px] flex-1 rounded border-2 border-border bg-white px-4 font-mono text-base font-bold tracking-[0.12em] outline-none focus:border-primary"
                        />
                        <button type="submit" disabled={loading || !manualCode.trim()}
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-primary px-6 text-sm font-bold text-[#111] disabled:opacity-50">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Prüfen
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Die Nummer steht auf dem Zertifikat unter dem QR-Code. Beim Scannen des QR-Codes wird sie automatisch geprüft.</p>
                </form>

                {loading && (
                    <div role="status" className="flex items-center gap-3 rounded-md border border-border bg-white p-5 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Zertifikat wird geprüft…
                    </div>
                )}

                {!loading && result && (
                    <>
                        <Status result={result} />

                        {card && (
                            <section className="grid items-start gap-6 rounded-md border border-border bg-white p-5 md:grid-cols-[minmax(0,1fr)_320px] sm:p-6">
                                <div className="min-w-0">
                                    <h2 className="mb-2 font-display text-[22px] font-extrabold uppercase">Angaben zum Zertifikat</h2>
                                    <dl className="border-t border-border">
                                        <Row label="Inhaber">{result.userName}</Row>
                                        <Row label="Nachweis">{isP ? "Befähigungsnachweis Gabelstapler (Theorie & Praxis)" : "Theorienachweis Gabelstapler (online)"}</Row>
                                        {isP
                                            ? <Row label="Qualifizierung">{(result.stufen?.length ? result.stufen : ["stufe1"]).map((s) => <span key={s} className="block">{STUFEN_LABELS[s] || s}</span>)}</Row>
                                            : <Row label="Fahrberechtigung" alert>Nein, nur Theorieteil</Row>}
                                        <Row label={isP ? "Kursdatum" : "Prüfungsdatum"}>{fmt(result.trainingDate)}</Row>
                                        {result.trainingLocation && <Row label="Ausbildungsort">{result.trainingLocation}</Row>}
                                        {result.instructorName && <Row label="Ausbilder">{result.instructorName}</Row>}
                                        {result.score !== undefined && <Row label="Prüfungsergebnis Theorie">{result.score} %</Row>}
                                        <Row label="Ausgestellt am">{fmt(result.issuedAt)}</Row>
                                        <Row label="Zertifikat-Nr."><span className="font-mono tracking-[0.1em]">{result.verificationCode}</span></Row>
                                        <Row label="Rechtsgrundlage">DGUV Vorschrift 68 · DGUV Grundsatz 308-001</Row>
                                    </dl>

                                    <details className="group mt-4">
                                        <summary className="flex cursor-pointer list-none justify-between py-2 text-sm font-semibold">
                                            {isP ? "Ausbildungsinhalte Theorie & Praxis" : "Theoretische Ausbildungsinhalte"}
                                            <span className="font-bold text-muted-foreground group-open:hidden">+</span>
                                            <span className="hidden font-bold text-muted-foreground group-open:inline">–</span>
                                        </summary>
                                        <div className={`grid gap-5 pt-2 ${isP ? "md:grid-cols-2" : ""}`}>
                                            {[["Theorie", THEORY_TOPICS], ...(isP ? [["Praxis", PRACTICE_TOPICS]] : [])].map(([title, items]) => (
                                                <div key={title as string}>
                                                    <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title as string}</h3>
                                                    <ol>
                                                        {(items as string[]).map((it, i) => (
                                                            <li key={it} className="grid grid-cols-[22px_1fr] border-b border-[#f0f0f0] py-1.5 text-[13px]">
                                                                <span className="font-bold text-primary">{i + 1}.</span>{it}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                </div>

                                <div className="grid justify-items-center gap-2 md:justify-items-start">
                                    <WalletCard cert={card} holder={card.userName} />
                                    <p className="max-w-[320px] text-xs text-muted-foreground">
                                        {isP ? "Digitaler Staplerschein mit Foto des Inhabers. Bitte mit dem Ausweis der Person abgleichen." : "Digitaler Theorienachweis. Kein Fahrausweis."}
                                    </p>
                                </div>
                            </section>
                        )}

                        {checkedAt && (
                            <p className="text-xs text-muted-foreground">
                                Geprüft am {checkedAt.toLocaleDateString("de-DE")} um {checkedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr über die STAPLERO-Datenbank.
                            </p>
                        )}
                    </>
                )}

                <section className="grid gap-4 rounded-md border border-border bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                        <h2 className="font-display text-[20px] font-extrabold uppercase">Fragen zur Echtheit?</h2>
                        <p className="text-sm text-muted-foreground">STAPLERO Ausbildungszentrum · Jakobstr. 13, 02826 Görlitz</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a href="tel:+4917622067783" className="inline-flex min-h-[44px] items-center gap-2 rounded border-2 border-foreground px-4 text-sm font-bold"><Phone className="h-4 w-4" /> +49 176 22067783</a>
                        <a href="mailto:info@staplero.com" className="inline-flex min-h-[44px] items-center gap-2 rounded border-2 border-foreground px-4 text-sm font-bold"><Mail className="h-4 w-4" /> info@staplero.com</a>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default VerifyCertificate;
