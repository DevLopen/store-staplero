import { useState } from "react";
import { Loader2, Download, CheckCircle, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import WalletCard from "@/components/dashboard/WalletCard";
import {
    API, authHeaders, Booking, PanelCertificate, fill, fmtDate, verifyUrl, THEORY_TOPICS, PRACTICE_TOPICS,
} from "@/components/dashboard/panelUtils";

const AppleIcon = () => (
    <svg viewBox="0 0 814 1000" width="13" height="15" fill="currentColor" aria-hidden="true">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.5 0 663 0 541.8c0-207.5 135.4-317.5 268.4-317.5 99.8 0 183 65.8 245.8 65.8 59.2 0 152-69.1 269.1-69.1zm-135.2-84.8c-62 0-160 41.5-163.1 41.5-15.2 0-12.9-14.7-12.9-20.7 0-64.6 57.3-128.5 116.3-155.3 52.2-24 106.2-32.1 138-32.1 5.4 0 10.2.4 15.5 1.1 3.2 49.7-6.4 143.2-93.8 165.5z"/>
    </svg>
);
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const btn = "inline-flex min-h-[44px] flex-1 basis-[170px] items-center justify-center gap-2 whitespace-nowrap rounded px-[18px] text-sm font-bold transition-colors disabled:opacity-60";

/** Przyciski: PDF, Apple Wallet, Google Wallet */
export const CertificateActions = ({ cert }: { cert: PanelCertificate }) => {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [busy, setBusy] = useState<"" | "pdf" | "apple" | "google">("");
    const [done, setDone] = useState(false);

    const saveBlob = (blob: Blob, filename: string) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    };

    const fail = (message?: string) => toast({ title: message || t("panel.actionFailed"), variant: "destructive" });

    const downloadPdf = async () => {
        setBusy("pdf");
        try {
            const res = await fetch(`${API}/certificates/${cert._id}/download`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            saveBlob(await res.blob(), `${cert.type === "practical" ? "Staplerschein" : "Theorienachweis"}-${cert.verificationCode}.pdf`);
            setDone(true);
            setTimeout(() => setDone(false), 2800);
        } catch { fail(); }
        finally { setBusy(""); }
    };

    const wallet = async (type: "apple" | "google") => {
        setBusy(type);
        try {
            const res = await fetch(`${API}/certificates/${cert._id}/wallet/${type}`, { headers: authHeaders() });
            if (res.status === 503) return fail(t("panel.walletUnavailable"));
            if (!res.ok) throw new Error();
            if (type === "apple") saveBlob(await res.blob(), `Staplerschein-${cert.verificationCode}.pkpass`);
            else window.location.href = (await res.json()).url;
        } catch { fail(); }
        finally { setBusy(""); }
    };

    return (
        <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadPdf} disabled={busy !== ""} className={`${btn} bg-primary text-[#111] hover:brightness-95`}>
                {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {done ? t("panel.downloaded") : t("panel.downloadPdf")}
            </button>
            <button type="button" onClick={() => wallet("apple")} disabled={busy !== ""} className={`${btn} bg-black text-white hover:bg-[#222]`}>
                {busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />} Apple Wallet
            </button>
            <button type="button" onClick={() => wallet("google")} disabled={busy !== ""} className={`${btn} border-2 border-foreground bg-white text-foreground hover:bg-secondary`}>
                {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />} Google Wallet
            </button>
        </div>
    );
};

const CopyLink = ({ code }: { code: string }) => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const url = verifyUrl(code);
    const copy = async () => {
        try { await navigator.clipboard.writeText(url); } catch { /* przeglądarka bez schowka — link jest widoczny obok */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };
    return (
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5 rounded-md bg-secondary px-3 py-2.5">
            <span className="font-mono text-[15px] font-bold tracking-widest">{code}</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-[13px] text-muted-foreground underline-offset-2 hover:underline">{url.replace(/^https?:\/\//, "")}</a>
            <button type="button" onClick={copy} className="ml-auto rounded border border-border bg-white px-2.5 py-2 text-xs font-semibold">
                {copied ? t("panel.copied") : t("panel.copyLink")}
            </button>
        </div>
    );
};

const Curriculum = ({ practical }: { practical: boolean }) => {
    const { t } = useLanguage();
    const list = (title: string, items: string[]) => (
        <div>
            <h5 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</h5>
            <ol>
                {items.map((it, i) => (
                    <li key={it} className="grid grid-cols-[22px_1fr] border-b border-[#f0f0f0] py-1.5 text-[13px]">
                        <span className="font-bold text-primary">{i + 1}.</span>{it}
                    </li>
                ))}
            </ol>
        </div>
    );
    return (
        <details className="group mt-4 border-t border-border">
            <summary className="flex cursor-pointer list-none justify-between py-3 text-sm font-semibold">
                {t("panel.curriculum")}
                <span className="font-bold text-muted-foreground group-open:hidden">+</span>
                <span className="hidden font-bold text-muted-foreground group-open:inline">–</span>
            </summary>
            <div className={`grid gap-5 pb-1.5 ${practical ? "md:grid-cols-2" : ""}`}>
                {list(t("panel.theory"), THEORY_TOPICS)}
                {practical && list(t("panel.practice"), PRACTICE_TOPICS)}
            </div>
        </details>
    );
};

/** Pełna karta certyfikatu (zakładka Zertifikate) */
export const CertificateCard = ({ cert }: { cert: PanelCertificate }) => {
    const { t, language } = useLanguage();
    const practical = cert.type === "practical";
    const stufe2 = cert.stufen?.some((s) => s.startsWith("stufe2"));
    const facts: Array<[string, string]> = practical
        ? [
            [t("panel.courseDate"), fmtDate(cert.trainingDate, language)],
            [t("panel.place"), cert.trainingLocation?.split("–")[0].trim() || "—"],
            [t("panel.instructor"), cert.instructorName || "—"],
        ]
        : [
            [t("panel.examDate"), fmtDate(cert.trainingDate, language)],
            [t("panel.examResult"), cert.score !== undefined ? `${cert.score} %` : "—"],
            [t("panel.drivingLabel"), t("panel.drivingNo")],
        ];
    return (
        <div className="rounded-md border border-border bg-white p-5">
            <div className="grid items-start gap-[22px] md:grid-cols-[320px_1fr]">
                <WalletCard cert={cert} holder={cert.userName} />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        {practical
                            ? <span className="rounded-full bg-[#15803d] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">✓ {t("panel.valid")}</span>
                            : <span className="rounded-full bg-[#b91c1c] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">✕ {t("panel.noDriving")}</span>}
                        <span className="rounded-full bg-[#ececec] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#39393b]">
                            {practical ? `Stufe 1${stufe2 ? " + 2" : ""}` : t("panel.theory")}
                        </span>
                    </div>
                    <h4 className="mb-0.5 mt-2.5 font-sans text-xl font-bold normal-case tracking-normal">{practical ? "Befähigungsnachweis Gabelstapler" : `Theorienachweis · ${t("panel.theoryCourse")}`}</h4>
                    <p className="text-sm text-muted-foreground">
                        {practical ? "Theorie & Praxis" : t("panel.theory")} · DGUV Vorschrift 68 · DGUV Grundsatz 308-001
                    </p>
                    {!practical && (
                        <div role="note" className="mt-3 flex items-start gap-3 rounded-md bg-[#b91c1c] p-3.5 text-white">
                            <span className="text-2xl font-extrabold leading-none" aria-hidden="true">✕</span>
                            <div>
                                <b className="block font-display text-lg font-extrabold uppercase leading-tight">{t("panel.noDriving")} · {t("panel.theoryNoticeTitle")}</b>
                                <span className="text-sm">{t("panel.theoryNotice")}</span>
                            </div>
                        </div>
                    )}
                    <div className="my-4 grid grid-cols-3 border-y border-border">
                        {facts.map(([label, value], i) => (
                            <div key={i} className={`min-w-0 py-2.5 ${i > 0 ? "border-l border-border pl-3" : "pr-3"}`}>
                                <small className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</small>
                                <b className="block truncate text-[15px]">{value}</b>
                            </div>
                        ))}
                    </div>
                    <CopyLink code={cert.verificationCode} />
                    <CertificateActions cert={cert} />
                    <Curriculum practical={practical} />
                </div>
            </div>
        </div>
    );
};

/** Stan przed wystawieniem: podgląd karty + 4 kroki */
export const CertificatePending = ({ booking, holder, theoryPercent, onGoToBooking }: {
    booking: Booking; holder: string; theoryPercent?: number; onGoToBooking: () => void;
}) => {
    const { t, language } = useLanguage();
    const steps: Array<{ text: string; state: "done" | "current" | "todo"; extra?: string }> = [
        { text: t("panel.stepBooked"), state: "done" },
        ...(theoryPercent !== undefined ? [{ text: t("panel.stepTheory"), state: (theoryPercent >= 100 ? "done" : "current") as "done" | "current", extra: `${theoryPercent} %` }] : []),
        { text: fill(t("panel.stepExam"), { date: fmtDate(booking.start, language, { day: "numeric", month: "numeric" }) + "–" + fmtDate(booking.end, language) }), state: theoryPercent === undefined || theoryPercent >= 100 ? "current" : "todo" },
        { text: t("panel.stepCert"), state: "todo" },
    ];
    return (
        <div className="rounded-md border border-border bg-white p-5">
            <div className="grid items-start gap-[22px] md:grid-cols-[320px_1fr]">
                <WalletCard holder={holder} pendingDate={booking.end} pendingCity={booking.city} />
                <div>
                    <span className="rounded-full bg-[#fde7cf] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9a4a00]">{t("panel.afterExam")}</span>
                    <h4 className="mb-0.5 mt-2.5 font-sans text-xl font-bold normal-case tracking-normal">{t("panel.almostTitle")}</h4>
                    <p className="text-sm text-muted-foreground">{t("panel.practicalTitle")} · {booking.city}</p>
                    <ol className="my-4 border-t border-border">
                        {steps.map((s, i) => (
                            <li key={i} className={`flex gap-2 border-b border-border py-2.5 text-sm ${s.state === "todo" ? "text-muted-foreground" : "text-foreground"} ${s.state === "current" ? "font-semibold" : ""}`}>
                                <b className={s.state === "done" ? "text-[#15803d]" : s.state === "current" ? "text-primary" : "text-muted-foreground"}>{i + 1}.</b>
                                {s.text}
                                {s.extra && <em className="ml-auto font-medium not-italic text-muted-foreground">{s.extra}</em>}
                            </li>
                        ))}
                    </ol>
                    <button type="button" onClick={onGoToBooking} className="inline-flex min-h-[44px] items-center rounded bg-[#212121] px-[18px] text-sm font-bold text-white">{t("panel.toBooking")}</button>
                </div>
            </div>
        </div>
    );
};

/** Pasek admina: certyfikat demo do testów wyglądu */
export const SeedBanner = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const call = async (method: "POST" | "DELETE") => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/certificates/admin/seed-demo`, { method, headers: authHeaders() });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message);
            window.location.reload();
        } catch (e: any) {
            toast({ title: e?.message || "Fehler", variant: "destructive" });
        } finally { setLoading(false); }
    };
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#fde7cf] bg-[#fff7ed] px-5 py-3.5">
            <div className="flex items-center gap-3">
                <Wrench className="h-4 w-4 text-[#9a4a00]" />
                <div>
                    <p className="text-sm font-bold text-[#9a4a00]">Admin-Vorschau</p>
                    <p className="text-xs text-[#9a4a00]">Demo-Zertifikat erstellen, um die Ansicht zu testen</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={() => call("POST")} disabled={loading} className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-[#111] disabled:opacity-60">
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Demo erstellen"}
                </button>
                <button type="button" onClick={() => call("DELETE")} disabled={loading} className="rounded px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Löschen</button>
            </div>
        </div>
    );
};

export default CertificateCard;
