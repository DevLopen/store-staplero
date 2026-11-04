/**
 * Unfallgeschehen (spis klienta, punkt 1), od razu w czterech językach.
 * Źródła: DGUV Statistik „Arbeitsunfallgeschehen 2024” (Ausgabe Oktober 2025), Kap. 7, Tabellen 58 und 59;
 * „Arbeitsunfallgeschehen 2023” (September 2024), Tabellen 57 und 58; BG ETEM „Aus Unfällen lernen: Umsturz mit Gabelstapler”;
 * BG RCI Unterweisungshilfe „So nicht! Gabelstapler”; DGUV Information 208-004 Abschn. 6.4.3; SGB VII §193.
 * Liczby do aktualizacji, gdy DGUV wyda nowszy raport.
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
const STAT24 = "DGUV Statistik „Arbeitsunfallgeschehen 2024“ (10/2025), Kap. 7, Tab. 58 und 59";

const STATS_TEXTS = texts([
    ["Deine Schätzung", "Your estimate", "Twoje oszacowanie", "Твоє припущення"],
    ["Auflösen", "Reveal", "Pokaż wynik", "Показати"],
    ["Sehr nah dran.", "Very close.", "Bardzo blisko.", "Дуже близько."],
    ["Es sind {p} % mehr, als du geschätzt hast.", "That is {p} % more than you estimated.", "To o {p} % więcej, niż szacowałeś.", "Це на {p} % більше, ніж ти оцінив."],
    ["Es sind weniger, als du geschätzt hast, aber immer noch sehr viele.", "That is fewer than you estimated, but still a lot.", "To mniej, niż szacowałeś, ale wciąż bardzo dużo.", "Це менше, ніж ти оцінив, але все одно дуже багато."],
    ["rund {n}", "about {n}", "ok. {n}", "близько {n}"],
    ["an jedem Arbeitstag", "every working day", "każdego dnia roboczego", "кожного робочого дня"],
    ["so schwer, dass eine Unfallrente nötig wurde", "so serious that an accident pension was needed", "tak ciężkich, że trzeba było przyznać rentę wypadkową", "настільки тяжких, що знадобилося призначити пенсію через нещасний випадок"],
    ["Menschen starben", "people died", "osób zginęło", "людей загинуло"],
    ["Vorjahr: {n} Unfälle, {d} Tote. Arbeitstage gerechnet mit rund 250 pro Jahr.", "Previous year: {n} accidents, {d} deaths. Working days calculated at about 250 per year.", "Rok wcześniej: {n} wypadków, {d} ofiar śmiertelnych. Dni robocze liczone jako ok. 250 w roku.", "Попередній рік: {n} нещасних випадків, {d} загиблих. Робочі дні: близько 250 на рік."],
    ["Meldepflichtige Unfälle", "Reportable accidents", "Wypadki podlegające zgłoszeniu", "Нещасні випадки, що підлягають повідомленню"],
    ["{d} tödlich", "{d} fatal", "{d} śmiertelne", "{d} смертельні"],
    ["Anteil der Unfälle mit Flurförderzeugen", "Share of accidents involving industrial trucks", "Odsetek wypadków z wózkami jezdniowymi", "Частка нещасних випадків з навантажувачами"],
    ["Als Tabelle anzeigen", "Show as table", "Pokaż jako tabelę", "Показати таблицею"],
    ["Unfälle", "Accidents", "Wypadki", "Нещасні випадки"], ["tödlich", "fatal", "śmiertelne", "смертельні"],
]);

/* ════════════════ Zahlen und Fakten ════════════════ */
export function lessonU1(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Unfallgeschehen", "Accident statistics", "Wypadki z wózkami", "Нещасні випадки"), image: "forklift",
            text: t("Bevor es um Technik und Regeln geht: Wie oft passiert mit Flurförderzeugen eigentlich etwas, und wen trifft es?",
                "Before we get to technology and rules: how often does something actually happen with industrial trucks, and who gets hurt?",
                "Zanim przejdziemy do techniki i przepisów: jak często naprawdę dochodzi do wypadków z wózkami i kogo dotykają?",
                "Перш ніж перейти до техніки й правил: як часто насправді стаються нещасні випадки з навантажувачами і кого вони зачіпають?"),
            meta: [t("ca. 25 Minuten", "about 25 minutes", "ok. 25 minut", "близько 25 хвилин"), t("Zahlen, zwei echte Unfälle und ihre Ursachen", "Figures, two real accidents and their causes", "Liczby, dwa prawdziwe wypadki i ich przyczyny", "Цифри, два реальні випадки та їхні причини"), { de: "DGUV Statistik 2024" }],
        }),
        step("sim", { sim: "stats", texts: STATS_TEXTS,
            title: t("Was schätzt du?", "What is your guess?", "Jak myślisz?", "Як гадаєш?"),
            lead: t("Wie viele meldepflichtige Arbeitsunfälle mit Flurförderzeugen gab es 2024 in Deutschland?", "How many reportable work accidents involving industrial trucks were there in Germany in 2024?", "Ile wypadków przy pracy z wózkami, podlegających zgłoszeniu, było w Niemczech w 2024 roku?", "Скільки нещасних випадків на роботі з навантажувачами, що підлягають повідомленню, було в Німеччині у 2024 році?"),
            heroLabel: t("meldepflichtige Arbeitsunfälle mit Flurförderzeugen 2024", "reportable work accidents involving industrial trucks in 2024", "wypadków przy pracy z wózkami jezdniowymi podlegających zgłoszeniu w 2024 roku", "нещасних випадків на роботі з навантажувачами, що підлягають повідомленню, у 2024 році"),
            total: 18035, dead: 8, pensions: 322, prev: { n: 18491, dead: 7 },
            barsTitle: t("Nach Art des Geräts, 2024", "By type of truck, 2024", "Według rodzaju wózka, 2024", "За типом техніки, 2024"),
            bars: [
                { label: t("Gegengewichtsstapler", "Counterbalance forklift", "Wózek czołowy z przeciwwagą", "Фронтальний навантажувач із противагою"), n: 5924, dead: 4 },
                { label: t("Handgabelhubwagen", "Hand pallet truck", "Ręczny wózek paletowy", "Ручний палетний візок"), n: 5911, dead: 1 },
                { label: t("Mitgänger, Elektro-Ameise", "Pedestrian-controlled electric truck", "Elektryczny wózek prowadzony („Ameise”)", "Електровізок із супроводом («Ameise»)"), n: 3038 },
                { label: t("Sonstige Flurförderzeuge", "Other industrial trucks", "Inne wózki jezdniowe", "Інші навантажувачі"), n: 1914, dead: 1 },
                { label: t("Schubmast-, Seiten-, Querstapler", "Reach, side and multi-way trucks", "Wózki z wysuwanym masztem, boczne i wielokierunkowe", "Річтраки, бокові й багатоходові навантажувачі"), n: 1032 },
                { label: t("Teleskopstapler", "Telehandler", "Ładowarka teleskopowa", "Телескопічний навантажувач"), n: 216, dead: 2 },
            ],
            partsTitle: t("Wie es passiert", "How it happens", "Jak do nich dochodzi", "Як це стається"),
            parts: [
                { label: t("Die verletzte Person fährt selbst", "The injured person is driving", "Poszkodowany sam prowadzi", "Постраждалий сам керує"), pct: 38.6, n: 6960 },
                { label: t("Angefahren, eingequetscht, überfahren", "Hit, crushed, run over", "Potrącony, przygnieciony, przejechany", "Збитий, затиснутий, переїханий"), pct: 41.1, n: 7420 },
                { label: t("Übrige Unfallhergänge", "Other circumstances", "Inne okoliczności", "Інші обставини"), pct: 20.3, n: 3655 },
            ],
            src: { de: `${STAT24}; Vorjahr: „Arbeitsunfallgeschehen 2023“, Tab. 57` } }),
        step("learn", {
            title: t("Was die Zahlen zeigen", "What the figures show", "Co pokazują liczby", "Що показують цифри"),
            lead: t("Hinter jeder Zahl steht ein Mensch, der mindestens drei Tage nicht arbeiten konnte.", "Behind every number is a person who could not work for at least three days.", "Za każdą liczbą stoi człowiek, który co najmniej trzy dni nie mógł pracować.", "За кожною цифрою — людина, яка щонайменше три дні не могла працювати."),
            points: [
                pt(t("<b>Meldepflichtig</b> ist ein Arbeitsunfall, wenn du dadurch mehr als drei Tage arbeitsunfähig bist oder stirbst.", "<b>Reportable</b> means a work accident leaves you unable to work for more than three days or is fatal.", "<b>Podlegający zgłoszeniu</b> jest wypadek, po którym jesteś niezdolny do pracy dłużej niż trzy dni albo który kończy się śmiercią.", "<b>Підлягає повідомленню</b> нещасний випадок, після якого ти непрацездатний понад три дні або який закінчився смертю.")),
                pt(t("<b>Gegengewichtsstapler</b> sind an den meisten Unfällen beteiligt, und an der Hälfte der Todesfälle. Meist geht es um den Verlust der Kontrolle über den Stapler oder darum, von etwas erfasst zu werden.", "<b>Counterbalance forklifts</b> are involved in most accidents and in half of the deaths. Most often the driver loses control of the truck or a person is struck or caught by an object.", "<b>Wózki czołowe</b> biorą udział w największej liczbie wypadków i w połowie wypadków śmiertelnych. Najczęściej operator traci panowanie nad wózkiem albo człowieka uderza lub pochwyca jakiś przedmiot.", "<b>Фронтальні навантажувачі</b> беруть участь у більшості нещасних випадків і в половині смертельних. Найчастіше водій втрачає контроль над навантажувачем або людину вдаряє чи захоплює якийсь предмет.")),
                pt(t("<b>Es trifft oft die anderen:</b> 41 % der Verletzten wurden angefahren, eingequetscht oder überfahren, meist Fußgänger und Kollegen.", "<b>It often hits others:</b> 41 % of the injured were hit, crushed or run over, mostly pedestrians and colleagues.", "<b>Często cierpią inni:</b> 41 % poszkodowanych zostało potrąconych, przygniecionych lub przejechanych, głównie piesi i współpracownicy.", "<b>Часто страждають інші:</b> 41 % постраждалих збили, затиснули чи переїхали — переважно пішоходів і колег.")),
                pt(t("<b>Füße und Knöchel</b> sind bei 45 % der Unfälle mit Flurfördermitteln verletzt. Bei schweren Fällen mit Unfallrente sind es zu 71 % Knochenbrüche.", "<b>Feet and ankles</b> are injured in 45 % of accidents with materials handling equipment. In serious cases where an accident pension was granted, 71 % are bone fractures.", "<b>Stopy i kostki</b> zostają zranione w 45 % wypadków ze sprzętem do transportu wewnętrznego. W ciężkich przypadkach, w których przyznano rentę wypadkową, w 71 % są to złamania kości.", "<b>Ступні й кісточки</b> травмовані в 45 % нещасних випадків із транспортною технікою. У тяжких випадках, коли призначено пенсію через нещасний випадок, у 71 % це переломи кісток.")),
                pt(t("<b>Handel und Warenlogistik</b> haben mit 40 % den größten Anteil, danach Metall- und Holzwirtschaft sowie Verkehr und Post mit je 13 %.", "<b>Trade and logistics</b> have the largest share at 40 %, followed by metal and wood industry and transport and post at 13 % each.", "<b>Handel i logistyka</b> mają największy udział, 40 %, dalej branża metalowa i drzewna oraz transport i poczta, po 13 %.", "<b>Торгівля й логістика</b> мають найбільшу частку — 40 %, далі металообробка й деревообробка та транспорт і пошта, по 13 %.")),
            ],
            merke: t("Die meisten dieser Unfälle lassen sich mit dem vermeiden, was du in diesem Kurs lernst.", "Most of these accidents can be avoided with what you learn in this course.", "Większości tych wypadków można uniknąć dzięki temu, czego nauczysz się na tym kursie.", "Більшості цих випадків можна уникнути завдяки тому, що ти вивчиш на цьому курсі."),
            src: { de: `${STAT24}; SGB VII §193` },
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Über 18.000</b> meldepflichtige Unfälle mit Flurförderzeugen im Jahr, rund 70 an jedem Arbeitstag.", "<b>Over 18,000</b> reportable accidents with industrial trucks a year, about 70 every working day.", "<b>Ponad 18 000</b> wypadków z wózkami jezdniowymi podlegających zgłoszeniu rocznie, czyli ok. 70 każdego dnia roboczego.", "<b>Понад 18 000</b> нещасних випадків з навантажувачами на рік, що підлягають повідомленню, тобто близько 70 кожного робочого дня.")),
            pt(t("<b>Gegengewichtsstapler</b> führen bei Unfällen und Todesfällen.", "<b>Counterbalance forklifts</b> account for the most accidents and the most deaths.", "<b>Wózki czołowe</b> odpowiadają za najwięcej wypadków i najwięcej ofiar śmiertelnych.", "<b>Фронтальні навантажувачі</b> спричиняють найбільше нещасних випадків і найбільше смертей.")),
            pt(t("<b>Fußgänger und Kollegen</b> sind besonders oft die Opfer.", "<b>Pedestrians and colleagues</b> are particularly often the victims.", "<b>Piesi i współpracownicy</b> szczególnie często są ofiarami.", "<b>Пішоходи й колеги</b> особливо часто стають жертвами.")),
        ] }),
    ];
}

