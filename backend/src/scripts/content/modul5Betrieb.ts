/**
 * Moduł „Betrieb allgemein” (spis klienta, punkt 6, moduł 5 kursu), od razu w czterech językach.
 * Źródła: DGUV Vorschrift 68 §5, §6, §7, §12, §15, §16, §23, §25 z Durchführungsanweisungen (wyd. 2002);
 * DGUV Information 208-004 „Gabelstapler”, rozdz. 1, 3.3, 4, 6.1, 7; DGUV G 308-001 (Entwurf 2026) Anhang B 3.2.2.1 Nr. 6.
 */
import { LText } from "../../models/LearningCourse";

type Step = { id: string; type: string; data: Record<string, unknown> };
type Mk = (type: string, data: Record<string, unknown>) => Step;

const t = (de: string, en: string, pl: string, uk: string): LText => ({ de, en, pl, uk });
const pt = (l: LText) => {
    const k: LText = {}, v: LText = {};
    for (const [lang, s] of Object.entries(l) as [keyof LText, string][]) {
        const m = s.match(/^<b>(.*?)<\/b>\s*(.*)$/s);
        k[lang] = m ? m[1] : ""; v[lang] = m ? m[2] : s;
    }
    return { k, v };
};
const texts = (rows: [string, string, string, string][]) => Object.fromEntries(rows.map(([de, en, pl, uk]) => [de, { de, en, pl, uk }]));

const RIGHT_T = t("Richtig", "Correct", "Dobrze", "Правильно");
const SUM = t("Das nimmst du mit", "Key takeaways", "Najważniejsze", "Головне");
const V68 = "DGUV Vorschrift 68";
const I208 = "DGUV Information 208-004";

const PARK_TEXTS = texts([
    ["Feierabend. Wähle zuerst den Platz, an dem du den Stapler abstellst.", "End of shift. First choose the place where you park the forklift.", "Koniec zmiany. Najpierw wybierz miejsce, w którym odstawisz wózek.", "Кінець зміни. Спершу обери місце, де залишиш навантажувач."],
    ["Jetzt sicherst du den Stapler. Tippe die Schritte an und schau auf den Stapler.", "Now secure the forklift. Tap the steps and watch the forklift.", "Teraz zabezpiecz wózek. Dotykaj kolejnych kroków i patrz na wózek.", "Тепер убезпеч навантажувач. Торкайся кроків і дивись на навантажувач."],
    ["Notausgang", "Emergency exit", "Wyjście ewakuacyjne", "Аварійний вихід"], ["Halle mit Abstellplätzen", "Hall with parking places", "Hala z miejscami postoju", "Цех з місцями стоянки"],
    ["Platz wählen", "Choose a place", "Wybierz miejsce", "Обери місце"], ["Richtiger Platz", "Right place", "Właściwe miejsce", "Правильне місце"], ["Nicht hier", "Not here", "Nie tutaj", "Не тут"],
    ["Feststellbremse anziehen", "Apply the parking brake", "Zaciągnij hamulec postojowy", "Затягни стоянкове гальмо"], ["sichert gegen Wegrollen", "prevents rolling away", "chroni przed odtoczeniem", "захищає від скочування"],
    ["Gabeln ganz absenken", "Lower the forks fully", "Opuść widły do końca", "Опусти вила повністю"], ["tiefste Stellung, auf dem Boden", "lowest position, on the floor", "najniższe położenie, na podłodze", "найнижче положення, на підлозі"],
    ["Mast nach vorn neigen", "Tilt the mast forwards", "Pochyl maszt do przodu", "Нахили щоглу вперед"], ["Gabelspitzen zeigen auf den Boden", "fork tips point to the floor", "końce wideł skierowane w podłogę", "кінці вил дивляться в підлогу"],
    ["Antrieb abstellen", "Switch off the drive", "Wyłącz napęd", "Вимкни привід"], ["Motor aus", "motor off", "silnik wyłączony", "двигун вимкнено"],
    ["Schlüssel abziehen und mitnehmen", "Remove the key and take it with you", "Wyjmij kluczyk i zabierz go", "Вийми ключ і забери його"], ["gegen unbefugte Benutzung", "against unauthorised use", "przed użyciem przez osoby nieupoważnione", "від стороннього використання"],
    ["Gesichert. Jetzt darfst du den Stapler verlassen.", "Secured. Now you may leave the forklift.", "Zabezpieczony. Teraz możesz opuścić wózek.", "Убезпечено. Тепер можна залишити навантажувач."],
]);
const PEOPLE_TEXTS = texts([
    ["Gefahren gefunden", "Hazards found", "Znalezione zagrożenia", "Знайдено небезпек"], ["Alle Gefahren gefunden", "All hazards found", "Wszystkie zagrożenia znalezione", "Усі небезпеки знайдено"],
    ["Gefahr: {l}", "Hazard: {l}", "Zagrożenie: {l}", "Небезпека: {l}"], ["In Ordnung: {l}", "All right: {l}", "W porządku: {l}", "Усе гаразд: {l}"],
    ["Tippe auf die Punkte in der Halle. Nicht alles ist falsch.", "Tap the points in the hall. Not everything is wrong.", "Dotknij punktów w hali. Nie wszystko jest złe.", "Торкайся точок у цеху. Не все неправильно."],
    ["Ganze Halle zeigen", "Show the whole hall", "Pokaż całą halę", "Показати весь цех"],
]);

/* ════════════════ Lernziele ════════════════ */
export function lesson5Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Betrieb allgemein", "General operation", "Eksploatacja ogólna", "Загальна експлуатація"), image: "forklift",
            text: t("Wer sagt dir, was du mit dem Stapler darfst? Wie stellst du ihn richtig ab? Und wie schützt du die Menschen um dich herum?",
                "Who tells you what you may do with the forklift? How do you park it correctly? And how do you protect the people around you?",
                "Kto mówi ci, co wolno robić wózkiem? Jak go prawidłowo odstawić? I jak chronić ludzi wokół siebie?",
                "Хто каже тобі, що можна робити навантажувачем? Як правильно його залишити? І як захистити людей навколо?"),
            meta: [t("ca. 70 Minuten", "about 70 minutes", "ok. 70 minut", "близько 70 хвилин"), t("5 Themen und Modul-Check", "5 topics and module check", "5 tematów i test modułu", "5 тем і перевірка модуля"), { de: "DGUV V68 §5–7, §12, §15, §16, §25" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "Your learning goals for this module. 1 = new to me, 5 = confident.", "Twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: [
                { code: "5.1", text: t("Ich kenne den Unterschied zwischen Betriebsanleitung und Betriebsanweisung und weiß, wann ich fahren darf.", "I know the difference between the operating manual and the operating instructions and know when I may drive.", "Znam różnicę między instrukcją obsługi a instrukcją stanowiskową i wiem, kiedy mogę jeździć.", "Я знаю різницю між інструкцією з експлуатації та робочою інструкцією і знаю, коли можу керувати."), short: t("Anleitung & Auftrag", "Manual & authorisation", "Instrukcje i upoważnienie", "Інструкції й доручення") },
                { code: "5.2", text: t("Ich stelle den Stapler richtig ab und sichere ihn.", "I park the forklift correctly and secure it.", "Prawidłowo odstawiam i zabezpieczam wózek.", "Я правильно залишаю й убезпечую навантажувач."), short: t("Abstellen", "Parking", "Odstawianie", "Стоянка") },
                { code: "5.3", text: t("Ich erkenne, wann andere Personen durch den Stapler gefährdet sind.", "I recognise when other people are endangered by the forklift.", "Rozpoznaję, kiedy wózek zagraża innym osobom.", "Я розпізнаю, коли навантажувач загрожує іншим людям."), short: t("Andere schützen", "Protect others", "Ochrona innych", "Захист інших") },
                { code: "5.4", text: t("Ich kenne meine Rechte und Pflichten und weiß, wann ich nicht fahren darf.", "I know my rights and duties and when I must not drive.", "Znam swoje prawa i obowiązki i wiem, kiedy nie wolno mi jechać.", "Я знаю свої права й обов’язки та коли не можна керувати.") },
                { code: "5.5", text: t("Ich fahre sicher rückwärts, durch Tore und mit Mitgänger-Geräten.", "I reverse, pass gates and handle pedestrian trucks safely.", "Bezpiecznie jeżdżę tyłem, przez bramy i wózkami prowadzonymi.", "Я безпечно їжджу назад, крізь ворота й керую візками із супроводом.") },
            ],
        }),
        step("sort", {
            title: t("Erlaubt oder nicht?", "Allowed or not?", "Wolno czy nie?", "Можна чи ні?"),
            lead: t("Entscheide aus dem Bauch heraus.", "Go with your gut feeling.", "Zdecyduj intuicyjnie.", "Вирішуй інтуїтивно."),
            labels: [t("Erlaubt", "Allowed", "Wolno", "Можна"), t("Verboten", "Not allowed", "Nie wolno", "Не можна")],
            items: [
                { t: t("Kollegen auf der Gabel mit nach oben nehmen", "Lifting a colleague up on the forks", "Podnieść kolegę na widłach", "Підняти колегу на вилах"), a: 1, why: t("Personen dürfen sich nicht auf dem angehobenen Lastaufnahmemittel aufhalten. Dafür gibt es Arbeitsbühnen.", "People must not be on the raised load handling device. Work platforms exist for that.", "Ludzie nie mogą przebywać na podniesionym osprzęcie. Do tego są podesty robocze.", "Люди не можуть перебувати на піднятому вантажозахоплювачі. Для цього є робочі платформи.") },
                { t: t("Den Schlüssel stecken lassen, während du kurz neben dem Stapler kommissionierst", "Leaving the key in while you pick orders right next to the forklift", "Zostawić kluczyk w stacyjce, gdy kompletujesz towar tuż obok wózka", "Залишити ключ у замку, коли комплектуєш товар поруч із навантажувачем"), a: 0, why: t("Bei kurzem Verlassen in unmittelbarer Nähe darf der Schlüssel stecken bleiben.", "When leaving briefly and staying right next to it, the key may stay in.", "Gdy na chwilę odchodzisz i zostajesz tuż obok, kluczyk może zostać w stacyjce.", "Якщо ненадовго відходиш і лишаєшся поруч, ключ може залишитися в замку.") },
                { t: t("Eine Palette mit den Gabelspitzen zur Seite schieben", "Pushing a pallet aside with the fork tips", "Odsunąć paletę na bok końcami wideł", "Відсунути палету кінцями вил"), a: 1, why: t("Verschieben mit den Gabelzinken ist keine bestimmungsgemäße Verwendung.", "Pushing with the fork arms is not intended use.", "Przesuwanie widłami nie jest zgodne z przeznaczeniem.", "Штовхати вантаж вилами — це використання не за призначенням.") },
                { t: t("Mit großer Last, die die Sicht versperrt, rückwärts fahren", "Driving backwards with a large load that blocks the view", "Jechać tyłem z dużym ładunkiem zasłaniającym widok", "Їхати задом з великим вантажем, що закриває огляд"), a: 0, why: t("Wenn die Last die Sicht nach vorn versperrt, fährst du rückwärts oder lässt dich einweisen.", "If the load blocks the forward view, you drive backwards or get a banksman.", "Gdy ładunek zasłania widok do przodu, jedziesz tyłem albo korzystasz z sygnalisty.", "Якщо вантаж закриває огляд уперед, їдеш заднім ходом або тебе скеровує сигнальник.") },
            ],
            allRight: t("Gutes Gespür. Jetzt schauen wir genauer hin.", "Good instinct. Now let us look closer.", "Dobre wyczucie. Teraz przyjrzymy się bliżej.", "Гарне чуття. Тепер придивимося ближче."),
            someWrong: t("Kein Problem, genau das klären wir jetzt.", "No problem, that is exactly what we will clear up now.", "Nie szkodzi, właśnie to teraz wyjaśnimy.", "Нічого, саме це зараз з’ясуємо."),
        }),
    ];
}

