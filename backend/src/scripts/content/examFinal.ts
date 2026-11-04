/** Egzamin końcowy (spis klienta: Abschlussprüfung). Pula pytań = testy modułów; próg 80 % i 45 min wg DGUV G 308-001 (Entwurf 2026). */
import { LText } from "../../models/LearningCourse";

type Step = { id: string; type: string; data: Record<string, unknown> };
type Mk = (type: string, data: Record<string, unknown>) => Step;
const t = (de: string, en: string, pl: string, uk: string): LText => ({ de, en, pl, uk });
const texts = (rows: [string, string, string, string][]) => Object.fromEntries(rows.map(([de, en, pl, uk]) => [de, { de, en, pl, uk }]));

const EXAM_TEXTS = texts([
    ["Fragen", "questions", "pytań", "питань"], ["Minuten", "minutes", "minut", "хвилин"], ["zum Bestehen", "to pass", "do zaliczenia", "для складання"],
    ["Während der Prüfung siehst du nicht, ob eine Antwort richtig ist.", "During the exam you do not see whether an answer is correct.", "W trakcie egzaminu nie widzisz, czy odpowiedź jest prawidłowa.", "Під час іспиту ти не бачиш, чи відповідь правильна."],
    ["Du kannst zurückblättern und Antworten ändern, bis du abgibst.", "You can go back and change answers until you submit.", "Możesz wracać do pytań i zmieniać odpowiedzi, dopóki nie oddasz egzaminu.", "Можна повертатися до питань і змінювати відповіді, доки не здаси іспит."],
    ["Danach siehst du dein Ergebnis und wie viele Fragen du in jedem Modul richtig hattest.", "Afterwards you see your result and how many questions you answered correctly in each module.", "Potem zobaczysz wynik i to, ile pytań z każdego modułu było dobrze.", "Потім ти побачиш результат і скільки питань із кожного модуля було правильно."],
    ["Bei jedem Versuch werden die Fragen neu ausgelost.", "The questions are drawn again for every attempt.", "Przy każdym podejściu pytania są losowane od nowa.", "Під час кожної спроби питання добираються заново."],
    ["Prüfung starten", "Start exam", "Rozpocznij egzamin", "Почати іспит"],
    ["Bestanden", "Passed", "Egzamin zdany", "Іспит складено"], ["Nicht bestanden", "Not passed", "Egzamin niezdany", "Іспит не складено"],
    ["{r} von {n} Fragen richtig, nötig sind {p} %.", "{r} of {n} questions correct; {p} % are needed to pass.", "Poprawne odpowiedzi: {r} z {n}. Do zaliczenia potrzeba {p} %.", "Правильно {r} з {n} питань, для складання потрібно {p} %."],
    ["Ergebnis nach Modul", "Result by module", "Wynik w poszczególnych modułach", "Результат за модулями"], ["Richtige Antworten", "Correct answers", "Prawidłowe odpowiedzi", "Правильні відповіді"],
    ["Lies die Module, in denen du schwach warst, noch einmal, bevor du die Prüfung wiederholst.", "Go through the modules where you were weak again before you retake the exam.", "Zanim powtórzysz egzamin, przejrzyj jeszcze raz moduły, w których wypadłeś słabo.", "Перш ніж повторити іспит, ще раз переглянь модулі, де результат був слабким."],
    ["Prüfung wiederholen", "Retake exam", "Powtórz egzamin", "Повторити іспит"],
    ["Frage {i} von {n}", "Question {i} of {n}", "Pytanie {i} z {n}", "Питання {i} з {n}"], ["Restzeit", "Time left", "Pozostały czas", "Залишок часу"],
    ["Nächste Frage", "Next question", "Następne pytanie", "Наступне питання"], ["Abgeben", "Submit", "Oddaj egzamin", "Здати іспит"],
    ["Noch {n} Fragen ohne Antwort.", "{n} questions still unanswered.", "Jeszcze {n} pytań bez odpowiedzi.", "Ще {n} питань без відповіді."],
]);

export function lessonExam(step: Mk, items: unknown[]): Step[] {
    return [
        step("intro", {
            title: t("Abschlussprüfung", "Final exam", "Egzamin końcowy", "Підсумковий іспит"), image: "forklift",
            text: t("Jetzt zeigst du, was du gelernt hast. Die Fragen kommen aus allen Modulen in zufälliger Reihenfolge.", "Now show what you have learned. The questions come from all modules in random order.", "Teraz pokażesz, czego się nauczyłeś. Pytania pochodzą ze wszystkich modułów, w losowej kolejności.", "Тепер покажи, чого навчився. Питання з усіх модулів у випадковому порядку."),
            meta: [t("höchstens 45 Minuten", "max. 45 minutes", "maks. 45 minut", "макс. 45 хвилин"), t("bestanden ab 80 %", "pass mark 80 %", "zaliczenie od 80 %", "іспит складено від 80 %"), { de: "DGUV G 308-001" }],
        }),
        step("sim", { sim: "final", texts: EXAM_TEXTS, items, count: 50, passPercent: 80, minutes: 45,
            title: t("Abschlussprüfung", "Final exam", "Egzamin końcowy", "Підсумковий іспит"),
            lead: t("Lies jede Frage in Ruhe. Es gibt immer genau eine richtige Antwort.", "Read each question calmly. There is always exactly one correct answer.", "Czytaj każde pytanie spokojnie. Zawsze jest dokładnie jedna prawidłowa odpowiedź.", "Читай кожне питання спокійно. Правильна відповідь завжди рівно одна.") }),
    ];
}
