// Lokalizacja w panelu to w praktyce wariant kursu: ten sam adres, a język w nazwie,
// np. „Berlin (auf Polnisch) Stufe 1: Theorie & Praxis (2 Tage)”. Te funkcje wyciągają
// z niej to, co klient ma zobaczyć: krótką nazwę miejsca i języki terminów.

const LANGUAGE_WORDS: [RegExp, string][] = [
    [/deutsch/i, "de"],
    [/englisch/i, "en"],
    [/polnisch/i, "pl"],
    [/ukrainisch/i, "uk"],
    [/russisch/i, "ru"],
    [/rumänisch|rumaenisch/i, "ro"],
];

/** Języki z nazwy lokalizacji, np. „(auf Ukrainisch / Russisch)” → ["uk", "ru"] */
export const languagesFromName = (name: string): string[] => {
    const inBrackets = name.match(/\(([^)]*)\)/)?.[1] ?? "";
    return LANGUAGE_WORDS.filter(([re]) => re.test(inBrackets)).map(([, code]) => code);
};

/** Języki terminu: ustawione przy terminie, a jeśli brak, odczytane z nazwy lokalizacji */
export const effectiveLanguages = (dateLanguages: string[] | undefined, locationName: string): string[] =>
    dateLanguages?.length ? dateLanguages : languagesFromName(locationName);

/** Krótka nazwa miejsca: miasto z adresu („12057 Berlin” → „Berlin”), inaczej nazwa bez dopisków */
export const placeName = (address: string | undefined, locationName: string): string => {
    const city = address?.match(/\b\d{5}\s+([^,]+)$/)?.[1]?.trim();
    return city || locationName.split(" (")[0].trim();
};
