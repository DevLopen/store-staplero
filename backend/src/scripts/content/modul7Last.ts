/**
 * Moduł „Umgang mit Last” (spis klienta, punkt 8, moduł 7 kursu), od razu w czterech językach.
 * Źródła: DGUV Vorschrift 68 §11, §12, §13, §17, §27 z DA (wyd. 2002); DGUV Information 208-004 „Gabelstapler”, rozdz. 6.3, 6.4, 8.4;
 * DGUV G 308-001 (Entwurf 2026) Anhang B Nr. 8; BGR 234 / DGUV Regel 108-007 (Fachlast, Feldlast); GefStoffV §14.
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

const PICK_TEXTS = texts([
    ["Gabeln unter die Palette fahren", "Drive the forks under the pallet", "Wjedź widłami pod paletę", "Заведи вила під палету"],
    ["Halb unterfahren", "Halfway under", "Wjazd do połowy", "До половини"],
    ["Bis zum Gabelrücken", "Up to the fork back", "Do grzbietu wideł", "До спинки вил"],
    ["Fahrstellung einstellen", "Set the travel position", "Ustaw pozycję do jazdy", "Встанови транспортне положення"],
    ["Bodenfreiheit", "Ground clearance", "Wysokość nad podłogą", "Висота над підлогою"],
    ["Bodenfreiheit {v} mm", "Clearance {v} mm", "Wysokość nad podłogą {v} mm", "Висота над підлогою {v} мм"],
    ["Hubmast", "Mast", "Maszt", "Щогла"],
    ["{n}° nach hinten", "{n}° backwards", "{n}° do tyłu", "{n}° назад"],
    ["{n}° nach vorn", "{n}° forwards", "{n}° do przodu", "{n}° вперед"],
    ["senkrecht", "vertical", "pionowo", "вертикально"],
    ["Losfahren und bremsen", "Drive off and brake", "Ruszaj i hamuj", "Рушай і гальмуй"],
    ["Nochmal einstellen", "Adjust again", "Ustaw ponownie", "Налаштуй знову"],
    ["Schwelle", "Floor sill", "Próg", "Поріг"],
]);
const RACK_TEXTS = texts([
    ["Fachlast {n} kg", "Shelf load {n} kg", "Obciążenie poziomu {n} kg", "Навантаження ярусу {n} кг"],
    ["Feldlast {n} kg", "Bay load {n} kg", "Obciążenie pola {n} kg", "Навантаження секції {n} кг"],
    ["Platz wählen", "Choose a place", "Wybierz miejsce", "Обери місце"],
    ["Zu schwer für diese Ebene", "Too heavy for this level", "Za ciężko na ten poziom", "Заважко для цього ярусу"],
    ["Passt", "Fits", "Pasuje", "Підходить"],
    ["Ebene {l}", "Level {l}", "Poziom {l}", "Ярус {l}"],
    ["Ganzes Feld", "Whole bay", "Całe pole", "Уся секція"],
    ["erlaubt {n} kg", "allowed {n} kg", "dozwolone {n} kg", "дозволено {n} кг"],
    ["Die Fachlast gilt für die ganze Ebene. Mit der neuen Palette wäre sie überschritten, der Träger biegt sich durch.", "The shelf load applies to the whole level. With the new pallet it would be exceeded and the beam would bend.", "Obciążenie poziomu dotyczy całego poziomu. Z nową paletą zostałoby przekroczone, a belka by się ugięła.", "Навантаження ярусу діє на весь ярус. З новою палетою його було б перевищено, і балка прогнулася б."],
    ["Fachlast und Feldlast bleiben eingehalten.", "Shelf load and bay load are respected.", "Obciążenie poziomu i pola jest zachowane.", "Навантаження ярусу й секції дотримано."],
]);
const SEQ_TEXTS = texts([
    ["Tippe unten den nächsten Schritt an", "Tap the next step below", "Dotknij poniżej następnego kroku", "Торкнися нижче наступного кроку"],
    ["Richtig: {s}", "Correct: {s}", "Prawidłowo: {s}", "Правильно: {s}"],
    ["Tippe die Schritte in der richtigen Reihenfolge an", "Tap the steps in the right order", "Dotykaj kroków we właściwej kolejności", "Торкайся кроків у правильному порядку"],
]);
const DOCK_TEXTS = texts([
    ["Gefahren gefunden", "Hazards found", "Znalezione zagrożenia", "Знайдено небезпек"], ["Alle Gefahren gefunden", "All hazards found", "Wszystkie zagrożenia znalezione", "Усі небезпеки знайдено"],
    ["Gefahr: {l}", "Hazard: {l}", "Zagrożenie: {l}", "Небезпека: {l}"], ["In Ordnung: {l}", "All right: {l}", "W porządku: {l}", "Усе гаразд: {l}"],
    ["Tippe auf die Punkte an der Rampe. Nicht alles ist falsch.", "Tap the points at the dock. Not everything is wrong.", "Dotknij punktów przy rampie. Nie wszystko jest złe.", "Торкайся точок біля рампи. Не все неправильно."],
    ["Tippe auf die Punkte in der Halle. Nicht alles ist falsch.", "Tap the points at the dock. Not everything is wrong.", "Dotknij punktów przy rampie. Nie wszystko jest złe.", "Торкайся точок біля рампи. Не все неправильно."],
    ["Ganze Halle zeigen", "Show the whole dock", "Pokaż całą rampę", "Показати всю рампу"],
]);

/* ════════════════ Lernziele ════════════════ */
export function lesson7Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Umgang mit Last", "Handling loads", "Praca z ładunkiem", "Робота з вантажем"), image: "forklift",
            text: t("Die meisten Fehler passieren nicht beim Fahren, sondern beim Aufnehmen, Absetzen und Stapeln. Hier lernst du die Handgriffe, die eine Last sicher machen.",
                "Most mistakes do not happen while driving but when picking up, setting down and stacking. Here you learn the moves that make a load safe.",
                "Najwięcej błędów zdarza się nie w czasie jazdy, tylko przy podejmowaniu, odkładaniu i piętrowaniu. Tu poznasz ruchy, które czynią ładunek bezpiecznym.",
                "Найбільше помилок трапляється не під час їзди, а під час підйому, опускання та штабелювання. Тут ти вивчиш дії, що роблять вантаж безпечним."),
            meta: [t("ca. 45 Minuten", "about 45 minutes", "ok. 45 minut", "близько 45 хвилин"), t("4 Themen und Modul-Check", "4 topics and module check", "4 tematy i test modułu", "4 теми і перевірка модуля"), { de: "DGUV V68 §11–13, §17, §27" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "Your learning goals for this module. 1 = new to me, 5 = confident.", "Twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: [
                { code: "7.1", text: t("Ich nehme eine Last richtig auf und fahre in der richtigen Fahrstellung.", "I pick up a load correctly and drive in the correct travel position.", "Prawidłowo podejmuję ładunek i jeżdżę w prawidłowej pozycji do jazdy.", "Я правильно беру вантаж і їжджу в правильному транспортному положенні."), short: t("Aufnehmen und fahren", "Pick up and drive", "Podejmowanie i jazda", "Підйом і їзда") },
                { code: "7.2", text: t("Ich setze Lasten sicher ab und halte Fachlast und Feldlast im Regal ein.", "I set loads down safely and respect shelf and bay loads in the rack.", "Bezpiecznie odkładam ładunki i przestrzegam obciążenia poziomu i pola w regale.", "Я безпечно ставлю вантаж і дотримуюся допустимих навантажень на ярус і секцію стелажа."), short: t("Absetzen und Regal", "Set down and rack", "Odkładanie i regał", "Опускання й стелаж") },
                { code: "7.3", text: t("Ich weiß, was bei schlechter Sicht, beim Lkw-Beladen und bei hängenden Lasten gilt.", "I know the rules for poor visibility, loading lorries and suspended loads.", "Wiem, co obowiązuje przy złej widoczności, załadunku ciężarówki i ładunkach podwieszonych.", "Я знаю правила для поганої видимості, навантаження вантажівки й підвішених вантажів."), short: t("Sicht, Lkw, hängend", "Visibility, lorries, suspended loads", "Widoczność, ciężarówki, ładunki podwieszone", "Огляд, вантажівки, підвішені вантажі") },
                { code: "7.4", text: t("Ich baue Stapel sicher auf und ab.", "I build and dismantle stacks safely.", "Bezpiecznie buduję i rozbieram stosy.", "Я безпечно складаю й розбираю штабелі.") },
            ],
        }),
        step("sort", {
            title: t("Erlaubt oder nicht?", "Allowed or not?", "Wolno czy nie?", "Можна чи ні?"),
            lead: t("Entscheide aus dem Bauch heraus.", "Go with your gut feeling.", "Zdecyduj intuicyjnie.", "Вирішуй інтуїтивно."),
            labels: [t("Erlaubt", "Allowed", "Wolno", "Можна"), t("Verboten", "Not allowed", "Nie wolno", "Не можна")],
            items: [
                { t: t("Mit hoch angehobener Palette quer durch die Halle zum Regal fahren", "Driving across the hall to the rack with the pallet raised high", "Jechać przez halę do regału z wysoko podniesioną paletą", "Їхати через цех до стелажа з високо піднятою палетою"), a: 1, why: t("Höher als bodenfrei wird nur zum Aufnehmen und Absetzen gefahren.", "With the load higher than just clear of the floor you only move to pick up or set down.", "Z ładunkiem podniesionym wyżej niż tuż nad podłogę poruszasz się tylko przy podejmowaniu i odkładaniu.", "З вантажем, піднятим вище, ніж трохи над підлогою, рухаєшся лише під час підхоплення й опускання.") },
                { t: t("Vor der Fahrt den Hubmast nach hinten neigen", "Tilting the mast backwards before driving", "Przed jazdą odchylić maszt do tyłu", "Перед їздою нахилити щоглу назад"), a: 0, why: t("So liegt die Last beim Bremsen sicher an.", "That way the load stays in place when braking.", "Wtedy ładunek przy hamowaniu leży pewnie.", "Так вантаж надійно лежить під час гальмування.") },
                { t: t("Eine Palette mit gebrochenem Brett ganz oben ins Regal stellen", "Putting a pallet with a broken board on the top rack level", "Wstawić paletę ze złamaną deską na najwyższy poziom regału", "Поставити палету з поламаною дошкою на верхній ярус"), a: 1, why: t("Beschädigte Paletten werden nicht gestapelt und nicht hoch abgesetzt.", "Damaged pallets are not stacked or set down high up.", "Uszkodzonych palet nie piętruje się i nie odkłada wysoko.", "Пошкоджені палети не штабелюють і не ставлять високо.") },
                { t: t("Vor dem Beladen prüfen, ob der Lkw gegen Wegrollen gesichert ist", "Checking before loading that the lorry is secured against rolling", "Przed załadunkiem sprawdzić, czy ciężarówka jest zabezpieczona przed odtoczeniem", "Перед навантаженням перевірити, чи вантажівка захищена від скочування"), a: 0, why: t("Ohne Sicherung kann der Lkw wegrollen, während du auf der Ladefläche bist.", "Without securing, the lorry can roll away while you are on the loading area.", "Bez zabezpieczenia ciężarówka może się stoczyć, gdy jesteś na skrzyni ładunkowej.", "Без захисту вантажівка може відкотитися, коли ти в кузові.") },
            ],
            allRight: t("Gutes Gespür. Jetzt üben wir die Handgriffe.", "Good instinct. Now let us practise the moves.", "Dobre wyczucie. Teraz poćwiczymy ruchy.", "Гарне чуття. Тепер потренуємо дії."),
            someWrong: t("Kein Problem, genau das üben wir jetzt.", "No problem, that is exactly what we practise now.", "Nie szkodzi, właśnie to teraz poćwiczymy.", "Нічого, саме це зараз потренуємо."),
        }),
    ];
}

