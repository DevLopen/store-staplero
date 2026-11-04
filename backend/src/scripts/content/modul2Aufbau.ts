/**
 * Moduł „Aufbau, Funktion & Typen von Flurförderzeugen” (spis klienta, moduł 2), od razu w czterech językach.
 * Źródła: DGUV Vorschrift 68 (Fassung 1997, DA 2002), DGUV Information 208-004 „Gabelstapler” (BGHM, 2012/2018),
 * DGUV G 308-001 (Dez. 2022, obowiązuje) i projekt G 308-001 (Entwurf 06/2026, Anhang A i B).
 * Wartości liczbowe w symulacjach masztu i osprzętu są poglądowe i w lekcji opisane jako przykład.
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
/** Teksty interfejsu symulacji: klucz = tekst niemiecki z komponentu. */
const texts = (rows: [string, string, string, string][]) => Object.fromEntries(rows.map(([de, en, pl, uk]) => [de, { de, en, pl, uk }]));

const BTN_GO = t("Los geht’s", "Let’s go", "Zaczynamy", "Почнімо");
const OPENER = t("Bevor wir starten: Was meinst du?", "Before we start: what do you think?", "Zanim zaczniemy: jak myślisz?", "Перш ніж почати: як ти думаєш?");
const RIGHT_T = t("Richtig", "Correct", "Dobrze", "Правильно");
const WRONG_T = t("Nicht ganz", "Not quite", "Nie do końca", "Не зовсім");
const SUM = t("Das nimmst du mit", "Key takeaways", "Najważniejsze", "Головне");
const QUICK = t("Kurztest", "Quick test", "Krótki test", "Короткий тест");
const V68 = "DGUV V68", I208 = "DGUV Information 208-004";

/* ───────── części wózka (eksploracja i test) ───────── */
const PARTS = [
    { id: "mast", name: t("Hubgerüst (Mast)", "Mast", "Maszt", "Щогла"),
        text: t("Senkrechte Führung für die Last. Es besteht aus Profilen, die ineinander laufen. Es ist neigbar: nach vorn nur zum Aufnehmen und Absetzen der Last.", "Vertical guide for the load. It consists of profiles that run inside each other. It can tilt: forwards only to pick up and set down the load.", "Pionowa prowadnica ładunku. Składa się z profili, które wsuwają się w siebie. Można go pochylać: do przodu tylko przy podejmowaniu i odkładaniu ładunku.", "Вертикальна напрямна для вантажу. Складається з профілів, що ходять один в одному. Її можна нахиляти: вперед лише для підхоплення й опускання вантажу."),
        src: { de: `${V68} §13 Abs. 1` } },
    { id: "carriage", name: t("Gabelträger", "Fork carriage", "Karetka wideł", "Каретка вил"),
        text: t("Fährt im Hubgerüst auf und ab. An ihm hängen die Gabelzinken, und hier werden auch Anbaugeräte befestigt.", "Moves up and down in the mast. The forks hang on it, and attachments are also fixed here.", "Jeździ w górę i w dół w maszcie. Wiszą na niej widły i tu mocuje się też osprzęt.", "Їздить угору й униз у щоглі. На ній висять вила, і тут кріпиться навісне обладнання."),
        src: { de: `${V68} DA zu §23 Abs. 1` } },
    { id: "forks", name: t("Gabelzinken", "Forks", "Widły (zęby wideł)", "Вила (зубці)"),
        text: t("Tragen die Last. Beide Zinken müssen gleich hoch sein und dürfen keine Risse haben. Die Last nimmst du nahe am Gabelrücken auf.", "Carry the load. Both forks must be at the same height and must not have cracks. Pick up the load close to the fork back.", "Niosą ładunek. Oba ramiona wideł muszą być na tej samej wysokości i bez pęknięć. Ładunek podejmujesz blisko grzbietu wideł.", "Несуть вантаж. Обидва зубці мають бути на однаковій висоті й без тріщин. Вантаж бери близько до спинки вил."),
        src: { de: `${V68} DA zu §9; DGUV G 308-001 Anhang B` } },
    { id: "chain", name: t("Hubketten", "Lift chains", "Łańcuchy podnoszenia", "Ланцюги підйому"),
        text: t("Laufen über Rollen oben am Mast und ziehen den Gabelträger mit. Sie müssen ausreichend und gleichmäßig gespannt sein.", "Run over rollers at the top of the mast and pull the fork carriage along. They must be tensioned sufficiently and evenly.", "Przechodzą przez rolki w górnej części masztu i ciągną karetkę. Muszą być wystarczająco i równomiernie napięte.", "Проходять через ролики вгорі щогли й тягнуть каретку. Мають бути достатньо й рівномірно натягнуті."),
        src: { de: `${V68} DA zu §9` } },
    { id: "tilt", name: t("Neigezylinder", "Tilt cylinder", "Siłownik pochylania", "Циліндр нахилу"),
        text: t("Hydraulikzylinder zwischen Rahmen und Mast. Er neigt das Hubgerüst nach vorn oder zurück. Gefahren wird mit zurückgeneigtem Mast.", "Hydraulic cylinder between frame and mast. It tilts the mast forwards or backwards. You drive with the mast tilted back.", "Siłownik hydrauliczny między ramą a masztem. Pochyla maszt do przodu lub do tyłu. Jeździsz z masztem odchylonym do tyłu.", "Гідроциліндр між рамою і щоглою. Нахиляє щоглу вперед або назад. Їздять зі щоглою, нахиленою назад."),
        src: { de: `${V68} §13 Abs. 1; DGUV G 308-001 Anhang B` } },
    { id: "lsg", name: t("Lastschutzgitter", "Load backrest", "Krata ochronna ładunku", "Захисна решітка вантажу"),
        text: t("Gitter über dem Gabelträger. Es hält Ladung zurück, die nach hinten auf den Fahrer fallen könnte. Für Kleinteile ist es Pflicht.", "Grille above the fork carriage. It holds back goods that could fall backwards onto the driver. It is mandatory for small parts.", "Krata nad karetką. Zatrzymuje towar, który mógłby spaść do tyłu na operatora. Przy drobnicy jest obowiązkowa.", "Решітка над кареткою. Затримує вантаж, що міг би впасти назад на водія. Для дрібних вантажів обов’язкова."),
        src: { de: `${V68} §11 Abs. 3` } },
    { id: "guard", name: t("Fahrerschutzdach", "Overhead guard", "Daszek ochronny", "Захисний дах"),
        text: t("Schützt dich vor herabfallenden Lasten. Pflicht bei Staplern, die höher als 1,80 m heben.", "Protects you from falling loads. Mandatory on forklifts that lift higher than 1.80 m.", "Chroni cię przed spadającym ładunkiem. Obowiązkowy w wózkach, które podnoszą wyżej niż 1,80 m.", "Захищає тебе від падіння вантажу. Обов’язковий на навантажувачах, що піднімають вище 1,80 м."),
        src: { de: `${I208} Abschn. 2.2; ${V68} §13 Abs. 4` } },
    { id: "restraint", name: t("Fahrerrückhaltesystem", "Operator restraint", "System przytrzymujący operatora", "Система утримання водія"),
        text: t("Bügeltür, Sitzbügel, Gurt oder geschlossene Kabine. Hält dich auf dem Sitz, wenn der Stapler umkippt. Ist es vorhanden, musst du es benutzen.", "Hoop door, seat bar, belt or closed cab. Keeps you in the seat if the forklift tips over. If it is fitted, you must use it.", "Drzwi pałąkowe, pałąk przy fotelu, pas lub zamknięta kabina. Trzyma cię w fotelu, gdy wózek się przewraca. Jeśli jest, musisz go używać.", "Дверцята-скоба, скоба сидіння, пасок безпеки або закрита кабіна. Утримує тебе на сидінні, коли навантажувач перекидається. Якщо система є, нею треба користуватися."),
        src: { de: `${V68} DA zu §6; ${I208} Abschn. 2.4` } },
    { id: "cw", name: t("Gegengewicht", "Counterweight", "Przeciwwaga", "Противага"),
        text: t("Schwerer Block am Heck. Er hält die Last vorne im Gleichgewicht. Darum heißt der Frontstapler auch Gegengewichtstapler.", "Heavy block at the rear. It balances the load at the front. That is why the front forklift is also called a counterbalance truck.", "Ciężki blok z tyłu. Równoważy ładunek z przodu. Dlatego wózek czołowy nazywa się też wózkiem z przeciwwagą.", "Важкий блок ззаду. Урівноважує вантаж спереду. Тому фронтальний навантажувач ще називають навантажувачем із противагою."),
        src: { de: "DGUV G 308-001 (Entwurf 2026) Anhang A" } },
    { id: "steer", name: t("Lenkachse hinten", "Rear steering axle", "Tylna oś skrętna", "Задня кермова вісь"),
        text: t("Beim Gabelstapler lenken die Hinterräder. Das Heck schwenkt in Kurven nach außen. Achte vor dem Lenken auf Personen neben und hinter dir.", "On a forklift the rear wheels steer. The rear swings out in curves. Watch for people beside and behind you before you steer.", "W wózku widłowym skręcają tylne koła. Tył na zakrętach zarzuca na zewnątrz. Zanim skręcisz, uważaj na osoby obok i za tobą.", "У навантажувача кермують задні колеса. Задня частина на поворотах виноситься назовні. Перед поворотом стеж за людьми поруч і позаду."),
        src: { de: `${I208} Abschn. 1.1` } },
    { id: "front", name: t("Vorderachse", "Front axle", "Oś przednia", "Передня вісь"),
        text: t("Trägt Stapler und Last. Sie ist die Kippkante nach vorn: Wird das Lastmoment zu groß, kippt der Stapler über diese Achse.", "Carries the truck and the load. If the load moment becomes too large, the truck tips forwards over this very axle.", "Niesie wózek i ładunek. Gdy moment ładunku jest za duży, wózek przewraca się do przodu właśnie przez tę oś.", "Несе навантажувач і вантаж. Якщо момент вантажу завеликий, навантажувач перекидається вперед саме через цю вісь."),
        src: { de: `${I208} Abschn. 6.3` } },
    { id: "plate", name: t("Typenschild", "Type plate", "Tabliczka znamionowa", "Заводська табличка"),
        text: t("Fabrikschild mit Hersteller, Typ, Baujahr, Fabriknummer, Nenn-Tragfähigkeit und Leergewicht. Daneben das Tragfähigkeitsschild mit dem Lastschwerpunkt-Diagramm.", "Manufacturer’s plate with manufacturer, type, year of manufacture, serial number, rated capacity and unladen weight. Next to it the capacity plate with the load chart.", "Tabliczka fabryczna: producent, typ, rok produkcji, numer fabryczny, udźwig nominalny i masa własna. Obok tabliczka udźwigu z wykresem udźwigu.", "Заводська табличка: виробник, тип, рік випуску, заводський номер, номінальна вантажопідйомність і власна маса. Поруч табличка вантажопідйомності з діаграмою вантажопідйомності."),
        src: { de: `${I208} Abschn. 2.1` } },
];

const ANATOMY_TEXTS = texts([
    ["Seitenansicht eines Gabelstaplers mit Bauteilen", "Side view of a forklift with its components", "Widok z boku wózka widłowego z częściami", "Вигляд збоку навантажувача з деталями"],
    ["Seitenansicht eines Gabelstaplers", "Side view of a forklift", "Widok z boku wózka widłowego", "Вигляд збоку навантажувача"],
    ["Alle Bauteile entdeckt", "All components discovered", "Wszystkie części odkryte", "Усі деталі знайдено"],
    ["Entdeckt", "Discovered", "Odkryte", "Знайдено"],
    ["Bauteil", "Component", "Część", "Деталь"],
    ["Tippe auf einen orangefarbenen Punkt oder unten auf einen Namen.", "Tap an orange dot or a name below.", "Dotknij pomarańczowego punktu albo nazwy poniżej.", "Торкнися помаранчевої точки або назви нижче."],
    ["Alle Bauteile sicher gefunden.", "You found every component.", "Wszystkie części znalezione bezbłędnie.", "Усі деталі знайдено без помилок."],
    ["Schau dir die Bauteile, die du nicht gefunden hast, in Thema 2.1 noch einmal an.", "Have another look at the components you missed in topic 2.1.", "Części, których nie znalazłeś, obejrzyj jeszcze raz w temacie 2.1.", "Деталі, яких не знайшов, переглянь ще раз у темі 2.1."],
    ["Tippe auf: {name}", "Tap: {name}", "Dotknij: {name}", "Торкнися: {name}"],
    ["Tippe auf einen Punkt im Bild", "Tap a dot in the picture", "Dotknij punktu na rysunku", "Торкнися точки на малюнку"],
]);

