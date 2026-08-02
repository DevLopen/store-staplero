/**
 * Heurystyki wykrywania spamu botów w formularzu kontaktowym.
 *
 * Nie zastępuje captchy, ale odfiltrowuje najczęstsze wzorce automatycznych
 * zgłoszeń: losowe ciągi znaków bez spacji (typowe dla botów testujących
 * formularze), wiadomości z nadmierną liczbą linków, oraz podstawowe
 * niepoprawne dane wejściowe.
 */

// Losowy "token" bez spacji, mieszający wielkie/małe litery i cyfry,
// bez interpunkcji i bez powtarzającego się wzorca słownikowego.
// Przykład dokładnie takiego spamu: "QkJeZIHwoi2A4ElZvBxTSFGKpjaiym046nX2r3uVsHpCDp7z8jyQ5BT"
export function looksLikeRandomToken(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.length < 16) return false;

    // Prawdziwe zdania niemal zawsze zawierają spację lub interpunkcję.
    const hasWhitespace = /\s/.test(trimmed);
    if (hasWhitespace) return false;

    // Musi mieszać wielkie i małe litery ORAZ cyfry, żeby nie łapać
    // pojedynczych słów typu "kontakt@firma.de" czy linków (te łapiemy osobno).
    const hasLower = /[a-z]/.test(trimmed);
    const hasUpper = /[A-Z]/.test(trimmed);
    const hasDigit = /[0-9]/.test(trimmed);
    const isAlnumOnly = /^[A-Za-z0-9]+$/.test(trimmed);

    return isAlnumOnly && hasLower && hasUpper && hasDigit;
}

// Wiadomość zawierająca głównie / wyłącznie linki (typowy spam reklamowy).
export function hasExcessiveLinks(text: string): boolean {
    const matches = text.match(/https?:\/\/|www\./gi);
    return !!matches && matches.length >= 3;
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
    "mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com",
    "temp-mail.org", "yopmail.com", "trashmail.com", "sharklasers.com",
    "getnada.com", "dispostable.com",
]);

export function isDisposableEmail(email: string): boolean {
    const domain = email.split("@")[1]?.toLowerCase().trim();
    return !!domain && DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export interface SpamCheckInput {
    name: string;
    email: string;
    message: string;
}

export function isLikelySpam({ name, email, message }: SpamCheckInput): boolean {
    if (looksLikeRandomToken(message) || looksLikeRandomToken(name)) return true;
    if (hasExcessiveLinks(message)) return true;
    if (isDisposableEmail(email)) return true;
    return false;
}