/* ════════════════ 5.1 Betriebsanleitung, Betriebsanweisung, Fahrauftrag ════════════════ */
export function lesson51(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Zwei Papiere, zwei Absender", "Two documents, two senders", "Dwa dokumenty, dwóch autorów", "Два документи, два автори"),
            lead: t("Sie klingen fast gleich, kommen aber von verschiedenen Stellen.", "They sound almost the same but come from different places.", "Brzmią prawie tak samo, ale pochodzą z różnych miejsc.", "Звучать майже однаково, але походять з різних місць."),
            points: [
                pt(t("<b>Betriebsanleitung:</b> kommt vom Hersteller, auf Deutsch. Sie beschreibt den Stapler und seine bestimmungsgemäße Verwendung.", "<b>Operating manual:</b> comes from the manufacturer, in German. It describes the forklift and its intended use.", "<b>Instrukcja obsługi (Betriebsanleitung):</b> pochodzi od producenta, jest w języku niemieckim. Opisuje wózek i jego użycie zgodne z przeznaczeniem.", "<b>Інструкція з експлуатації (Betriebsanleitung):</b> від виробника, німецькою. Описує навантажувач і його використання за призначенням.")),
                pt(t("<b>Betriebsanweisung:</b> schreibt dein Unternehmer, schriftlich und verständlich, und hängt sie an geeigneter Stelle aus. Sie regelt deinen Betrieb.", "<b>Operating instructions:</b> written by your employer, in writing and in understandable language, and posted in a suitable place. They govern your workplace.", "<b>Instrukcja stanowiskowa (Betriebsanweisung):</b> sporządza ją twój pracodawca, na piśmie i w zrozumiały sposób, i wywiesza w odpowiednim miejscu. Reguluje pracę w twoim zakładzie.", "<b>Робоча інструкція (Betriebsanweisung):</b> складає твій роботодавець письмово й зрозуміло та вивішує у відповідному місці. Вона регулює роботу на твоєму підприємстві.")),
                pt(t("<b>Inhalt der Betriebsanweisung:</b> befahrbare Verkehrswege, Lager und Stapelung, Mitnahme von Personen, Anbaugeräte, Arbeitsbühnen und die Pflicht, die Betriebsanleitung zu beachten.", "<b>Content of the operating instructions:</b> permitted traffic routes, storage and stacking, carrying people, attachments, work platforms and the duty to follow the operating manual.", "<b>Treść instrukcji stanowiskowej:</b> dozwolone drogi komunikacyjne, składowanie i piętrowanie, przewóz osób, osprzęt, podesty robocze i obowiązek przestrzegania instrukcji obsługi.", "<b>Зміст робочої інструкції:</b> дозволені шляхи руху, складування й штабелювання, перевезення людей, навісне обладнання, робочі платформи й обов’язок дотримуватися інструкції з експлуатації.")),
                pt(t("<b>Du musst beide beachten.</b> Den Inhalt der Betriebsanweisung bekommst du in der Unterweisung.", "<b>You must follow both.</b> You get the content of the operating instructions in your briefing.", "<b>Musisz przestrzegać obu.</b> Treść instrukcji stanowiskowej poznajesz na instruktażu.", "<b>Ти маєш дотримуватися обох.</b> Зміст робочої інструкції дізнаєшся на інструктажі.")),
            ],
            merke: t("Anleitung = Hersteller und Stapler. Anweisung = Unternehmer und Betrieb.", "Manual = manufacturer and forklift. Instructions = employer and workplace.", "Instrukcja obsługi = producent i wózek. Instrukcja stanowiskowa = pracodawca i zakład.", "Інструкція з експлуатації = виробник і навантажувач. Робоча інструкція = роботодавець і підприємство."),
            src: { de: `${V68} §5 mit DA; ${I208} Abschn. 1 und 4` },
        }),
        step("sort", {
            title: t("Wo steht das?", "Where is this written?", "Gdzie to jest zapisane?", "Де це написано?"),
            lead: t("Ordne jede Aussage dem richtigen Papier zu.", "Assign each statement to the right document.", "Przypisz każde zdanie do właściwego dokumentu.", "Віднеси кожне твердження до правильного документа."),
            labels: [t("Betriebsanleitung", "Operating manual", "Instrukcja obsługi", "Посібник"), t("Betriebsanweisung", "Operating instructions", "Instrukcja stanowiskowa", "Робоча інструкція")],
            items: [
                { t: t("Wie oft die Hydraulik gewartet wird", "How often the hydraulics are serviced", "Jak często serwisować hydraulikę", "Як часто обслуговувати гідравліку"), a: 0, why: t("Technische Angaben zum Stapler kommen vom Hersteller.", "Technical details about the forklift come from the manufacturer.", "Dane techniczne wózka pochodzą od producenta.", "Технічні дані навантажувача — від виробника.") },
                { t: t("Halle 3 ist für Stapler gesperrt", "Hall 3 is closed to forklifts", "Hala 3 jest zamknięta dla wózków", "Цех 3 закритий для навантажувачів"), a: 1, why: t("Welche Verkehrswege befahren werden dürfen, legt der Unternehmer fest.", "The employer decides which traffic routes may be used.", "To pracodawca ustala, którymi drogami wolno jeździć.", "Які шляхи дозволені, вирішує роботодавець.") },
                { t: t("Personen dürfen bei uns nicht mitfahren", "People may not ride along here", "U nas nie wolno przewozić osób", "У нас не можна возити людей"), a: 1, why: t("Die Mitnahme von Personen regelt der Unternehmer, oft als Verbot.", "The employer rules on carrying people, often as a ban.", "Przewóz osób reguluje pracodawca, często jako zakaz.", "Перевезення людей регулює роботодавець, часто забороняючи його.") },
                { t: t("Zulässige Anbaugeräte für dieses Modell", "Permitted attachments for this model", "Dozwolony osprzęt dla tego modelu", "Дозволене навісне обладнання для цієї моделі"), a: 0, why: t("Ob ein Anbaugerät zum Stapler passt, gibt der Hersteller vor.", "The manufacturer specifies whether an attachment fits the forklift.", "Czy osprzęt pasuje do wózka, określa producent.", "Чи підходить навісне обладнання до навантажувача, визначає виробник.") },
            ],
            allRight: t("Genau. Du weißt, wo du nachschauen musst.", "Exactly. You know where to look.", "Dokładnie. Wiesz, gdzie szukać.", "Саме так. Ти знаєш, де шукати."),
            someWrong: t("Merke: Technik vom Hersteller, Regeln vor Ort vom Unternehmer.", "Remember: technology from the manufacturer, local rules from the employer.", "Zapamiętaj: technika od producenta, zasady na miejscu od pracodawcy.", "Запам’ятай: техніка від виробника, місцеві правила від роботодавця."),
        }),
        step("learn", {
            title: t("Bestimmungsgemäß verwenden", "Use as intended", "Używaj zgodnie z przeznaczeniem", "Використовуй за призначенням"),
            lead: t("Der Stapler darf nur für das eingesetzt werden, wofür ihn der Hersteller vorgesehen hat.", "The forklift may only be used for what the manufacturer intended.", "Wózka wolno używać tylko do tego, do czego przewidział go producent.", "Навантажувач можна використовувати лише так, як передбачив виробник."),
            points: [
                pt(t("<b>Fahrerrückhaltesystem benutzen:</b> Bügeltür zu, Sitzbügel in Schutzstellung oder Gurt anlegen. Das gehört zur bestimmungsgemäßen Verwendung.", "<b>Use the operator restraint:</b> close the bar door, put the seat bar in protective position or fasten the belt. This is part of intended use.", "<b>Używaj systemu przytrzymującego:</b> zamknij drzwi pałąkowe, ustaw pałąk fotela w pozycji ochronnej albo zapnij pas. To część użycia zgodnego z przeznaczeniem.", "<b>Використовуй систему утримання:</b> закрий дверцята-скобу, постав скобу сидіння в захисне положення або пристебнися. Це частина використання за призначенням.")),
                pt(t("<b>Nicht schieben, nicht ziehen:</b> Lasten mit den Gabelzinken verschieben ist unzulässig.", "<b>Do not push or pull:</b> moving loads by pushing with the fork arms is not allowed.", "<b>Nie pchaj, nie ciągnij:</b> przesuwanie ładunków widłami jest niedozwolone.", "<b>Не штовхай і не тягни:</b> зсувати вантажі вилами заборонено.")),
                pt(t("<b>Anbaugeräte:</b> nur wenn Gerät und Stapler aufeinander abgestimmt sind. Vor dem Einsatz prüfst du Befestigung und Anschluss.", "<b>Attachments:</b> only if device and forklift are matched. Before use, check the fixing and connection.", "<b>Osprzęt:</b> tylko gdy urządzenie i wózek są do siebie dopasowane. Przed użyciem sprawdzasz mocowanie i podłączenie.", "<b>Навісне обладнання:</b> лише якщо воно узгоджене з навантажувачем. Перед роботою перевіряєш кріплення й підключення.")),
                pt(t("<b>Steuern nur vom Fahrerplatz:</b> nicht von außen an den Hebeln ziehen.", "<b>Operate only from the driver’s seat:</b> do not pull the levers from outside.", "<b>Steruj tylko z miejsca operatora:</b> nie ciągnij dźwigni z zewnątrz.", "<b>Керуй лише з місця водія:</b> не тягни важелі ззовні.")),
            ],
            merke: t("Was nicht in der Betriebsanleitung vorgesehen ist, machst du nicht.", "What is not provided for in the operating manual, you do not do.", "Czego nie przewiduje instrukcja obsługi, tego nie robisz.", "Чого немає в інструкції з експлуатації, того не робиш."),
            src: { de: `${V68} §6 mit DA, §16 Abs. 1, §23; ${I208} Abschn. 6.1` },
        }),
        step("question", {
            title: t("Nur mal kurz", "Just quickly", "Tylko na chwilę", "Лише на хвилинку"),
            text: t("Eine Gitterbox steht schief im Gang. Ein Kollege ruft: „Schieb sie einfach mit den Gabelspitzen rüber!“", "A mesh box is standing crooked in the aisle. A colleague calls: “Just push it over with the fork tips!”", "Paleta siatkowa stoi krzywo w alejce. Kolega woła: „Po prostu przesuń ją końcami wideł!”", "Сітчастий контейнер стоїть криво в проході. Колега гукає: «Просто відсунь його кінцями вил!»"),
            layout: "list",
            options: [t("Kurz anschieben, ist ja nur ein Stück", "Push it briefly, it is only a short way", "Lekko pchnąć, to tylko kawałek", "Трохи підштовхнути, це недалеко"), t("Gitterbox richtig aufnehmen und an die richtige Stelle setzen", "Pick up the mesh box properly and set it down in the right place", "Prawidłowo podjąć paletę siatkową i odstawić ją we właściwe miejsce", "Правильно підняти контейнер і поставити в правильне місце")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, nicht bestimmungsgemäß", "No, not intended use", "Nie, niezgodne z przeznaczeniem", "Ні, не за призначенням") },
            body: t("Beim Schieben kann die Last kippen oder wegrutschen und Gabelzinken werden beschädigt. Verschieben mit den Gabelzinken ist unzulässig.", "When pushing, the load can tip or slide away and the fork arms get damaged. Pushing with the fork arms is not allowed.", "Przy pchaniu ładunek może się przewrócić albo zsunąć, a widły ulegają uszkodzeniu. Przesuwanie widłami jest niedozwolone.", "Під час штовхання вантаж може перекинутися чи зісковзнути, а вила пошкоджуються. Штовхати вилами заборонено."),
            src: { de: `${I208} Abschn. 6.1, Bild 6-1` },
        }),
        step("learn", {
            title: t("Fahren nur mit Auftrag", "Drive only with authorisation", "Jazda tylko z upoważnieniem", "Керування лише за дорученням"),
            lead: t("Ein Staplerschein allein reicht nicht. Du brauchst den Auftrag deines Unternehmers.", "A forklift licence alone is not enough. You need your employer’s authorisation.", "Sam Staplerschein nie wystarcza. Potrzebujesz upoważnienia pracodawcy.", "Самого Staplerschein недостатньо. Потрібне доручення роботодавця."),
            points: [
                pt(t("<b>Voraussetzungen:</b> mindestens 18 Jahre, geeignet, ausgebildet und Befähigung nachgewiesen.", "<b>Requirements:</b> at least 18 years old, suitable, trained and competence proven.", "<b>Warunki:</b> co najmniej 18 lat, odpowiednie predyspozycje, szkolenie i potwierdzone umiejętności.", "<b>Умови:</b> щонайменше 18 років, придатність, навчання й підтверджена кваліфікація.")),
                pt(t("<b>Der Auftrag ist schriftlich</b> und gilt für die Stapler, für die du beauftragt bist.", "<b>The authorisation is in writing</b> and applies to the forklifts you are authorised for.", "<b>Upoważnienie jest pisemne</b> i dotyczy wózków, do których cię upoważniono.", "<b>Доручення письмове</b> і стосується навантажувачів, на які тебе уповноважено.")),
                pt(t("<b>Schlüsselgewalt:</b> Du bist verantwortlich, dass niemand deinen Stapler unbefugt benutzt. Den Schlüssel gibst du nicht weiter.", "<b>Key responsibility:</b> you are responsible that nobody uses your forklift without authorisation. You do not pass on the key.", "<b>Odpowiedzialność za kluczyk:</b> odpowiadasz za to, by nikt nie użył wózka bez upoważnienia. Nie przekazujesz kluczyka.", "<b>Відповідальність за ключ:</b> ти відповідаєш за те, щоб ніхто не скористався твоїм навантажувачем без дозволу. Ключ нікому не передаєш.")),
            ],
            merke: t("Ohne Auftrag kein Fahren, auch nicht „nur mal eben“.", "No authorisation, no driving, not even “just for a moment”.", "Bez upoważnienia nie jeździsz, nawet „tylko na chwilę”.", "Без доручення не їдеш, навіть «лише на хвилинку»."),
            src: { de: `${V68} §7; ${I208} Abschn. 7.1` },
        }),
        step("question", {
            title: t("Der Kollege ohne Schein", "The colleague without a licence", "Kolega bez uprawnień", "Колега без посвідчення"),
            text: t("Ein neuer Kollege bittet dich um den Schlüssel: Er will nur schnell eine Palette umsetzen. Einen Fahrauftrag hat er nicht.", "A new colleague asks you for the key: he just wants to move a pallet quickly. He has no driving authorisation.", "Nowy kolega prosi cię o kluczyk: chce tylko szybko przestawić paletę. Nie ma upoważnienia do jazdy.", "Новий колега просить ключ: хоче лише швидко переставити палету. Доручення в нього немає."),
            layout: "list",
            options: [t("Schlüssel geben und aufpassen", "Give him the key and watch", "Dać kluczyk i pilnować", "Дати ключ і наглядати"), t("Nein sagen und die Palette selbst umsetzen", "Say no and move the pallet yourself", "Odmówić i samemu przestawić paletę", "Відмовити й переставити палету самому")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das ist unbefugtes Fahren", "No, that is unauthorised driving", "Nie, to jazda bez upoważnienia", "Ні, це керування без дозволу") },
            quote: t("„Versicherte dürfen Flurförderzeuge nur steuern, wenn sie vom Unternehmer hiermit beauftragt sind.“", "“Insured persons may only operate industrial trucks if they have been authorised to do so by the employer.”", "„Ubezpieczeni mogą kierować wózkami tylko wtedy, gdy pracodawca ich do tego upoważnił.”", "«Застраховані можуть керувати навантажувачами, лише якщо роботодавець їм це доручив.»"),
            body: t("Du hast die Schlüsselgewalt. Passiert etwas, trägst auch du Verantwortung.", "You hold the key. If something happens, you also bear responsibility.", "To ty masz kluczyk. Gdy coś się stanie, ty też odpowiadasz.", "Ключ у тебе. Якщо щось станеться, відповідаєш і ти."),
            src: { de: `${V68} §7 Abs. 3; ${I208} Abschn. 7.1` },
        }),
        step("video", {
            title: t("Betriebsanweisung im Betrieb", "Operating instructions at work", "Instrukcja stanowiskowa w zakładzie", "Робоча інструкція на підприємстві"),
            brief: t("Kurzer Rundgang: ausgehängte Betriebsanweisung am Staplerplatz, Betriebsanleitung im Fach am Stapler, Unterweisung mit Unterschrift. Ruhige Kamera, Nahaufnahmen der Dokumente.", "Short walk-round: posted operating instructions at the forklift area, operating manual in the compartment on the forklift, briefing with signature. Calm camera, close-ups of the documents.", "Krótki obchód: wywieszona instrukcja stanowiskowa przy miejscu wózków, instrukcja obsługi w schowku wózka, instruktaż z podpisem. Spokojna kamera, zbliżenia dokumentów.", "Короткий обхід: вивішена робоча інструкція біля місця навантажувачів, інструкція з експлуатації у відсіку навантажувача, інструктаж з підписом. Спокійна камера, крупні плани документів."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Betriebsanleitung</b> vom Hersteller, <b>Betriebsanweisung</b> vom Unternehmer: Du beachtest beide.", "<b>Operating manual</b> from the manufacturer, <b>operating instructions</b> from the employer: you follow both.", "<b>Instrukcja obsługi</b> od producenta, <b>instrukcja stanowiskowa</b> od pracodawcy: przestrzegasz obu.", "<b>Посібник</b> від виробника, <b>робоча інструкція</b> від роботодавця: дотримуєшся обох.")),
            pt(t("<b>Bestimmungsgemäß:</b> Rückhaltesystem nutzen, nicht schieben, Anbaugeräte nur abgestimmt.", "<b>As intended:</b> use the restraint, do not push, attachments only if matched.", "<b>Zgodnie z przeznaczeniem:</b> używaj systemu przytrzymującego, nie przesuwaj ładunków widłami, osprzęt tylko dopasowany do wózka.", "<b>За призначенням:</b> користуйся системою утримання, не штовхай вантажі вилами, навісне обладнання лише узгоджене.")),
            pt(t("<b>Fahrauftrag:</b> schriftlich, Schlüssel nie an Unbefugte.", "<b>Driving authorisation:</b> in writing, never give the key to unauthorised people.", "<b>Polecenie:</b> pisemne; kluczyka nigdy nie dawaj osobom nieupoważnionym.", "<b>Доручення:</b> письмове; ключ ніколи не давай стороннім.")),
        ] }),
    ];
}