const MAST_TEXTS = texts([
    ["Gabelstapler mit Hubgerüst, Hubhöhe {h} Millimeter", "Forklift with mast, lift height {h} millimetres", "Wózek z masztem, wysokość podnoszenia {h} milimetrów", "Навантажувач зі щоглою, висота підйому {h} міліметрів"],
    ["Halte „Heben“ gedrückt und beobachte den Mast.", "Hold “Lift” and watch the mast.", "Przytrzymaj „Podnieś” i obserwuj maszt.", "Утримуй «Підняти» і стеж за щоглою."],
    ["Einfacher Mast: Der Gabelträger fährt im Mast hoch.", "Single mast: the fork carriage moves up inside the mast.", "Maszt pojedynczy: karetka jedzie w górę wewnątrz masztu.", "Одинарна щогла: каретка їде вгору всередині щогли."],
    ["Freihub: Nur der Gabelträger fährt hoch, die Bauhöhe bleibt gleich.", "Free lift: only the fork carriage moves up, the overall height stays the same.", "Wolny skok: jedzie tylko karetka, wysokość konstrukcyjna się nie zmienia.", "Вільний хід: їде лише каретка, будівельна висота не змінюється."],
    ["Der Mast fährt aus: Die Bauhöhe wächst.", "The mast extends: the overall height grows.", "Maszt się wysuwa: wysokość konstrukcyjna rośnie.", "Щогла висувається: будівельна висота зростає."],
    ["Halt: Mast oder Last stößt an die Decke.", "Stop: the mast or load hits the ceiling.", "Stop: maszt lub ładunek uderza w strop.", "Стоп: щогла або вантаж упирається в стелю."],
    ["Heb die Gabel, bis der Mast ausfährt", "Lift the forks until the mast extends", "Podnoś widły, aż maszt zacznie się wysuwać", "Піднімай вила, доки щогла не почне висуватися"],
    ["Neige den Mast ganz zurück", "Tilt the mast fully back", "Odchyl maszt całkiem do tyłu", "Нахили щоглу повністю назад"],
    ["Mit Triplex: Heb die Palette über 1,2 m, ohne an die Decke zu stoßen", "With triplex: lift the pallet above 1.2 m without hitting the ceiling", "Z masztem triplex: podnieś paletę powyżej 1,2 m, nie uderzając w strop", "З триплексом: підніми палету вище 1,2 м, не зачепивши стелю"],
    ["Mastart wählen", "Choose mast type", "Wybierz rodzaj masztu", "Обери тип щогли"],
    ["Simplex", "Simplex", "Simplex", "Simplex"], ["Duplex", "Duplex", "Duplex", "Duplex"], ["Triplex", "Triplex", "Triplex", "Triplex"],
    ["Beispielwerte", "Example values", "Wartości przykładowe", "Приклад значень"],
    ["Decke {h} m", "Ceiling {h} m", "Strop {h} m", "Стеля {h} м"],
    ["Hubhöhe", "Lift height", "Wys. podnoszenia", "Висота підйому"],
    ["Bauhöhe", "Overall height", "Wysokość konstrukcyjna", "Будівельна висота"],
    ["Neigung", "Tilt", "Pochylenie", "Нахилити"],
    ["Heben", "Lift", "Podnieś", "Підняти"], ["Senken", "Lower", "Opuść", "Опустити"],
    ["Neigen", "Tilt", "Pochyl", "Нахилити"], ["Vor", "Forward", "Do przodu", "Вперед"], ["Zurück", "Back", "Do tyłu", "Назад"],
]);

const TYPES_TEXTS = texts([
    ["Alle Bauarten angesehen", "All truck types viewed", "Wszystkie typy obejrzane", "Усі типи переглянуто"],
    ["Wische durch die Karten", "Swipe through the cards", "Przesuwaj karty", "Гортай картки"],
    ["Merkmal", "Feature", "Cecha", "Ознака"], ["Einsatz", "Use", "Zastosowanie", "Застосування"], ["Achtung", "Note", "Uwaga", "Увага"],
    ["Welche Bauart ist das?", "Which type is this?", "Jaki to typ?", "Що це за тип?"],
]);

const ATTACH_TEXTS = texts([
    ["Gabelstapler mit Anbaugerät", "Forklift with attachment", "Wózek z osprzętem", "Навантажувач з навісним обладнанням"],
    ["Anbaugerät wählen", "Choose attachment", "Wybierz osprzęt", "Обери навісне обладнання"],
    ["Nur Gabeln", "Forks only", "Same widły", "Лише вила"],
    ["Beispielrechnung", "Example calculation", "Obliczenie przykładowe", "Приклад розрахунку"],
    ["Resttragfähigkeit", "Remaining capacity", "Udźwig resztkowy", "Залишкова вантажопідйомність"],
    ["Nenntragfähigkeit {q} kg", "Rated capacity {q} kg", "Udźwig nominalny {q} kg", "Номінальна вантажопідйомність {q} кг"],
    ["Ohne Anbaugerät gilt das Lastschwerpunktdiagramm auf dem Typenschild des Staplers.", "Without an attachment the load centre diagram on the truck’s plate applies.", "Bez osprzętu obowiązuje wykres udźwigu z tabliczki wózka.", "Без навісного обладнання діє діаграма вантажопідйомності з таблички навантажувача."],
    ["Anbaugeräte angesehen", "Attachments viewed", "Obejrzane rodzaje osprzętu", "Переглянуте обладнання"],
    ["Vor dem Einsatz prüfst du:", "Before use you check:", "Przed użyciem sprawdzasz:", "Перед використанням перевір:"],
    ["Geprüft. Jetzt darfst du mit dem Anbaugerät arbeiten.", "Checked. Now you may work with the attachment.", "Sprawdzone. Teraz możesz pracować z osprzętem.", "Перевірено. Тепер можна працювати з обладнанням."],
]);

/* ════════════════ Lernziele ════════════════ */
const GOALS = [
    { code: "2.1", text: t("Ich kenne die Bauteile eines Frontstaplers und weiß, wofür sie da sind.", "I know the components of a front forklift and what they are for.", "Znam części wózka czołowego i wiem, do czego służą.", "Я знаю деталі фронтального навантажувача і для чого вони."), short: t("Frontstapler", "Front forklift", "Wózek czołowy", "Фронтальний навантажувач") },
    { code: "2.2", text: t("Ich erkenne Sonderbauformen und weiß, ob mein Staplerschein dafür reicht.", "I recognise special truck types and know whether my licence covers them.", "Rozpoznaję specjalne typy wózków i wiem, czy mój Staplerschein na nie wystarcza.", "Я розпізнаю спеціальні типи навантажувачів і знаю, чи діє на них мій Staplerschein."), short: t("Sonderbauformen", "Special types", "Typy specjalne", "Спеціальні типи") },
    { code: "2.3", text: t("Ich weiß, wie Anbaugeräte den Stapler verändern und was ich vorher prüfe.", "I know how attachments change the forklift and what I check beforehand.", "Wiem, jak osprzęt zmienia wózek i co sprawdzam wcześniej.", "Я знаю, як навісне обладнання змінює навантажувач і що перевіряти заздалегідь."), short: t("Anbaugeräte", "Attachments", "Osprzęt", "Навісне обладнання") },
];

export function lesson2Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Aufbau, Funktion & Typen", "Design, function & types", "Budowa, działanie i typy", "Будова, принцип роботи і типи"), image: "forklift",
            text: t("Du lernst den Stapler von innen kennen: was ihn trägt, hebt und schützt, welche anderen Bauarten es gibt und wie Anbaugeräte ihn verändern.",
                "You get to know the forklift from the inside: what carries, lifts and protects it, which other types exist and how attachments change it.",
                "Poznasz wózek od środka: co go niesie, podnosi i chroni, jakie są inne typy i jak osprzęt go zmienia.",
                "Ти пізнаєш навантажувач зсередини: що його несе, піднімає і захищає, які є інші типи і як навісне обладнання його змінює."),
            meta: [t("ca. 30 Minuten", "about 30 minutes", "ok. 30 minut", "близько 30 хвилин"), t("3 Themen und Modul-Check", "3 topics and module check", "3 tematy i test modułu", "3 теми і перевірка модуля"), { de: "DGUV V68, DGUV I 208-004" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Das sind deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "These are your learning goals for this module. 1 = new to me, 5 = confident.", "To twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Це твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: GOALS,
        }),
        step("learn", {
            title: t("Was ist ein Flurförderzeug?", "What is an industrial truck?", "Czym jest wózek jezdniowy?", "Що таке складська техніка (Flurförderzeug)?"),
            lead: t("Der Gabelstapler ist nur eine von vielen Bauarten. Die DGUV Vorschrift 68 beschreibt, was sie alle gemeinsam haben.", "The forklift is only one of many types. DGUV Regulation 68 describes what they all have in common.", "Wózek widłowy to tylko jeden z wielu typów. DGUV Vorschrift 68 opisuje, co mają wspólnego.", "Вилковий навантажувач лише один із багатьох типів. DGUV Vorschrift 68 описує, що в них спільного."),
            points: [
                pt(t("<b>Räder auf dem Boden:</b> Es fährt auf Rädern auf Flur und ist frei lenkbar, also nicht an Schienen gebunden.", "<b>Wheels on the floor:</b> it runs on wheels on the floor and can be steered freely, so it is not bound to rails.", "<b>Koła na podłodze:</b> jeździ na kołach po posadzce i można nim swobodnie kierować, więc nie porusza się po szynach.", "<b>Колеса на підлозі:</b> їздить на колесах по підлозі й вільно кермується, тобто не прив’язаний до рейок.")),
                pt(t("<b>Für Lasten:</b> Es ist zum Befördern, Ziehen oder Schieben von Lasten gebaut.", "<b>For loads:</b> it is built to carry, pull or push loads.", "<b>Do ładunków:</b> jest zbudowany do przewożenia, ciągnięcia lub pchania ładunków.", "<b>Для вантажів:</b> створений для перевезення, тягнення або штовхання вантажів.")),
                pt(t("<b>Im Betrieb:</b> Es ist für den innerbetrieblichen Einsatz bestimmt.", "<b>On site:</b> it is intended for use within the company premises.", "<b>W zakładzie:</b> jest przeznaczony do użytku wewnątrz zakładu.", "<b>На підприємстві:</b> призначений для використання всередині підприємства.")),
                pt(t("<b>Mit Hubeinrichtung</b> kann es Lasten zusätzlich heben, stapeln oder in Regale einlagern.", "<b>With a lifting device</b> it can also lift, stack or put loads into racks.", "<b>Z urządzeniem podnoszącym</b> może dodatkowo podnosić, piętrować lub wstawiać ładunki do regałów.", "<b>З підйомним пристроєм</b> може ще піднімати, штабелювати або ставити вантажі в стелажі.")),
            ],
            merke: t("Für alle Flurförderzeuge gilt die DGUV Vorschrift 68, egal ob Stapler, Hubwagen oder Schlepper.", "DGUV Regulation 68 applies to all industrial trucks, whether forklift, pallet truck or tow tractor.", "DGUV Vorschrift 68 dotyczy wszystkich wózków jezdniowych: widłowych, paletowych i ciągników.", "DGUV Vorschrift 68 діє для всієї складської техніки: навантажувачів, візків і тягачів."),
            src: { de: `${V68} §1, §2 Abs. 1 und 2` },
        }),
        step("sort", {
            title: t("Flurförderzeug oder nicht?", "Industrial truck or not?", "Wózek jezdniowy czy nie?", "Складська техніка чи ні?"),
            lead: t("Prüfe jedes Gerät mit den drei Merkmalen.", "Check each machine against the three features.", "Sprawdź każde urządzenie pod kątem trzech cech.", "Перевір кожну машину за трьома ознаками."),
            labels: [t("Flurförderzeug", "Industrial truck", "Wózek jezdniowy", "Складська техніка"), t("Kein Flurförderzeug", "Not an industrial truck", "Nie wózek jezdniowy", "Не складська техніка")],
            items: [
                { t: t("Schubmaststapler im Hochregallager", "Reach truck in a high-bay warehouse", "Wózek z wysuwanym masztem w magazynie wysokiego składowania", "Річтрак на висотному складі"), a: 0, why: t("Räder auf Flur, frei lenkbar, hebt und stapelt Lasten im Betrieb.", "Wheels on the floor, freely steerable, lifts and stacks loads on site.", "Koła na posadzce, swobodnie kierowany, podnosi i piętruje ładunki w zakładzie.", "Колеса на підлозі, вільно кермується, піднімає і штабелює на підприємстві.") },
                { t: t("Brückenkran in der Werkhalle", "Overhead crane in the factory hall", "Suwnica pomostowa w hali", "Мостовий кран у цеху"), a: 1, why: t("Er läuft auf Schienen unter dem Dach, nicht auf Rädern auf Flur und nicht frei lenkbar.", "It runs on rails under the roof, not on wheels on the floor and not freely steerable.", "Jeździ po szynach pod dachem, nie na kołach po posadzce i nie jest swobodnie kierowana.", "Їздить рейками під дахом, не на колесах по підлозі й не кермується вільно.") },
                { t: t("Elektro-Schlepper, der Anhänger durchs Werk zieht", "Electric tow tractor pulling trailers through the plant", "Elektryczny ciągnik ciągnący przyczepy po zakładzie", "Електротягач, що тягне причепи підприємством"), a: 0, why: t("Ziehen von Lasten gehört ausdrücklich dazu.", "Pulling loads is explicitly included in the definition.", "Ciągnięcie ładunków jest wprost wymienione w definicji.", "Тягнення вантажів прямо назване у визначенні.") },
                { t: t("LKW auf der Autobahn", "Lorry on the motorway", "Ciężarówka na autostradzie", "Вантажівка на автобані"), a: 1, why: t("Er ist für den öffentlichen Straßenverkehr bestimmt, nicht für den innerbetrieblichen Einsatz.", "It is intended for public road traffic, not for use on company premises.", "Jest przeznaczona do ruchu po drogach publicznych, nie do pracy wewnątrz zakładu.", "Призначена для руху дорогами загального користування, а не для роботи на підприємстві.") },
                { t: t("Elektro-Hochhubwagen mit Deichsel", "Electric pedestrian stacker with tiller", "Elektryczny wózek podnośnikowy wysokiego podnoszenia z dyszlem", "Електроштабелер з дишлом"), a: 0, why: t("Auch ein Mitgänger-Gerät ist ein Flurförderzeug mit Hubeinrichtung.", "A pedestrian-controlled truck is also an industrial truck with a lifting device.", "Wózek prowadzony też jest wózkiem jezdniowym z urządzeniem podnoszącym.", "Візок із супроводом пішки теж є складською технікою з підйомним пристроєм.") },
            ],
            allRight: t("Richtig. Du erkennst ein Flurförderzeug an den drei Merkmalen.", "Correct. You recognise an industrial truck by the three features.", "Dobrze. Rozpoznajesz wózek jezdniowy po trzech cechach.", "Правильно. Ти впізнаєш складську техніку за трьома ознаками."),
            someWrong: t("Prüfe immer: Räder auf Flur und frei lenkbar, für Lasten, im Betrieb.", "Always check: wheels on the floor and freely steerable, built for loads, used on site.", "Zawsze sprawdzaj: koła na posadzce i swobodne kierowanie, przeznaczenie do ładunków, praca wewnątrz zakładu.", "Завжди перевіряй: колеса на підлозі й вільне керування, призначення для вантажів, робота на підприємстві."),
        }),
    ];
}