/* ════════════════ 7.1 Last aufnehmen und fahren ════════════════ */
export function lesson71(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Bevor du die Last aufnimmst", "Before you pick up the load", "Zanim podejmiesz ładunek", "Перш ніж брати вантаж"),
            lead: t("Vier Fragen, bevor die Gabel unter die Palette fährt.", "Four questions before the forks go under the pallet.", "Cztery pytania, zanim widły wjadą pod paletę.", "Чотири питання, перш ніж вила зайдуть під палету."),
            points: [
                pt(t("<b>Wie schwer ist die Last?</b> Das Gewicht steht in den Transportpapieren oder auf der Last.", "<b>How heavy is the load?</b> The weight is in the transport documents or on the load.", "<b>Ile waży ładunek?</b> Masa jest podana w dokumentach przewozowych albo na ładunku.", "<b>Скільки важить вантаж?</b> Вага є в транспортних документах або на вантажі.")),
                pt(t("<b>Reicht die Tragfähigkeit?</b> Fabrikschild und Lastschwerpunktdiagramm sagen es dir. Nie überlasten, nie Zusatzgewichte anbringen.", "<b>Is the capacity enough?</b> The rating plate and load centre diagram tell you. Never overload, never add extra counterweights.", "<b>Czy udźwig wystarczy?</b> Powie ci to tabliczka znamionowa i wykres udźwigu. Nigdy nie przeciążaj i nie dokładaj dodatkowych przeciwwag.", "<b>Чи вистачить вантажопідйомності?</b> Це підкажуть заводська табличка й діаграма вантажопідйомності. Ніколи не перевантажуй і не встановлюй додаткових противаг.")),
                pt(t("<b>Wo liegt der Schwerpunkt?</b> Ist er markiert, richtest du die Gabelzinken danach aus.", "<b>Where is the centre of gravity?</b> If it is marked, you position the forks accordingly.", "<b>Gdzie jest środek ciężkości?</b> Jeśli jest oznaczony, ustawiasz według niego widły.", "<b>Де центр ваги?</b> Якщо він позначений, розстав вила відповідно до нього.")),
                pt(t("<b>Ist die Last in Ordnung?</b> Nicht ordnungsgemäß gepackt, verrutscht oder auf beschädigter Palette: nicht stapeln und nicht hoch absetzen.", "<b>Is the load in order?</b> Not packed properly, shifted or on a damaged pallet: do not stack it or set it down high.", "<b>Czy ładunek jest w porządku?</b> Źle zapakowany, przesunięty albo na uszkodzonej palecie: nie piętruj go i nie odkładaj wysoko.", "<b>Чи вантаж у порядку?</b> Погано запакований, зсунутий або на пошкодженій палеті: не штабелюй і не став високо.")),
            ],
            merke: t("Erst wissen, dann heben.", "Know first, then lift.", "Najpierw wiedz, potem podnoś.", "Спершу знай, потім піднімай."),
            src: { de: `${V68} §11 Abs. 1 und 2, §13 Abs. 3; ${I208} Abschn. 6.3.4` },
        }),
        step("learn", {
            title: t("So nimmst du die Last auf", "How to pick up the load", "Tak podejmujesz ładunek", "Як брати вантаж"),
            lead: t("Je näher der Schwerpunkt am Gabelrücken liegt, desto mehr darfst du heben.", "The closer the centre of gravity is to the fork back, the more you may lift.", "Im bliżej grzbietu wideł leży środek ciężkości, tym więcej możesz podnieść.", "Що ближче центр ваги до спинки вил, то більше можна піднімати."),
            points: [
                pt(t("<b>Zinken passend einstellen:</b> so weit auseinander, dass die Last auf beiden Zinken gleichmäßig aufliegt.", "<b>Set the forks to fit:</b> far enough apart that the load rests evenly on both forks.", "<b>Rozstaw widły odpowiednio:</b> tak szeroko, by ładunek leżał równo na obu ramionach wideł.", "<b>Розстав вила відповідно:</b> так широко, щоб вантаж рівно лежав на обох зубцях.")),
                pt(t("<b>Ganz unterfahren:</b> so weit wie möglich, bis die Last am Gabelrücken anliegt. Paletten von der Schmalseite aufnehmen.", "<b>Go all the way under:</b> as far as possible until the load touches the fork back. Pick up pallets from the narrow side.", "<b>Wjedź do końca:</b> jak najdalej, aż ładunek oprze się o grzbiet wideł. Palety podejmuj od węższej strony.", "<b>Заводь вила повністю:</b> якнайглибше, доки вантаж не впреться в спинку вил. Палети бери з вузького боку.")),
                pt(t("<b>Nach vorn neigen nur zum Aufnehmen und Absetzen.</b> Danach den Hubmast nach hinten neigen.", "<b>Tilt forwards only to pick up and set down.</b> Afterwards tilt the mast backwards.", "<b>Do przodu pochylasz tylko przy podejmowaniu i odkładaniu.</b> Potem odchylasz maszt do tyłu.", "<b>Вперед нахиляєш лише для підхоплення й опускання.</b> Потім нахиляєш щоглу назад.")),
                pt(t("<b>Schutz von oben:</b> Kleinteile, die herabfallen können, nur mit Lastschutzgitter. Über 1,80 m nur mit Fahrerschutzdach.", "<b>Protection from above:</b> small parts that can fall only with a load backrest. Above 1.80 m lift height only with an overhead guard.", "<b>Ochrona z góry:</b> drobne elementy, które mogą spaść, przewoź tylko z kratą ochronną ładunku. Przy wysokości podnoszenia powyżej 1,80 m tylko z daszkiem ochronnym.", "<b>Захист згори:</b> дрібні предмети, що можуть упасти, — лише із захисною решіткою вантажу. При висоті підйому понад 1,80 м — лише із захисним дахом.")),
            ],
            src: { de: `${V68} §11 Abs. 3, §13 Abs. 1 und 4; ${I208} Abschn. 6.3.2 und 6.3.4` },
        }),
        step("learn", {
            title: t("Die Fahrstellung", "The travel position", "Pozycja do jazdy", "Транспортне положення"),
            lead: t("Last unten, Mast nach hinten geneigt, mit Gefühl fahren.", "Load low, mast tilted back, drive with care.", "Ładunek nisko, maszt odchylony do tyłu, jazda z wyczuciem.", "Вантаж низько, щогла нахилена назад, їзда обережна."),
            points: [
                pt(t("<b>Bodenfreiheit 10 bis 30 cm:</b> je nach Boden. Höher wird nur zum Aufnehmen und Absetzen gefahren.", "<b>Ground clearance 10 to 30 cm:</b> depending on the floor. Higher only to pick up and set down.", "<b>Ładunek 10–30 cm nad podłogą:</b> zależnie od podłoża. Wyżej tylko przy podejmowaniu i odkładaniu.", "<b>Висота над підлогою 10–30 см:</b> залежно від підлоги. Вище — лише для підхоплення й опускання.")),
                pt(t("<b>Hubmast zurückgeneigt:</b> dann liegt die Last beim Bremsen sicher an.", "<b>Mast tilted back:</b> then the load stays put when braking.", "<b>Maszt odchylony do tyłu:</b> wtedy ładunek przy hamowaniu leży pewnie.", "<b>Щогла нахилена назад:</b> тоді вантаж не зсувається при гальмуванні.")),
                pt(t("<b>Tempo anpassen:</b> an Last, Fahrbahn und Umgebung. Vorausschauend fahren, damit du nicht abrupt bremsen musst.", "<b>Adapt your speed:</b> to the load, floor and surroundings. Drive with foresight so you do not have to brake abruptly.", "<b>Dostosuj prędkość:</b> do ładunku, nawierzchni i otoczenia. Jedź przewidująco, by nie hamować gwałtownie.", "<b>Підлаштуй швидкість:</b> під вантаж, покриття й оточення. Їдь передбачливо, щоб не гальмувати різко.")),
                pt(t("<b>Abrupt bremsen oder anfahren</b> lässt die Last rutschen und kann den Stapler kippen. Schwellen und Kanten langsam überfahren und die Last beobachten.", "<b>Braking or starting abruptly</b> makes the load slide and can tip the forklift. Cross sills and edges slowly and watch the load.", "<b>Gwałtowne hamowanie lub ruszanie</b> sprawia, że ładunek się zsuwa, a wózek może się przewrócić. Progi i krawędzie pokonuj powoli, obserwując ładunek.", "<b>Різке гальмування чи рушання</b> зсуває вантаж і може перекинути навантажувач. Пороги й краї переїжджай повільно, стежачи за вантажем.")),
            ],
            merke: t("Last tief, Mast zurück, sanft bremsen.", "Load low, mast back, brake gently.", "Ładunek nisko, maszt do tyłu, hamuj łagodnie.", "Вантаж низько, щогла назад, гальмуй м’яко."),
            src: { de: `${V68} §12 Abs. 2, 3 und 6; ${I208} Abschn. 6.3.4 und 6.4.1; DGUV G 308-001 (Entwurf 2026), Anhang B Nr. 8` },
        }),
        step("sim", { sim: "pickup", texts: PICK_TEXTS,
            title: t("Aufnehmen, einstellen, losfahren", "Pick up, set, drive off", "Podejmij, ustaw, ruszaj", "Підхопи, налаштуй, рушай"),
            lead: t("Fahr unter die Palette, stell Höhe und Mast ein und bremse auf der Strecke. Probier ruhig auch Fehler aus.", "Drive under the pallet, set the height and mast and brake on the route. Feel free to try mistakes too.", "Wjedź pod paletę, ustaw wysokość i maszt, a potem hamuj na trasie. Śmiało wypróbuj też błędy.", "Заведи вила під палету, налаштуй висоту й щоглу і гальмуй на маршруті. Можна спробувати й помилки."),
            outcomes: {
                ok: { title: t("Sichere Fahrstellung", "Safe travel position", "Bezpieczna pozycja do jazdy", "Безпечне транспортне положення"), text: t("Last am Gabelrücken, 10 bis 30 cm über dem Boden, Mast nach hinten geneigt. Beim Bremsen bleibt alles, wo es ist.", "Load at the fork back, 10 to 30 cm above the floor, mast tilted back. When braking, everything stays in place.", "Ładunek przy grzbiecie wideł, 10–30 cm nad podłogą, maszt odchylony do tyłu. Przy hamowaniu wszystko zostaje na miejscu.", "Вантаж біля спинки вил, 10–30 см над підлогою, щогла нахилена назад. При гальмуванні все лишається на місці.") },
                drop: { title: t("Die Palette fällt von den Gabelspitzen", "The pallet falls off the fork tips", "Paleta spada z końców wideł", "Палета падає з кінців вил"), text: t("Halb unterfahren liegt der Schwerpunkt weit vorn. Beim Bremsen kippt die Last über die Spitzen. Immer bis zum Gabelrücken unterfahren.", "Only halfway under, the centre of gravity is far forward. When braking, the load tips over the tips. Always go in up to the fork back.", "Gdy widły są wsunięte tylko do połowy, środek ciężkości jest daleko z przodu. Przy hamowaniu ładunek przechyla się przez końce wideł. Zawsze wsuwaj widły aż do grzbietu.", "Коли вила заведені лише наполовину, центр ваги далеко попереду. При гальмуванні вантаж перекидається через кінці вил. Завжди заводь вила до спинки.") },
                low: { title: t("Zu tief: Die Palette schlägt an die Schwelle", "Too low: the pallet hits the sill", "Za nisko: paleta uderza w próg", "Занизько: палета б’ється об поріг"), text: t("Unter 10 cm schleift die Last über Unebenheiten oder stößt an Schwellen. Die Last kann verrutschen, der Stapler wird abrupt gestoppt.", "Below 10 cm the load scrapes over unevenness or hits sills. The load can shift and the forklift is stopped abruptly.", "Poniżej 10 cm ładunek szoruje po nierównościach albo uderza w progi. Może się przesunąć, a wózek gwałtownie staje.", "Нижче 10 см вантаж чіпляє нерівності чи пороги. Він може зсунутися, а навантажувач різко зупиняється.") },
                high: { title: t("Zu hoch: Der Stapler nickt nach vorn", "Too high: the forklift pitches forward", "Za wysoko: wózek przechyla się do przodu", "Зависоко: навантажувач нахиляється вперед"), text: t("Mit hoch angehobener Last liegt der Gesamtschwerpunkt höher. Beim Bremsen hebt sich das Heck, die Sicht ist schlechter. Gefahren wird bodenfrei.", "With the load raised high, the combined centre of gravity is higher. When braking the rear lifts and visibility is worse. Drive with the load just clear of the floor.", "Przy wysoko podniesionym ładunku wspólny środek ciężkości jest wyżej. Przy hamowaniu tył się unosi, a widoczność jest gorsza. Jeździsz z ładunkiem tuż nad podłogą.", "З високо піднятим вантажем загальний центр ваги вищий. При гальмуванні задня частина піднімається, огляд гірший. Їздять із вантажем трохи над підлогою.") },
                slide: { title: t("Die Last rutscht nach vorn", "The load slides forwards", "Ładunek zsuwa się do przodu", "Вантаж зсувається вперед"), text: t("Ohne zurückgeneigten Hubmast schiebt die Last beim Bremsen nach vorn. Vor der Fahrt den Mast nach hinten neigen.", "Without the mast tilted back, the load pushes forwards when braking. Tilt the mast back before driving.", "Bez odchylonego masztu ładunek przy hamowaniu przesuwa się do przodu. Przed jazdą odchyl maszt do tyłu.", "Без нахилу щогли назад вантаж при гальмуванні зсувається вперед. Перед їздою нахили щоглу назад.") },
            },
            done: t("Genau so fährst du jede Palette.", "That is exactly how you drive every pallet.", "Dokładnie tak przewozisz każdą paletę.", "Саме так возиш кожну палету."),
            src: { de: `${V68} §12 Abs. 3 und 6; ${I208} Abschn. 6.3.4 und 6.4.1` } }),
        step("question", {
            title: t("Verrutschte Kartons", "Shifted cartons", "Przesunięte kartony", "Зсунуті коробки"),
            text: t("Auf einer Palette sind die oberen Kartons verrutscht und hängen über. Die Palette soll ins Regal auf 3 Meter.", "On a pallet the top cartons have shifted and overhang. The pallet is meant to go into the rack at 3 metres.", "Na palecie górne kartony się przesunęły i wystają. Paleta ma trafić do regału na 3 metry.", "На палеті верхні коробки зсунулися й звисають. Палету треба поставити на стелаж на 3 метри."),
            layout: "list",
            options: [t("Langsam hochheben, dann hält es schon", "Lift slowly, it will hold", "Podnieść powoli, jakoś się utrzyma", "Підняти повільно, якось втримається"), t("Nicht einlagern, erst neu packen und sichern lassen", "Do not store it, have it repacked and secured first", "Nie składować, najpierw zlecić ponowne spakowanie i zabezpieczenie", "Не складувати, спершу переупакувати й закріпити")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das ist zu riskant", "No, that is too risky", "Nie, to zbyt ryzykowne", "Ні, це надто ризиковано") },
            body: t("Lasten, die nicht ordnungsgemäß gepackt sind oder sich verschoben haben, dürfen nicht gestapelt oder auf höher gelegenen Stellen abgesetzt werden.", "Loads that are not packed properly or have shifted must not be stacked or set down at higher places.", "Ładunków źle zapakowanych lub przesuniętych nie wolno piętrować ani odkładać wysoko.", "Погано запаковані чи зсунуті вантажі не можна штабелювати чи ставити високо."),
            src: { de: `${V68} §13 Abs. 3` },
        }),
        step("video", {
            title: t("Palette aufnehmen und abfahren", "Picking up a pallet and driving off", "Podjęcie palety i odjazd", "Підйом палети й від’їзд"),
            brief: t("Stapler fährt gerade an die Palette, Zinken auf Breite, bis zum Gabelrücken einfahren, leicht anheben, Mast zurück, auf 15 cm absenken, losfahren. Seitliche Kamera, Nahaufnahme Gabelrücken.", "Forklift approaches the pallet straight, forks set to width, in up to the fork back, lift slightly, mast back, lower to 15 cm, drive off. Side camera, close-up of the fork back.", "Wózek podjeżdża prosto do palety, widły rozstawione na szerokość palety, wjazd aż do grzbietu wideł, lekkie uniesienie, maszt do tyłu, opuszczenie na 15 cm, odjazd. Kamera z boku, zbliżenie grzbietu wideł.", "Навантажувач під’їжджає прямо, вила розставлені під палету, заїзд до спинки вил, трохи підняти, щоглу назад, опустити до 15 см, рушити. Камера збоку, крупний план спинки вил."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Vorher klären:</b> Gewicht, Tragfähigkeit, Schwerpunkt, Zustand der Last.", "<b>Clarify first:</b> weight, capacity, centre of gravity, condition of the load.", "<b>Najpierw ustal:</b> masę, udźwig, środek ciężkości, stan ładunku.", "<b>Спершу з’ясуй:</b> вагу, вантажопідйомність, центр ваги, стан вантажу.")),
            pt(t("<b>Aufnehmen:</b> bis zum Gabelrücken, gleichmäßig auf beiden Zinken.", "<b>Pick up:</b> up to the fork back, evenly on both forks.", "<b>Podejmij:</b> do grzbietu wideł, równo na obu widłach.", "<b>Підхоплення:</b> до спинки вил, рівно на обох зубцях.")),
            pt(t("<b>Fahren:</b> 10 bis 30 cm Bodenfreiheit, Mast zurück, vorausschauend.", "<b>Drive:</b> 10 to 30 cm clearance, mast back, with foresight.", "<b>Jedź:</b> 10–30 cm nad podłogą, maszt do tyłu, przewidująco.", "<b>Їдь:</b> 10–30 см над підлогою, щогла назад, передбачливо.")),
        ] }),
    ];
}