/* ════════════════ 5.2 Abstellen und Sichern ════════════════ */
export function lesson52(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Bevor du absteigst", "Before you get off", "Zanim wysiądziesz", "Перш ніж зійти"),
            lead: t("Erst wo, dann wie. Ein abgestellter Stapler darf niemanden behindern und darf nicht von selbst losrollen.", "First where, then how. A parked forklift must not obstruct anyone and must not roll away on its own.", "Najpierw gdzie, potem jak. Odstawiony wózek nie może nikomu przeszkadzać ani sam się stoczyć.", "Спершу де, потім як. Залишений навантажувач не має нікому заважати й сам покотитися."),
            points: [
                pt(t("<b>Wo:</b> am vorgesehenen Platz. Nicht auf Verkehrs- und Fluchtwegen, nicht vor Notausgängen, Feuerlöschern oder anderen Sicherheitseinrichtungen.", "<b>Where:</b> at the designated place. Not on traffic routes or escape routes, not in front of emergency exits, fire extinguishers or other safety equipment.", "<b>Gdzie:</b> w wyznaczonym miejscu. Nie na drogach komunikacyjnych i ewakuacyjnych, nie przed wyjściami ewakuacyjnymi, gaśnicami i innymi urządzeniami bezpieczeństwa.", "<b>Де:</b> на визначеному місці. Не на проїздах і шляхах евакуації, не перед аварійними виходами, вогнегасниками й іншим захисним обладнанням.")),
                pt(t("<b>Wie:</b> Feststellbremse, Gabeln in die tiefste Stellung, Mast so weit vorneigen, dass die Gabelspitzen auf den Boden zeigen, Antrieb aus, Schlüssel abziehen und mitnehmen.", "<b>How:</b> parking brake, forks to the lowest position, tilt the mast forward so the fork tips point to the floor, switch off the drive, remove the key and take it with you.", "<b>Jak:</b> hamulec postojowy, widły w najniższe położenie, maszt pochylony tak, by końce wideł wskazywały podłogę, napęd wyłączony, kluczyk wyjęty i zabrany.", "<b>Як:</b> стоянкове гальмо, вила в найнижче положення, щогла нахилена так, щоб кінці вил дивилися в підлогу, привід вимкнено, ключ вийнято й забрано.")),
                pt(t("<b>Warum die Gabelspitzen nach unten:</b> Niemand stolpert über Zinken in Kniehöhe, die Ketten sind entlastet.", "<b>Why fork tips down:</b> nobody trips over fork arms at knee height, the chains are relieved.", "<b>Dlaczego końce wideł w dół:</b> nikt nie potknie się o widły na wysokości kolan, łańcuchy są odciążone.", "<b>Чому кінці вил донизу:</b> ніхто не спіткнеться об вила на рівні колін, ланцюги розвантажені.")),
            ],
            merke: t("Platz frei, Gabeln runter, Bremse an, Schlüssel ab.", "Right place, forks down, brake on, key out.", "Odpowiednie miejsce, widły w dół, hamulec zaciągnięty, kluczyk wyjęty.", "Правильне місце, вила вниз, гальмо затягнуто, ключ вийнято."),
            src: { de: `${V68} §15 Abs. 1 mit DA; ${I208} Abschn. 7.4` },
        }),
        step("sim", { sim: "abstellen", texts: PARK_TEXTS,
            title: t("Stell den Stapler richtig ab", "Park the forklift correctly", "Odstaw wózek prawidłowo", "Правильно постав навантажувач на стоянку"),
            spots: [
                { id: "exit", label: t("Vor dem Notausgang", "In front of the emergency exit", "Przed wyjściem ewakuacyjnym", "Перед аварійним виходом"), why: t("Notausgänge und der Weg zum Feuerlöscher müssen jederzeit frei bleiben.", "Emergency exits and the way to the fire extinguisher must stay clear at all times.", "Wyjścia ewakuacyjne i dostęp do gaśnicy muszą być zawsze wolne.", "Аварійні виходи й доступ до вогнегасника мають бути завжди вільні.") },
                { id: "lane", label: t("Am Rand des Fahrwegs", "At the edge of the driveway", "Przy krawędzi drogi", "На краю проїзду"), why: t("Ein Stapler auf dem Verkehrsweg ist ein Hindernis für alle anderen.", "A forklift on the traffic route is an obstacle for everyone else.", "Wózek na drodze komunikacyjnej to przeszkoda dla wszystkich.", "Навантажувач на проїзді — перешкода для всіх.") },
                { id: "ramp", label: t("Auf der Rampe", "On the ramp", "Na rampie", "На рампі"), why: t("Auf geneigten Flächen wird nicht abgestellt. Geht es nicht anders, kommen zusätzlich Unterlegkeile unter die Räder.", "Do not park on inclined surfaces. If it cannot be avoided, wheel chocks are also placed under the wheels.", "Na pochyłościach się nie parkuje. Jeśli nie da się inaczej, dodatkowo podkłada się kliny pod koła.", "На схилах навантажувач не ставлять. Якщо інакше ніяк — додатково підкладають клини під колеса.") },
                { id: "bay", ok: true, label: t("Markierter Abstellplatz", "Marked parking place", "Oznaczone miejsce postoju", "Позначене місце стоянки"), why: t("Der vorgesehene Platz: eben, außerhalb der Verkehrswege, Notausgang und Feuerlöscher bleiben frei.", "The designated place: level, off the traffic routes, emergency exit and extinguisher stay clear.", "Wyznaczone miejsce: płaskie, poza drogami komunikacyjnymi, wyjście ewakuacyjne i gaśnica pozostają wolne.", "Визначене місце: рівне, поза проїздами, аварійний вихід і вогнегасник вільні.") },
            ] }),
        step("learn", {
            title: t("Kurz weg oder richtig weg?", "Away briefly or properly away?", "Na chwilę czy na dłużej?", "Ненадовго чи надовго?"),
            lead: t("Für ganz kurze Unterbrechungen gibt es eine Ausnahme, aber mit klarer Grenze.", "There is an exception for very short breaks, but with a clear limit.", "Dla bardzo krótkich przerw jest wyjątek, ale z jasną granicą.", "Для дуже коротких перерв є виняток, але з чіткою межею."),
            points: [
                pt(t("<b>Kurz verlassen:</b> z. B. Anhänger kuppeln oder kommissionieren. Bleibst du in unmittelbarer Nähe, reicht die Feststellbremse. Der Schlüssel darf stecken bleiben.", "<b>Leaving briefly:</b> e.g. coupling a trailer or picking orders. If you stay right next to it, the parking brake is enough. The key may stay in.", "<b>Krótkie opuszczenie:</b> np. sprzęganie przyczepy albo kompletacja. Jeśli zostajesz tuż obok, wystarczy hamulec postojowy. Kluczyk może zostać.", "<b>Короткий відхід:</b> напр. зчепити причіп або комплектувати товар. Якщо лишаєшся безпосередньо поруч, вистачить стоянкового гальма. Ключ може залишитися в замку.")),
                pt(t("<b>Unmittelbare Nähe</b> heißt: Du kannst bei einer Störung oder wenn jemand losfahren will sofort eingreifen.", "<b>Right next to it</b> means: you can step in immediately if there is a fault or someone tries to drive off.", "<b>Bezpośrednia bliskość</b> oznacza: możesz natychmiast zareagować przy usterce albo gdy ktoś chce odjechać.", "<b>Безпосередня близькість</b> означає: ти можеш одразу втрутитися при збої або якщо хтось хоче поїхати.")),
                pt(t("<b>Am Gefälle:</b> nur wenn es nicht anders geht, dann zusätzlich Unterlegkeile.", "<b>On a slope:</b> only if there is no other way, then also wheel chocks.", "<b>Na spadku:</b> tylko gdy nie da się inaczej, i wtedy dodatkowo kliny pod koła.", "<b>На схилі:</b> лише якщо інакше ніяк, тоді ще й клини під колеса.")),
            ],
            merke: t("Außer Sichtweite oder länger weg: immer komplett sichern.", "Out of sight or away for longer: always secure completely.", "Poza zasięgiem wzroku albo na dłużej: zawsze zabezpiecz wózek w pełni.", "Поза зоною видимості чи надовго: завжди повністю убезпечуй."),
            src: { de: `${V68} §15 Abs. 2 und 3 mit DA; ${I208} Abschn. 7.2` },
        }),
        step("question", {
            title: t("Kaffeepause", "Coffee break", "Przerwa na kawę", "Перерва на каву"),
            text: t("Du gehst für zehn Minuten in den Pausenraum am anderen Ende der Halle. Der Stapler steht auf dem markierten Platz, Gabeln unten, Bremse an.", "You go to the break room at the other end of the hall for ten minutes. The forklift is on the marked place, forks down, brake on.", "Idziesz na dziesięć minut do pokoju socjalnego na drugim końcu hali. Wózek stoi na oznaczonym miejscu, widły w dole, hamulec zaciągnięty.", "Ти йдеш на десять хвилин до кімнати відпочинку в іншому кінці цеху. Навантажувач на позначеному місці, вила внизу, гальмо затягнуто."),
            layout: "list",
            options: [t("Schlüssel stecken lassen, ich bin ja gleich zurück", "Leave the key in, I will be right back", "Zostawić kluczyk w stacyjce, przecież zaraz wracam", "Залишити ключ, я скоро повернуся"), t("Antrieb aus, Schlüssel abziehen und mitnehmen", "Switch off the drive, remove the key and take it with you", "Wyłączyć napęd, wyjąć i zabrać kluczyk", "Вимкнути привід, вийняти й забрати ключ")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das ist kein kurzes Verlassen", "No, that is not leaving briefly", "Nie, to nie jest krótkie opuszczenie", "Ні, це не короткий відхід") },
            body: t("Im Pausenraum kannst du nicht sofort eingreifen. Also gilt die volle Sicherung, auch gegen unbefugte Benutzung.", "From the break room you cannot step in immediately. So full securing applies, including against unauthorised use.", "Z pokoju socjalnego nie zareagujesz od razu. Obowiązuje więc pełne zabezpieczenie, także przed użyciem przez osoby nieupoważnione.", "З кімнати відпочинку ти не втрутишся одразу. Тож потрібне повне убезпечення, зокрема від стороннього використання."),
            src: { de: `${V68} §15 mit DA` },
        }),
        step("video", {
            title: t("Richtig abstellen", "Parking correctly", "Prawidłowe odstawienie", "Правильна стоянка"),
            brief: t("Stapler fährt auf den markierten Platz, Feststellbremse, Gabeln ab, Mast vor bis die Spitzen den Boden berühren, Antrieb aus, Schlüssel abziehen. Nahaufnahmen von Bremse, Gabelspitzen und Schlüssel.", "Forklift drives onto the marked place, parking brake, forks down, mast forward until the tips touch the floor, drive switched off, key out. Close-ups of brake, fork tips and key.", "Wózek wjeżdża na oznaczone miejsce: hamulec postojowy, widły w dół, maszt do przodu, aż końce wideł dotkną podłogi, napęd wyłączony, kluczyk wyjęty. Zbliżenia hamulca, końców wideł i kluczyka.", "Навантажувач заїжджає на позначене місце, гальмо, вила вниз, щогла вперед, поки кінці не торкнуться підлоги, привід вимкнено, ключ вийнято. Крупні плани гальма, кінців вил і ключа."),
            length: t("20 bis 30 Sekunden", "20 to 30 seconds", "20 do 30 sekund", "20–30 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Wo:</b> vorgesehener Platz, eben, nichts zustellen.", "<b>Where:</b> designated place, level, block nothing.", "<b>Gdzie:</b> wyznaczone miejsce, płaskie podłoże, niczego nie zastawiaj.", "<b>Де:</b> визначене місце, рівно, нічого не загороджуй.")),
            pt(t("<b>Wie:</b> Bremse, Gabeln ab, Spitzen nach unten, Antrieb aus, Schlüssel mitnehmen.", "<b>How:</b> brake, forks down, tips down, drive switched off, take the key.", "<b>Jak:</b> hamulec, widły w dół, końce w dół, napęd wyłączony, kluczyk zabrany.", "<b>Як:</b> гальмо, вила вниз, кінці донизу, привід вимкнено, ключ забрано.")),
            pt(t("<b>Kurz weg</b> nur in unmittelbarer Nähe, sonst volle Sicherung.", "<b>Briefly away</b> only right next to it, otherwise full securing.", "<b>Krótka nieobecność</b> tylko gdy zostajesz tuż obok, w przeciwnym razie pełne zabezpieczenie.", "<b>Короткий відхід</b> лише якщо лишаєшся поруч, інакше повне убезпечення.")),
        ] }),
    ];
}