/* ════════════════ 2.1 Der klassische Frontstapler ════════════════ */
export function lesson21(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Welche Räder lenken beim Gabelstapler?", "Which wheels steer on a forklift?", "Które koła skręcają w wózku widłowym?", "Які колеса кермують у навантажувача?"),
            text: OPENER,
            options: [t("Vorne", "Front", "Przednie", "Передні"), t("Hinten", "Rear", "Tylne", "Задні")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, hinten", "No, the rear ones", "Nie, tylne", "Ні, задні") },
            quote: t("„Gabelstapler besitzen eine sonst nicht übliche Hinterachslenkung.“", "“Forklifts have rear-axle steering, which is otherwise unusual.”", "„Wózki widłowe mają skręcaną oś tylną, co poza nimi spotyka się rzadko.”", "«Навантажувачі мають кермування задньою віссю, яке в інших машинах трапляється рідко.»"),
            body: t("Warum das so ist und welche Bauteile der Frontstapler sonst noch hat, siehst du jetzt.", "Why that is, and what other components the front forklift has, you will see now.", "Dlaczego tak jest i jakie jeszcze części ma wózek czołowy, zobaczysz teraz.", "Чому так і які ще деталі має фронтальний навантажувач, побачиш зараз."),
            src: { de: `${I208} Abschn. 1.1` }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Das Prinzip Gegengewicht", "The counterbalance principle", "Zasada przeciwwagi", "Принцип противаги"),
            lead: t("Beim Frontstapler liegt die Last frei vor den Vorderrädern. Im Gleichgewicht hält ihn seine eigene Masse, vor allem das Gegengewicht am Heck.",
                "On a front forklift the load sits freely in front of the front wheels. Its own mass, above all the counterweight at the rear, keeps it in balance.",
                "W wózku czołowym ładunek znajduje się swobodnie przed przednimi kołami. W równowadze utrzymuje go jego własna masa, przede wszystkim przeciwwaga z tyłu.",
                "У фронтального навантажувача вантаж вільно розташований перед передніми колесами. Рівновагу тримає власна маса машини, передусім противага ззаду."),
            points: [
                pt(t("<b>Vorderachse:</b> Sie trägt die Last und ist die Kippkante nach vorn.", "<b>Front axle:</b> it carries the load and is the edge over which the truck can tip forwards.", "<b>Oś przednia:</b> niesie ładunek i to przez nią wózek może przewrócić się do przodu.", "<b>Передня вісь:</b> несе вантаж, і саме через неї навантажувач може перекинутися вперед.")),
                pt(t("<b>Hinterachse:</b> Sie lenkt. Das Heck schwenkt in Kurven weit aus.", "<b>Rear axle:</b> it steers. The rear swings out wide in curves.", "<b>Oś tylna:</b> skręca. Tył na zakrętach mocno zarzuca na zewnątrz.", "<b>Задня вісь:</b> кермує. Задня частина на поворотах сильно виноситься назовні.")),
                pt(t("<b>Hubgerüst:</b> Es hebt die Last senkrecht und lässt sich neigen.", "<b>Mast:</b> it lifts the load vertically and can be tilted.", "<b>Maszt:</b> podnosi ładunek pionowo i można go pochylać.", "<b>Щогла:</b> піднімає вантаж вертикально і може нахилятися.")),
                pt(t("<b>Schwerpunkt wandert:</b> Beim Heben und Neigen verschiebt sich der Schwerpunkt des ganzen Staplers.", "<b>The centre of gravity moves:</b> lifting and tilting shifts the centre of gravity of the whole truck.", "<b>Środek ciężkości się przesuwa:</b> podnoszenie i pochylanie przesuwa środek ciężkości całego wózka.", "<b>Центр ваги зміщується:</b> підйом і нахил зсувають центр ваги всього навантажувача.")),
            ],
            merke: t("Last vorne, Gegengewicht hinten, dazwischen die Vorderachse als Drehpunkt. Wie bei einer Wippe.", "Load at the front, counterweight at the rear, the front axle as the pivot in between. Like a seesaw.", "Ładunek z przodu, przeciwwaga z tyłu, pośrodku oś przednia jako punkt podparcia. Jak huśtawka.", "Вантаж спереду, противага ззаду, між ними передня вісь як точка опори. Як гойдалка."),
            src: { de: `DGUV G 308-001 (Entwurf 2026) Anhang A; ${I208} Abschn. 1.1` },
        }),
        step("sim", { sim: "anatomy", mode: "explore", lift: 1000, texts: ANATOMY_TEXTS, parts: PARTS,
            title: t("Entdecke den Frontstapler", "Explore the front forklift", "Poznaj wózek czołowy", "Познайомся з фронтальним навантажувачем") }),
        step("learn", {
            title: t("Hubgerüst, Gabelträger und Freihub", "Mast, fork carriage and free lift", "Maszt, karetka i wolny skok", "Щогла, каретка і вільний хід"),
            lead: t("Das Hubgerüst arbeitet hydraulisch. Ein Hubzylinder drückt den Mast nach oben, die Hubketten ziehen den Gabelträger mit.",
                "The mast works hydraulically. A lift cylinder pushes the mast up, and the lift chains pull the fork carriage along.",
                "Maszt działa hydraulicznie. Siłownik podnoszenia wypycha maszt w górę, a łańcuchy ciągną karetkę.",
                "Щогла працює гідравлічно. Циліндр підйому виштовхує щоглу вгору, ланцюги тягнуть каретку."),
            points: [
                pt(t("<b>Simplex, Duplex, Triplex:</b> ein, zwei oder drei Mastprofile, die ineinander laufen. Mehr Profile, mehr Hubhöhe bei gleicher Bauhöhe.", "<b>Simplex, duplex, triplex:</b> one, two or three mast profiles running inside each other. More profiles mean more lift height at the same overall height.", "<b>Simplex, duplex, triplex:</b> jeden, dwa lub trzy profile masztu wsuwane w siebie. Więcej profili to większa wysokość podnoszenia przy tej samej wysokości konstrukcyjnej.", "<b>Симплекс, дуплекс, триплекс:</b> один, два або три профілі щогли, що ходять один в одному. Більше профілів — більша висота підйому за тієї ж будівельної висоти.")),
                pt(t("<b>Freihub:</b> die Hubhöhe, die der Gabelträger erreicht, bevor der Mast ausfährt. Wichtig in Containern, LKW und unter niedrigen Toren.", "<b>Free lift:</b> the height the fork carriage reaches before the mast extends. Important in containers, lorries and under low doors.", "<b>Wolny skok:</b> wysokość, na którą podnosi się karetka, zanim maszt zacznie się wysuwać. Ważne w kontenerach, ciężarówkach i pod niskimi bramami.", "<b>Вільний хід:</b> висота, яку досягає каретка до висування щогли. Важливо в контейнерах, вантажівках і під низькими воротами.")),
                pt(t("<b>Neigen:</b> Nach vorn wird der Mast nur zum Aufnehmen und Absetzen der Last geneigt. Gefahren wird mit zurückgeneigtem Mast.", "<b>Tilting:</b> the mast is only tilted forwards to pick up and set down the load. You drive with the mast tilted back.", "<b>Pochylanie:</b> do przodu maszt pochylasz tylko przy podejmowaniu i odkładaniu ładunku. Jeździsz z masztem odchylonym do tyłu.", "<b>Нахил:</b> вперед щоглу нахиляють лише для підіймання і опускання вантажу. Їздять зі щоглою, нахиленою назад.")),
                pt(t("<b>Gabelträger:</b> Er trägt die Gabelzinken. Hier werden auch Anbaugeräte befestigt.", "<b>Fork carriage:</b> it carries the forks. Attachments are also fixed here.", "<b>Karetka:</b> niesie widły. Tu mocuje się też osprzęt.", "<b>Каретка:</b> несе вила. Тут кріпиться і навісне обладнання.")),
            ],
            merke: t("Den Freihub und die Bauhöhe deines Staplers findest du im Typenblatt des Herstellers.", "You will find your truck’s free lift and overall height in the manufacturer’s data sheet.", "Wolny skok i wysokość konstrukcyjną swojego wózka znajdziesz w karcie katalogowej producenta.", "Вільний хід і будівельну висоту свого навантажувача знайдеш у технічному паспорті виробника."),
            src: { de: `${V68} §13 Abs. 1, DA zu §23; VDI 2198 (Typenblätter)` },
        }),
        step("sim", { sim: "mast", ceiling: 2600, texts: MAST_TEXTS,
            title: t("Steuere das Hubgerüst", "Operate the mast", "Steruj masztem", "Керуй щоглою") }),
        step("video", {
            title: t("Der Mast in Bewegung", "The mast in motion", "Maszt w ruchu", "Щогла в русі"),
            brief: t("Feste Kamera auf Stativ, seitlich zum Stapler. Palette langsam heben: erst Freihub, dann fährt der Mast aus, bis ganz oben. Danach Mast vor- und zurückneigen. Ruhig, ohne Schnitte.", "Fixed camera on a tripod, side-on to the forklift. Lift a pallet slowly: free lift first, then the mast extends, up to the top. Then tilt the mast forwards and back. Calm, no cuts.", "Kamera na statywie, z boku wózka. Powoli podnieś paletę: najpierw wolny skok, potem maszt się wysuwa aż do góry. Następnie pochyl maszt do przodu i do tyłu. Spokojnie, bez cięć.", "Нерухома камера на штативі збоку від навантажувача. Повільно підняти палету: спершу вільний хід, потім щогла висувається до самого верху. Далі нахилити щоглу вперед і назад. Спокійно, без монтажу."),
            length: t("20 bis 30 Sekunden", "20 to 30 seconds", "20 do 30 sekund", "20–30 секунд"),
        }),
        step("learn", {
            title: t("Schutz für den Fahrer", "Protection for the driver", "Ochrona operatora", "Захист водія"),
            lead: t("Drei Bauteile schützen dich direkt. Sie sind keine Zierde: Fehlen sie oder benutzt du sie nicht, wird es lebensgefährlich.",
                "Three components protect you directly. They are not decoration: if they are missing or you do not use them, it becomes life-threatening.",
                "Trzy części chronią cię bezpośrednio. To nie ozdoby: jeśli ich brak albo z nich nie korzystasz, grozi to śmiercią.",
                "Три деталі захищають тебе безпосередньо. Це не прикраса: якщо їх немає або ти ними не користуєшся, це небезпечно для життя."),
            points: [
                pt(t("<b>Fahrerschutzdach:</b> Pflicht bei Staplern, die höher als 1,80 m heben. Es fängt herabfallende Lasten ab.", "<b>Overhead guard:</b> mandatory on forklifts that lift higher than 1.80 m. It catches falling loads.", "<b>Daszek ochronny:</b> obowiązkowy w wózkach podnoszących wyżej niż 1,80 m. Zatrzymuje spadający ładunek.", "<b>Захисний дах:</b> обов’язковий на навантажувачах, що піднімають вище 1,80 м. Затримує падаючий вантаж.")),
                pt(t("<b>Lastschutzgitter:</b> Wer Kleinteile transportiert, die auf den Fahrer fallen können, braucht es.", "<b>Load backrest:</b> required if you transport small parts that could fall onto the driver.", "<b>Krata ochronna:</b> potrzebna, gdy przewozisz drobnicę, która może spaść na operatora.", "<b>Захисна решітка:</b> потрібна, якщо перевозиш дрібні вантажі, що можуть упасти на водія.")),
                pt(t("<b>Fahrerrückhaltesystem:</b> Seit Dezember 1998 haben alle neuen Gabelstapler eins. Ist es vorhanden, musst du es benutzen: Tür zu, Bügel in Schutzstellung oder Gurt an.", "<b>Operator restraint:</b> all new forklifts have had one since December 1998. If it is fitted you must use it: door closed, bar in protective position or belt fastened.", "<b>System przytrzymujący:</b> od grudnia 1998 mają go wszystkie nowe wózki. Jeśli jest, musisz go używać: drzwi zamknięte, pałąk w pozycji ochronnej albo zapięty pas.", "<b>Система утримання:</b> з грудня 1998 вона є на всіх нових навантажувачах. Якщо є, нею треба користуватися: дверцята зачинені, скоба в захисному положенні або пасок застебнутий.")),
                pt(t("<b>Kippt der Stapler:</b> nicht abspringen. Festhalten, abstützen und auf dem Sitz bleiben. Wer springt, wird oft vom Schutzdach erschlagen.", "<b>If the forklift tips:</b> do not jump off. Hold on, brace yourself and stay in the seat. People who jump are often crushed by the overhead guard.", "<b>Gdy wózek się przewraca:</b> nie wyskakuj. Trzymaj się mocno, zaprzyj się nogami i zostań w fotelu. Kto wyskakuje, często ginie przygnieciony daszkiem ochronnym.", "<b>Якщо навантажувач перекидається:</b> не вистрибуй. Міцно тримайся, упрись ногами й залишайся на сидінні. Хто вистрибує, часто гине під захисним дахом.")),
            ],
            merke: t("Nach einer Erhebung der Berufsgenossenschaften sterben jedes Jahr 10 bis 15 Menschen durch umkippende Gabelstapler.", "According to a survey by the employers’ liability insurance associations, 10 to 15 people die every year from overturning forklifts.", "Według badania ubezpieczycieli wypadkowych co roku 10 do 15 osób ginie w wypadkach z przewracającym się wózkiem.", "За даними страхових спілок, щороку 10–15 людей гинуть через перекидання навантажувачів."),
            src: { de: `${I208} Abschn. 2.2 und 2.4; ${V68} §11 Abs. 3, §13 Abs. 4, DA zu §6` },
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: t("Ab welcher Hubhöhe braucht ein Gabelstapler ein Fahrerschutzdach?", "From what lift height does a forklift need an overhead guard?", "Od jakiej wysokości podnoszenia wózek potrzebuje daszka ochronnego?", "З якої висоти підйому навантажувачу потрібен захисний дах?"),
                    options: [t("Ab 1,00 m", "From 1.00 m", "Od 1,00 m", "Від 1,00 м"), t("Ab mehr als 1,80 m", "From more than 1.80 m", "Od ponad 1,80 m", "Понад 1,80 м"), t("Ab 3,30 m", "From 3.30 m", "Od 3,30 m", "Від 3,30 м")], correct: 1,
                    why: t("Hebt der Stapler höher als 1,80 m, ist das Schutzdach Pflicht.", "If the forklift lifts higher than 1.80 m, the guard is mandatory.", "Gdy wózek podnosi wyżej niż 1,80 m, daszek jest obowiązkowy.", "Якщо навантажувач піднімає вище 1,80 м, захисний дах обов’язковий.") },
                { q: t("Dein Stapler hat Bügeltüren. Wann schließt du sie?", "Your forklift has hoop doors. When do you close them?", "Twój wózek ma drzwi pałąkowe. Kiedy je zamykasz?", "У твого навантажувача дверцята-скоби. Коли ти їх зачиняєш?"),
                    options: [t("Nur bei Fahrten im Freien", "Only when driving outdoors", "Tylko przy jeździe na zewnątrz", "Лише під час їзди надворі"), t("Immer beim Fahren", "Always when driving", "Zawsze podczas jazdy", "Завжди під час їзди"), t("Nur mit Last", "Only with a load", "Tylko z ładunkiem", "Лише під час їзди з вантажем")], correct: 1,
                    why: t("Ein vorhandenes Rückhaltesystem gehört zur bestimmungsgemäßen Verwendung.", "Using a fitted restraint is part of intended use.", "Korzystanie z zamontowanego systemu przytrzymującego należy do użytkowania zgodnego z przeznaczeniem.", "Користування наявною системою утримання входить до використання за призначенням.") },
                { q: t("Der Stapler beginnt zur Seite zu kippen. Was tust du?", "The forklift starts to tip sideways. What do you do?", "Wózek zaczyna przewracać się na bok. Co robisz?", "Навантажувач починає перекидатися набік. Що робиш?"),
                    options: [t("Schnell abspringen", "Jump off quickly", "Szybko wyskakuję", "Швидко стрибаю"), t("Festhalten, abstützen, sitzen bleiben", "Hold on, brace, stay seated", "Trzymać się, zaprzeć się nogami, zostać w fotelu", "Триматися, упертися ногами, лишатися на сидінні")], correct: 1,
                    why: t("Beim Abspringen wird der Fahrer oft vom Schutzdach erschlagen.", "When jumping, the driver is often crushed by the overhead guard.", "Przy wyskakiwaniu operatora często przygniata daszek ochronny.", "Під час стрибка водія часто придавлює захисний дах.") },
            ],
            allRight: t("Alles richtig. Du kennst deinen Schutz.", "All correct. You know your protection.", "Wszystko dobrze. Znasz swoją ochronę.", "Усе правильно. Ти знаєш свій захист."),
            someWrong: t("Merke: Schutzdach ab 1,80 m, Rückhaltesystem immer benutzen, beim Kippen sitzen bleiben.", "Remember: guard above 1.80 m, always use the restraint, stay seated when tipping.", "Zapamiętaj: daszek powyżej 1,80 m, zawsze używaj systemu przytrzymującego, przy wywrotce zostań w fotelu.", "Запам’ятай: захисний дах понад 1,80 м, завжди користуйся системою утримання, під час перекидання сиди."),
        }),
        step("learn", {
            title: t("Schilder und Ausstattung", "Plates and equipment", "Tabliczki i wyposażenie", "Таблички та обладнання"),
            lead: t("Am Stapler stehen die wichtigsten Daten. Ein Blick darauf gehört zu jeder Übernahme eines Geräts.", "The most important data is on the forklift itself. A look at it is part of taking over any truck.", "Najważniejsze dane są na wózku. Sprawdzasz je za każdym razem, gdy przejmujesz wózek.", "Найважливіші дані є на самому навантажувачі. Поглянути на них треба щоразу, коли береш машину."),
            points: [
                pt(t("<b>Fabrikschild:</b> Hersteller, Typ, Baujahr, Fabriknummer, Nenn-Tragfähigkeit und Leergewicht.", "<b>Manufacturer’s plate:</b> manufacturer, type, year of manufacture, serial number, rated capacity and unladen weight.", "<b>Tabliczka fabryczna:</b> producent, typ, rok produkcji, numer fabryczny, udźwig nominalny i masa własna.", "<b>Заводська табличка:</b> виробник, тип, рік випуску, заводський номер, номінальна вантажопідйомність і власна маса.")),
                pt(t("<b>Tragfähigkeitsschild:</b> das Lastschwerpunkt-Diagramm. Die Nenn-Tragfähigkeit gilt meist für 500 mm Lastschwerpunktabstand bis 3.300 mm Hubhöhe.", "<b>Capacity plate:</b> the load chart. The rated capacity usually applies to a 500 mm load centre distance and a lift height of up to 3,300 mm.", "<b>Tabliczka udźwigu:</b> wykres udźwigu. Udźwig nominalny dotyczy zwykle odległości środka ciężkości 500 mm i wysokości podnoszenia do 3300 mm.", "<b>Табличка вантажопідйомності:</b> діаграма вантажопідйомності. Номінальна вантажопідйомність зазвичай діє для відстані центру ваги 500 мм і висоти підйому до 3300 мм.")),
                pt(t("<b>Warnhinweis:</b> Ab 2.000 mm Hubhöhe muss am Stapler „Aufenthalt unter der Last verboten“ stehen.", "<b>Warning sign:</b> from 2,000 mm lift height, “No standing under the load” must be shown on the truck.", "<b>Ostrzeżenie:</b> od 2000 mm wysokości podnoszenia na wózku musi być umieszczony napis „Zakaz przebywania pod ładunkiem”.", "<b>Попередження:</b> від 2000 мм висоти підйому на навантажувачі має бути «Перебування під вантажем заборонено».")),
                pt(t("<b>Jeder Stapler hat:</b> Betriebs- und Feststellbremse, Schlüssel gegen unbefugte Benutzung, Hupe und klar gekennzeichnete Bedienhebel.", "<b>Every forklift has:</b> service and parking brake, a key against unauthorised use, a horn and clearly marked control levers.", "<b>Każdy wózek ma:</b> hamulec roboczy i postojowy, kluczyk przeciw użyciu przez osoby nieupoważnione, klakson i wyraźnie oznaczone dźwignie.", "<b>Кожен навантажувач має:</b> робоче і стоянкове гальмо, ключ для захисту від використання сторонніми, звуковий сигнал і чітко позначені важелі.")),
            ],
            merke: t("Das Typenschild gilt nur für den Stapler ohne Anbaugerät. Mit Anbaugerät gilt dessen eigenes Diagramm.", "The type plate only applies to the truck without an attachment. With an attachment, its own diagram applies.", "Tabliczka znamionowa dotyczy wózka bez osprzętu. Z osprzętem obowiązuje osobny wykres udźwigu.", "Табличка діє лише для навантажувача без навісного обладнання. З обладнанням діє окрема діаграма для нього."),
            src: { de: `${I208} Abschn. 2.1, 2.2 und 8.6` },
        }),
        step("gap", {
            title: t("Lies das Tragfähigkeitsschild", "Read the capacity plate", "Odczytaj tabliczkę udźwigu", "Прочитай табличку вантажопідйомності"),
            sentence: t("Die Nenn-Tragfähigkeit auf dem Fabrikschild bezieht sich bei den meisten Staplern auf einen Lastschwerpunktabstand von {1} mm, und zwar bis zu einer Hubhöhe von {2} mm. Ab {3} mm Hubhöhe ist der Hinweis „Aufenthalt unter der Last verboten“ Pflicht.",
                "On most forklifts the rated capacity on the plate refers to a load centre distance of {1} mm, up to a lift height of {2} mm. From {3} mm lift height the sign “No standing under the load” is mandatory.",
                "W większości wózków udźwig nominalny z tabliczki dotyczy odległości środka ciężkości {1} mm, do wysokości podnoszenia {2} mm. Od {3} mm wysokości obowiązkowe jest ostrzeżenie „Zakaz przebywania pod ładunkiem”.",
                "У більшості навантажувачів номінальна вантажопідйомність на табличці стосується відстані центру ваги {1} мм до висоти підйому {2} мм. Від {3} мм висоти обов’язковий напис «Перебування під вантажем заборонено»."),
            chips: ["500", "3.300", "2.000", "1.000", "6.000", "250"].map(c => ({ id: c, text: { de: c, en: c.replace(".", ","), pl: c.replace(".", " "), uk: c.replace(".", " ") } })),
            answer: ["500", "3.300", "2.000"],
            success: { title: t("Genau", "Exactly", "Dokładnie", "Саме так"), body: t("500 mm und 3.300 mm stehen für die Nenn-Tragfähigkeit. Wird die Last größer, länger oder höher gehoben, sinkt die zulässige Last. Das schaust du im Diagramm nach.", "500 mm and 3,300 mm are the reference for the rated capacity. If the load is bigger, longer or lifted higher, the permitted load drops. You look that up in the diagram.", "500 mm i 3300 mm to wartości, dla których podano udźwig nominalny. Gdy ładunek jest większy, dłuższy albo podniesiony wyżej, dopuszczalny ciężar spada. Sprawdzasz to na wykresie.", "500 мм і 3300 мм — значення, для яких указано номінальну вантажопідйомність. Якщо вантаж більший, довший або піднятий вище, допустима маса зменшується. Це дивишся на діаграмі."), src: { de: `${I208} Abschn. 2.1` } },
        }),
        step("video", {
            title: t("Rundgang um den Stapler", "A walk around the forklift", "Obchód wokół wózka", "Обхід навколо навантажувача"),
            brief: t("Ein Ausbilder geht einmal um einen echten Frontstapler und zeigt: Gegengewicht, Lenkachse (Räder einschlagen lassen), Hubgerüst mit Ketten, Gabelzinken mit Verriegelung, Schutzdach, Bügeltür oder Gurt und das Typenschild in Nahaufnahme.", "A trainer walks once around a real front forklift and shows: counterweight, steering axle (turn the wheels), mast with chains, forks with locking pins, overhead guard, hoop door or belt and the type plate in close-up.", "Instruktor obchodzi prawdziwy wózek czołowy i pokazuje: przeciwwagę, oś skrętną (skręcone koła), maszt z łańcuchami, widły z blokadą, daszek ochronny, drzwi pałąkowe lub pas i tabliczkę znamionową z bliska.", "Інструктор обходить справжній фронтальний навантажувач і показує: противагу, кермову вісь (повернути колеса), щоглу з ланцюгами, вила з фіксаторами, захисний дах, дверцята-скобу або пасок і табличку крупним планом."),
            length: t("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Gegengewicht:</b> Last vorne, Gegengewicht hinten, Vorderachse als Kippkante. Die Hinterachse lenkt.", "<b>Counterweight:</b> load at the front, counterweight at the rear, front axle as tipping edge. The rear axle steers.", "<b>Przeciwwaga:</b> ładunek z przodu, przeciwwaga z tyłu, oś przednia jako krawędź, przez którą wózek może się przewrócić. Oś tylna skręca.", "<b>Противага:</b> вантаж спереду, противага ззаду, передня вісь — лінія, через яку навантажувач може перекинутися. Задня вісь кермує.")),
            pt(t("<b>Hubgerüst:</b> Hubzylinder und Ketten heben den Gabelträger. Freihub bedeutet: heben ohne größere Bauhöhe.", "<b>Mast:</b> lift cylinder and chains raise the fork carriage. Free lift means lifting without increasing the overall height.", "<b>Maszt:</b> siłownik i łańcuchy podnoszą karetkę. Wolny skok to podnoszenie bez zwiększania wysokości konstrukcyjnej.", "<b>Щогла:</b> циліндр і ланцюги піднімають каретку. Вільний хід — підйом без збільшення будівельної висоти.")),
            pt(t("<b>Neigen:</b> nach vorn nur zum Aufnehmen und Absetzen, gefahren wird zurückgeneigt.", "<b>Tilting:</b> forwards only to pick up and set down; you drive with the mast tilted back.", "<b>Pochylanie:</b> do przodu tylko przy podejmowaniu i odkładaniu, jeździsz z masztem odchylonym do tyłu.", "<b>Нахил:</b> вперед лише для підхоплення й опускання, їздять зі щоглою, нахиленою назад.")),
            pt(t("<b>Schutz:</b> Schutzdach ab 1,80 m Hubhöhe, Lastschutzgitter für Kleinteile, Rückhaltesystem immer benutzen.", "<b>Protection:</b> overhead guard above 1.80 m lift height, load backrest for small parts, always use the restraint.", "<b>Ochrona:</b> daszek ochronny przy wysokości podnoszenia powyżej 1,80 m, krata ochronna przy drobnicy, system przytrzymujący zawsze w użyciu.", "<b>Захист:</b> захисний дах при висоті підйому понад 1,80 м, захисна решітка для дрібних вантажів, система утримання — завжди.")),
        ] }),
    ];
}

