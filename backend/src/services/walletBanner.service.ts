import fs from "fs";
import path from "path";
import { Jimp } from "jimp";

/**
 * Wspólny baner kart Wallet (Apple: strip.png, Google: heroImage).
 *
 * Tło z tytułem jest gotowym obrazkiem (src/assets/wallet/banner-bg-*.png, 1125×369 px),
 * a tutaj doklejamy tylko zdjęcie kursanta w białą ramkę po prawej stronie.
 * Dzięki temu obie karty mają identyczny baner i nie potrzebujemy fontów ani natywnych bibliotek.
 */

// tsc nie kopiuje src/assets do dist, więc szukamy w obu miejscach
const ASSET_DIRS = [
    path.join(__dirname, "../assets"),
    path.join(process.cwd(), "src/assets"),
];

export const assetPath = (...parts: string[]): string | null => {
    for (const dir of ASSET_DIRS) {
        const p = path.join(dir, ...parts);
        if (fs.existsSync(p)) return p;
    }
    return null;
};

export const readAsset = (...parts: string[]): Buffer | null => {
    const p = assetPath(...parts);
    return p ? fs.readFileSync(p) : null;
};

/** Zdjęcie kursanta z katalogu uploads (tylko pliki wewnątrz katalogu) */
export const loadCertificatePhoto = (cert: { photoFile?: string }): Buffer | null => {
    if (!cert.photoFile || typeof cert.photoFile !== "string") return null;
    const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));
    const photoPath = path.resolve(uploadsDir, cert.photoFile);
    if (!photoPath.startsWith(uploadsDir + path.sep) || !fs.existsSync(photoPath)) return null;
    return fs.readFileSync(photoPath);
};

// Geometria ramki na zdjęcie w tle 1125×369 (patrz banner-bg-*.png)
const BANNER_W = 1125;
const BANNER_H = 369;
const PHOTO = { x: 841, y: 28, w: 235, h: 302, radius: 14 };

const bannerVariant = (cert: { type: string; stufen?: string[] }) => {
    if (cert.type !== "practical") return "theorie";
    return cert.stufen?.some((s) => s.startsWith("stufe2")) ? "stufe12" : "stufe1";
};

/** Zaokrągla rogi zdjęcia, malując narożniki kolorem ramki (białym) */
const roundCorners = (img: any, radius: number) => {
    const white = 0xffffffff;
    const { width, height } = img.bitmap;
    for (let y = 0; y < radius; y++) {
        for (let x = 0; x < radius; x++) {
            const dx = radius - x - 0.5;
            const dy = radius - y - 0.5;
            if (dx * dx + dy * dy > radius * radius) {
                img.setPixelColor(white, x, y);
                img.setPixelColor(white, width - 1 - x, y);
                img.setPixelColor(white, x, height - 1 - y);
                img.setPixelColor(white, width - 1 - x, height - 1 - y);
            }
        }
    }
};

/** Baner 1125×369 px (PNG). `width` pozwala zmniejszyć go np. do strip.png 375 px. */
export const buildWalletBanner = async (
    cert: { type: string; stufen?: string[]; photoFile?: string },
    width = BANNER_W,
): Promise<Buffer> => {
    const variant = bannerVariant(cert);
    const bgBuf = readAsset("wallet", `banner-bg-${variant}.png`);
    if (!bgBuf) throw new Error("Wallet-Banner-Hintergrund fehlt (src/assets/wallet)");
    const banner = await Jimp.read(bgBuf);

    // Theorie: zamiast zdjęcia czerwone pole „Keine Fahrberechtigung” (jest już w tle)
    const photoBuf = variant === "theorie" ? null : loadCertificatePhoto(cert) || readAsset("wallet", "photo-placeholder.png");
    if (photoBuf) {
        try {
            const photo = await Jimp.read(photoBuf);
            photo.cover({ w: PHOTO.w, h: PHOTO.h });
            roundCorners(photo, PHOTO.radius);
            banner.composite(photo, PHOTO.x, PHOTO.y);
        } catch (err) {
            console.error("[Wallet] Foto konnte nicht eingebettet werden:", (err as Error).message);
        }
    }

    if (width !== BANNER_W) banner.resize({ w: width, h: Math.round((BANNER_H * width) / BANNER_W) });
    return banner.getBuffer("image/png");
};
