import User from "../models/User";

/** Jedna postać adresu w bazie i w zapytaniach: bez spacji na brzegach, małymi literami. */
export const normalizeEmail = (value: unknown): string =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Szuka konta po e-mailu niezależnie od wielkości liter.
 * Najpierw dokładnie po znormalizowanym adresie (indeks). Zapas z regexem bez rozróżniania wielkości
 * liter łapie konta zapisane przed migracją scripts/normalizeEmails.ts; po migracji nie powinien
 * już niczego znajdować i można go usunąć.
 */
export const findUserByEmail = async (value: unknown, select?: string) => {
    const email = normalizeEmail(value);
    if (!email) return null;
    const exact = User.findOne({ email });
    const user = await (select ? exact.select(select) : exact);
    if (user) return user;
    const legacy = User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });
    return select ? legacy.select(select) : legacy;
};
