import { Lang } from "./types";

// Teksty interfejsu odtwarzacza (nie treść kursu). Treść kursu jest w danych jako LText.
const UI = {
    next:        { de: "Weiter", en: "Next", pl: "Dalej", uk: "Далі" },
    back:        { de: "Zurück", en: "Back", pl: "Wstecz", uk: "Назад" },
    start:       { de: "Starten", en: "Start", pl: "Start", uk: "Почати" },
    check:       { de: "Prüfen", en: "Check", pl: "Sprawdź", uk: "Перевірити" },
    tryAgain:    { de: "Nochmal versuchen", en: "Try again", pl: "Spróbuj jeszcze raz", uk: "Спробувати ще раз" },
    close:       { de: "Schließen", en: "Close", pl: "Zamknij", uk: "Закрити" },
    right:       { de: "Richtig", en: "Correct", pl: "Dobrze", uk: "Правильно" },
    wrong:       { de: "Falsch", en: "Wrong", pl: "Źle", uk: "Неправильно" },
    notQuite:    { de: "Nicht ganz", en: "Not quite", pl: "Nie do końca", uk: "Не зовсім" },
    nextQ:       { de: "Nächste", en: "Next", pl: "Następne", uk: "Наступне" },
    results:     { de: "Auswertung", en: "Results", pl: "Wynik", uk: "Результат" },
    chooseOne:   { de: "Wähle eine Antwort", en: "Choose an answer", pl: "Wybierz odpowiedź", uk: "Обери відповідь" },
    correctOf:   { de: "richtig", en: "correct", pl: "dobrze", uk: "правильно" },
    yourAnswer:  { de: "Deine Antwort: {a}", en: "Your answer: {a}", pl: "Twoja odpowiedź: {a}", uk: "Твоя відповідь: {a}" },
    merke:       { de: "Merke", en: "Remember", pl: "Zapamiętaj", uk: "Запам’ятай" },
    source:      { de: "Quelle", en: "Source", pl: "Źródło", uk: "Джерело" },
    videoSlot:   { de: "Video-Platz", en: "Video slot", pl: "Miejsce na film", uk: "Місце для відео" },
    videoBrief:  { de: "Optional: kurze Realaufnahme", en: "Optional: short real footage", pl: "Opcjonalnie: krótkie nagranie z życia", uk: "Опційно: коротке реальне відео" },
    length:      { de: "Länge: {l}", en: "Length: {l}", pl: "Długość: {l}", uk: "Тривалість: {l}" },
    fillAll:     { de: "Fülle alle Lücken", en: "Fill all gaps", pl: "Wypełnij wszystkie luki", uk: "Заповни всі пропуски" },
    gapHelp:     { de: "Tippe die Wörter der Reihe nach an. Tippe auf eine Lücke, um sie wieder zu leeren.", en: "Tap the words in order. Tap a gap to empty it again.", pl: "Dotykaj słów po kolei. Dotknij luki, żeby ją opróżnić.", uk: "Торкайся слів по черзі. Торкнися пропуску, щоб очистити його." },
    gap:         { de: "Lücke {n}", en: "Gap {n}", pl: "Luka {n}", uk: "Пропуск {n}" },
    unknown:     { de: "unbekannt", en: "new to me", pl: "nie znam", uk: "незнайомо" },
    sure:        { de: "sicher", en: "confident", pl: "pewnie", uk: "впевнено" },
    stepOf:      { de: "Schritt {a} von {b}", en: "Step {a} of {b}", pl: "Krok {a} z {b}", uk: "Крок {a} з {b}" },
    finish:      { de: "Thema abschließen", en: "Finish topic", pl: "Zakończ temat", uk: "Завершити тему" },
    nextTopic:   { de: "Weiter zum nächsten Thema", en: "Continue to next topic", pl: "Dalej do następnego tematu", uk: "Далі до наступної теми" },
    overview:    { de: "Kursübersicht", en: "Course overview", pl: "Przegląd kursu", uk: "Огляд курсу" },
    dashboard:   { de: "Übersicht", en: "Overview", pl: "Pulpit", uk: "Огляд" },
    menu:        { de: "Kursmenü umschalten", en: "Toggle course menu", pl: "Pokaż lub ukryj menu kursu", uk: "Показати або сховати меню курсу" },
    unsupported: { de: "Dieser Schritt wird in der neuen Version noch vorbereitet.", en: "This step is still being prepared in the new version.", pl: "Ten krok jest jeszcze przygotowywany w nowej wersji.", uk: "Цей крок ще готується в новій версії." },
} satisfies Record<string, Record<Lang, string>>;

export type UIKey = keyof typeof UI;
export const ui = (k: UIKey, lang: Lang, vars?: Record<string, string | number>) => {
    const s = UI[k][lang] ?? UI[k].de;
    return vars ? s.replace(/\{(\w+)\}/g, (_, v) => String(vars[v] ?? "")) : s;
};
