import axios from "axios";

/**
 * Weryfikacja Google reCAPTCHA v3.
 *
 * reCAPTCHA v3 nie pokazuje żadnej łamigłówki - działa w tle i zwraca
 * "score" (0.0 - 1.0) opisujący jak bardzo dane zgłoszenie wygląda na
 * wygenerowane przez człowieka (1.0) vs bota (0.0).
 *
 * Wymaga zmiennej środowiskowej RECAPTCHA_SECRET_KEY (Secret Key z
 * https://www.google.com/recaptcha/admin, typ "reCAPTCHA v3").
 */

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// Minimalny wynik uznawany za "prawdopodobnie człowiek". Google zaleca 0.5
// jako punkt startowy; można go dostroić po obserwacji realnego ruchu.
const MIN_SCORE = 0.5;

interface RecaptchaVerifyResult {
    success: boolean;
    reason?: string;
    score?: number;
}

export async function verifyRecaptcha(
    token: unknown,
    expectedAction: string,
    remoteIp?: string
): Promise<RecaptchaVerifyResult> {
    if (!RECAPTCHA_SECRET_KEY) {
        // Brak skonfigurowanego klucza - nie blokujemy ruchu, ale głośno
        // logujemy, żeby było widać, że ochrona nie jest aktywna.
        console.warn("[recaptcha] RECAPTCHA_SECRET_KEY nie jest ustawiony - weryfikacja pominięta");
        return { success: true };
    }

    if (typeof token !== "string" || token.length === 0) {
        return { success: false, reason: "missing-token" };
    }

    try {
        const response = await axios.post(
            RECAPTCHA_VERIFY_URL,
            null,
            {
                params: {
                    secret: RECAPTCHA_SECRET_KEY,
                    response: token,
                    ...(remoteIp ? { remoteip: remoteIp } : {}),
                },
                timeout: 5000,
            }
        );

        const data = response.data as {
            success: boolean;
            score?: number;
            action?: string;
            "error-codes"?: string[];
        };

        if (!data.success) {
            return { success: false, reason: (data["error-codes"] || []).join(",") || "verification-failed" };
        }

        if (data.action && data.action !== expectedAction) {
            return { success: false, reason: "action-mismatch", score: data.score };
        }

        if (typeof data.score === "number" && data.score < MIN_SCORE) {
            return { success: false, reason: "low-score", score: data.score };
        }

        return { success: true, score: data.score };
    } catch (error) {
        console.error("[recaptcha] Verification request failed:", error);
        // Błąd sieci/API Google - nie blokujemy formularza całkowicie z
        // powodu przejściowego problemu po stronie Google, tylko logujemy.
        return { success: true, reason: "verify-request-error" };
    }
}