/* ════════════════ 2.2 Sonderbauformen ════════════════ */
const T_NAMES = {
    front: t("Frontstapler", "Front forklift", "Wózek czołowy", "Фронтальний навантажувач"),
    reach: t("Schubmaststapler", "Reach truck", "Wózek z wysuwanym masztem", "Річтрак"),
    highlift: t("Hochhubwagen", "Pedestrian stacker", "Wózek podnośnikowy", "Штабелер"),
    vna: t("Schmalgangstapler", "Very narrow aisle truck", "Wózek do wąskich korytarzy", "Вузькопрохідний навантажувач"),
    tele: t("Teleskoplader", "Telehandler", "Ładowarka teleskopowa", "Телескопічний навантажувач"),
    lowlift: t("Niederhubwagen", "Pallet truck", "Wózek paletowy", "Палетний візок"),
};
export function lesson22(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Mit deinem Staplerschein auf den Schubmaststapler?", "On a reach truck with your forklift licence?", "Ze Staplerschein na wózek z wysuwanym masztem?", "Зі Staplerschein на річтрак?"),
            text: t("Du hast den Staplerschein auf dem Frontstapler gemacht. Im neuen Job steht ein Schubmaststapler. Darfst du sofort losfahren?", "You took your licence on a front forklift. At your new job there is a reach truck. Are you allowed to drive off straight away?", "Zrobiłeś Staplerschein na wózku czołowym. W nowej pracy stoi wózek z wysuwanym masztem. Możesz od razu jechać?", "Ти отримав Staplerschein на фронтальному навантажувачі. На новій роботі стоїть річтрак. Можна одразу їхати?"),
            layout: "list",
            options: [t("Ja, Stapler ist Stapler", "Yes, a forklift is a forklift", "Tak, wózek to wózek", "Так, навантажувач — це навантажувач"), t("Nein, ich brauche eine Zusatzqualifizierung", "No, I need additional qualification", "Nie, potrzebuję dodatkowej kwalifikacji", "Ні, потрібна додаткова кваліфікація")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: WRONG_T },
            quote: t("„Daher müssen Bedienpersonen, sofern sie im Betrieb andere Flurförderzeuge fahren, an einer zusätzlichen Qualifizierungsmaßnahme (Stufe 2) teilnehmen. Dies gilt z. B. bei Schubmaststaplern …“", "“Operators who drive other industrial trucks at work must therefore take part in an additional qualification (level 2). This applies, for example, to reach trucks …”", "„Dlatego operatorzy, którzy w zakładzie jeżdżą innymi wózkami, muszą przejść dodatkową kwalifikację (stopień 2). Dotyczy to np. wózków z wysuwanym masztem …”", "«Тому оператори, які на підприємстві їздять іншою технікою, мають пройти додаткову кваліфікацію (ступінь 2). Це стосується, напр., річтраків …»"),
            body: t("Jede Bauart lenkt, kippt und wird anders bedient. Welche es gibt, siehst du jetzt.", "Each type steers, tips and is operated differently. You will now see which types exist.", "Każdy typ inaczej skręca, przewraca się i jest obsługiwany. Jakie są typy, zobaczysz teraz.", "Кожен тип по-іншому кермує, перекидається й керується. Які бувають типи, побачиш зараз."),
            src: { de: "DGUV G 308-001 (Dez. 2022) Abschn. 3.3" }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Andere Bauart, andere Regeln", "Different type, different rules", "Inny typ, inne zasady", "Інший тип, інші правила"),
            lead: t("Nicht jedes Flurförderzeug hat ein großes Gegengewicht. Viele stützen die Last mit Radarmen ab, andere werden zu Fuß gesteuert oder im Gang geführt.", "Not every industrial truck has a large counterweight. Many support the load with wheel arms, others are steered on foot or guided in the aisle.", "Nie każdy wózek ma dużą przeciwwagę. Wiele podpiera ładunek ramionami z kołami, inne są sterowane przez operatora idącego pieszo albo prowadzone w korytarzu.", "Не кожна машина має велику противагу. Багато підпирають вантаж колісними опорами, іншими керує оператор, що йде пішки, або їх ведуть у проході напрямними."),
            points: [
                pt(t("<b>Radarme:</b> Beim Schubmaststapler und Hochhubwagen stehen Räder vorn unter der Last. Das macht sie kurz und wendig.", "<b>Wheel arms:</b> on reach trucks and stackers, wheels stand at the front under the load. That makes them short and agile.", "<b>Ramiona z kołami:</b> w wózkach z wysuwanym masztem i wózkach podnośnikowych koła są z przodu pod ładunkiem. Dzięki temu są krótkie i zwrotne.", "<b>Колісні опори:</b> у річтрака і штабелера колеса стоять спереду під вантажем. Тому вони короткі й маневрені.")),
                pt(t("<b>Mitgänger:</b> Mit Deichsel zu Fuß gesteuert. Du brauchst eine Unterweisung und einen Auftrag des Unternehmers.", "<b>Pedestrian-controlled:</b> steered on foot with a tiller. You need instruction and an authorisation from the employer.", "<b>Wózki prowadzone:</b> sterowane pieszo dyszlem. Potrzebujesz instruktażu i upoważnienia pracodawcy.", "<b>Візки із супроводом пішки:</b> ними керують дишлом, ідучи пішки. Потрібні інструктаж і доручення роботодавця.")),
                pt(t("<b>Zusatzqualifizierung (Stufe 2):</b> zum Beispiel für Schubmast-, Seiten- und Dreiseitenstapler.", "<b>Additional qualification (level 2):</b> for example for reach, side-loading and three-way trucks.", "<b>Kwalifikacja dodatkowa (stopień 2):</b> np. dla wózków z wysuwanym masztem, bocznych i trójstronnych.", "<b>Додаткова кваліфікація (ступінь 2):</b> напр. для річтраків, бічних і тристоронніх навантажувачів.")),
                pt(t("<b>Eigener Grundsatz:</b> Für geländegängige Teleskopstapler gilt DGUV Grundsatz 308-009, nicht dieser Kurs.", "<b>Separate principle:</b> rough-terrain telehandlers fall under DGUV Principle 308-009, not this course.", "<b>Osobna zasada:</b> terenowe ładowarki teleskopowe podlegają DGUV Grundsatz 308-009, nie temu kursowi.", "<b>Окремий принцип:</b> позашляхові телескопічні навантажувачі підпадають під DGUV Grundsatz 308-009, а не цей курс.")),
            ],
            merke: t("Dein Staplerschein gilt für den Typ, auf dem du ausgebildet wurdest. Für andere Typen kommt eine Zusatzqualifizierung oder Unterweisung dazu.", "Your licence applies to the type you were trained on. For other types, additional qualification or instruction is added.", "Twój Staplerschein dotyczy typu, na którym się szkoliłeś. Do innych typów dochodzi kwalifikacja dodatkowa albo instruktaż.", "Твій Staplerschein діє для типу, на якому ти навчався. Для інших типів потрібна додаткова кваліфікація або інструктаж."),
            src: { de: `DGUV G 308-001 (Dez. 2022) Abschn. 1.3 und 3.3; ${V68} §7 Abs. 2 und 3` },
        }),
        step("sim", { sim: "types", texts: TYPES_TEXTS,
            title: t("Vier Bauarten im Überblick", "Four types at a glance", "Cztery typy w skrócie", "Чотири типи: огляд"),
            lead: t("Wische nach links für die nächste Karte.", "Swipe left for the next card.", "Przesuń w lewo, aby zobaczyć następną kartę.", "Гортай ліворуч до наступної картки."),
            cards: [
                { type: "reach", name: T_NAMES.reach, aka: t("auch Schubmaster genannt", "German: Schubmaststapler", "niem. Schubmaststapler", "нім. Schubmaststapler"),
                    what: t("Radarme mit Rädern vorn. Hubmast oder Gabel lassen sich nach vorn schieben, um die Last aufzunehmen.", "Wheel arms with wheels at the front. The mast or forks slide forwards to pick up the load.", "Ramiona z kołami z przodu. Maszt lub widły wysuwają się do przodu, by podjąć ładunek.", "Колісні опори спереду. Щогла або вила висуваються вперед, щоб узяти вантаж."),
                    use: t("Hochregallager, enge Gänge, meist in der Halle.", "High-bay warehouses, narrow aisles, mostly indoors.", "Magazyny wysokiego składowania, wąskie alejki, zwykle w hali.", "Висотні склади, вузькі проходи, переважно в приміщенні."),
                    note: t("Fahrer sitzt oft quer zur Fahrtrichtung. Last nur bei zurückgeschobenem Mast transportieren.", "The driver often sits sideways to the direction of travel. Only transport the load with the mast retracted.", "Operator często siedzi bokiem do kierunku jazdy. Ładunek przewoź tylko przy wsuniętym maszcie.", "Водій часто сидить боком до напрямку руху. Перевозь вантаж лише зі втягнутою щоглою."),
                    lic: t("Zusatzqualifizierung (Stufe 2)", "Additional qualification (level 2)", "Kwalifikacja dodatkowa (stopień 2)", "Додаткова кваліфікація (ступінь 2)") },
                { type: "highlift", name: T_NAMES.highlift, aka: t("Deichselstapler, Hochhub-Mitgänger", "pedestrian stacker with tiller", "wózek podnośnikowy z dyszlem", "штабелер з дишлом"),
                    what: t("Wird mit der Deichsel zu Fuß gesteuert. Die Gabeln liegen über den Radarmen und heben bis ins Regal.", "Steered on foot with a tiller. The forks sit above the wheel arms and lift up into the rack.", "Sterowany pieszo dyszlem. Widły są nad ramionami z kołami i podnoszą ładunek aż na regał.", "Керується пішки дишлом. Вила розташовані над колісними опорами й піднімають вантаж аж на стелаж."),
                    use: t("Kleine Lager, Wareneingang, Märkte.", "Small warehouses, goods receipt, shops.", "Małe magazyny, przyjęcie towaru, sklepy.", "Невеликі склади, приймання товару, магазини."),
                    note: t("Umgangssprachlich oft „Ameise“ genannt. Mit klappbarer Standplattform fährst du mit, dann gelten strengere Regeln.", "Often called an “ant” in German slang. With a folding platform you can ride on it, but then stricter rules apply.", "Potocznie w Niemczech „Ameise” (mrówka). Jeśli ma składaną platformę, możesz na niej jechać, ale wtedy obowiązują ostrzejsze zasady.", "У розмовній німецькій часто «Ameise» (мураха). Якщо є відкидна платформа, ти можеш їхати на ній, але тоді діють суворіші правила."),
                    lic: t("Mitgänger: Unterweisung und Auftrag", "Pedestrian: instruction and authorisation", "Prowadzony: instruktaż i upoważnienie", "Супровід пішки: інструктаж і доручення") },
                { type: "vna", name: T_NAMES.vna, aka: t("Dreiseiten- oder Regalstapler", "three-way or turret truck", "wózek trójstronny lub regałowy", "тристоронній або стелажний"),
                    what: t("Lagert nach vorn und zu beiden Seiten ein und aus. Im Gang mechanisch an Schienen oder induktiv über einen Leitdraht geführt.", "Stores and retrieves to the front and to both sides. In the aisle it is guided mechanically by rails or inductively by a wire.", "Składuje i pobiera ładunki z przodu i z obu boków. W korytarzu jest prowadzony mechanicznie po szynach albo indukcyjnie wzdłuż przewodu w posadzce.", "Складує й забирає вантажі спереду та з обох боків. У проході його ведуть механічно рейками або індуктивно по дроту в підлозі."),
                    use: t("Schmalganglager mit sehr hohen Regalen.", "Very narrow aisle warehouses with very high racks.", "Magazyny z wąskimi korytarzami i bardzo wysokimi regałami.", "Склади з вузькими проходами й дуже високими стелажами."),
                    note: t("Fußgänger dürfen den Schmalgang nur mit Auftrag und nur ohne Stapler im Gang betreten.", "Pedestrians may only enter the narrow aisle with authorisation and only when no truck is in it.", "Piesi mogą wejść do wąskiego korytarza tylko z upoważnieniem i tylko, gdy nie ma w nim wózka.", "Пішоходи можуть заходити у вузький прохід лише з дорученням і лише коли там немає машини."),
                    lic: t("Zusatzqualifizierung (Stufe 2)", "Additional qualification (level 2)", "Kwalifikacja dodatkowa (stopień 2)", "Додаткова кваліфікація (ступінь 2)") },
                { type: "tele", name: T_NAMES.tele, aka: t("geländegängiger Teleskopstapler", "rough-terrain telescopic handler", "terenowa ładowarka teleskopowa", "позашляховий телескопічний навантажувач"),
                    what: t("Großer Ausleger, der nach vorn und oben teleskopiert. Große Räder für unebenes Gelände.", "Large boom that telescopes forwards and upwards. Big wheels for rough ground.", "Duży wysięgnik, który wysuwa się do przodu i w górę. Duże koła na nierówny teren.", "Велика стріла, що висувається вперед і вгору. Великі колеса для нерівного ґрунту."),
                    use: t("Baustellen und Landwirtschaft.", "Construction sites and agriculture.", "Budowy i rolnictwo.", "Будівництва й сільське господарство."),
                    lic: t("Eigener Grundsatz: DGUV G 308-009", "Separate principle: DGUV G 308-009", "Osobna zasada: DGUV G 308-009", "Окремий принцип: DGUV G 308-009"), licKind: "other" },
            ],
        }),
        step("video", {
            title: t("Bauarten im Einsatz", "Truck types in action", "Typy w działaniu", "Типи в роботі"),
            brief: t("Je 6 bis 8 Sekunden: Schubmaststapler schiebt den Mast vor und nimmt eine Palette auf, Hochhubwagen wird mit der Deichsel gefahren, Schmalgangstapler fährt geführt in den Gang und lagert seitlich ein.", "6 to 8 seconds each: reach truck extends its mast and picks up a pallet, pedestrian stacker driven with the tiller, very narrow aisle truck guided into the aisle storing sideways.", "Po 6 do 8 sekund: wózek z wysuwanym masztem wysuwa maszt i podejmuje paletę, wózek podnośnikowy prowadzony dyszlem, wózek do wąskich korytarzy wjeżdża do korytarza po prowadnicach i odkłada paletę na bok.", "По 6–8 секунд: річтрак висуває щоглу й бере палету, штабелер ведуть дишлом, вузькопрохідний навантажувач заїжджає в прохід і складує вбік."),
            length: t("25 bis 35 Sekunden", "25 to 35 seconds", "25 do 35 sekund", "25–35 секунд"),
        }),
        step("sim", { sim: "identify", texts: TYPES_TEXTS,
            title: t("Welche Bauart ist das?", "Which type is this?", "Jaki to typ?", "Що це за тип?"),
            items: [
                { type: "reach", options: [T_NAMES.front, T_NAMES.reach, T_NAMES.vna, T_NAMES.tele], correct: 1, why: t("Radarme vorn, und der Mast fährt nach vorn: ein Schubmaststapler.", "Wheel arms at the front and the mast moves forwards: a reach truck.", "Ramiona z kołami z przodu i maszt wysuwa się do przodu: wózek z wysuwanym masztem.", "Колісні опори спереду, щогла їде вперед: річтрак.") },
                { type: "tele", options: [T_NAMES.tele, T_NAMES.front, T_NAMES.highlift, T_NAMES.reach], correct: 0, why: t("Ausleger statt Mast, große Geländereifen: ein Teleskoplader.", "Boom instead of mast, big off-road tyres: a telehandler.", "Wysięgnik zamiast masztu, duże opony terenowe: ładowarka teleskopowa.", "Стріла замість щогли, великі позашляхові шини: телескопічний навантажувач.") },
                { type: "highlift", options: [T_NAMES.lowlift, T_NAMES.reach, T_NAMES.highlift, T_NAMES.vna], correct: 2, why: t("Deichsel und Mast: ein Hochhubwagen. Ein Niederhubwagen hebt nur knapp über den Boden.", "Tiller and mast: a pedestrian stacker. A pallet truck only lifts just off the floor.", "Dyszel i maszt: wózek podnośnikowy. Wózek paletowy podnosi tylko tuż nad podłogę.", "Дишло і щогла: штабелер. Палетний візок піднімає лише трохи над підлогою.") },
                { type: "vna", options: [T_NAMES.front, T_NAMES.vna, T_NAMES.tele, T_NAMES.lowlift], correct: 1, why: t("Hoher Mast, Gabel quer gestellt, Führung am Boden: ein Schmalgangstapler.", "Tall mast, forks turned sideways, guidance on the floor: a very narrow aisle truck.", "Wysoki maszt, widły ustawione w bok, prowadnice przy podłodze: wózek do wąskich korytarzy.", "Висока щогла, вила повернуті вбік, напрямна на підлозі: вузькопрохідний навантажувач.") },
                { type: "front", options: [T_NAMES.highlift, T_NAMES.reach, T_NAMES.tele, T_NAMES.front], correct: 3, why: t("Gegengewicht hinten, Last frei vor den Vorderrädern: der klassische Frontstapler.", "Counterweight at the rear, load freely in front of the front wheels: the classic front forklift.", "Przeciwwaga z tyłu, ładunek swobodnie przed przednimi kołami: klasyczny wózek czołowy.", "Противага ззаду, вантаж вільно перед передніми колесами: класичний фронтальний навантажувач.") },
            ],
            allRight: t("Alle erkannt. Du unterscheidest die Bauarten sicher.", "All identified. You can tell the types apart.", "Wszystkie rozpoznane. Pewnie rozróżniasz typy.", "Усі впізнано. Ти впевнено розрізняєш типи."),
            someWrong: t("Achte auf drei Dinge: Gegengewicht oder Radarme, Mast oder Ausleger, Sitz oder Deichsel.", "Look for three things: counterweight or wheel arms, mast or boom, seat or tiller.", "Zwróć uwagę na trzy rzeczy: przeciwwaga czy ramiona z kołami, maszt czy wysięgnik, fotel czy dyszel.", "Зверни увагу на три речі: противага чи колісні опори, щогла чи стріла, сидіння чи дишло."),
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: t("Welcher Grundsatz gilt für geländegängige Teleskopstapler?", "Which principle applies to rough-terrain telehandlers?", "Która zasada dotyczy terenowych ładowarek teleskopowych?", "Який принцип діє для позашляхових телескопічних навантажувачів?"),
                    options: [{ de: "DGUV G 308-001" }, { de: "DGUV G 308-009" }, { de: "DGUV V68 §2" }], correct: 1,
                    why: t("G 308-001 gilt ausdrücklich nicht für geländegängige Teleskopstapler.", "G 308-001 explicitly does not apply to rough-terrain telehandlers.", "G 308-001 wprost nie dotyczy terenowych ładowarek teleskopowych.", "G 308-001 прямо не стосується позашляхових телескопічних навантажувачів.") },
                { q: t("Was brauchst du für einen Hochhubwagen mit Deichsel, den du zu Fuß steuerst?", "What do you need for a pedestrian stacker you steer on foot?", "Czego potrzebujesz do wózka podnośnikowego prowadzonego pieszo?", "Що потрібно для штабелера, яким керуєш пішки?"),
                    options: [t("Einen Führerschein", "A driving licence", "Prawa jazdy", "Посвідчення водія"), t("Unterweisung und Auftrag des Unternehmers", "Instruction and the employer’s authorisation", "Instruktażu i upoważnienia pracodawcy", "Інструктаж і доручення роботодавця"), t("Nichts, er ist ungefährlich", "Nothing, it is harmless", "Niczego, jest niegroźny", "Нічого, він безпечний")], correct: 1,
                    why: t("Mitgänger-Geräte darf steuern, wer geeignet, unterwiesen und beauftragt ist.", "Pedestrian trucks may be operated by those who are suitable, instructed and authorised.", "Wózki prowadzone może obsługiwać osoba, która ma odpowiednie predyspozycje, przeszła instruktaż i ma upoważnienie.", "Візками із супроводом пішки може керувати придатна особа, яка пройшла інструктаж і має доручення.") },
                { q: t("Du willst durch einen Schmalgang laufen. Ein Regalstapler arbeitet darin. Was gilt?", "You want to walk through a narrow aisle. A turret truck is working in it. What applies?", "Chcesz przejść wąskim korytarzem. Pracuje w nim wózek regałowy. Co obowiązuje?", "Ти хочеш пройти вузьким проходом. Там працює стелажний навантажувач. Що діє?"),
                    options: [t("Schnell durchgehen", "Walk through quickly", "Szybko przejść", "Швидко пройти"), t("Warten, bis kein Stapler mehr im Gang ist", "Wait until no truck is in the aisle", "Poczekać, aż w korytarzu nie będzie wózka", "Чекати, поки в проході не буде машини")], correct: 1,
                    why: t("Schmalgänge betrittst du nur mit Auftrag und erst, wenn sich kein Regalstapler darin befindet.", "You only enter narrow aisles with authorisation and only once no turret truck is in them.", "Do wąskich korytarzy wchodzisz tylko z upoważnieniem i dopiero, gdy nie ma w nich wózka regałowego.", "У вузькі проходи заходиш лише з дорученням і лише коли там немає машини.") },
            ],
            allRight: t("Alles richtig.", "All correct.", "Wszystko dobrze.", "Усе правильно."),
            someWrong: t("Geh bei Bedarf zurück zu den Karten.", "Go back to the cards if needed.", "W razie potrzeby wróć do kart.", "За потреби повернися до карток."),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Radarme statt Gegengewicht:</b> Schubmaststapler und Hochhubwagen stützen die Last vorn ab.", "<b>Wheel arms instead of counterweight:</b> reach trucks and stackers support the load at the front.", "<b>Ramiona z kołami zamiast przeciwwagi:</b> wózki z wysuwanym masztem i podnośnikowe podpierają ładunek z przodu.", "<b>Колісні опори замість противаги:</b> річтраки і штабелери підпирають вантаж спереду.")),
            pt(t("<b>Stufe 2:</b> Für Schubmast-, Seiten- und Dreiseitenstapler brauchst du eine Zusatzqualifizierung.", "<b>Level 2:</b> for reach, side-loading and three-way trucks you need additional qualification.", "<b>Stopień 2:</b> do wózków z wysuwanym masztem, bocznych i trójstronnych potrzebujesz dodatkowej kwalifikacji.", "<b>Ступінь 2:</b> для річтраків, бічних і тристоронніх потрібна додаткова кваліфікація.")),
            pt(t("<b>Mitgänger:</b> Unterweisung und Auftrag. Teleskoplader: eigener Grundsatz G 308-009.", "<b>Pedestrian trucks:</b> instruction and authorisation. Telehandlers: separate principle G 308-009.", "<b>Wózki prowadzone:</b> instruktaż i upoważnienie. Ładowarki teleskopowe: osobna zasada G 308-009.", "<b>Пішки:</b> інструктаж і доручення. Телескопічні навантажувачі: окремий принцип G 308-009.")),
        ] }),
    ];
}