/* ════════════════ 7.2 Absetzen, Stapeln, Regale ════════════════ */
export function lesson72(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Wo die Last hin darf", "Where the load may go", "Gdzie wolno odłożyć ładunek", "Куди можна ставити вантаж"),
            lead: t("Abgesetzt wird nur auf Flächen, die dafür vorgesehen sind.", "Loads are set down only on areas intended for it.", "Ładunek odkładasz tylko na miejscach do tego przeznaczonych.", "Вантаж ставлять лише на призначені для цього місця."),
            points: [
                pt(t("<b>Tragfähige Unterlage:</b> ausreichend tragfähig und standsicher. Beachte die zulässige Bodenbelastung.", "<b>Load-bearing base:</b> strong and stable enough. Observe the permitted floor load.", "<b>Nośne podłoże:</b> wystarczająco wytrzymałe i stabilne. Pilnuj dopuszczalnego obciążenia podłogi.", "<b>Міцна основа:</b> достатньо міцна й стійка. Зважай на допустиме навантаження підлоги.")),
                pt(t("<b>Nichts zustellen:</b> nicht in Verkehrs- und Fluchtwegen, nicht vor Feuerlöschern, Notausgängen und elektrischen Verteilern.", "<b>Block nothing:</b> not in traffic or escape routes, not in front of fire extinguishers, emergency exits or electrical distribution boards.", "<b>Niczego nie zastawiaj:</b> nie na drogach komunikacyjnych i ewakuacyjnych, nie przed gaśnicami, wyjściami ewakuacyjnymi i rozdzielnicami elektrycznymi.", "<b>Нічого не загороджуй:</b> не на проїздах і шляхах евакуації, не перед вогнегасниками, аварійними виходами й електрощитами.")),
                pt(t("<b>Stapelordnung:</b> Die zulässige Stapelhöhe deines Betriebs überschreitest du nie. Stapel so bauen und abtragen, dass nichts auf Menschen fallen kann.", "<b>Stacking rules:</b> never exceed your company’s permitted stacking height. Build and dismantle stacks so nothing can fall on people.", "<b>Zasady piętrowania:</b> nigdy nie przekraczasz dopuszczalnej wysokości stosu w zakładzie. Stosy buduj i rozbieraj tak, by nic nie spadło na ludzi.", "<b>Правила штабелювання:</b> ніколи не перевищуй допустиму висоту штабеля на твоєму підприємстві. Будуй і розбирай штабелі так, щоб нічого не впало на людей.")),
                pt(t("<b>Anheben erst direkt davor:</b> bei stehendem, gebremstem Stapler und senkrechtem Mast. Nach dem Ausstapeln sofort in Fahrstellung absenken.", "<b>Lift only right before:</b> with the forklift stationary, braked and the mast vertical. After removing from the stack, lower to the travel position at once.", "<b>Podnoś dopiero tuż przed:</b> gdy wózek stoi, jest zahamowany, a maszt pionowo. Po zdjęciu ze stosu od razu opuść ładunek do pozycji do jazdy.", "<b>Піднімай лише безпосередньо перед цим:</b> коли навантажувач стоїть, загальмований, щогла вертикально. Після зняття одразу опусти вантаж у транспортне положення.")),
            ],
            merke: t("Solange die Last oben ist, bleibst du auf dem Stapler, und niemand steht darunter.", "As long as the load is up, you stay on the forklift and nobody stands underneath.", "Dopóki ładunek jest w górze, zostajesz na wózku i nikt pod nim nie stoi.", "Доки вантаж угорі, ти лишаєшся на навантажувачі, і ніхто під ним не стоїть."),
            src: { de: `${V68} §13 Abs. 2 und 5; ${I208} Abschn. 6.3.5` },
        }),
        step("sim", { sim: "sequence", texts: SEQ_TEXTS,
            title: t("Palette ins Regal stellen", "Putting a pallet into the rack", "Wstawianie palety do regału", "Встановлення палети в стелаж"),
            lead: t("Bring die Schritte in die richtige Reihenfolge.", "Put the steps in the right order.", "Ułóż kroki we właściwej kolejności.", "Розстав кроки в правильному порядку."),
            items: [
                { t: t("Gerade vor dem Regal anhalten und bremsen", "Stop straight in front of the rack and brake", "Zatrzymać się prosto przed regałem i zahamować", "Зупинитися рівно перед стелажем і загальмувати") },
                { t: t("Hubmast senkrecht stellen", "Set the mast vertical", "Ustawić maszt pionowo", "Поставити щоглу вертикально") },
                { t: t("Last auf Einstapelhöhe anheben", "Lift the load to stacking height", "Podnieść ładunek na wysokość poziomu regału", "Підняти вантаж на висоту ярусу") },
                { t: t("Langsam ins Regalfach einfahren", "Drive slowly into the rack compartment", "Powoli wjechać w gniazdo regału", "Повільно заїхати в комірку стелажа") },
                { t: t("Last absetzen, Gabeln leicht absenken", "Set the load down, lower the forks slightly", "Odłożyć ładunek, lekko opuścić widły", "Поставити вантаж, трохи опустити вила") },
                { t: t("Umschauen und gerade herausfahren", "Look around and reverse out straight", "Rozejrzeć się i prosto wyjechać", "Озирнутися й рівно виїхати") },
                { t: t("Gabeln in Fahrstellung absenken", "Lower the forks to travel position", "Opuścić widły do pozycji do jazdy", "Опустити вила в транспортне положення") },
            ],
            shuffle: [4, 1, 6, 0, 3, 5, 2],
            allRight: t("Genau so. Gehoben wird erst im Stand, gefahren wieder unten.", "Exactly. Lift only when stationary, drive low again.", "Dokładnie tak. Podnosisz dopiero na postoju, a jedziesz znów z ładunkiem nisko.", "Саме так. Піднімаєш лише, коли стоїш, а їдеш знову з вантажем унизу."),
            someWrong: t("Fast. Erst anhalten und Mast senkrecht, dann anheben. Nach dem Absetzen sofort wieder runter.", "Almost. First stop and set the mast vertical, then lift. After setting down, lower at once.", "Prawie. Najpierw zatrzymaj się i ustaw maszt pionowo, potem podnoś. Po odłożeniu od razu opuść widły.", "Майже. Спершу зупинись і постав щоглу вертикально, потім піднімай. Після опускання вантажу одразу опусти вила."),
            src: { de: `${I208} Abschn. 6.3.5` } }),
        step("learn", {
            title: t("Fachlast und Feldlast", "Shelf load and bay load", "Obciążenie poziomu i pola", "Навантаження ярусу й секції"),
            lead: t("Am Regal hängt ein Belastungsschild. Es sagt dir, wie viel das Regal tragen darf.", "A load sign hangs on the rack. It tells you how much the rack may carry.", "Na regale wisi tabliczka obciążenia. Mówi, ile regał może unieść.", "На стелажі висить табличка навантаження. Вона каже, скільки може витримати стелаж."),
            points: [
                pt(t("<b>Fachlast:</b> das Höchstgewicht für eine Ebene, also für alle Paletten zusammen, die auf einem Trägerpaar stehen.", "<b>Shelf load:</b> the maximum weight for one level, i.e. for all pallets together standing on one pair of beams.", "<b>Obciążenie poziomu:</b> największa dopuszczalna masa na jeden poziom, czyli dla wszystkich palet razem stojących na jednej parze belek.", "<b>Навантаження ярусу:</b> максимальна маса на один ярус, тобто для всіх палет разом на одній парі балок.")),
                pt(t("<b>Feldlast:</b> das Höchstgewicht für alle Ebenen eines Regalfeldes zwischen zwei Rahmen. Sie ist oft kleiner als alle Fachlasten zusammen.", "<b>Bay load:</b> the maximum weight for all levels of a rack bay between two frames. It is often lower than all shelf loads together.", "<b>Obciążenie pola:</b> największa dopuszczalna masa dla wszystkich poziomów jednego pola między dwiema ramami. Często jest mniejsza niż suma obciążeń poziomów.", "<b>Навантаження секції:</b> максимальна маса для всіх ярусів секції між двома рамами. Часто менша за суму навантажень ярусів.")),
                pt(t("<b>Beides gilt gleichzeitig.</b> Keine Angabe am Regal? Dann nicht einlagern und nachfragen.", "<b>Both apply at the same time.</b> No information on the rack? Then do not store and ask.", "<b>Obie wartości obowiązują jednocześnie.</b> Na regale nie ma danych? Wtedy nie składuj i zapytaj.", "<b>Обидва значення діють одночасно.</b> Немає даних на стелажі? Тоді не складуй і запитай.")),
                pt(t("<b>Anfahrschäden melden:</b> Ein verbogener Ständer oder Träger kann die Tragfähigkeit stark verringern.", "<b>Report impact damage:</b> a bent upright or beam can greatly reduce the load capacity.", "<b>Zgłaszaj uszkodzenia po uderzeniach:</b> wygięty słupek ramy albo belka mogą mocno zmniejszyć nośność.", "<b>Повідомляй про пошкодження від ударів:</b> погнута стійка чи балка може сильно зменшити несучу здатність.")),
            ],
            merke: t("Fachlast pro Ebene, Feldlast pro Feld. Beides einhalten.", "Shelf load per level, bay load per bay. Respect both.", "Obciążenie poziomu dotyczy jednego poziomu, obciążenie pola całego pola. Przestrzegaj obu.", "Навантаження на ярус і на секцію. Дотримуйся обох."),
            src: { de: `${V68} DA zu §13 Abs. 2 mit BGR 234 „Lagereinrichtungen und -geräte“ (heute DGUV Regel 108-007)` },
        }),
        step("sim", { sim: "rack", texts: RACK_TEXTS,
            title: t("Wohin mit 800 kg?", "Where to put 800 kg?", "Gdzie odłożyć 800 kg?", "Куди поставити 800 кг?"),
            lead: t("Lies das Belastungsschild am Regal und wähle einen freien Platz für die Palette.", "Read the load sign on the rack and choose a free place for the pallet.", "Odczytaj tabliczkę obciążenia na regale i wybierz wolne miejsce na paletę.", "Прочитай табличку навантаження й обери вільне місце для палети."),
            fach: 1000, feld: 2400, carry: 800,
            slots: [
                { id: "l1a", level: 1, side: -1, kg: 600 },
                { id: "l1b", level: 1, side: 1, label: t("Ebene 1, neben 600 kg", "Level 1, next to 600 kg", "Poziom 1, obok 600 kg", "Ярус 1, поруч із 600 кг") },
                { id: "l2a", level: 2, side: -1, label: t("Ebene 2, links", "Level 2, left", "Poziom 2, z lewej", "Ярус 2, ліворуч") },
                { id: "l2b", level: 2, side: 1, label: t("Ebene 2, rechts", "Level 2, right", "Poziom 2, z prawej", "Ярус 2, праворуч") },
                { id: "l3a", level: 3, side: -1, kg: 300 },
                { id: "l3b", level: 3, side: 1, label: t("Ebene 3, neben 300 kg", "Level 3, next to 300 kg", "Poziom 3, obok 300 kg", "Ярус 3, поруч із 300 кг") },
            ],
            src: { de: `BGR 234 / DGUV Regel 108-007; ${V68} §13 Abs. 2` } }),
        step("question", {
            title: t("Nur kurz weg", "Away just briefly", "Tylko na chwilę", "Лише на хвилинку"),
            text: t("Die Palette steht auf 4 Metern, du suchst noch das richtige Fach. Dein Telefon klingelt im Spind nebenan.", "The pallet is at 4 metres and you are still looking for the right compartment. Your phone rings in the locker next door.", "Paleta jest na 4 metrach, a ty szukasz jeszcze właściwego gniazda. W szafce obok dzwoni twój telefon.", "Палета на 4 метрах, ти ще шукаєш потрібну комірку. Поруч у шафці дзвонить телефон."),
            layout: "list",
            options: [t("Kurz absteigen, die Last bleibt ja oben stehen", "Get off briefly, the load stays up anyway", "Zejść na chwilę, ładunek przecież stoi w górze", "Ненадовго зійти, вантаж і так стоїть угорі"), t("Erst absetzen oder absenken, dann absteigen", "Set it down or lower it first, then get off", "Najpierw odłożyć albo opuścić ładunek, potem wysiąść", "Спершу поставити або опустити вантаж, потім зійти")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, nicht mit Last oben", "No, not with the load up", "Nie, nie z ładunkiem w górze", "Ні, не з вантажем угорі") },
            body: t("Solange die Last hochgefahren ist, darfst du den Stapler nicht verlassen. Rutscht sie ab oder sinkt die Hydraulik, kann niemand eingreifen.", "As long as the load is raised, you must not leave the forklift. If it slips or the hydraulics sink, nobody can intervene.", "Dopóki ładunek jest podniesiony, nie wolno ci opuścić wózka. Gdy się zsunie albo hydraulika opadnie, nikt nie będzie mógł zareagować.", "Доки вантаж піднятий, залишати навантажувач не можна. Якщо він зісковзне чи гідравліка опуститься, ніхто не втрутиться."),
            src: { de: `${I208} Abschn. 6.3.5` },
        }),
        step("video", {
            title: t("Einstapeln und Ausstapeln", "Putting into and taking out of the rack", "Wstawianie i zdejmowanie z regału", "Встановлення й зняття зі стелажа"),
            brief: t("Stapler hält vor dem Regal, Mast senkrecht, hebt, fährt ein, setzt ab, fährt heraus und senkt ab. Danach Ausstapeln in umgekehrter Reihenfolge. Nahaufnahme Belastungsschild.", "Forklift stops in front of the rack, mast vertical, lifts, drives in, sets down, reverses out and lowers. Then removal in reverse order. Close-up of the load sign.", "Wózek staje przed regałem, maszt pionowo, podnosi, wjeżdża, odkłada, wyjeżdża i opuszcza widły. Potem zdejmowanie w odwrotnej kolejności. Zbliżenie tabliczki obciążenia.", "Навантажувач зупиняється перед стелажем, щогла вертикально, піднімає, заїжджає, ставить, виїжджає, опускає вила. Потім зняття у зворотному порядку. Крупний план таблички навантаження."),
            length: t("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Absetzen</b> nur auf vorgesehenen, tragfähigen Flächen, Wege und Notausgänge frei.", "<b>Set down</b> only on designated, load-bearing areas, routes and exits clear.", "<b>Odkładaj</b> tylko na wyznaczonych, nośnych miejscach; drogi i wyjścia ewakuacyjne zostają wolne.", "<b>Ставити вантаж</b> лише на призначених міцних місцях; проходи й виходи вільні.")),
            pt(t("<b>Einstapeln:</b> anhalten, Mast senkrecht, heben, einfahren, absetzen, herausfahren, absenken.", "<b>Stacking:</b> stop, mast vertical, lift, drive in, set down, reverse out, lower.", "<b>Wstawianie:</b> zatrzymaj się, maszt pionowo, podnieś, wjedź, odłóż, wyjedź, opuść.", "<b>Встановлення:</b> зупинись, щогла вертикально, підніми, заїдь, постав, виїдь, опусти.")),
            pt(t("<b>Regal:</b> Fachlast pro Ebene und Feldlast pro Feld einhalten.", "<b>Rack:</b> respect shelf load per level and bay load per bay.", "<b>Regał:</b> przestrzegaj obciążenia poziomu i pola.", "<b>Стелаж:</b> дотримуйся навантаження ярусу й секції.")),
        ] }),
    ];
}

