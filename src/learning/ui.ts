import { Lang } from "./types";

// Teksty interfejsu odtwarzacza (nie treść kursu). Treść kursu jest w danych jako LText.
const UI = {
    next:        { de: "Weiter", en: "Next", pl: "Dalej", uk: "Далі" },
    back:        { de: "Zurück", en: "Back", pl: "Wstecz", uk: "Назад" },
    start:       { de: "Starten", en: "Start", pl: "Start", uk: "Почати" },
    check:       { de: "Prüfen", en: "Check", pl: "Sprawdź", uk: "Перевірити" },
    tryAgain:    { de: "Nochmal versuchen", en: "Try again", pl: "Spróbuj jeszcze raz", uk: "Спробувати ще раз" },
    close:       { de: "Schließen", en: "Close", pl: "Zamknij", uk: "Закрити" },
    gateLead:    { de: "Dieser Test entscheidet, ob das nächste Modul freigeschaltet wird. Bestanden ab {p} %. Während des Tests gibt es keine Hinweise.", en: "This test decides whether the next module is unlocked. Pass mark {p} %. There are no hints during the test.", pl: "Ten test decyduje, czy kolejny moduł zostanie odblokowany. Zaliczenie od {p} %. W trakcie testu nie ma podpowiedzi.", uk: "Цей тест вирішує, чи відкриється наступний модуль. Складено від {p} %. Під час тесту підказок немає." },
    qOf:         { de: "Frage {a} von {b}", en: "Question {a} of {b}", pl: "Pytanie {a} z {b}", uk: "Питання {a} з {b}" },
    submit:      { de: "Abgeben", en: "Submit", pl: "Oddaj", uk: "Здати" },
    gatePassed:  { de: "Bestanden. Das nächste Modul ist freigeschaltet.", en: "Passed. The next module is unlocked.", pl: "Zaliczone. Kolejny moduł jest odblokowany.", uk: "Складено. Наступний модуль відкрито." },
    gateFailed:  { de: "Nicht bestanden. Du brauchst {n} von {m} richtigen Antworten.", en: "Not passed. You need {n} of {m} correct answers.", pl: "Niezaliczone. Potrzebujesz {n} z {m} prawidłowych odpowiedzi.", uk: "Не складено. Потрібно {n} з {m} правильних відповідей." },
    gateNew:     { de: "Beim nächsten Versuch bekommst du neue Fragen in anderer Reihenfolge. Lies die Lektionen dieses Moduls noch einmal, bevor du den Test wiederholst.", en: "On your next attempt you get new questions in a different order. Go through this module's lessons again before you retake the test.", pl: "Przy następnym podejściu dostaniesz nowe pytania w innej kolejności. Zanim powtórzysz test, przejrzyj jeszcze raz lekcje tego modułu.", uk: "Під час наступної спроби ти отримаєш нові питання в іншому порядку. Перш ніж повторити тест, ще раз переглянь уроки цього модуля." },
    gateRetry:   { de: "Test wiederholen", en: "Retake test", pl: "Powtórz test", uk: "Повторити тест" },
    gateHint:    { de: "Bestehe den Test, um weiterzumachen", en: "Pass the test to continue", pl: "Zalicz test, aby przejść dalej", uk: "Склади тест, щоб продовжити" },
    gateSending: { de: "Wird ausgewertet …", en: "Evaluating …", pl: "Sprawdzam …", uk: "Перевіряю …" },
    locked:      { de: "Modul gesperrt", en: "Module locked", pl: "Moduł zablokowany", uk: "Модуль заблоковано" },
    lockedText:  { de: "Bestehe zuerst den Modul-Check des vorherigen Moduls. Dann wird dieses Modul freigeschaltet.", en: "First pass the module check of the previous module. Then this module is unlocked.", pl: "Najpierw zalicz test poprzedniego modułu. Wtedy ten moduł zostanie odblokowany.", uk: "Спершу склади перевірку попереднього модуля. Тоді цей модуль відкриється." },
    toCheck:     { de: "Zum Modul-Check", en: "Go to the module check", pl: "Przejdź do testu modułu", uk: "До перевірки модуля" },
    right:       { de: "Richtig", en: "Correct", pl: "Dobrze", uk: "Правильно" },
    wrong:       { de: "Falsch", en: "Wrong", pl: "Źle", uk: "Неправильно" },
    notQuite:    { de: "Nicht ganz", en: "Not quite", pl: "Nie do końca", uk: "Не зовсім" },
    nextQ:       { de: "Nächste", en: "Next", pl: "Następne", uk: "Наступне" },
    results:     { de: "Auswertung", en: "Results", pl: "Wynik", uk: "Результат" },
    pickN:       { de: "Wähle {n} Antworten.", en: "Choose {n} answers.", pl: "Wybierz {n} odpowiedzi.", uk: "Обери {n} відповіді." },
    numLabel:    { de: "Deine Antwort", en: "Your answer", pl: "Twoja odpowiedź", uk: "Твоя відповідь" },
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
    testsLink:   { de: "Tests und Prüfung", en: "Tests and exam", pl: "Testy i egzamin", uk: "Тести та іспит" },
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
