import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLanguage } from "@/contexts/LanguageContext";
import { PanelCertificate, fmtDate, verifyUrl, walletBannerUrl } from "./panelUtils";

/**
 * Cyfrowy Staplerschein w panelu — ten sam układ co karta Apple/Google Wallet:
 * logo, baner (tytuł + zdjęcie), właściciel, dane 2×2, kod QR.
 * Dla wystawionego certyfikatu baner to ten sam obrazek PNG, który dostają Wallety.
 */

const Silhouette = () => (
    <svg viewBox="0 0 70 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="70" height="90" fill="#dcd9d3" />
        <circle cx="35" cy="34" r="15" fill="#b9b5ad" />
        <path d="M8 90c2-18 13-28 27-28s25 10 27 28z" fill="#b9b5ad" />
    </svg>
);

const QrImage = ({ value }: { value: string }) => {
    const [src, setSrc] = useState("");
    useEffect(() => {
        QRCode.toDataURL(value, { width: 256, margin: 0, color: { dark: "#111111", light: "#ffffff" }, errorCorrectionLevel: "M" })
            .then(setSrc)
            .catch(() => setSrc(""));
    }, [value]);
    return src ? <img src={src} alt="QR-Code" width={128} height={128} className="mx-auto block" /> : <div className="mx-auto h-32 w-32" />;
};

// Baner rysowany w CSS (przed wystawieniem albo gdy obrazek się nie wczyta)
const CssBanner = ({ title, sub, theory, noDriving }: { title: string; sub: string; theory?: boolean; noDriving?: string }) => (
    <div className={`relative flex aspect-[3/1] items-center justify-between overflow-hidden border-b-[3px] bg-gradient-to-br from-[#2e2e2e] to-[#1a1a1a] ${theory ? "border-[#dc2626]" : "border-primary"}`}>
        <div className="pl-4">
            <div className={`text-[9px] font-bold uppercase tracking-[0.16em] ${theory ? "text-[#f87171]" : "text-primary"}`}>{theory ? "Kein Fahrausweis" : "Befähigungsnachweis"}</div>
            <div className="mt-1 font-display text-[30px] font-extrabold uppercase leading-[0.95] text-white">{title}</div>
            <div className="mt-1 text-[11px] font-medium text-[#cfcfcf]">{sub}</div>
        </div>
        {theory ? (
            <div className="mr-3.5 flex aspect-square h-[78%] flex-col items-center justify-center rounded-lg bg-[#b91c1c] px-1 text-center">
                <span className="text-3xl font-extrabold leading-none text-white">✕</span>
                <span className="mt-1 font-display text-[11px] font-extrabold uppercase leading-none text-white">{noDriving}</span>
            </div>
        ) : (
            <div className="mr-3.5 aspect-[35/45] h-[84%] overflow-hidden rounded-md bg-[#dcd9d3] ring-2 ring-white">
                <Silhouette />
            </div>
        )}
    </div>
);

interface Props {
    cert?: PanelCertificate | null;
    holder: string;
    pendingDate?: Date;
    pendingCity?: string;
}

const WalletCard = ({ cert, holder, pendingDate, pendingCity }: Props) => {
    const { t, language } = useLanguage();
    const [bannerFailed, setBannerFailed] = useState(false);
    const pending = !cert;
    const isTheory = cert?.type === "online";
    const stufe2 = cert?.stufen?.some((s) => s.startsWith("stufe2"));
    const title = isTheory ? "Theorie" : "Staplerschein";
    const sub = isTheory ? "Nur Theorieteil · DGUV V68" : `Gabelstapler · Stufe 1${stufe2 ? " + 2" : ""}`;
    const place = cert?.trainingLocation?.split("–")[0].trim() || pendingCity || (isTheory ? "Online" : "—");

    const fields: Array<[string, string]> = [
        [t("panel.certNo"), cert ? cert.verificationCode : t("panel.certNoPending")],
        [t("panel.issued"), cert ? fmtDate(cert.issuedAt, language) : pendingDate ? fmtDate(pendingDate, language) : "—"],
        isTheory ? [t("panel.drivingLabel"), t("panel.drivingNo")] : [t("panel.place"), place],
        [t("panel.basis"), "DGUV V68"],
    ];

    return (
        <div className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-[#212121] text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
            <div className="flex items-center gap-2.5 px-4 py-3.5">
                <img src="/favicon.svg" alt="" className="h-[30px] w-[30px] rounded-full" />
                <span className="text-[15px] font-semibold tracking-wide">STAPLERO</span>
                <span className={`ml-auto whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${pending ? "bg-[#fde7cf] text-[#9a4a00]" : isTheory ? "bg-[#b91c1c] text-white" : "bg-[#15803d] text-white"}`}>
                    {pending ? t("panel.afterExam") : isTheory ? `✕ ${t("panel.theoryOnly")}` : `✓ ${t("panel.valid")}`}
                </span>
            </div>

            {cert && !bannerFailed ? (
                <img
                    src={walletBannerUrl(cert.verificationCode)}
                    alt={`${title} · ${holder}`}
                    className="block aspect-[1125/369] w-full"
                    onError={() => setBannerFailed(true)}
                />
            ) : (
                <CssBanner title={title} sub={sub} theory={isTheory} noDriving={t("panel.noDriving")} />
            )}

            <div className={`px-4 pb-5 pt-3.5 ${pending ? "[&_b]:opacity-60" : ""}`}>
                <div className="mb-3.5">
                    <small className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a8a8a8]">{t("panel.holder")}</small>
                    <b className="mt-0.5 block text-2xl font-medium leading-tight">{holder}</b>
                </div>
                <div className="grid grid-cols-[1.3fr_1fr] gap-3">
                    {fields.map(([label, value]) => (
                        <div key={label} className="min-w-0">
                            <small className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a8a8a8]">{label}</small>
                            <b className="mt-0.5 block truncate text-sm font-medium">{value}</b>
                        </div>
                    ))}
                </div>
                {cert ? (
                    <div className="mx-auto mt-4 w-[148px] rounded-[10px] bg-white px-2.5 pb-1.5 pt-2.5 text-center">
                        <QrImage value={verifyUrl(cert.verificationCode)} />
                        <span className="mt-1 block text-[10px] tracking-[0.08em] text-[#333]">{cert.verificationCode}</span>
                    </div>
                ) : (
                    <div className="mx-auto mt-4 grid aspect-square w-[110px] place-items-center rounded-[10px] border border-dashed border-[#5a5a5a] bg-[#2e2e2e] text-center text-xs leading-snug text-[#a8a8a8]">
                        {t("panel.qrAfter")}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletCard;
