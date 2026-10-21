import { useEffect, useState } from "react";
import QRCode from "qrcode";
import logo from "@/assets/staplero-white-cropped.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import { PanelCertificate, fmtDate, verifyUrl, walletBannerUrl } from "./panelUtils";

/**
 * Cyfrowy Staplerschein w panelu: wierny podgląd karty Apple/Google Wallet.
 * Kolory = walletData().colors w certificateController, baner = ten sam PNG co w Wallet
 * (backend/src/assets/wallet/source/banner.html). Staplerschein pomarańczowy, teoria jasna.
 */

const THEME = {
    practical: { bg: "#f39200", fg: "#161616", label: "#5c2e00", rule: "rgba(22,22,22,.18)" },
    theory: { bg: "#f2f1ee", fg: "#18181b", label: "#b91c1c", rule: "rgba(24,24,27,.12)" },
};

const QrImage = ({ value }: { value: string }) => {
    const [src, setSrc] = useState("");
    useEffect(() => {
        QRCode.toDataURL(value, { width: 256, margin: 0, color: { dark: "#111111", light: "#ffffff" }, errorCorrectionLevel: "M" })
            .then(setSrc)
            .catch(() => setSrc(""));
    }, [value]);
    return src ? <img src={src} alt="QR-Code" width={116} height={116} className="mx-auto block" /> : <div className="mx-auto h-[116px] w-[116px]" />;
};

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
    const level = cert?.stufen?.some((x) => x.startsWith("stufe2")) ? "Stufe 1 + 2" : "Stufe 1";
    const c = THEME[isTheory ? "theory" : "practical"];
    const place = cert?.trainingLocation?.split("–")[0].trim() || pendingCity || (isTheory ? "Online" : "—");
    const fallback = `/img/wallet/banner-${isTheory ? "theorie" : "stufe1"}.png`;

    const fields: Array<[string, string]> = [
        [t("panel.certNo"), cert ? cert.verificationCode : t("panel.certNoPending")],
        [t("panel.issued"), cert ? fmtDate(cert.issuedAt, language) : pendingDate ? fmtDate(pendingDate, language) : "—"],
        isTheory ? [t("panel.drivingLabel"), t("panel.drivingNo")] : [t("panel.place"), place],
    ];
    const label = { color: c.label } as const;

    return (
        <div
            className="w-full max-w-[320px] overflow-hidden rounded-[14px] text-left shadow-[0_1px_2px_rgba(0,0,0,.12),0_12px_32px_rgba(0,0,0,.16)]"
            style={{ background: c.bg, color: c.fg }}
        >
            <div className="flex items-center gap-2 px-3.5 py-3">
                <img src={logo} alt="STAPLERO" className="h-[28px] w-auto" />
                <span className="ml-auto text-right leading-tight">
                    <small className="block text-[9px] font-semibold uppercase tracking-[0.08em]" style={label}>{isTheory ? t("panel.theoryOnly") : "DGUV V68"}</small>
                    <b className="block text-[13px] font-semibold">{pending ? t("panel.afterExam") : isTheory ? "Theorie" : level}</b>
                </span>
            </div>

            <img
                src={cert && !bannerFailed ? walletBannerUrl(cert.verificationCode) : fallback}
                alt=""
                className={`block aspect-[1125/369] w-full ${pending ? "opacity-70" : ""}`}
                onError={() => setBannerFailed(true)}
            />

            <div className="px-3.5 pb-4 pt-3">
                <small className="block text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={label}>{t("panel.holder")}</small>
                <b className="mt-0.5 block truncate text-[22px] font-medium leading-tight">{holder}</b>
                <div className={`mt-3 grid gap-2.5 border-t pt-2.5 ${isTheory ? "grid-cols-[1.25fr_1fr]" : "grid-cols-[1.25fr_1fr_1fr]"}`} style={{ borderColor: c.rule }}>
                    {fields.map(([l, v]) => (
                        <div key={l} className="min-w-0">
                            <small className="block truncate text-[9px] font-semibold uppercase tracking-[0.08em]" style={label}>{l}</small>
                            <b className={`mt-0.5 block truncate text-[12.5px] font-semibold ${pending ? "opacity-60" : ""}`}>{v}</b>
                        </div>
                    ))}
                </div>
                {cert ? (
                    <div className="mx-auto mt-4 w-[140px] rounded-[10px] bg-white px-3 pb-1.5 pt-3 text-center shadow-[0_1px_2px_rgba(0,0,0,.1)]">
                        <QrImage value={verifyUrl(cert.verificationCode)} />
                        <span className="mt-1 block text-[10px] tracking-[0.1em] text-[#333]">{cert.verificationCode}</span>
                    </div>
                ) : (
                    <div className="mx-auto mt-4 grid aspect-square w-[116px] place-items-center rounded-[10px] border border-dashed px-2 text-center text-[11px] leading-snug" style={{ borderColor: c.rule, color: c.label }}>
                        {t("panel.qrAfter")}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletCard;