/* ════════════════ 2.3 Anbaugeräte ════════════════ */
export function lesson23(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Du baust eine Klammer an. Was passiert mit der Tragfähigkeit?", "You fit a clamp. What happens to the capacity?", "Montujesz chwytak. Co dzieje się z udźwigiem?", "Ти ставиш захват. Що стається з вантажопідйомністю?"),
            text: OPENER, layout: "list",
            options: [t("Sie bleibt gleich", "It stays the same", "Zostaje taki sam", "Залишається такою ж"), t("Sie sinkt", "It drops", "Spada", "Зменшується"), t("Sie steigt, die Klammer hält ja fest", "It rises, the clamp holds tight", "Rośnie, bo chwytak mocno trzyma", "Зростає, бо захват міцно тримає")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: WRONG_T },
            quote: t("„Weiterhin ist zu beachten, dass durch das Gewicht und die Abmessungen des Anbaugerätes die verbleibende Nutzlast des Gabelstaplers herabgesetzt wird.“", "“It must also be noted that the weight and dimensions of the attachment reduce the forklift’s remaining payload.”", "„Należy też pamiętać, że masa i wymiary osprzętu zmniejszają pozostały udźwig wózka.”", "«Слід також пам’ятати, що маса й розміри навісного обладнання зменшують залишкову вантажопідйомність.»"),
            body: t("Das Anbaugerät wiegt selbst etwas und schiebt die Last weiter nach vorn. Beides frisst Tragfähigkeit.", "The attachment has its own weight and pushes the load further forwards. Both eat into the capacity.", "Osprzęt sam coś waży i przesuwa ładunek dalej do przodu. Jedno i drugie zmniejsza udźwig.", "Обладнання має власну масу і зсуває вантаж далі вперед. І те, і інше зменшує вантажопідйомність."),
            src: { de: `${I208} Abschn. 8.6` }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Was Anbaugeräte können", "What attachments do", "Co potrafi osprzęt", "Що вміє навісне обладнання"),
            lead: t("Anbaugeräte machen aus dem Stapler ein Spezialgerät. Sie werden am Gabelträger oder auf den Gabeln befestigt und oft hydraulisch angetrieben.", "Attachments turn the forklift into a special machine. They are fixed to the fork carriage or onto the forks and are often hydraulically powered.", "Osprzęt zmienia wózek w maszynę specjalną. Mocuje się go na karetce lub na widłach i często napędza hydraulicznie.", "Навісне обладнання перетворює навантажувач на спеціальну машину. Його кріплять на каретці або на вилах, часто з гідравлічним приводом."),
            points: [
                pt(t("<b>Seitenschieber:</b> verschiebt die Gabeln seitlich, damit du die Palette genau absetzt, ohne zu rangieren.", "<b>Side shift:</b> moves the forks sideways so you can set the pallet down exactly without manoeuvring.", "<b>Przesuw boczny:</b> przesuwa widły na boki, żeby dokładnie odłożyć paletę bez manewrowania.", "<b>Бічний зсув:</b> зсуває вила вбік, щоб точно поставити палету без маневрів.")),
                pt(t("<b>Gabelverlängerung:</b> Aufsteckzinken für lange oder sperrige Lasten.", "<b>Fork extension:</b> slip-on tines for long or bulky loads.", "<b>Przedłużki wideł:</b> nakładki na widły do długich lub dużych ładunków.", "<b>Подовжувачі вил:</b> насадки для довгих або громіздких вантажів.")),
                pt(t("<b>Klammer:</b> greift Lasten ohne Palette, zum Beispiel Ballen, Kartons oder Fässer.", "<b>Clamp:</b> grips loads without a pallet, for example bales, cartons or drums.", "<b>Chwytak (klamra):</b> chwyta ładunki bez palety, np. bele, kartony lub beczki.", "<b>Захват:</b> захоплює вантажі без палети, наприклад тюки, коробки чи бочки.")),
                pt(t("<b>Kippbehälter:</b> Behälter für Schüttgut und Späne, der sich zum Entleeren kippen lässt.", "<b>Tipping skip:</b> container for bulk material and chips that tips to empty.", "<b>Pojemnik wywrotny:</b> na materiały sypkie i wióry, przechyla się do opróżnienia.", "<b>Перекидний контейнер:</b> для сипких матеріалів і стружки, перекидається для спорожнення.")),
            ],
            merke: t("Arbeitsbühnen sind auch Anbaugeräte. Für sie gelten eigene, strenge Regeln, die du im Modul Sondereinsätze lernst.", "Work platforms are attachments too. Separate, strict rules apply to them, which you will learn in the special operations module.", "Podesty robocze to też osprzęt. Obowiązują je osobne, surowe zasady, które poznasz w module o zadaniach specjalnych.", "Робочі платформи теж є навісним обладнанням. Для них діють окремі суворі правила, які ти вивчиш у модулі про особливі роботи."),
            src: { de: "DGUV G 308-001 (Entwurf 2026) Anhang B; DGUV V68 §26" },
        }),
        step("sim", { sim: "attach", texts: ATTACH_TEXTS, Q: 2500, c: 500, A: 450,
            title: t("Anbaugerät montieren", "Fit an attachment", "Zamontuj osprzęt", "Встанови навісне обладнання"),
            tools: [
                { id: "sideshift", name: t("Seitenschieber", "Side shift", "Przesuw boczny", "Бічний зсув"), w: 120, e: 40, d: 80, c: 500,
                    effect: t("Leicht, aber er sitzt vor dem Gabelträger. Die Last rückt ein Stück nach vorn, die Resttragfähigkeit sinkt etwas.", "Light, but it sits in front of the carriage. The load moves a little forwards and the remaining capacity drops slightly.", "Lekki, ale jest przed karetką. Ładunek przesuwa się trochę do przodu, udźwig resztkowy nieco spada.", "Легкий, але стоїть перед кареткою. Вантаж трохи зсувається вперед, залишкова вантажопідйомність трохи зменшується.") },
                { id: "extension", name: t("Gabelverlängerung", "Fork extension", "Przedłużki wideł", "Подовжувачі вил"), w: 90, e: 600, d: 0, c: 800,
                    effect: t("Lange Lasten haben ihren Schwerpunkt weit vorn. Das Lastmoment wächst stark, die zulässige Last fällt deutlich.", "Long loads have their centre of gravity far forwards. The load moment grows a lot and the permitted load drops clearly.", "Długie ładunki mają środek ciężkości daleko z przodu. Moment ładunku mocno rośnie, dopuszczalny ciężar wyraźnie spada.", "У довгих вантажів центр ваги далеко спереду. Момент вантажу сильно зростає, допустима маса помітно зменшується.") },
                { id: "clamp", name: t("Klammer", "Clamp", "Chwytak", "Захват"), w: 550, e: 150, d: 250, c: 500,
                    effect: t("Schwer und mit Abstand vor dem Gabelträger. Hier geht am meisten Tragfähigkeit verloren. Klammern über 1 t brauchen eine Zusatzqualifizierung.", "Heavy and with distance in front of the carriage. This is where the most capacity is lost. Clamps for more than 1 t need additional qualification.", "Ciężki i osadzony w pewnej odległości przed karetką. Tu traci się najwięcej udźwigu. Chwytaki powyżej 1 t wymagają dodatkowej kwalifikacji.", "Важкий і розташований на відстані перед кареткою. Тут втрачається найбільше вантажопідйомності. Захвати понад 1 т потребують додаткової кваліфікації.") },
                { id: "bin", name: t("Kippbehälter", "Tipping skip", "Pojemnik wywrotny", "Перекидний контейнер"), w: 180, e: 400, d: 0, c: 600,
                    effect: t("Der Behälter selbst zählt zur Last, und sein Inhalt liegt weiter vorn als bei einer Palette.", "The container itself counts as load, and its contents sit further forwards than on a pallet.", "Sam pojemnik liczy się do ładunku, a jego zawartość jest dalej z przodu niż na palecie.", "Сам контейнер рахується як вантаж, а вміст лежить далі вперед, ніж на палеті.") },
            ],
            checks: [
                { t: t("Gerät und Stapler sind aufeinander abgestimmt", "Attachment and truck are matched", "Osprzęt i wózek są do siebie dopasowane", "Обладнання і навантажувач узгоджені"), sub: t("zulässige Kombination laut Kennzeichnung oder Betriebsanweisung", "permitted combination according to marking or operating instructions", "dopuszczalne połączenie według oznaczenia lub instrukcji stanowiskowej", "дозволене поєднання за маркуванням або робочою інструкцією") },
                { t: t("Richtig befestigt und angeschlossen", "Correctly fixed and connected", "Prawidłowo zamocowany i podłączony", "Правильно закріплене й під’єднане"), sub: t("Sicherungen eingerastet, Hydraulik dicht", "locks engaged, hydraulics tight", "zabezpieczenia zatrzaśnięte, hydraulika szczelna", "фіксатори на місці, гідравліка без витоків") },
                { t: t("Eigenes Lastschwerpunktdiagramm beachtet", "Own load centre diagram observed", "Uwzględniony własny wykres udźwigu", "Власну діаграму вантажопідйомності враховано"), sub: t("die Tragfähigkeit von Gerät und Stapler wird nicht überschritten", "the capacity of attachment and truck is not exceeded", "udźwig osprzętu i wózka nie jest przekroczony", "вантажопідйомність обладнання й навантажувача не перевищено") },
            ],
        }),
        step("learn", {
            title: t("Regeln für Anbaugeräte", "Rules for attachments", "Zasady dla osprzętu", "Правила для навісного обладнання"),
            lead: t("Die DGUV Vorschrift 68 hat einen eigenen Paragrafen für Anbaugeräte. Er verteilt die Pflichten auf Unternehmer und Fahrer.", "DGUV Regulation 68 has its own section on attachments. It divides the duties between employer and driver.", "DGUV Vorschrift 68 ma osobny paragraf o osprzęcie. Dzieli obowiązki między pracodawcę i operatora.", "DGUV Vorschrift 68 має окремий параграф про навісне обладнання. Він розподіляє обов’язки між роботодавцем і водієм."),
            points: [
                pt(t("<b>Unternehmer:</b> setzt nur Anbaugeräte ein, die zum Stapler passen: Befestigung und Energiezufuhr stimmen, die Standsicherheit bleibt in allen Stellungen erhalten.", "<b>Employer:</b> only uses attachments that suit the truck: fixing and power supply fit, stability is maintained in all positions.", "<b>Pracodawca:</b> używa tylko osprzętu pasującego do wózka: mocowanie i zasilanie pasują, stateczność zostaje zachowana w każdym położeniu.", "<b>Роботодавець:</b> використовує лише обладнання, що підходить: кріплення й живлення відповідають, стійкість зберігається в усіх положеннях.")),
                pt(t("<b>Fahrer vor der Verwendung:</b> vergewissert sich, dass das Gerät bestimmungsgemäß befestigt und angeschlossen ist.", "<b>Driver before use:</b> makes sure the attachment is fixed and connected as intended.", "<b>Operator przed użyciem:</b> upewnia się, że osprzęt jest zamocowany i podłączony zgodnie z przeznaczeniem.", "<b>Водій перед використанням:</b> переконується, що обладнання закріплене й під’єднане як належить.")),
                pt(t("<b>Fahrer bei der Arbeit:</b> achtet darauf, dass die Tragfähigkeit von Anbaugerät und Stapler nicht überschritten wird.", "<b>Driver while working:</b> makes sure the capacity of attachment and truck is not exceeded.", "<b>Operator w pracy:</b> pilnuje, by nie przekroczyć udźwigu osprzętu i wózka.", "<b>Водій під час роботи:</b> стежить, щоб не перевищити вантажопідйомність обладнання й навантажувача.")),
                pt(t("<b>Prüfung:</b> Anbaugeräte werden wie der Stapler mindestens einmal im Jahr von einer fachkundigen Person geprüft.", "<b>Inspection:</b> like the truck, attachments are inspected by a qualified person at least once a year.", "<b>Przegląd:</b> osprzęt, tak jak wózek, sprawdza osoba uprawniona co najmniej raz w roku.", "<b>Перевірка:</b> обладнання, як і навантажувач, перевіряє фахівець щонайменше раз на рік.")),
            ],
            merke: t("Ist ein Anbaugerät nicht sicher befestigt, fährst du nicht. Auch nicht „nur kurz“.", "If an attachment is not securely fixed, you do not drive. Not even “just quickly”.", "Jeśli osprzęt nie jest pewnie zamocowany, nie jedziesz. Nawet „tylko na chwilę”.", "Якщо обладнання не закріплене надійно, ти не їдеш. Навіть «на хвилинку»."),
            src: { de: `${V68} §23 Abs. 1 bis 3 mit DA, §37 Abs. 1 mit DA` },
        }),
        step("video", {
            title: t("Anbaugerät richtig anbauen", "Fitting an attachment correctly", "Prawidłowy montaż osprzętu", "Правильне встановлення обладнання"),
            brief: t("Ein Fahrer steckt eine Gabelverlängerung auf und sichert sie. Danach Nahaufnahme einer Klammer: Befestigung am Gabelträger, Hydraulikschläuche angeschlossen, Zusatz-Tragfähigkeitsschild am Gerät.", "A driver slips on a fork extension and secures it. Then a close-up of a clamp: fixing on the carriage, hydraulic hoses connected, additional capacity plate on the attachment.", "Operator nakłada przedłużkę wideł i ją zabezpiecza. Potem zbliżenie chwytaka: mocowanie na karetce, podłączone węże hydrauliczne, dodatkowa tabliczka udźwigu na osprzęcie.", "Водій насуває подовжувач вил і фіксує його. Потім крупний план захвату: кріплення на каретці, під’єднані гідрошланги, додаткова табличка вантажопідйомності на обладнанні."),
            length: t("40 bis 60 Sekunden", "40 to 60 seconds", "40 do 60 sekund", "40–60 секунд"),
        }),
        step("question", {
            title: t("Gabelverlängerung ohne Sicherung", "Fork extension without locking", "Przedłużka bez zabezpieczenia", "Подовжувач без фіксації"),
            text: t("Dein Kollege hat die Gabelverlängerungen aufgesteckt, aber die Sicherungsbolzen liegen noch auf dem Boden. Er sagt: „Ist nur für eine Fuhre.“", "Your colleague has slipped on the fork extensions, but the locking pins are still lying on the floor. He says: “It’s only for one trip.”", "Kolega nałożył przedłużki, ale sworznie zabezpieczające leżą jeszcze na podłodze. Mówi: „To tylko na jeden kurs”.", "Колега насунув подовжувачі вил, але фіксувальні пальці ще лежать на підлозі. Каже: «Це лише на один рейс»."),
            layout: "list",
            options: [t("Vorsichtig fahren, die Last hält sie ja", "Drive carefully, the load holds them down", "Jechać ostrożnie, ładunek je dociśnie", "Їхати обережно, вантаж їх притисне"), t("Erst die Bolzen einsetzen, dann fahren", "Insert the pins first, then drive", "Najpierw włożyć sworznie, potem jechać", "Спершу вставити фіксувальні пальці, потім їхати"), t("Ohne Last fahren, das reicht", "Drive without a load, that is enough", "Jechać bez ładunku, to wystarczy", "Їхати без вантажу, цього досить")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das ist gefährlich", "No, that is dangerous", "Nie, to niebezpieczne", "Ні, це небезпечно") },
            quote: t("„Der Fahrer hat sich vor der Verwendung eines Anbaugerätes zu vergewissern, dass das Anbaugerät bestimmungsgemäß befestigt und angeschlossen ist.“", "“Before using an attachment, the driver must make sure that it is fixed and connected as intended.”", "„Operator przed użyciem osprzętu musi upewnić się, że jest on zamocowany i podłączony zgodnie z przeznaczeniem.”", "«Перед використанням обладнання водій має переконатися, що воно закріплене й під’єднане як належить.»"),
            body: t("Ungesicherte Verlängerungen können beim Bremsen oder Neigen abrutschen, samt Last.", "Unsecured extensions can slide off when braking or tilting, together with the load.", "Niezabezpieczone przedłużki mogą zsunąć się przy hamowaniu lub pochylaniu, razem z ładunkiem.", "Незафіксовані подовжувачі можуть зісковзнути під час гальмування чи нахилу разом із вантажем."),
            src: { de: `${V68} §23 Abs. 2` },
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Weniger Tragfähigkeit:</b> Gewicht und Abmessungen des Anbaugeräts senken die verbleibende Nutzlast.", "<b>Less capacity:</b> the weight and dimensions of the attachment reduce the remaining payload.", "<b>Mniejszy udźwig:</b> masa i wymiary osprzętu zmniejszają pozostały udźwig.", "<b>Менша вантажопідйомність:</b> маса й розміри обладнання зменшують залишкову вантажопідйомність.")),
            pt(t("<b>Eigenes Diagramm:</b> Mit Anbaugerät gilt dessen Lastschwerpunktdiagramm, nicht das des Staplers.", "<b>Own diagram:</b> with an attachment, its load centre diagram applies, not the truck’s.", "<b>Własny wykres:</b> z osprzętem obowiązuje wykres udźwigu osprzętu, a nie wykres wózka.", "<b>Власна діаграма:</b> з обладнанням діє його власна діаграма, а не діаграма навантажувача.")),
            pt(t("<b>Vor jeder Verwendung:</b> abgestimmt, befestigt, angeschlossen. Sonst wird nicht gefahren.", "<b>Before every use:</b> matched, fixed, connected. Otherwise there is no driving.", "<b>Przed każdym użyciem:</b> dopasowany, zamocowany, podłączony. Inaczej nie jedziesz.", "<b>Перед кожним використанням:</b> узгоджено, закріплено, під’єднано. Інакше не їдеш.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson2Check(step: Mk): Step[] {
    return [
        step("sim", { sim: "anatomy", mode: "find", lift: 1000, texts: ANATOMY_TEXTS, parts: PARTS, find: ["tilt", "guard", "chain", "cw", "carriage", "steer"],
            title: t("Finde das Bauteil", "Find the component", "Znajdź część", "Знайди деталь") }),
        step("sim", { sim: "identify", texts: TYPES_TEXTS,
            title: t("Bauart erkennen", "Identify the type", "Rozpoznaj typ", "Впізнай тип"),
            items: [
                { type: "vna", options: [T_NAMES.vna, T_NAMES.reach, T_NAMES.front, T_NAMES.tele], correct: 0, why: t("Geführt im Gang, Gabel quer: Schmalgangstapler.", "Guided in the aisle, forks turned: very narrow aisle truck.", "Prowadzony w korytarzu, widły ustawione w bok: wózek do wąskich korytarzy.", "Ведеться в проході, вила повернуті вбік: вузькопрохідний навантажувач.") },
                { type: "lowlift", options: [T_NAMES.highlift, T_NAMES.lowlift, T_NAMES.reach, T_NAMES.front], correct: 1, why: t("Kein Mast, hebt nur bodenfrei: Niederhubwagen.", "No mast, only lifts off the floor: pallet truck.", "Bez masztu, podnosi tylko nad podłogę: wózek paletowy.", "Без щогли, піднімає лише над підлогою: палетний візок.") },
                { type: "reach", options: [T_NAMES.front, T_NAMES.tele, T_NAMES.reach, T_NAMES.vna], correct: 2, why: t("Radarme und vorschiebbarer Mast: Schubmaststapler.", "Wheel arms and a mast that moves forwards: reach truck.", "Ramiona z kołami i wysuwany maszt: wózek z wysuwanym masztem.", "Колісні опори й висувна щогла: річтрак.") },
            ],
            allRight: t("Alle erkannt.", "All identified.", "Wszystkie rozpoznane.", "Усі впізнано."),
            someWrong: t("Schau dir die Karten in Thema 2.2 noch einmal an.", "Have another look at the cards in topic 2.2.", "Obejrzyj jeszcze raz karty w temacie 2.2.", "Переглянь ще раз картки в темі 2.2."),
        }),
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Wann darfst du den Hubmast nach vorn neigen?", "When are you allowed to tilt the mast forwards?", "Kiedy możesz pochylić maszt do przodu?", "Коли можна нахиляти щоглу вперед?"),
                    options: [t("Beim Fahren mit Last", "When driving with a load", "Podczas jazdy z ładunkiem", "Під час їзди з вантажем"), t("Nur zum Aufnehmen und Absetzen der Last", "Only to pick up and set down the load", "Tylko przy podejmowaniu i odkładaniu ładunku", "Лише для підхоплення й опускання вантажу"), t("Immer, wenn die Sicht schlecht ist", "Whenever visibility is poor", "Zawsze, gdy widoczność jest słaba", "Завжди, коли погана видимість")], correct: 1,
                    why: t("DGUV V68 §13 Abs. 1.", "DGUV V68 §13 para. 1.", "DGUV V68 §13 ust. 1.", "DGUV V68 §13 абз. 1.") },
                { q: t("Was bedeutet Freihub?", "What does free lift mean?", "Co oznacza wolny skok?", "Що означає вільний хід?"),
                    options: [t("Heben ohne Last", "Lifting without a load", "Podnoszenie bez ładunku", "Підйом без вантажу"), t("Heben, ohne dass die Bauhöhe wächst", "Lifting without the overall height increasing", "Podnoszenie bez wzrostu wysokości konstrukcyjnej", "Підйом без зростання будівельної висоти"), t("Heben ohne Hydraulik", "Lifting without hydraulics", "Podnoszenie bez hydrauliki", "Підйом без гідравліки")], correct: 1,
                    why: t("Erst fährt nur der Gabelträger hoch, dann der Mast.", "First only the carriage moves up, then the mast.", "Najpierw podnosi się tylko karetka, potem maszt.", "Спершу піднімається лише каретка, потім щогла.") },
                { q: t("Wofür ist das Lastschutzgitter Pflicht?", "What is the load backrest mandatory for?", "Do czego krata ochronna jest obowiązkowa?", "Для чого захисна решітка обов’язкова?"),
                    options: [t("Für Kleinteile, die auf den Fahrer fallen können", "For small parts that could fall onto the driver", "Do drobnicy, która może spaść na operatora", "Для дрібних вантажів, що можуть упасти на водія"), t("Nur für Fahrten im Freien", "Only for outdoor driving", "Tylko do jazdy na zewnątrz", "Лише для їзди надворі"), t("Für leere Paletten", "For empty pallets", "Do pustych palet", "Для порожніх палет")], correct: 0,
                    why: t("DGUV V68 §11 Abs. 3.", "DGUV V68 §11 para. 3.", "DGUV V68 §11 ust. 3.", "DGUV V68 §11 абз. 3.") },
                { q: t("Mit Anbaugerät gilt welches Lastschwerpunktdiagramm?", "With an attachment, which load centre diagram applies?", "Który wykres udźwigu obowiązuje z osprzętem?", "Яка діаграма вантажопідйомності діє з навісним обладнанням?"),
                    options: [t("Das auf dem Stapler", "The one on the truck", "Ten na wózku", "Та, що на навантажувачі"), t("Das eigene des Anbaugeräts", "The attachment’s own", "Własny wykres osprzętu", "Власна діаграма обладнання")], correct: 1,
                    why: t("DGUV Information 208-004, Abschn. 8.6.", "DGUV Information 208-004, section 8.6.", "DGUV Information 208-004, rozdz. 8.6.", "DGUV Information 208-004, розд. 8.6.") },
                { q: t("Du hast den Staplerschein auf dem Frontstapler. Darfst du damit einen Dreiseitenstapler fahren?", "You got your licence on a front forklift. Are you allowed to drive a three-way truck with it?", "Staplerschein zdobyłeś na wózku czołowym. Czy możesz z nim jeździć wózkiem trójstronnym?", "Ти отримав Staplerschein на фронтальному навантажувачі. Чи можна з ним їздити тристороннім навантажувачем?"),
                    options: [t("Ja", "Yes", "Tak", "Так"), t("Nein, erst nach Zusatzqualifizierung", "No, only after additional qualification", "Nie, dopiero po dodatkowej kwalifikacji", "Ні, лише після додаткової кваліфікації")], correct: 1,
                    why: t("DGUV G 308-001, Abschn. 3.3.", "DGUV G 308-001, section 3.3.", "DGUV G 308-001, rozdz. 3.3.", "DGUV G 308-001, розд. 3.3.") },
            ],
            allRight: t("Stark. Modul 2 ist geschafft.", "Great. You have completed module 2.", "Świetnie. Moduł 2 zaliczony.", "Чудово. Модуль 2 пройдено."),
            someWrong: t("Fast. Geh bei Bedarf zu den Themen zurück.", "Almost. Go back to the topics if needed.", "Prawie. W razie potrzeby wróć do tematów.", "Майже. За потреби повернися до тем."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Frontstapler:</b> Gegengewicht, Hinterradlenkung, neigbares Hubgerüst mit Freihub.", "<b>Front forklift:</b> counterweight, rear-wheel steering, tilting mast with free lift.", "<b>Wózek czołowy:</b> przeciwwaga, skręt tylnymi kołami, pochylany maszt z wolnym skokiem.", "<b>Фронтальний навантажувач:</b> противага, кермування задніми колесами, нахильна щогла з вільним ходом.")),
            pt(t("<b>Sonderbauformen:</b> eigene Ausbildung oder Unterweisung, Teleskoplader nach G 308-009.", "<b>Special types:</b> separate training or instruction, telehandlers under G 308-009.", "<b>Typy specjalne:</b> osobne szkolenie lub instruktaż, ładowarki teleskopowe według G 308-009.", "<b>Спеціальні типи:</b> окреме навчання чи інструктаж, телескопічні навантажувачі — за G 308-009.")),
            pt(t("<b>Anbaugeräte:</b> weniger Tragfähigkeit, eigenes Diagramm, vor dem Einsatz prüfen.", "<b>Attachments:</b> less capacity, own diagram, check before use.", "<b>Osprzęt:</b> mniejszy udźwig, własny wykres, sprawdzić przed użyciem.", "<b>Навісне обладнання:</b> менша вантажопідйомність, власна діаграма, перевірити перед роботою.")),
        ] }),
    ];
}