/* ════════════════ 7.3 Sicht, Fahrzeuge, besondere Lasten ════════════════ */
export function lesson73(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Wenn die Last die Sicht nimmt", "When the load blocks your view", "Gdy ładunek zasłania widok", "Коли вантаж закриває огляд"),
            lead: t("Du fährst nur, wenn du die Fahrbahn siehst oder eingewiesen wirst.", "You only drive if you can see the route or a banksman guides you.", "Jedziesz tylko wtedy, gdy widzisz drogę albo kieruje tobą sygnalista.", "Їдеш лише тоді, коли бачиш дорогу або тебе скеровує сигнальник."),
            points: [
                pt(t("<b>Über die Last hinweg:</b> Die Last darf nur so hoch sein, dass du die Fahrbahn überblickst und rechtzeitig halten kannst.", "<b>Over the load:</b> the load may only be so high that you can see the route and stop in time.", "<b>Ponad ładunkiem:</b> ładunek może być tylko tak wysoki, byś widział drogę i zdążył się zatrzymać.", "<b>Понад вантажем:</b> вантаж може бути лише такий високий, щоб ти бачив дорогу й міг вчасно зупинитися.")),
                pt(t("<b>Große Last:</b> rückwärts fahren, möglichst mit Einweiser. Ragt die Last seitlich über, nicht rückwärts fahren.", "<b>Large load:</b> drive backwards, ideally with a banksman. If the load sticks out sideways, do not drive backwards.", "<b>Duży ładunek:</b> jedź tyłem, najlepiej z sygnalistą. Gdy ładunek wystaje na boki, nie jedź tyłem.", "<b>Великий вантаж:</b> їдь заднім ходом, бажано із сигнальником. Якщо вантаж виступає вбік, заднім ходом не їдь.")),
                pt(t("<b>Hilfsmittel:</b> Spiegel, Kamera und Monitor oder ein erhöhter oder drehbarer Sitz, wenn der Hersteller sie vorsieht.", "<b>Aids:</b> mirrors, camera and monitor, or a raised or swivelling seat if the manufacturer provides for them.", "<b>Pomoce:</b> lusterka, kamera z monitorem albo podwyższony lub obrotowy fotel, jeśli przewiduje je producent.", "<b>Допоміжні засоби:</b> дзеркала, камера з монітором або підняте чи поворотне сидіння, якщо їх передбачає виробник.")),
                pt(t("<b>Ständig ohne Sicht?</b> Dann ist ein anderes Gerät nötig, zum Beispiel ein Quersitzstapler. Häufiges Rückwärtsfahren belastet die Wirbelsäule.", "<b>Constantly without a view?</b> Then a different truck is needed, for example a sideways-seated truck. Frequent reversing strains the spine.", "<b>Ciągle bez widoczności?</b> Potrzebny jest inny wózek, np. z siedziskiem ustawionym bokiem do kierunku jazdy. Częsta jazda tyłem obciąża kręgosłup.", "<b>Постійно без огляду?</b> Потрібна інша техніка, наприклад навантажувач із боковим сидінням. Часта їзда задом навантажує хребет.")),
            ],
            src: { de: `${V68} §12 Abs. 1 mit DA; ${I208} Abschn. 6.4.1` },
        }),
        step("learn", {
            title: t("Lkw be- und entladen", "Loading and unloading lorries", "Załadunek i rozładunek ciężarówek", "Навантаження й розвантаження вантажівок"),
            lead: t("Bevor du auf die Ladefläche fährst, prüfst du drei Dinge.", "Before you drive onto the loading area, you check three things.", "Zanim wjedziesz na skrzynię ładunkową, sprawdzasz trzy rzeczy.", "Перш ніж заїхати в кузов, перевіряєш три речі."),
            points: [
                pt(t("<b>Gegen Wegrollen gesichert:</b> Feststellbremse angezogen und Unterlegkeile vor den nicht gelenkten Rädern. Abgestellte Wechselbrücken und Auflieger zusätzlich gegen Kippen.", "<b>Secured against rolling:</b> parking brake applied and wheel chocks in front of the non-steered wheels. Parked swap bodies and semi-trailers also against tipping.", "<b>Zabezpieczenie przed odtoczeniem:</b> hamulec postojowy zaciągnięty i kliny pod kołami nieskrętnymi. Odstawione nadwozia wymienne i naczepy dodatkowo przed przewróceniem.", "<b>Захист від скочування:</b> стоянкове гальмо й противідкотні упори під некерованими колесами. Відчеплені кузови й напівпричепи ще й від перекидання.")),
                pt(t("<b>Überladebrücke:</b> breit genug, tragfähig, rutschhemmend und gegen Verschieben gesichert. Die Ladefläche muss Stapler und Ladung tragen.", "<b>Dock plate:</b> wide enough, load-bearing, slip-resistant and secured against shifting. The loading area must carry forklift and load.", "<b>Pomost przeładunkowy:</b> wystarczająco szeroki, nośny, antypoślizgowy i zabezpieczony przed przesunięciem. Skrzynia musi utrzymać wózek i ładunek.", "<b>Перехідний місток:</b> достатньо широкий, міцний, протиковзкий і закріплений. Кузов має витримати навантажувач і вантаж.")),
                pt(t("<b>Absprechen:</b> Du und der Lkw-Fahrer klärt den Ablauf vorher. Niemand steht im Fahrbereich auf der Ladefläche.", "<b>Agree on it:</b> you and the lorry driver agree on the procedure beforehand. Nobody stands in the driving area on the loading surface.", "<b>Uzgodnij:</b> ty i kierowca ciężarówki ustalacie wcześniej przebieg pracy. Nikt nie stoi na skrzyni ładunkowej w strefie jazdy wózka.", "<b>Домовся:</b> ти й водій вантажівки заздалегідь узгоджуєте порядок. Ніхто не стоїть у кузові на шляху навантажувача.")),
            ],
            merke: t("Keil, Brücke, Absprache. Dann erst rauf.", "Chock, plate, agreement. Only then drive on.", "Klin, pomost, uzgodnienie. Dopiero wtedy wjeżdżasz.", "Упор, місток, домовленість. Лише тоді заїжджай."),
            src: { de: `${V68} §17 mit DA; ${I208} Abschn. 8.4` },
        }),
        step("sim", { sim: "people", scene: "loading", texts: DOCK_TEXTS,
            title: t("Darfst du auf den Auflieger?", "Are you allowed to drive onto the trailer?", "Czy możesz wjechać na naczepę?", "Чи можна заїхати на напівпричіп?"),
            lead: t("Finde die drei Gefahren an der Rampe. Drehe die Szene mit dem Finger.", "Find the three hazards at the dock. Rotate the scene with your finger.", "Znajdź trzy zagrożenia przy rampie. Obracaj scenę palcem.", "Знайди три небезпеки біля рампи. Обертай сцену пальцем."),
            zones: [
                { id: "chock", bad: true, label: t("Unterlegkeil fehlt", "Wheel chock missing", "Brak klina pod kołem", "Немає противідкотного упору"), why: t("Der Keil liegt neben dem Auflieger statt vor dem Rad. Beim Befahren kann der Auflieger von der Rampe wegrollen und du stürzt in die Lücke.", "The chock lies next to the trailer instead of in front of the wheel. When driving on, the trailer can roll away from the dock and you fall into the gap.", "Klin leży obok naczepy zamiast pod kołem. Przy wjeździe naczepa może odtoczyć się od rampy, a ty wpadniesz w szczelinę.", "Упор лежить біля напівпричепа, а не під колесом. Під час заїзду напівпричіп може відкотитися, і ти впадеш у щілину.") },
                { id: "driver", bad: true, label: t("Person auf der Ladefläche", "Person on the loading area", "Osoba na skrzyni ładunkowej", "Людина в кузові"), why: t("Der Lkw-Fahrer steht telefonierend im Fahrweg. Erst absprechen, dann fährt nur einer: entweder er ist draußen oder du wartest.", "The lorry driver is standing in the route on the phone. Agree first, then only one moves: either the driver gets out or you wait.", "Kierowca ciężarówki stoi na drodze wózka i rozmawia przez telefon. Najpierw uzgodnienie, potem rusza tylko jeden: on wychodzi albo ty czekasz.", "Водій вантажівки стоїть на шляху й розмовляє телефоном. Спершу домовитися: або він виходить, або ти чекаєш.") },
                { id: "pallet", bad: true, label: t("Beschädigte Palette", "Damaged pallet", "Uszkodzona paleta", "Пошкоджена палета"), why: t("Gebrochenes Brett, schief stehende Kartons. So nicht aufnehmen und nicht stapeln: melden und umpacken lassen.", "Broken board, cartons leaning. Do not pick it up or stack it like this: report it and have it repacked.", "Złamana deska, przechylone kartony. Tak nie podejmujesz i nie piętrujesz: zgłoś i zleć przepakowanie.", "Зламана дошка, перекошені коробки. Так не береш і не штабелюєш: повідом і доручи переупакувати.") },
                { id: "bridge", label: t("Überladebrücke", "Dock plate", "Pomost przeładunkowy", "Перехідний місток"), why: t("Breit, aufgelegt und mit Warnmarkierung. So soll es sein.", "Wide, in place and with warning markings. That is how it should be.", "Szeroki, prawidłowo położony i z oznakowaniem ostrzegawczym. Tak ma być.", "Широкий, покладений і з попереджувальним маркуванням. Так і має бути.") },
                { id: "truck", label: t("Stapler wartet", "Forklift waiting", "Wózek czeka", "Навантажувач чекає"), why: t("Last tief, Mast zurück, Abstand zur Rampe. Der Fahrer wartet, bis alles geklärt ist.", "Load low, mast back, distance to the dock. The driver waits until everything is clear.", "Ładunek nisko, maszt do tyłu, odstęp od rampy. Operator czeka, aż wszystko będzie jasne.", "Вантаж низько, щогла назад, відстань до рампи. Водій чекає, доки все з’ясується.") },
            ],
            done: t("Alle drei Gefahren erkannt. Erst wenn sie beseitigt sind, fährst du auf.", "All three hazards spotted. Only once they are removed do you drive on.", "Rozpoznałeś wszystkie trzy zagrożenia. Wjeżdżasz dopiero po ich usunięciu.", "Усі три небезпеки виявлено. Заїжджаєш лише після їх усунення."),
            src: { de: `${V68} §13 Abs. 3, §17; ${I208} Abschn. 8.4` } }),
        step("learn", {
            title: t("Hängende Lasten und Gefahrstoffe", "Suspended loads and hazardous substances", "Ładunki podwieszone i substancje niebezpieczne", "Підвішені вантажі й небезпечні речовини"),
            lead: t("Manche Lasten verhalten sich anders als eine Palette.", "Some loads behave differently from a pallet.", "Niektóre ładunki zachowują się inaczej niż paleta.", "Деякі вантажі поводяться інакше, ніж палета."),
            points: [
                pt(t("<b>Hängend nur, wenn erlaubt:</b> wenn der Hersteller es vorsieht oder ein Gutachten die Standsicherheit nachweist. Das Anschlagmittel darf sich nicht verschieben oder lösen.", "<b>Suspended only if permitted:</b> if the manufacturer provides for it or an expert report proves stability. The lifting gear must not shift or come loose.", "<b>Ładunki podwieszone tylko wtedy, gdy jest to dozwolone:</b> gdy przewiduje to producent albo ekspertyza potwierdza stateczność. Zawiesie nie może się przesunąć ani poluzować.", "<b>Підвішені вантажі лише тоді, коли це дозволено:</b> якщо це передбачає виробник або експертиза підтверджує стійкість. Стропи не повинні зсуватися чи послаблюватися.")),
                pt(t("<b>Pendeln:</b> Hängende Lasten und Big Bags schwingen beim Bremsen und in Kurven. Langsam fahren. Wer die Last führt, geht außerhalb der Fahrspur und nie vor der Last, mit Hilfsmitteln wie Führungsseilen.", "<b>Swinging:</b> suspended loads and big bags swing when braking and cornering. Drive slowly. Anyone guiding the load walks outside the track and never in front of the load, using aids such as tag lines.", "<b>Kołysanie:</b> ładunki podwieszone i big bagi kołyszą się przy hamowaniu i na łukach. Jedź powoli. Kto prowadzi ładunek, idzie poza torem jazdy i nigdy przed ładunkiem, używając pomocy, np. lin prowadzących.", "<b>Розгойдування:</b> підвішені вантажі й біг-беги розгойдуються при гальмуванні й у поворотах. Їдь повільно. Хто веде вантаж, іде поза колією і ніколи перед вантажем, використовуючи допоміжні засоби, наприклад напрямні канати.")),
                pt(t("<b>Nicht palettierte Lasten:</b> mit dem passenden Lastaufnahmemittel, zum Beispiel Klammer oder Dorn, so wie es die Betriebsanweisung festlegt.", "<b>Non-palletised loads:</b> with the suitable load handling device, for example a clamp or spike, as the operating instructions specify.", "<b>Ładunki bez palet:</b> odpowiednim osprzętem, np. chwytakiem lub trzpieniem, zgodnie z instrukcją stanowiskową.", "<b>Вантажі без палет:</b> відповідним вантажозахоплювачем, наприклад захватом чи штирем, як визначає робоча інструкція.")),
                pt(t("<b>Gefahrstoffe:</b> nur nach Betriebsanweisung, Gebinde geschlossen und gegen Herabfallen gesichert. Tritt etwas aus: anhalten, Bereich sichern, melden.", "<b>Hazardous substances:</b> only according to the operating instructions, containers closed and secured against falling. If anything leaks: stop, secure the area, report.", "<b>Substancje niebezpieczne:</b> tylko według instrukcji stanowiskowej, opakowania zamknięte i zabezpieczone przed spadnięciem. Gdy coś wycieka: zatrzymaj się, zabezpiecz miejsce, zgłoś.", "<b>Небезпечні речовини:</b> лише за робочою інструкцією, тара закрита й захищена від падіння. Якщо щось витікає: зупинись, огороди місце, повідом.")),
            ],
            src: { de: `${V68} §11 Abs. 2, §27; GefStoffV §14; DGUV G 308-001 (Entwurf 2026), Anhang B Nr. 8` },
        }),
        step("question", {
            title: t("Der Big Bag schwingt", "The big bag is swinging", "Big bag się kołysze", "Біг-бег розгойдується"),
            text: t("Du fährst einen Big Bag am Lasthaken. Ein Kollege will ihn ruhig halten und geht dafür direkt vor der Last her.", "You are moving a big bag on the load hook. A colleague wants to steady it and walks directly in front of the load.", "Wieziesz big bag na haku. Kolega chce go przytrzymać i idzie tuż przed ładunkiem.", "Ти везеш біг-бег на гаку. Колега хоче його втримати й іде просто перед вантажем."),
            layout: "list",
            options: [t("Weiterfahren, er hält die Last ja ruhig", "Keep driving, he is steadying the load", "Jechać dalej, przecież uspokaja ładunek", "Їхати далі, він же тримає вантаж"), t("Anhalten. Er führt die Last von der Seite, außerhalb der Fahrspur, mit Führungsseil", "Stop. The colleague guides the load from the side, outside the track, with a tag line", "Zatrzymać się. Kolega prowadzi ładunek z boku, poza torem jazdy, liną prowadzącą", "Зупинитися. Колега веде вантаж збоку, поза колією, напрямним канатом")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, vor der Last ist der gefährlichste Platz", "No, in front of the load is the most dangerous place", "Nie, przed ładunkiem jest najgroźniejsze miejsce", "Ні, перед вантажем — найнебезпечніше місце") },
            quote: t("„Versicherte, die hängende Lasten während der Fahrbewegung führen, dürfen sich nicht innerhalb der Fahrspur des Flurförderzeuges und – in Fahrtrichtung gesehen – nicht vor der Last aufhalten.“", "“Insured persons guiding suspended loads during travel must not be within the track of the industrial truck nor – seen in the direction of travel – in front of the load.”", "„Ubezpieczeni prowadzący ładunki podwieszone podczas jazdy nie mogą przebywać w torze jazdy wózka ani – patrząc w kierunku jazdy – przed ładunkiem.”", "«Застраховані, що ведуть підвішені вантажі під час руху, не повинні перебувати в колії навантажувача і – у напрямку руху – перед вантажем.»"),
            body: t("Beim Bremsen schwingt die Last nach vorn. Du achtest als Fahrer darauf, wo die Person geht, und beobachtest sie.", "When braking, the load swings forwards. As the driver, you pay attention to where the person walks and keep watching them.", "Przy hamowaniu ładunek wychyla się do przodu. Jako operator pilnujesz, gdzie idzie ta osoba, i ją obserwujesz.", "При гальмуванні вантаж розгойдується вперед. Як водій, ти стежиш, де йде людина, і спостерігаєш за нею."),
            src: { de: `${V68} §27 Abs. 3 und 5` },
        }),
        step("video", {
            title: t("Lkw an der Rampe entladen", "Unloading a lorry at the dock", "Rozładunek ciężarówki przy rampie", "Розвантаження вантажівки біля рампи"),
            brief: t("Kurze Absprache mit dem Lkw-Fahrer, Blick auf Keil und Feststellbremse, Überladebrücke wird aufgelegt, Stapler fährt langsam auf und holt die erste Palette. Kamera von der Rampe und aus dem Auflieger.", "Short talk with the lorry driver, look at chock and parking brake, dock plate is laid, forklift drives on slowly and fetches the first pallet. Camera from the dock and from inside the trailer.", "Krótkie uzgodnienie z kierowcą, sprawdzenie klina i hamulca postojowego, pomost zostaje położony, wózek powoli wjeżdża i zabiera pierwszą paletę. Kamera z rampy i z wnętrza naczepy.", "Коротка домовленість із водієм, перевірка упору й стоянкового гальма, кладуть місток, навантажувач повільно заїжджає й забирає першу палету. Камера з рампи й з напівпричепа."),
            length: t("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Keine Sicht:</b> rückwärts oder mit Einweiser, seitlich überstehend nicht rückwärts.", "<b>No view:</b> reverse or use a banksman; do not reverse if the load sticks out sideways.", "<b>Brak widoczności:</b> jedź tyłem albo z sygnalistą; z ładunkiem wystającym na boki nie jedź tyłem.", "<b>Немає огляду:</b> їдь заднім ходом або із сигнальником; з вантажем, що виступає вбік, заднім ходом не їдь.")),
            pt(t("<b>Lkw:</b> Keil und Bremse, sichere Überladebrücke, Absprache.", "<b>Lorry:</b> chock and brake, safe dock plate, agreement.", "<b>Ciężarówka:</b> klin i hamulec, bezpieczny pomost przeładunkowy, uzgodnienie.", "<b>Вантажівка:</b> упор і гальмо, безпечний місток, домовленість.")),
            pt(t("<b>Hängend:</b> nur wenn erlaubt, langsam, niemand vor der Last.", "<b>Suspended:</b> only if permitted, slowly, nobody in front of the load.", "<b>Ładunki podwieszone:</b> tylko gdy jest to dozwolone, powoli, nikt przed ładunkiem.", "<b>Підвішені вантажі:</b> лише якщо це дозволено, повільно, ніхто перед вантажем.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson7Check(step: Mk): Step[] {
    return [
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Wie weit fährst du die Gabeln unter die Last?", "How far do you drive the forks under the load?", "Jak daleko wsuwasz widły pod ładunek?", "Наскільки глибоко заводиш вила під вантаж?"),
                    options: [t("Bis die Last am Gabelrücken anliegt", "Until the load touches the fork back", "Aż ładunek oprze się o grzbiet wideł", "Доки вантаж не впреться в спинку вил"), t("Bis zur Mitte, das reicht", "To the middle, that is enough", "Do połowy, wystarczy", "До середини, цього досить")], correct: 0,
                    why: t("DGUV Information 208-004, Abschnitt 6.3.2.", "DGUV Information 208-004, section 6.3.2.", "DGUV Information 208-004, rozdz. 6.3.2.", "DGUV Information 208-004, розд. 6.3.2.") },
                { q: t("Wie hoch fährst du mit der Last?", "How high do you drive with the load?", "Na jakiej wysokości wieziesz ładunek?", "На якій висоті везеш вантаж?"),
                    options: [t("Auf Augenhöhe, dann siehst du sie", "At eye level so you can see it", "Na wysokości oczu, żeby go widzieć", "На рівні очей, щоб бачити"), t("Bodenfrei, etwa 10 bis 30 cm", "Just clear of the floor, about 10 to 30 cm", "Tuż nad podłogą, ok. 10–30 cm", "Трохи над підлогою, приблизно 10–30 см")], correct: 1,
                    why: t("DGUV Vorschrift 68 §12 Abs. 3; DGUV Information 208-004, Abschnitt 6.4.1.", "DGUV Regulation 68 §12 para. 3; DGUV Information 208-004, section 6.4.1.", "DGUV Vorschrift 68 §12 ust. 3; DGUV Information 208-004, rozdz. 6.4.1.", "DGUV Vorschrift 68 §12 абз. 3; DGUV Information 208-004, розд. 6.4.1.") },
                { q: t("Wann darf der Hubmast nach vorn geneigt werden?", "When is the mast allowed to be tilted forwards?", "Kiedy wolno pochylić maszt do przodu?", "Коли можна нахиляти щоглу вперед?"),
                    options: [t("Nur zum Aufnehmen und Absetzen der Last", "Only to pick up and set down the load", "Tylko przy podejmowaniu i odkładaniu ładunku", "Лише для підйому й опускання вантажу"), t("Bei jeder Fahrt bergab", "On every downhill drive", "Przy każdym zjeździe w dół", "При кожному спуску")], correct: 0,
                    why: t("DGUV Vorschrift 68 §13 Abs. 1.", "DGUV Regulation 68 §13 para. 1.", "DGUV Vorschrift 68 §13 ust. 1.", "DGUV Vorschrift 68 §13 абз. 1.") },
                { q: t("Was gibt die Fachlast an?", "What does the shelf load state?", "Co określa obciążenie poziomu?", "Що вказує навантаження ярусу?"),
                    options: [t("Das Höchstgewicht für eine ganze Regalebene", "The maximum weight for an entire rack level", "Największą dopuszczalną masę dla całego poziomu regału", "Максимальну масу для всього ярусу"), t("Das Höchstgewicht für eine einzelne Palette", "The maximum weight for a single pallet", "Największą masę jednej palety", "Максимальну масу однієї палети")], correct: 0,
                    why: t("DGUV Information 208-061 (früher DGUV Regel 108-007).", "DGUV Information 208-061 (formerly DGUV Rule 108-007).", "DGUV Information 208-061 (dawniej DGUV Regel 108-007).", "DGUV Information 208-061 (раніше DGUV Regel 108-007).") },
                { q: t("Was prüfst du, bevor du einen Lkw befährst?", "What do you check before driving onto a lorry?", "Co sprawdzasz, zanim wjedziesz na ciężarówkę?", "Що перевіряєш, перш ніж заїхати на вантажівку?"),
                    options: [t("Feststellbremse und Unterlegkeile, sichere Überladebrücke", "Parking brake and wheel chocks, safe dock plate", "Hamulec postojowy i kliny, bezpieczny pomost przeładunkowy", "Стоянкове гальмо й упори, безпечний місток"), t("Nur ob die Plane offen ist", "Only whether the tarpaulin is open", "Tylko czy plandeka jest odsłonięta", "Лише чи відкритий тент")], correct: 0,
                    why: t("DGUV Vorschrift 68 §17; DGUV Information 208-004, Abschnitt 8.4.", "DGUV Regulation 68 §17; DGUV Information 208-004, section 8.4.", "DGUV Vorschrift 68 §17; DGUV Information 208-004, rozdz. 8.4.", "DGUV Vorschrift 68 §17; DGUV Information 208-004, розд. 8.4.") },
                { q: t("Eine große Last versperrt die Sicht und ragt seitlich über. Was tust du?", "A large load blocks the view and sticks out sideways. What do you do?", "Duży ładunek zasłania widok i wystaje na boki. Co robisz?", "Великий вантаж закриває огляд і виступає вбік. Що робиш?"),
                    options: [t("Rückwärts fahren, dann geht es", "Drive backwards, then it works", "Jechać tyłem, wtedy się da", "Їхати задом, тоді вийде"), t("Mit Einweiser fahren oder ein anderes Gerät nehmen", "Drive with a banksman or use a different truck", "Jechać z sygnalistą albo użyć innego wózka", "Їхати із сигнальником або взяти іншу техніку")], correct: 1,
                    why: t("DGUV Vorschrift 68, DA zu §12 Abs. 1: seitlich überstehend nicht rückwärts.", "DGUV Regulation 68, note on §12 para. 1: do not reverse if the load sticks out sideways.", "DGUV Vorschrift 68, DA do §12 ust. 1: z ładunkiem wystającym na boki nie jeździ się tyłem.", "DGUV Vorschrift 68, DA до §12 абз. 1: з вантажем, що виступає вбік, заднім ходом не їздять.") },
            ],
            allRight: t("Alles richtig. Du gehst sicher mit Lasten um.", "All correct. You handle loads safely.", "Wszystko dobrze. Bezpiecznie pracujesz z ładunkiem.", "Усе правильно. Ти безпечно працюєш із вантажем."),
            someWrong: t("Schau dir die markierten Fragen noch einmal an.", "Take another look at the marked questions.", "Przejrzyj jeszcze raz zaznaczone pytania.", "Переглянь ще раз позначені питання."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Aufnehmen und fahren:</b> bis zum Gabelrücken, bodenfrei, Mast zurück.", "<b>Pick up and drive:</b> up to the fork back, just clear of the floor, mast back.", "<b>Podejmowanie i jazda:</b> do grzbietu wideł, tuż nad podłogą, maszt do tyłu.", "<b>Підйом і їзда:</b> до спинки вил, трохи над підлогою, щогла назад.")),
            pt(t("<b>Absetzen und Regal:</b> vorgesehene Flächen, Fachlast und Feldlast einhalten.", "<b>Set down and rack:</b> designated areas, respect shelf and bay load.", "<b>Odkładanie i regał:</b> wyznaczone miejsca, przestrzegaj obciążenia poziomu i pola.", "<b>Опускання й стелаж:</b> призначені місця, дотримуйся навантаження ярусу й секції.")),
            pt(t("<b>Besondere Lagen:</b> Sicht, Lkw sichern, hängende Lasten nur mit Erlaubnis.", "<b>Special situations:</b> view, secure the lorry, suspended loads only with permission.", "<b>Sytuacje szczególne:</b> widoczność, zabezpieczenie ciężarówki, ładunki podwieszone tylko za zgodą.", "<b>Особливі ситуації:</b> огляд, убезпечити вантажівку, підвішені вантажі лише з дозволу.")),
        ] }),
    ];
}