/* ════════════════ Aus Unfällen lernen ════════════════ */
export function lessonU2(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Fall 1: Umsturz auf dem Hof", "Case 1: Tip-over in the yard", "Przypadek 1: wywrotka na placu", "Випадок 1: перекидання на подвір’ї"),
            lead: t("Ein echter Fall, den die Berufsgenossenschaft ausgewertet hat.", "A real case evaluated by the employers’ liability insurance association.", "Prawdziwy przypadek przeanalizowany przez Berufsgenossenschaft, czyli niemieckie ubezpieczenie od wypadków przy pracy.", "Реальний випадок, який проаналізувала галузева страхова спілка (Berufsgenossenschaft)."),
            points: [
                pt(t("<b>Die Aufgabe:</b> Ein Mitarbeiter bringt Behälter mit Spänen von den Werkzeugmaschinen zu einer zentralen Sammelstelle.", "<b>The task:</b> an employee takes containers of chips from the machine tools to a central collection point.", "<b>Zadanie:</b> pracownik wozi pojemniki z wiórami od obrabiarek do centralnego punktu zbiórki.", "<b>Завдання:</b> працівник возить контейнери зі стружкою від верстатів до центрального пункту збору.")),
                pt(t("<b>Der Unfall:</b> Er fährt über eine geneigte Hoffläche und biegt in eine Kurve ab. Der Stapler kippt um.", "<b>The accident:</b> the driver crosses a sloping yard surface and turns into a bend. The forklift tips over.", "<b>Wypadek:</b> jedzie po pochyłym placu i wchodzi w zakręt. Wózek się przewraca.", "<b>Випадок:</b> він їде похилим подвір’ям і входить у поворот. Навантажувач перекидається.")),
                pt(t("<b>Die Folgen:</b> Sein rechtes Bein und sein rechter Arm werden eingeklemmt. Er wird schwer verletzt.", "<b>The consequences:</b> the right leg and right arm are trapped. The employee is seriously injured.", "<b>Skutki:</b> prawa noga i prawa ręka zostają przygniecione. Pracownik jest ciężko ranny.", "<b>Наслідки:</b> його праву ногу й праву руку затиснуло. Він тяжко травмований.")),
            ],
            src: { de: "BG ETEM, „Aus Unfällen lernen: Umsturz mit Gabelstapler“" },
        }),
        step("sort", {
            title: t("Was hat zum Umsturz geführt?", "What led to the tip-over?", "Co doprowadziło do wywrotki?", "Що призвело до перекидання?"),
            lead: t("Laut Auswertung kamen vier Dinge zusammen. Welche?", "According to the evaluation, four things came together. Which ones?", "Według analizy zbiegły się cztery rzeczy. Które?", "За аналізом, збіглися чотири чинники. Які?"),
            labels: [t("Ursache", "Cause", "Przyczyna", "Причина"), t("Keine Ursache", "Not a cause", "Nie przyczyna", "Не причина")],
            items: [
                { t: t("Geneigte Fahrfläche", "Sloping surface", "Pochyła nawierzchnia", "Похила поверхня"), a: 0, why: t("Am Hang liegt der Schwerpunkt schon schräg, in der Kurve reicht dann wenig.", "On a slope the centre of gravity is already off, and in a bend it takes little more.", "Na pochyłości środek ciężkości jest już przesunięty, a na zakręcie wystarczy niewiele.", "На схилі центр ваги вже зміщений, а в повороті вистачить небагато.") },
                { t: t("Zu hohe Geschwindigkeit", "Too high a speed", "Zbyt duża prędkość", "Завелика швидкість"), a: 0, why: t("Die Fliehkraft wächst mit dem Quadrat der Geschwindigkeit.", "Centrifugal force grows with the square of the speed.", "Siła odśrodkowa rośnie z kwadratem prędkości.", "Відцентрова сила зростає з квадратом швидкості.") },
                { t: t("Last höher angehoben als nötig, um sie vom Boden freizubekommen", "Load raised higher than needed to clear the floor", "Ładunek podniesiony wyżej, niż trzeba, by oderwać go od podłogi", "Вантаж піднято вище, ніж потрібно, щоб відірвати його від підлоги"), a: 0, why: t("Eine hohe Last hebt den Gesamtschwerpunkt und macht den Stapler kippanfällig.", "A high load raises the combined centre of gravity and makes the truck prone to tipping.", "Wysoko uniesiony ładunek podnosi wspólny środek ciężkości i ułatwia wywrotkę.", "Високо піднятий вантаж піднімає загальний центр ваги й полегшує перекидання.") },
                { t: t("Enger Kurvenradius", "Tight turning radius", "Ciasny promień skrętu", "Малий радіус повороту"), a: 0, why: t("Je enger die Kurve, desto größer die Fliehkraft.", "The tighter the bend, the greater the centrifugal force.", "Im ciaśniejszy zakręt, tym większa siła odśrodkowa.", "Що крутіший поворот, то більша відцентрова сила.") },
                { t: t("Der Fahrer trug Sicherheitsschuhe", "The driver wore safety shoes", "Operator miał na sobie obuwie ochronne", "Водій був у захисному взутті"), a: 1, why: t("Richtig und vorgeschrieben, hat aber mit dem Umsturz nichts zu tun.", "Correct and required, but nothing to do with the tip-over.", "To prawidłowe i obowiązkowe, ale nie ma związku z wywrotką.", "Це правильно й обов’язково, але з перекиданням не пов’язано.") },
            ],
            allRight: t("Genau. Jede einzelne Ursache lernst du in Modul 4 zu vermeiden.", "Exactly. You learn to avoid each cause in module 4.", "Dokładnie. Każdej z tych przyczyn nauczysz się unikać w module 4.", "Саме так. Уникати кожної причини навчишся в модулі 4."),
            someWrong: t("Vier Dinge kamen zusammen: Gefälle, Tempo, hohe Last, enge Kurve.", "Four things came together: slope, speed, high load, tight bend.", "Zbiegły się cztery rzeczy: pochyłość, prędkość, wysoki ładunek, ciasny zakręt.", "Збіглися чотири чинники: схил, швидкість, високий вантаж, крутий поворот."),
        }),
        step("learn", {
            title: t("Wenn der Stapler kippt", "When the forklift tips", "Gdy wózek się przewraca", "Коли навантажувач перекидається"),
            lead: t("Die Auswertung sagt: Mit Rückhalteeinrichtung wären die Folgen weniger schwer gewesen.", "The evaluation says: with a restraint system the consequences would have been less severe.", "Analiza mówi: z systemem przytrzymującym skutki byłyby lżejsze.", "Аналіз каже: із системою утримання наслідки були б легшими."),
            points: [
                pt(t("<b>Rückhaltesystem benutzen:</b> Gurt, Bügel oder Kabinentür halten dich im Schutzraum unter dem Fahrerschutzdach.", "<b>Use the restraint:</b> belt, bar or cab door keep you in the protected space under the overhead guard.", "<b>Używaj systemu przytrzymującego:</b> pas, pałąk lub drzwi kabiny trzymają cię w bezpiecznej przestrzeni pod daszkiem ochronnym kierowcy.", "<b>Користуйся системою утримання:</b> пас, скоба чи двері кабіни тримають тебе в захищеному просторі під захисним дахом водія.")),
                pt(t("<b>Nicht abspringen:</b> Der Stapler kippt schneller, als du rauskommst. Wer abspringt, landet meist genau dort, wo der Stapler aufschlägt, und wird vom Fahrerschutzdach oder Hubmast eingeklemmt.", "<b>Do not jump:</b> the forklift tips faster than you can get out. Anyone who jumps usually lands exactly where the truck hits the ground and is crushed by the overhead guard or mast.", "<b>Nie wyskakuj:</b> wózek przewraca się szybciej, niż zdążysz wysiąść. Kto wyskakuje, zwykle ląduje dokładnie tam, gdzie wózek uderza o ziemię, i zostaje przygnieciony daszkiem ochronnym kierowcy albo masztem.", "<b>Не вистрибуй:</b> навантажувач перекидається швидше, ніж ти встигнеш вийти. Хто вистрибує, зазвичай падає саме туди, куди б’ється машина, і його затискає захисний дах або щогла.")),
                pt(t("<b>Festhalten:</b> am Lenkrad oder Fahrerschutzdach und den Fahrersitz nicht verlassen.", "<b>Hold on:</b> to the steering wheel or overhead guard and do not leave the driver’s seat.", "<b>Trzymaj się:</b> mocno kierownicy albo daszku i nie opuszczaj fotela.", "<b>Тримайся:</b> міцно за кермо або за захисний дах і не залишай сидіння.")),
            ],
            merke: t("Anschnallen, festhalten, sitzen bleiben.", "Buckle up, hold on tight, stay seated.", "Zapnij pas, trzymaj się mocno, zostań w fotelu.", "Пристебнися, міцно тримайся, залишайся на сидінні."),
            src: { de: "BG ETEM, „Aus Unfällen lernen: Umsturz mit Gabelstapler“; DGUV Information 208-004 Abschn. 6.4.3" },
        }),
        step("learn", {
            title: t("Fall 2: Beim Zurücksetzen übersehen", "Case 2: Overlooked while reversing", "Przypadek 2: niezauważony podczas cofania", "Випадок 2: людину не помітили під час руху назад"),
            lead: t("Ein Fall von einem Lagerplatz eines rohstoffgewinnenden Betriebes.", "A case from the storage yard of a raw materials company.", "Przypadek z placu składowego zakładu wydobywczego.", "Випадок зі складського майданчика видобувного підприємства."),
            points: [
                pt(t("<b>Die Situation:</b> Ein Lkw wird mit dem Stapler beladen. Der Lkw-Fahrer steht in der Nähe.", "<b>The situation:</b> a lorry is being loaded with the forklift. The lorry driver is standing nearby.", "<b>Sytuacja:</b> ciężarówka jest ładowana wózkiem. Kierowca ciężarówki stoi w pobliżu.", "<b>Ситуація:</b> вантажівку завантажують навантажувачем. Водій вантажівки стоїть поруч.")),
                pt(t("<b>Der Unfall:</b> Beim Zurücksetzen fährt der Staplerfahrer den Lkw-Fahrer an.", "<b>The accident:</b> while reversing, the forklift driver hits the lorry driver.", "<b>Wypadek:</b> przy cofaniu operator wózka potrąca kierowcę ciężarówki.", "<b>Випадок:</b> під час руху назад водій навантажувача збиває водія вантажівки.")),
                pt(t("<b>Die Folgen:</b> eine schwere Unterschenkelfraktur.", "<b>The consequences:</b> a serious fracture of the lower leg.", "<b>Skutki:</b> ciężkie złamanie podudzia.", "<b>Наслідки:</b> тяжкий перелом гомілки.")),
            ],
            src: { de: "BG RCI, Unterweisungshilfe „So nicht! Gabelstapler“" },
        }),
        step("question", {
            title: t("Was lief schief?", "What went wrong?", "Co poszło nie tak?", "Що пішло не так?"),
            text: t("Welche zwei Fehler nennt die Berufsgenossenschaft?", "Which two mistakes does the insurance association name?", "Jakie dwa błędy wskazuje Berufsgenossenschaft?", "Які дві помилки називає страхова спілка?"),
            layout: "list",
            options: [
                t("Der Stapler war überladen und zu schnell", "The forklift was overloaded and too fast", "Wózek był przeciążony i za szybki", "Навантажувач був перевантажений і зашвидкий"),
                t("Der Staplerfahrer übersah den Lkw-Fahrer, und der stand im Gefahrenbereich", "The forklift driver overlooked the lorry driver, who was standing in the danger zone", "Operator wózka nie zauważył kierowcy ciężarówki, a ten stał w strefie zagrożenia", "Водій навантажувача не помітив водія вантажівки, а той стояв у небезпечній зоні"),
            ], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, es ging um Sicht und Abstand", "No, it was about view and distance", "Nie, chodziło o widoczność i odstęp", "Ні, йшлося про огляд і відстань") },
            body: t("Vor dem Rückwärtsfahren schaust du dich um, und niemand hält sich im Gefahrenbereich des Staplers auf. Beides lernst du in den Modulen 5 und 7.", "Before reversing you look around, and nobody stays in the forklift’s danger zone. You learn both in modules 5 and 7.", "Przed cofaniem rozglądasz się, a w strefie zagrożenia wózka nikt nie przebywa. Obu rzeczy nauczysz się w modułach 5 i 7.", "Перед рухом назад ти озираєшся, і ніхто не перебуває в небезпечній зоні навантажувача. Обидва правила ти вивчиш у модулях 5 і 7."),
            src: { de: "BG RCI, Unterweisungshilfe „So nicht! Gabelstapler“" },
        }),
        step("video", {
            title: t("Im Kippsimulator", "In the tip-over simulator", "W symulatorze wywrotki", "У симуляторі перекидання"),
            brief: t("Fahrer sitzt angeschnallt im Kippsimulator. Der Stapler kippt langsam zur Seite, der Fahrer hält sich am Lenkrad fest und bleibt sitzen. Zum Vergleich als Grafik: Wer abspringt, landet unter dem Fahrerschutzdach des kippenden Staplers.", "Driver sits belted in the tip-over simulator. The truck slowly tips sideways, the driver holds on to the steering wheel and stays seated. For comparison, as a graphic: anyone who jumps ends up under the overhead guard of the falling truck.", "Operator siedzi z zapiętym pasem w symulatorze wywrotki. Wózek powoli przechyla się na bok, operator trzyma się kierownicy i zostaje w fotelu. Dla porównania grafika: kto wyskakuje, ląduje pod daszkiem ochronnym przewracającego się wózka.", "Водій сидить пристебнутим у симуляторі перекидання. Навантажувач повільно перекидається набік, водій тримається за кермо й лишається на сидінні. Для порівняння графіка: хто вистрибує, опиняється під захисним дахом навантажувача, що падає."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Umsturz</b> entsteht oft aus mehreren Fehlern zugleich: Gefälle, Tempo, hohe Last, enge Kurve.", "<b>Tip-overs</b> often result from several mistakes at once: slope, speed, high load, tight bend.", "<b>Wywrotka</b> często wynika z kilku błędów naraz: pochyłość, prędkość, wysoko uniesiony ładunek, ciasny zakręt.", "<b>Перекидання</b> часто стається через кілька помилок одночасно: схил, швидкість, високо піднятий вантаж, крутий поворот.")),
            pt(t("<b>Rückhaltesystem</b> rettet Leben. Kippt der Stapler: festhalten, nicht springen.", "<b>The restraint system</b> saves lives. If the truck tips: hold on, do not jump.", "<b>System przytrzymujący</b> ratuje życie. Gdy wózek się przewraca: trzymaj się, nie wyskakuj.", "<b>Система утримання</b> рятує життя. Якщо навантажувач перекидається: тримайся, не вистрибуй.")),
            pt(t("<b>Umschauen</b> vor dem Rückwärtsfahren, niemand im Gefahrenbereich.", "<b>Look around</b> before reversing, nobody in the danger zone.", "<b>Rozglądaj się</b> przed cofaniem, nikt w strefie zagrożenia.", "<b>Озирайся</b> перед рухом назад, нікого в небезпечній зоні.")),
        ] }),
    ];
}