/* ════════════════ 5.3 Andere Personen schützen ════════════════ */
export function lesson53(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Menschen um den Stapler", "People around the forklift", "Ludzie wokół wózka", "Люди навколо навантажувача"),
            lead: t("Bei Staplerunfällen trifft es oft nicht den Fahrer, sondern Menschen in der Nähe. Du hast bei jeder Bewegung die Verantwortung.", "In forklift accidents it is often not the driver who gets hurt but people nearby. You are responsible for every movement.", "W wypadkach z wózkami często poszkodowany jest nie operator, lecz osoby w pobliżu. Za każdy ruch odpowiadasz ty.", "У нещасних випадках з навантажувачами часто страждає не водій, а люди поруч. За кожен рух відповідаєш ти."),
            points: [
                pt(t("<b>Niemand unter der Last:</b> nicht unter angehobener Last oder Gabel, nicht auf der Last.", "<b>Nobody under the load:</b> not under a raised load or fork, not on the load.", "<b>Nikt pod ładunkiem:</b> ani pod podniesionym ładunkiem lub widłami, ani na ładunku.", "<b>Ніхто під вантажем:</b> ні під піднятим вантажем чи вилами, ні на вантажі.")),
                pt(t("<b>Keine Mitfahrer:</b> nur auf Staplern mit eigenem Sitz- oder Standplatz und Haltegriffen, und nur wenn die Betriebsanweisung es erlaubt. Nie auf der Gabel oder dem Trittblech.", "<b>No passengers:</b> only on forklifts with their own seat or standing place and handles, and only if the operating instructions allow it. Never on the fork or the step.", "<b>Bez pasażerów:</b> tylko na wózkach z osobnym siedzeniem lub miejscem stojącym dla pasażera i uchwytami, i tylko gdy pozwala na to instrukcja stanowiskowa. Nigdy na widłach ani na stopniu.", "<b>Без пасажирів:</b> лише на навантажувачах з окремим сидінням чи місцем і поручнями, і лише якщо дозволяє робоча інструкція. Ніколи на вилах чи підніжці.")),
                pt(t("<b>Abstand halten:</b> Wo Lasten aufgenommen oder abgesetzt werden, haben Fußgänger nichts zu suchen. Muss jemand dorthin, verständigt er sich vorher mit dir.", "<b>Keep clear:</b> pedestrians have no business where loads are picked up or set down. If someone has to go there, they agree it with you first.", "<b>Trzymaj dystans:</b> piesi nie mają czego szukać tam, gdzie podejmuje się lub odstawia ładunki. Jeśli ktoś musi tam wejść, najpierw się z tobą porozumiewa.", "<b>Тримай дистанцію:</b> пішоходам нема чого робити там, де піднімають чи ставлять вантаж. Якщо комусь треба туди, він спершу домовляється з тобою.")),
                pt(t("<b>Aufsteigen nur im Stand:</b> Auf- und absteigen nur, wenn der Stapler steht.", "<b>Get on only when stopped:</b> get on and off only when the forklift is stationary.", "<b>Wsiadanie tylko na postoju:</b> wsiadaj i wysiadaj tylko, gdy wózek stoi.", "<b>Сідати лише коли машина стоїть:</b> сідай і сходь лише коли навантажувач стоїть.")),
            ],
            merke: t("Unter, auf und an der Last ist für Menschen kein Platz.", "Under, on and next to the load is no place for people.", "Pod, na i przy ładunku nie ma miejsca dla ludzi.", "Під, на і біля вантажу людям не місце."),
            src: { de: `${V68} §16 Abs. 1 bis 4, §25` },
        }),
        step("sim", { sim: "people", texts: PEOPLE_TEXTS,
            title: t("Wer ist hier in Gefahr?", "Who is in danger here?", "Kto tu jest w niebezpieczeństwie?", "Хто тут у небезпеці?"),
            lead: t("Finde die vier gefährlichen Situationen in der Halle. Drehe die Halle mit dem Finger, um alles zu sehen.", "Find the four dangerous situations in the hall. Rotate the hall with your finger to see everything.", "Znajdź cztery niebezpieczne sytuacje w hali. Obracaj halę palcem, by zobaczyć wszystko.", "Знайди чотири небезпечні ситуації в цеху. Обертай цех пальцем, щоб усе побачити."),
            zones: [
                { id: "under", bad: true, label: t("Unter der angehobenen Last", "Under the raised load", "Pod podniesionym ładunkiem", "Під піднятим вантажем"), why: t("Rutscht die Palette ab oder versagt die Hydraulik, wird die Person getroffen. Fahrer stoppt, bis der Bereich frei ist.", "If the pallet slips or the hydraulics fail, the person is hit. The driver stops until the area is clear.", "Gdy paleta się zsunie albo zawiedzie hydraulika, osoba zostanie uderzona. Operator zatrzymuje się, aż obszar będzie wolny.", "Якщо палета зісковзне чи відмовить гідравліка, людину вдарить. Водій зупиняється, поки зона не звільниться.") },
                { id: "forks", bad: true, label: t("Person auf der Gabel", "Person on the fork", "Osoba na widłach", "Людина на вилах"), why: t("Personen auf dem angehobenen Lastaufnahmemittel sind verboten. Zum Arbeiten in der Höhe gibt es Arbeitsbühnen mit Geländer, sicher befestigt.", "People on the raised load handling device are prohibited. For work at height there are work platforms with railings, securely fixed.", "Przebywanie ludzi na podniesionym osprzęcie jest zakazane. Do pracy na wysokości są pewnie zamocowane podesty robocze z barierkami.", "Перебування людей на піднятому вантажозахоплювачі заборонене. Для роботи на висоті є надійно закріплені робочі платформи з поручнями.") },
                { id: "reverse", bad: true, label: t("Fußgänger hinter dem Stapler", "Pedestrian behind the forklift", "Pieszy za wózkiem", "Пішохід за навантажувачем"), why: t("Der Stapler fährt rückwärts, der Fußgänger schaut aufs Handy. Vor dem Rückwärtsfahren nach hinten schauen. Ist die Sicht eingeschränkt, hilft ein Einweiser.", "The forklift is reversing, the pedestrian is looking at a phone. Look behind before reversing. If the view is limited, a banksman helps.", "Wózek cofa, pieszy patrzy w telefon. Przed cofaniem spójrz do tyłu. Przy ograniczonej widoczności pomaga sygnalista.", "Навантажувач їде задом, пішохід дивиться в телефон. Перед заднім ходом подивись назад. Якщо огляд обмежений — допоможе сигнальник.") },
                { id: "ride", bad: true, label: t("Mitfahrer auf dem Trittblech", "Passenger on the step", "Pasażer na stopniu", "Пасажир на підніжці"), why: t("Mitfahren nur auf eigenen Sitz- oder Standplätzen mit Haltegriffen. Auf dem Trittblech kann die Person abrutschen und überrollt werden.", "Riding only on dedicated seats or standing places with handles. On the step, the person can slip and be run over.", "Jazda tylko na osobnych siedziskach lub stanowiskach z uchwytami. Ze stopnia można się ześlizgnąć i trafić pod koła.", "Їздити лише на окремих сидіннях чи місцях з поручнями. З підніжки можна зісковзнути й потрапити під колеса.") },
                { id: "walk", label: t("Fußgänger auf dem Gehweg", "Pedestrian on the walkway", "Pieszy na chodniku", "Пішохід на тротуарі"), why: t("Getrennter Gehweg mit Geländer: So bleiben Fußgänger und Stapler auseinander.", "Separate walkway with railing: this keeps pedestrians and forklifts apart.", "Wydzielony chodnik z barierką: tak piesi i wózki są od siebie oddzieleni.", "Окремий тротуар з поручнями: так пішоходи й навантажувачі розділені.") },
                { id: "guide", label: t("Einweiser vor dem Stapler", "Banksman in front of the forklift", "Sygnalista przed wózkiem", "Сигнальник перед навантажувачем"), why: t("Der Einweiser steht gut sichtbar mit Abstand und gibt Zeichen. So fährt der Fahrer auch bei eingeschränkter Sicht sicher.", "The banksman stands clearly visible at a distance and gives signals. This way the driver drives safely even with limited visibility.", "Sygnalista stoi w bezpiecznej odległości, dobrze widoczny, i daje znaki. Dzięki temu operator jedzie bezpiecznie także przy ograniczonej widoczności.", "Сигнальник стоїть на видноті на відстані й подає знаки. Так водій безпечно їде навіть за обмеженого огляду.") },
            ],
            done: t("Alle vier Gefahren erkannt.", "All four hazards spotted.", "Rozpoznałeś wszystkie cztery zagrożenia.", "Усі чотири небезпеки виявлено."),
            src: { de: `${V68} §12 Abs. 1, §16, §25` } }),
        step("learn", {
            title: t("Sehen und gesehen werden", "See and be seen", "Widzieć i być widzianym", "Бачити й бути поміченим"),
            lead: t("Die meisten Zusammenstöße passieren, weil einer den anderen nicht gesehen hat.", "Most collisions happen because one did not see the other.", "Większość zderzeń zdarza się, bo ktoś kogoś nie zauważył.", "Більшість зіткнень стається, бо хтось когось не помітив."),
            points: [
                pt(t("<b>Freie Sicht:</b> Du fährst nur, wenn du die Fahrbahn siehst oder eingewiesen wirst. Versperrt eine große Last die Sicht, fährst du rückwärts.", "<b>Clear view:</b> you only drive if you can see the route or a banksman guides you. If a large load blocks the view, you drive backwards.", "<b>Dobra widoczność:</b> jedziesz tylko, gdy widzisz drogę albo kieruje tobą sygnalista. Gdy duży ładunek zasłania widok, jedziesz tyłem.", "<b>Вільний огляд:</b> їдеш лише якщо бачиш дорогу або тебе скеровує сигнальник. Якщо великий вантаж закриває огляд, їдеш заднім ходом.")),
                pt(t("<b>Rückwärts:</b> vorher umschauen. Nicht rückwärts mit Lasten, die seitlich überstehen. Häufiges Rückwärtsfahren belastet die Wirbelsäule.", "<b>Reversing:</b> look round first. Not backwards with loads that stick out sideways. Frequent reversing strains the spine.", "<b>Cofanie:</b> najpierw się rozejrzyj. Nie cofaj z ładunkiem wystającym na boki. Częste cofanie obciąża kręgosłup.", "<b>Задній хід:</b> спершу озирнись. Не їдь задом з вантажем, що виступає вбоки. Часта їзда задом навантажує хребет.")),
                pt(t("<b>Warnzeichen:</b> Mit der Hupe machst du auf dich aufmerksam, wenn Personen dich nicht bemerken.", "<b>Warning signals:</b> use the horn to draw attention when people do not notice you.", "<b>Sygnały ostrzegawcze:</b> klaksonem zwracasz na siebie uwagę, gdy ktoś cię nie zauważa.", "<b>Попереджувальні сигнали:</b> клаксоном привертаєш увагу, коли тебе не помічають.")),
                pt(t("<b>Lärm und Kundenverkehr:</b> Im Lärmbereich Gehörschutz tragen, guter Gehörschutz lässt Warnsignale noch durch. Wo Kunden unterwegs sind, besonders langsam fahren und den Arbeitsbereich sichern.", "<b>Noise and customer traffic:</b> wear hearing protection in noise areas, good protection still lets warning signals through. Where customers are about, drive especially slowly and secure the work area.", "<b>Hałas i ruch klientów:</b> w strefie hałasu noś ochronniki, dobre ochronniki przepuszczają sygnały ostrzegawcze. Gdzie są klienci, jedź szczególnie wolno i zabezpiecz obszar pracy.", "<b>Шум і рух клієнтів:</b> у шумній зоні носи захист слуху: добрий захист слуху все ж пропускає попереджувальні сигнали. Де є клієнти, їдь особливо повільно й огороджуй робочу зону.")),
            ],
            merke: t("Siehst du nichts, fährst du nicht. Hol dir einen Einweiser.", "If you cannot see, you do not drive. Get a banksman.", "Nie widzisz, nie jedziesz. Poproś o pomoc sygnalistę.", "Не бачиш — не їдеш. Поклич сигнальника."),
            src: { de: `${V68} §12 Abs. 1 mit DA; ${I208} Abschn. 3.3; DGUV G 308-001 (Entwurf 2026) Anhang B` },
        }),
        step("learn", {
            title: t("Assistenzsysteme", "Assistance systems", "Systemy wspomagające", "Системи допомоги"),
            lead: t("Technik kann helfen, wenn die Sicht nicht reicht. Welche erlaubt ist, gibt der Hersteller vor.", "Technology can help when the view is not enough. The manufacturer specifies which is allowed.", "Technika może pomóc, gdy widoczność nie wystarcza. Które systemy są dozwolone, określa producent.", "Техніка може допомогти, коли огляду бракує. Які дозволені, визначає виробник."),
            points: [
                pt(t("<b>Spiegel, Kamera und Monitor</b> zeigen, was hinter oder neben dir passiert.", "<b>Mirrors, camera and monitor</b> show what happens behind or beside you.", "<b>Lusterka, kamera i monitor</b> pokazują, co dzieje się za tobą lub obok.", "<b>Дзеркала, камера й монітор</b> показують, що відбувається позаду чи поруч.")),
                pt(t("<b>Akustische und optische Warnhinweise</b> machen andere auf den Stapler aufmerksam.", "<b>Acoustic and visual warnings</b> make others aware of the forklift.", "<b>Ostrzeżenia dźwiękowe i świetlne</b> zwracają uwagę innych na wózek.", "<b>Звукові й світлові попередження</b> привертають увагу інших до навантажувача.")),
                pt(t("<b>Sensoren zur Personenerkennung</b> warnen oder bremsen, wenn jemand im Fahrweg ist.", "<b>Sensors for detecting people</b> warn or brake when someone is in the path.", "<b>Czujniki wykrywania osób</b> ostrzegają albo hamują, gdy ktoś jest na drodze.", "<b>Датчики розпізнавання людей</b> попереджають або гальмують, коли хтось на шляху.")),
                pt(t("<b>Erhöhter oder drehbarer Sitz</b> verbessert die Sicht und schont den Rücken.", "<b>A raised or swivelling seat</b> improves the view and protects the back.", "<b>Podwyższony lub obrotowy fotel</b> poprawia widoczność i oszczędza plecy.", "<b>Підняте чи поворотне сидіння</b> покращує огляд і береже спину.")),
            ],
            merke: t("Assistenzsysteme helfen, aber sie fahren nicht für dich. Hinschauen bleibt deine Aufgabe.", "Assistance systems help, but they do not drive for you. Looking remains your job.", "Systemy pomagają, ale nie jadą za ciebie. Obserwowanie otoczenia nadal należy do ciebie.", "Системи допомагають, але не їдуть за тебе. Дивитися — й надалі твоє завдання."),
            src: { de: `${V68} DA zu §12 Abs. 1` },
        }),
        step("question", {
            title: t("Die Kamera piept nicht", "The camera does not beep", "Kamera nie piszczy", "Камера не пищить"),
            text: t("Dein Stapler hat eine Rückfahrkamera mit Personenerkennung. Du willst rückwärts aus dem Regalgang, der Monitor zeigt nichts.", "Your forklift has a reversing camera with people detection. You want to reverse out of the aisle, the monitor shows nothing.", "Twój wózek ma kamerę cofania z wykrywaniem osób. Chcesz wyjechać tyłem z alejki między regałami, monitor nic nie pokazuje.", "Твій навантажувач має камеру заднього ходу з розпізнаванням людей. Ти хочеш виїхати задом із проходу, монітор нічого не показує."),
            layout: "list",
            options: [t("Losfahren, die Technik hätte gewarnt", "Drive off, the system would have warned", "Ruszyć, system by ostrzegł", "Рушити, система попередила б"), t("Trotzdem umschauen und langsam zurücksetzen", "Look round anyway and reverse slowly", "Mimo to się rozejrzeć i powoli cofać", "Все одно озирнутися й повільно здати назад")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, Technik ersetzt nicht den Blick", "No, technology does not replace looking", "Nie, technika nie zastąpi patrzenia", "Ні, техніка не замінює погляд") },
            body: t("Kameras haben tote Winkel, Sensoren können verschmutzt sein. Du bleibst verantwortlich, dass niemand gefährdet wird.", "Cameras have blind spots, sensors can be dirty. You remain responsible that nobody is endangered.", "Kamery mają martwe pola, czujniki mogą być zabrudzone. Nadal to ty odpowiadasz za to, by nikt nie był zagrożony.", "Камери мають сліпі зони, датчики можуть бути брудними. Ти й надалі відповідаєш за те, щоб нікому не загрожувала небезпека."),
            src: { de: `${V68} §16 Abs. 1, DA zu §12 Abs. 1` },
        }),
        step("video", {
            title: t("Begegnung mit Fußgängern", "Meeting pedestrians", "Spotkanie z pieszymi", "Зустріч з пішоходами"),
            brief: t("Stapler nähert sich einer unübersichtlichen Ecke, hält an, hupt kurz, ein Fußgänger quert, dann fährt der Stapler weiter. Danach Rückwärtsfahrt mit Schulterblick. Kamera aus Fahrerperspektive und von außen.", "Forklift approaches a blind corner, stops, sounds the horn briefly, a pedestrian crosses, then the forklift continues. Then reversing with a look over the shoulder. Camera from driver perspective and outside.", "Wózek zbliża się do narożnika bez widoczności, zatrzymuje się, krótko trąbi, pieszy przechodzi, wózek jedzie dalej. Potem cofanie z obejrzeniem się przez ramię. Kamera z perspektywy operatora i z zewnątrz.", "Навантажувач під’їжджає до кута без огляду, зупиняється, коротко сигналить, пішохід проходить, навантажувач їде далі. Потім задній хід з поглядом через плече. Камера з місця водія і ззовні."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Niemand</b> unter, auf oder an der Last, keine Mitfahrer ohne eigenen Platz.", "<b>Nobody</b> stands under, on or next to the load; no passengers without a dedicated place.", "<b>Nikt</b> nie przebywa pod ładunkiem, na nim ani przy nim; żadnych pasażerów bez osobnego miejsca.", "<b>Ніхто</b> не перебуває під вантажем, на ньому чи біля нього; жодних пасажирів без окремого місця.")),
            pt(t("<b>Sicht:</b> sonst rückwärts oder mit Einweiser, vor dem Rückwärtsfahren umschauen.", "<b>View:</b> otherwise drive in reverse or use a banksman; look round before reversing.", "<b>Widoczność:</b> w przeciwnym razie jedź tyłem albo z sygnalistą; przed cofaniem się rozejrzyj.", "<b>Огляд:</b> інакше їдь заднім ходом або із сигнальником; перед заднім ходом озирнись.")),
            pt(t("<b>Assistenzsysteme</b> helfen, die Verantwortung bleibt bei dir.", "<b>Assistance systems</b> help, the responsibility stays with you.", "<b>Systemy wspomagające</b> pomagają, ale odpowiedzialność nadal spoczywa na tobie.", "<b>Системи допомоги</b> допомагають, але відповідальність лишається на тобі.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson5Check(step: Mk): Step[] {
    return [
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Wer erstellt die Betriebsanweisung?", "Who writes the operating instructions?", "Kto sporządza instrukcję stanowiskową?", "Хто складає робочу інструкцію?"),
                    options: [t("Der Unternehmer", "The employer", "Pracodawca", "Роботодавець"), t("Der Hersteller", "The manufacturer", "Producent", "Виробник")], correct: 0,
                    why: t("DGUV Vorschrift 68 §5. Die Betriebsanleitung kommt vom Hersteller.", "DGUV Regulation 68 §5. The operating manual comes from the manufacturer.", "DGUV Vorschrift 68 §5. Instrukcja obsługi pochodzi od producenta.", "DGUV Vorschrift 68 §5. Інструкція з експлуатації — від виробника.") },
                { q: t("Was gehört zur bestimmungsgemäßen Verwendung?", "What is part of intended use?", "Co należy do użycia zgodnego z przeznaczeniem?", "Що входить до використання за призначенням?"),
                    options: [t("Fahrerrückhaltesystem benutzen", "Using the operator restraint", "Używanie systemu przytrzymującego", "Використання системи утримання"), t("Lasten mit den Zinken schieben", "Pushing loads with the fork arms", "Pchanie ładunków widłami", "Штовхання вантажів вилами")], correct: 0,
                    why: t("DGUV Vorschrift 68, DA zu §6.", "DGUV Regulation 68, implementation note on §6.", "DGUV Vorschrift 68, DA do §6.", "DGUV Vorschrift 68, DA до §6.") },
                { q: t("Wie verlässt du den Stapler zum Feierabend?", "How do you leave the forklift at the end of the shift?", "Jak zostawiasz wózek na koniec zmiany?", "Як залишаєш навантажувач наприкінці зміни?"),
                    options: [t("Bremse, Gabeln ab, Spitzen nach unten, Antrieb aus, Schlüssel mitnehmen", "Brake, forks down, tips down, drive switched off, take the key", "Hamulec, widły w dół, końce w dół, napęd wyłączony, kluczyk zabrany", "Гальмо, вила вниз, кінці донизу, привід вимкнено, ключ забрано"), t("Gabeln auf Kniehöhe, damit morgen schneller losgeht", "Forks at knee height so you can start faster tomorrow", "Widły na wysokości kolan, żeby jutro szybciej ruszyć", "Вила на рівні колін, щоб завтра швидше почати")], correct: 0,
                    why: t("DGUV Vorschrift 68 §15 Abs. 1.", "DGUV Regulation 68 §15 para. 1.", "DGUV Vorschrift 68 §15 ust. 1.", "DGUV Vorschrift 68 §15 абз. 1.") },
                { q: t("Wo darfst du den Stapler nicht abstellen?", "Where must you not park the forklift?", "Gdzie nie wolno odstawić wózka?", "Де не можна залишати навантажувач?"),
                    options: [t("Vor einem Notausgang", "In front of an emergency exit", "Przed wyjściem ewakuacyjnym", "Перед аварійним виходом"), t("Auf dem markierten Abstellplatz", "On the marked parking place", "Na oznaczonym miejscu postoju", "На позначеному місці стоянки")], correct: 0,
                    why: t("Flucht- und Verkehrswege und Sicherheitseinrichtungen bleiben frei.", "Escape and traffic routes and safety equipment stay clear.", "Drogi ewakuacyjne, komunikacyjne i urządzenia bezpieczeństwa muszą być wolne.", "Шляхи евакуації, проїзди й захисне обладнання мають бути вільні.") },
                { q: t("Ein Kollege will auf dem Trittblech mitfahren. Dein Stapler hat keinen Beifahrerplatz.", "A colleague wants to ride on the step. Your forklift has no passenger place.", "Kolega chce jechać na stopniu. Twój wózek nie ma miejsca dla pasażera.", "Колега хоче проїхатися на підніжці. Місця для пасажира немає."),
                    options: [t("Ablehnen", "Refuse", "Odmówić", "Відмовити"), t("Langsam fahren und mitnehmen", "Drive slowly and take him along", "Jechać powoli i zabrać go", "Їхати повільно й узяти його")], correct: 0,
                    why: t("DGUV Vorschrift 68 §16 Abs. 4 und §25.", "DGUV Regulation 68 §16 para. 4 and §25.", "DGUV Vorschrift 68 §16 ust. 4 i §25.", "DGUV Vorschrift 68 §16 абз. 4 і §25.") },
                { q: t("Eine große Last versperrt dir die Sicht nach vorn. Was tust du?", "A large load blocks your forward view. What do you do?", "Duży ładunek zasłania ci widok do przodu. Co robisz?", "Великий вантаж закриває огляд уперед. Що робиш?"),
                    options: [t("Rückwärts fahren oder einweisen lassen", "Drive backwards or get guided", "Jechać tyłem albo z pomocą sygnalisty", "Їхати заднім ходом або із сигнальником"), t("Last höher heben und darunter durchschauen", "Lift the load higher and look underneath", "Podnoszę ładunek wyżej i patrzę pod nim", "Піднімаю вантаж вище й дивлюся під ним")], correct: 0,
                    why: t("DGUV Vorschrift 68 §12 Abs. 1 mit DA. Mit angehobener Last fährt ein Frontstapler nicht.", "DGUV Regulation 68 §12 para. 1 with note. A front forklift does not drive with a raised load.", "DGUV Vorschrift 68 §12 ust. 1 z DA. Wózek czołowy nie jeździ z podniesionym ładunkiem.", "DGUV Vorschrift 68 §12 абз. 1 з DA. Фронтальний навантажувач не їздить з піднятим вантажем.") },
            ],
            allRight: t("Stark. Modul geschafft.", "Great. Module complete.", "Świetnie. Moduł zaliczony.", "Чудово. Модуль пройдено."),
            someWrong: t("Fast. Geh bei Bedarf zu den Themen zurück.", "Almost. Go back to the topics if needed.", "Prawie. W razie potrzeby wróć do tematów.", "Майже. За потреби повернися до тем."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Papiere und Auftrag:</b> Anleitung, Anweisung, schriftlicher Fahrauftrag.", "<b>Documents and authorisation:</b> manual, instructions, written authorisation.", "<b>Dokumenty i upoważnienie:</b> instrukcja obsługi, instrukcja stanowiskowa, pisemne upoważnienie do jazdy.", "<b>Документи й доручення:</b> інструкція з експлуатації, робоча інструкція, письмове доручення.")),
            pt(t("<b>Abstellen und Menschen:</b> sicher abstellen, niemand unter oder auf der Last, Sicht vor Tempo.", "<b>Parking and people:</b> park safely, nobody under or on the load, view before speed.", "<b>Odstawianie i ludzie:</b> bezpiecznie odstaw, nikt pod ani na ładunku, widoczność ważniejsza niż tempo.", "<b>Стоянка й люди:</b> безпечно залишай, ніхто під чи на вантажі, огляд важливіший за темп.")),
        ] }),
    ];
}
