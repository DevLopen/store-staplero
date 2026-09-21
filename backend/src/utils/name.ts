/**
 * Pomocnicze funkcje do pracy z imieniem i nazwiskiem.
 *
 * W bazie nadal trzymamy pełne `name` (używane przez faktury, certyfikaty, e-maile),
 * a dodatkowo `firstName` / `lastName`. Stare rekordy mają tylko `name`, więc
 * rozbijamy je "na żywo": pierwsze słowo = imię, reszta = nazwisko.
 */

export const joinName = (firstName?: string, lastName?: string): string =>
    [firstName, lastName]
        .map((s) => (s || "").trim())
        .filter(Boolean)
        .join(" ");

export const splitName = (fullName?: string): { firstName: string; lastName: string } => {
    const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
    };
};

/**
 * Zwraca komplet (firstName, lastName, name) z dowolnej kombinacji danych wejściowych.
 * Jeśli podano firstName/lastName — mają pierwszeństwo, w przeciwnym razie rozbijamy `name`.
 */
export const resolveName = (input: {
    firstName?: string;
    lastName?: string;
    name?: string;
}): { firstName: string; lastName: string; name: string } => {
    const first = (input.firstName || "").trim();
    const last = (input.lastName || "").trim();
    if (first || last) {
        return { firstName: first, lastName: last, name: joinName(first, last) };
    }
    const { firstName, lastName } = splitName(input.name);
    return { firstName, lastName, name: joinName(firstName, lastName) };
};
