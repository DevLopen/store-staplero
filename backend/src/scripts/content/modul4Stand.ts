/**
 * Moduł „Standsicherheit” (spis klienta, punkt 5), od razu w czterech językach.
 * Źródła: DGUV Information 208-004 „Gabelstapler”, rozdz. 2.4, 6.3.1–6.3.3, 6.4.1–6.4.3; DGUV Vorschrift 68 §8 z DA, §9 DA, §12 Abs. 7;
 * DGUV G 308-001 (Entwurf 2026) Anhang B. Liczby w symulacjach są modelem poglądowym (oznaczone „Modell”, „Beispieldiagramm”).
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

const BTN_GO = t("Los geht’s", "Let’s go", "Zaczynamy", "Почнімо");
const OPENER = t("Bevor wir starten: Was meinst du?", "Before we start: what do you think?", "Zanim zaczniemy: jak myślisz?", "Перш ніж почати: як ти думаєш?");
const RIGHT_T = t("Richtig", "Correct", "Dobrze", "Правильно");
const WRONG_T = t("Nicht ganz", "Not quite", "Nie do końca", "Не зовсім");
const SUM = t("Das nimmst du mit", "Key takeaways", "Najważniejsze", "Головне");
const QUICK = t("Kurztest", "Quick test", "Krótki test", "Короткий тест");
const I208 = "DGUV Information 208-004";

const DIAGRAM_TEXTS = texts([
    ["Last (kg)", "Load (kg)", "Ładunek (kg)", "Вантаж (кг)"],
    ["Lastschwerpunktabstand (mm)", "Load centre distance (mm)", "Odległość środka ciężkości (mm)", "Відстань центру ваги (мм)"],
    ["sicherer Bereich", "safe range", "zakres bezpieczny", "безпечна зона"], ["überlastet", "overloaded", "przeciążony", "перевантажено"],
    ["Draufsicht: Kiste auf den Gabeln", "Top view: crate on the forks", "Widok z góry: skrzynia na widłach", "Вигляд згори: ящик на вилах"],
    ["Darf aufgenommen werden", "Can be picked up", "Można podjąć", "Можна підняти"], ["Überlastet", "Overloaded", "Przeciążony", "Перевантажено"],
    ["{kg} kg bei {c} mm, erlaubt {q} kg", "{kg} kg at {c} mm, permitted {q} kg", "{kg} kg przy {c} mm, dopuszczalne {q} kg", "{kg} кг при {c} мм, дозволено {q} кг"],
    ["Der Punkt liegt unter der Linie. So nimmst du die Kiste sicher auf.", "The point is below the line. This is how to pick up the crate safely.", "Punkt leży pod linią. Tak podejmiesz skrzynię bezpiecznie.", "Точка під лінією. Так ящик можна підняти безпечно."],
    ["Der Punkt liegt über der Linie. Dreh die Kiste: von der anderen Seite liegt der Schwerpunkt näher am Gabelrücken.", "The point is above the line. Turn the crate: from the other side the centre of gravity is closer to the fork back.", "Punkt leży nad linią. Obróć skrzynię: z drugiej strony środek ciężkości jest bliżej grzbietu wideł.", "Точка над лінією. Поверни ящик: з іншого боку центр ваги ближче до спинки вил."],
    ["Alle Kisten richtig aufgenommen.", "All crates picked up correctly.", "Wszystkie skrzynie podjęte prawidłowo.", "Усі ящики піднято правильно."],
    ["Aufnahme wählen", "Choose pick-up side", "Wybierz stronę podjęcia", "Обери, з якого боку брати"],
    ["Längsseite zum Stapler", "Long side to the truck", "Dłuższym bokiem do wózka", "Довгим боком до навантажувача"], ["Stirnseite zum Stapler", "Short side to the truck", "Krótszym bokiem do wózka", "Коротким боком до навантажувача"],
    ["Beispieldiagramm: Stapler mit 1.500 kg Nenntragfähigkeit bei 500 mm", "Example diagram: forklift with 1,500 kg rated capacity at 500 mm", "Wykres przykładowy: wózek o udźwigu nominalnym 1500 kg przy 500 mm", "Приклад діаграми: навантажувач із номінальною вантажопідйомністю 1500 кг при 500 мм"],
    ["So aufnehmen", "Pick up like this", "Podejmij tak", "Підняти так"],
    ["{d} mm auf den Gabeln", "{d} mm on the forks", "{d} mm na widłach", "{d} мм на вилах"],
    ["Lastschwerpunkt {c} mm", "Load centre distance {c} mm", "Odległość środka ciężkości {c} mm", "Відстань центру ваги {c} мм"], ["Schwerpunkt", "Centre of gravity", "Środek ciężkości", "Центр ваги"],
    ["Kiste auf den Gabeln, Lastschwerpunkt {c} mm", "Crate on the forks, load centre distance {c} mm", "Skrzynia na widłach, odległość środka ciężkości {c} mm", "Ящик на вилах, відстань центру ваги {c} мм"],
    ["Der Lastschwerpunktabstand wird vom Gabelrücken bis zur Mitte der Last gemessen. Je weiter vorn, desto weniger darf der Stapler heben.", "The load centre distance is measured from the fork back to the middle of the load. The further forward, the less the truck may lift.", "Odległość środka ciężkości mierzy się od grzbietu wideł do środka ładunku. Im dalej z przodu, tym mniej wózek może podnieść.", "Відстань центру ваги міряють від спинки вил до середини вантажу. Що далі вперед, то менше навантажувач може підняти."],
    ["Erlaubt bei {c} mm", "Permitted at {c} mm", "Dopuszczalne przy {c} mm", "Дозволено при {c} мм"], ["Gewicht der Kiste", "Weight of the crate", "Masa skrzyni", "Вага ящика"],
    ["Im Lastschwerpunktdiagramm ansehen", "See it in the load centre diagram", "Zobacz na wykresie udźwigu", "Переглянути на діаграмі вантажопідйомності"],
    ["Anheben", "Lift", "Podnieś", "Підняти"],
]);
const COG_TEXTS = texts([
    ["Stapler", "Truck", "Wózek", "Навантажувач"], ["Last", "Load", "Ładunek", "Вантаж"], ["Gesamtschwerpunkt", "Overall centre of gravity", "Wspólny środek ciężkości", "Загальний центр ваги"], ["Kippkante", "Tipping edge", "Krawędź wywrotu", "Лінія перекидання"],
    ["Gabelstapler mit Schwerpunkten", "Forklift with centres of gravity", "Wózek ze środkami ciężkości", "Навантажувач із центрами ваги"],
    ["Der Gesamtschwerpunkt wandert über die Kippkante: Der Stapler kippt nach vorn.", "The overall centre of gravity moves past the tipping edge: the forklift tips forwards.", "Wspólny środek ciężkości przechodzi za krawędź wywrotu: wózek przewraca się do przodu.", "Загальний центр ваги виходить за лінію перекидання: навантажувач перекидається вперед."],
    ["Beim Bremsen drückt die Masse nach vorn. Es bleibt noch Abstand zur Kippkante.", "When braking, the mass pushes forwards. There is still distance to the tipping edge.", "Przy hamowaniu masa napiera do przodu. Zostaje jeszcze zapas do krawędzi wywrotu.", "Під час гальмування маса тисне вперед. До лінії перекидання ще є запас."],
    ["Gesamtschwerpunkt {h} mm hoch, {m} mm vor der Kippkante", "Overall centre of gravity {h} mm high, {m} mm before the tipping edge", "Wspólny środek ciężkości {h} mm wysoko, {m} mm przed krawędzią wywrotu", "Загальний центр ваги на висоті {h} мм, {m} мм до лінії перекидання"],
    ["Modell", "Model", "Model", "Модель"],
    ["Heben", "Lift", "Podnieś", "Підняти"], ["Senken", "Lower", "Opuść", "Опустити"], ["Neigen", "Tilt", "Pochyl", "Нахилити"], ["Vor", "Forward", "Do przodu", "Вперед"], ["Zurück", "Back", "Do tyłu", "Назад"],
    ["Bremse in Fahrstellung: Last unten, Mast zurück", "Brake in travel position: load low, mast back", "Zahamuj w pozycji do jazdy: ładunek nisko, maszt odchylony do tyłu", "Гальмуй у транспортному положенні: вантаж низько, щогла назад"],
    ["Bremse mit hoch angehobener Last", "Brake with the load lifted high", "Zahamuj z wysoko podniesionym ładunkiem", "Гальмуй з високо піднятим вантажем"],
    ["Stark bremsen", "Brake hard", "Hamuj mocno", "Гальмуй різко"],
]);
const TRI_TEXTS = texts([
    ["Pendelachse", "Pendulum axle", "Oś wahliwa", "Маятникова вісь"], ["Kippkante", "Tipping edge", "Krawędź wywrotu", "Лінія перекидання"], ["Fliehkraft", "Centrifugal force", "Siła odśrodkowa", "Відцентрова сила"],
    ["Draufsicht mit Kippdreieck", "Top view with stability triangle", "Widok z góry z trójkątem stateczności", "Вигляд згори з трикутником стійкості"],
    ["Beladung", "Load", "Załadunek", "Завантаження"], ["Leer", "Empty", "Pusty", "Порожній"], ["Last unten", "Load low", "Ładunek nisko", "Вантаж низько"], ["Last oben", "Load high", "Ładunek wysoko", "Вантаж високо"],
    ["Geschwindigkeit", "Speed", "Prędkość", "Швидкість"], ["Kurvenradius", "Curve radius", "Promień łuku", "Радіус повороту"],
    ["Kippmoment im Vergleich zum Standmoment", "Tipping moment compared with stability moment", "Moment wywracający w porównaniu z momentem stateczności", "Момент перекидання порівняно з моментом стійкості"],
    ["Kippmoment: {p} % des Standmoments", "Tipping moment: {p} % of the stability moment", "Moment wywracający: {p} % momentu stateczności", "Момент перекидання: {p} % моменту стійкості"],
    ["Der Schwerpunkt liegt außerhalb des Dreiecks: Der Stapler kippt zur Seite.", "The centre of gravity is outside the triangle: the forklift tips sideways.", "Środek ciężkości jest poza trójkątem: wózek przewraca się na bok.", "Центр ваги поза трикутником: навантажувач перекидається набік."],
    ["Der Schwerpunkt bleibt im Dreieck. Der Stapler bleibt stehen.", "The centre of gravity stays in the triangle. The forklift stays upright.", "Środek ciężkości zostaje w trójkącie. Wózek stoi.", "Центр ваги залишається в трикутнику. Навантажувач стоїть."],
    ["Stell Tempo und Radius ein und fahr die Kurve.", "Set speed and radius and drive the curve.", "Ustaw prędkość i promień i przejedź łuk.", "Налаштуй швидкість і радіус і проїдь поворот."],
    ["Modell", "Model", "Model", "Модель"],
    ["Bring den leeren Stapler zum Kippen", "Make the empty forklift tip", "Przewróć pusty wózek", "Перекинь порожній навантажувач"],
    ["Fahr eine Kurve mit mindestens 6 km/h, ohne zu kippen", "Drive a curve at 6 km/h or more without tipping", "Przejedź łuk z prędkością co najmniej 6 km/h bez wywrotki", "Проїдь поворот щонайменше 6 км/год без перекидання"],
    ["Probier es mit angehobener Last", "Try it with the load lifted", "Spróbuj z podniesionym ładunkiem", "Спробуй з піднятим вантажем"],
    ["Kurve fahren", "Drive the curve", "Przejedź łuk", "Проїхати поворот"],
]);

const CURVE_TEXTS = texts([
    ["enge Kurve", "tight curve", "ciasny zakręt", "крутий поворот"], ["weite Kurve", "wide curve", "szeroki zakręt", "плавний поворот"],
    ["Draufsicht auf die Kurve", "Top view of the curve", "Widok zakrętu z góry", "Поворот, вигляд згори"],
    ["Fliehkraft", "Centrifugal force", "Siła odśrodkowa", "Відцентрова сила"], ["Kippkante", "Tipping edge", "Krawędź wywrotu", "Лінія перекидання"], ["Schwerpunkt", "Centre of gravity", "Środek ciężkości", "Центр ваги"],
    ["Ansicht von hinten", "View from behind", "Widok od tyłu", "Вигляд ззаду"],
    ["Leer", "Empty", "Pusty", "Порожній"], ["Last unten", "Load low", "Ładunek nisko", "Вантаж низько"], ["Last oben", "Load high", "Ładunek wysoko", "Вантаж високо"],
    ["Wähle Ladung, Kurve und Tempo und tippe auf „Losfahren“. Schau auf die Ansicht von hinten.", "Choose load, curve and speed and tap “Drive”. Watch the view from behind.", "Wybierz ładunek, zakręt i prędkość i dotknij „Jedź”. Obserwuj widok od tyłu.", "Обери вантаж, поворот і швидкість і торкнися «Поїхали». Стеж за виглядом ззаду."],
    ["Ladung", "Load", "Ładunek", "Вантаж"], ["Kurve", "Curve", "Zakręt", "Поворот"], ["Tempo", "Speed", "Prędkość", "Швидкість"], ["eng", "tight", "ciasny", "крутий"], ["weit", "wide", "szeroki", "плавний"],
    ["Kippgefahr", "Tipping risk", "Ryzyko wywrotki", "Ризик перекидання"],
    ["Umgekippt", "Tipped over", "Przewrócił się", "Перекинувся"], ["Sicher durch die Kurve", "Safely through the curve", "Bezpiecznie przez zakręt", "Безпечно через поворот"],
    ["Die Fliehkraft war stärker als die Standsicherheit ({p} %). Halbes Tempo hätte nur ein Viertel der Fliehkraft bedeutet.", "Centrifugal force exceeded the stability ({p} %). At half the speed, the force would have been only a quarter.", "Siła odśrodkowa przeważyła stateczność ({p} %). Przy połowie prędkości siła byłaby cztery razy mniejsza.", "Відцентрова сила переважила стійкість ({p} %). На половині швидкості сила була б учетверо меншою."],
    ["Kippgefahr {p} %. Der Schwerpunkt blieb innerhalb der Kippkante.", "Tipping risk {p} %. The centre of gravity stayed inside the stability triangle.", "Ryzyko wywrotki {p} %. Środek ciężkości pozostał wewnątrz trójkąta stateczności.", "Ризик перекидання {p} %. Центр ваги залишився в межах трикутника стійкості."],
    ["Probier diese Fahrten:", "Try these runs:", "Wypróbuj te przejazdy:", "Спробуй ці заїзди:"],
    ["Losfahren", "Drive", "Jedź", "Поїхали"],
    ["Wähle Ladung, Kurve und Tempo und tippe auf „Losfahren“. Am Boden siehst du das Standdreieck und den Schwerpunkt.", "Choose load, curve and speed and tap “Drive”. On the floor you see the stability triangle and the centre of gravity.", "Wybierz ładunek, zakręt i prędkość i dotknij „Jedź”. Na posadzce widać trójkąt stateczności i środek ciężkości.", "Обери вантаж, поворот і швидкість і торкнися «Поїхали». На підлозі видно трикутник стійкості й центр ваги."],
    ["3D-Szene wird geladen", "Loading 3D scene", "Wczytuję scenę 3D", "Завантаження 3D-сцени"],
    ["Kamera", "Camera", "Kamera", "Камера"], ["Hinterher", "Follow", "Za wózkiem", "Слідом"], ["Von oben", "From above", "Z góry", "Згори"],
]);

/* ════════════════ Lernziele ════════════════ */
export function lesson4Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Standsicherheit", "Stability", "Stateczność", "Стійкість"), image: "forklift",
            text: t("Warum kippt ein Stapler? Du lernst, wo Schwerpunkte liegen, wie du das Lastschwerpunktdiagramm liest und warum zu schnelle Kurven so gefährlich sind.",
                "Why does a forklift tip over? You learn where the centres of gravity are, how to read the load centre diagram and why curves taken too fast are so dangerous.",
                "Dlaczego wózek się przewraca? Dowiesz się, gdzie są środki ciężkości, jak czytać wykres udźwigu i dlaczego zbyt szybkie pokonywanie łuków jest tak niebezpieczne.",
                "Чому навантажувач перекидається? Ти дізнаєшся, де центри ваги, як читати діаграму вантажопідйомності й чому надто швидкі повороти такі небезпечні."),
            meta: [t("ca. 45 Minuten", "about 45 minutes", "ok. 45 minut", "близько 45 хвилин"), t("4 Themen und Modul-Check", "4 topics and module check", "4 tematy i test modułu", "4 теми і перевірка модуля"), { de: "DGUV I 208-004, DGUV V68 §8" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "Your learning goals for this module. 1 = new to me, 5 = confident.", "Twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: [
                { code: "4.1", text: t("Ich kann das Lastschwerpunktdiagramm lesen und weiß, wie Heben und Neigen den Schwerpunkt verschieben.", "I can read the load centre diagram and know how lifting and tilting shift the centre of gravity.", "Umiem czytać wykres udźwigu i wiem, jak podnoszenie i pochylanie przesuwa środek ciężkości.", "Я вмію читати діаграму вантажопідйомності і знаю, як підйом і нахил зсувають центр ваги."), short: t("Schwerpunkt", "Centre of gravity", "Środek ciężkości", "Центр ваги") },
                { code: "4.2", text: t("Ich verstehe das Kippdreieck und fahre Kurven sicher.", "I understand the stability triangle and drive curves safely.", "Rozumiem trójkąt stateczności i bezpiecznie pokonuję łuki.", "Я розумію трикутник стійкості й безпечно проходжу повороти."), short: t("Kippdreieck", "Triangle", "Trójkąt", "Трикутник") },
                { code: "4.3", text: t("Ich kenne den Einfluss von Boden, Reifen, Achsen und Gefälle.", "I know the influence of floor, tyres, axles and slopes.", "Znam wpływ podłoża, opon, osi i spadków.", "Я знаю вплив підлоги, шин, осей і схилів."), short: t("Boden & Gefälle", "Floor & slopes", "Podłoże i spadki", "Підлога і схили") },
                { code: "4.4", text: t("Ich kenne Anhalteweg, Bremsweg und das Gewicht des Staplers.", "I know stopping distance, braking distance and the forklift’s weight.", "Znam drogę zatrzymania, drogę hamowania i masę wózka.", "Я знаю шлях зупинки, гальмівний шлях і масу навантажувача.") },
            ],
        }),
        step("sort", {
            title: t("Kann der Stapler dadurch kippen?", "Can this make the forklift tip?", "Czy przez to wózek może się przewrócić?", "Чи може через це навантажувач перекинутися?"),
            lead: t("Entscheide aus dem Bauch heraus.", "Go with your gut feeling.", "Zdecyduj intuicyjnie.", "Вирішуй інтуїтивно."),
            labels: [t("Kippgefahr", "Tipping risk", "Ryzyko wywrotki", "Ризик перекидання"), t("Unbedenklich", "Harmless", "Bezpieczne", "Безпечно")],
            items: [
                { t: t("Zu schnell um die Kurve", "Too fast round the curve", "Za szybko na łuku", "Надто швидко в повороті"), a: 0, why: t("Die Fliehkraft drückt den Stapler nach außen.", "Centrifugal force pushes the forklift outwards.", "Siła odśrodkowa wypycha wózek na zewnątrz.", "Відцентрова сила виштовхує навантажувач назовні.") },
                { t: t("Mit angehobener Last fahren", "Driving with the load raised", "Jazda z podniesionym ładunkiem", "Їзда з піднятим вантажем"), a: 0, why: t("Der Schwerpunkt liegt hoch, schon kleine Stöße oder Bremsen reichen.", "The centre of gravity is high, small bumps or braking are enough.", "Środek ciężkości jest wysoko, wystarczą małe wstrząsy lub hamowanie.", "Центр ваги високо, вистачить малих поштовхів чи гальмування.") },
                { t: t("Last bergseitig auf der Rampe", "Load on the uphill side of the ramp", "Ładunek od strony wzniesienia na rampie", "Вантаж з боку підйому на рампі"), a: 1, why: t("Richtig so. Talseitig wäre gefährlich.", "That is correct. Downhill would be dangerous.", "Tak jest dobrze. Od strony spadku byłoby niebezpiecznie.", "Так правильно. З боку спуску було б небезпечно.") },
                { t: t("Auf der Rampe wenden", "Turning round on the ramp", "Zawracanie na rampie", "Розворот на рампі"), a: 0, why: t("Wenden auf geneigter Fahrbahn lässt den Stapler seitlich kippen.", "Turning on a slope can make the forklift tip sideways.", "Zawracanie na pochyłości może przewrócić wózek na bok.", "Розворот на схилі може перекинути навантажувач набік.") },
                { t: t("Langsam mit tiefer Last fahren", "Driving slowly with the load low", "Jazda powoli z nisko opuszczonym ładunkiem", "Їзда повільно з низьким вантажем"), a: 1, why: t("So bleibt der Schwerpunkt tief und die Fliehkraft klein.", "This keeps the centre of gravity low and the centrifugal force small.", "Tak środek ciężkości zostaje nisko, a siła odśrodkowa mała.", "Так центр ваги лишається низько, а відцентрова сила мала.") },
            ],
            allRight: t("Gutes Gespür. Jetzt schauen wir uns an, warum.", "Good instinct. Now let us see why.", "Dobre wyczucie. Teraz zobaczymy dlaczego.", "Гарне чуття. Тепер подивимося чому."),
            someWrong: t("Kein Problem, genau das klären wir jetzt.", "No problem, that is exactly what we will clear up now.", "Nie szkodzi, właśnie to teraz wyjaśnimy.", "Нічого, саме це зараз з’ясуємо."),
        }),
    ];
}

/* ════════════════ 4.1 Schwerpunkt und Lastschwerpunktdiagramm ════════════════ */
export function lesson41(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Kiste mit 1.300 kg, Stapler mit 1.500 kg Tragfähigkeit. Darfst du sie aufnehmen?", "A 1,300 kg crate and a forklift with 1,500 kg capacity. Are you allowed to pick it up?", "Skrzynia 1300 kg, wózek o udźwigu 1500 kg. Możesz ją podjąć?", "Ящик 1300 кг, навантажувач із вантажопідйомністю 1500 кг. Чи можна його підняти?"),
            text: OPENER, layout: "list",
            options: [t("Ja, 1.300 ist weniger als 1.500", "Yes, 1,300 is less than 1,500", "Tak, 1300 to mniej niż 1500", "Так, 1300 менше за 1500"), t("Nein, zu knapp", "No, too close", "Nie, za mało zapasu", "Ні, надто впритул"), t("Kommt darauf an, wie du sie aufnimmst", "It depends on how you pick it up", "Zależy, jak ją podejmiesz", "Залежить, як ти її береш")], correct: 2,
            resultTitle: { right: RIGHT_T, wrong: WRONG_T },
            quote: t("„Es genügt also nicht, wenn nur das Lastgewicht berücksichtigt wird, sondern auch die Entfernung des Lastschwerpunktes vom Gabelrücken ist zu beachten.“", "“It is therefore not enough to consider only the weight of the load; the distance of the load centre from the fork back must also be taken into account.”", "„Nie wystarczy więc uwzględnić tylko masy ładunku, trzeba też brać pod uwagę odległość jego środka ciężkości od grzbietu wideł.”", "«Отже, недостатньо враховувати лише масу вантажу, треба зважати й на відстань центру ваги від спинки вил.»"),
            body: t("Das Beispiel stammt aus der DGUV Information 208-004. Gleich rechnest du es selbst nach.", "The example comes from DGUV Information 208-004. You will work it out yourself shortly.", "Przykład pochodzi z DGUV Information 208-004. Za chwilę sam to sprawdzisz.", "Приклад з DGUV Information 208-004. Зараз ти перевіриш його сам."),
            src: { de: `${I208} Abschn. 6.3.3` }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Schwerpunkt und Wippe", "Centre of gravity and the seesaw", "Środek ciężkości i huśtawka", "Центр ваги і гойдалка"),
            lead: t("Der Schwerpunkt ist der Punkt, in dem man sich die ganze Masse eines Körpers vereint denkt. Am Stapler wirken zwei davon gegeneinander.", "The centre of gravity is the point where you imagine the whole mass of a body to be concentrated. On a forklift, two of them act against each other.", "Środek ciężkości to punkt, w którym wyobrażamy sobie skupioną całą masę ciała. W wózku działają dwa takie punkty, jeden przeciw drugiemu.", "Центр ваги — точка, в якій уявно зосереджена вся маса тіла. На навантажувачі два таких центри діють один проти одного."),
            points: [
                pt(t("<b>Schwerpunkt der Last:</b> Bei gleichmäßigen Lasten liegt er auf der halben Lasttiefe.", "<b>Load centre:</b> with uniform loads it lies at half the load depth.", "<b>Środek ciężkości ładunku:</b> przy równomiernym ładunku leży w połowie jego głębokości.", "<b>Центр ваги вантажу:</b> у рівномірного вантажу він на половині його глибини.")),
                pt(t("<b>Schwerpunkt des Staplers:</b> möglichst weit hinten, meist unter dem Fahrersitz.", "<b>Truck’s centre of gravity:</b> as far back as possible, usually under the driver’s seat.", "<b>Środek ciężkości wózka:</b> możliwie daleko z tyłu, zwykle pod fotelem.", "<b>Центр ваги навантажувача:</b> якомога далі ззаду, зазвичай під сидінням.")),
                pt(t("<b>Drehpunkt:</b> die Vorderachse. Im Gleichgewicht ist Last mal Lastarm auf beiden Seiten gleich groß.", "<b>Pivot:</b> the front axle. In balance, load times lever arm is equal on both sides.", "<b>Punkt podparcia:</b> oś przednia. W równowadze ciężar razy ramię jest po obu stronach równy.", "<b>Точка опори:</b> передня вісь. У рівновазі добуток маси на плече з обох боків однаковий.")),
                pt(t("<b>Darum:</b> Je weiter der Lastschwerpunkt vom Gabelrücken entfernt ist, desto weniger darf die Last wiegen.", "<b>Therefore:</b> the further the load centre is from the fork back, the less the load may weigh.", "<b>Dlatego:</b> im dalej środek ciężkości ładunku od grzbietu wideł, tym mniej może ważyć ładunek.", "<b>Тому:</b> що далі центр ваги від спинки вил, то менше може важити вантаж.")),
            ],
            formula: [t("Lastmoment", "Load moment", "Moment ładunku", "Момент вантажу"), t("Gewicht", "Weight", "Ciężar", "Вага"), t("Lastarm", "Lever arm", "Ramię dźwigni", "Плече важеля")],
            merke: t("Auf den Lastarm hast du direkten Einfluss: Last immer an den Gabelrücken anlegen.", "You have direct influence on the lever arm: always place the load against the fork back.", "Na ramię dźwigni masz bezpośredni wpływ: zawsze dosuwaj ładunek do grzbietu wideł.", "На плече ти впливаєш напряму: завжди притискай вантаж до спинки вил."),
            src: { de: `${I208} Abschn. 6.3.1 und 6.3.2` },
        }),
        step("learn", {
            title: t("Das Lastschwerpunktdiagramm", "The load centre diagram", "Wykres udźwigu", "Діаграма вантажопідйомності"),
            lead: t("Am Stapler zeigt das Diagramm, wie viel er bei welchem Lastschwerpunktabstand tragen darf. Du brauchst immer zwei Werte: Gewicht und Abstand.", "On the forklift, the diagram shows how much it may carry at which load centre distance. You always need two values: weight and distance.", "Wykres na wózku pokazuje, ile może unieść przy jakiej odległości środka ciężkości. Zawsze potrzebujesz dwóch wartości: masy i odległości.", "Діаграма на навантажувачі показує, скільки він може нести при якій відстані центру ваги. Завжди потрібні два значення: маса й відстань."),
            points: [
                pt(t("<b>Abstand bestimmen:</b> vom Gabelrücken bis zum Schwerpunkt, bei gleichmäßiger Last die halbe Tiefe.", "<b>Find the distance:</b> from the fork back to the centre of gravity, half the depth for a uniform load.", "<b>Ustal odległość:</b> od grzbietu wideł do środka ciężkości; przy równomiernym ładunku to połowa jego głębokości.", "<b>Визнач відстань:</b> від спинки вил до центру ваги, для рівномірного вантажу половина глибини.")),
                pt(t("<b>Ablesen:</b> Gewicht und Abstand ergeben einen Punkt. Unter der Linie ist sicher, darüber überlastet.", "<b>Read off:</b> weight and distance give a point. Below the line is safe, above it is overloaded.", "<b>Odczytaj:</b> masa i odległość dają punkt. Pod linią bezpiecznie, nad nią przeciążenie.", "<b>Зчитай:</b> маса й відстань дають точку. Під лінією безпечно, над нею перевантаження.")),
                pt(t("<b>Drehen hilft:</b> Dieselbe Kiste kann von der einen Seite sicher und von der anderen überlastet sein.", "<b>Turning helps:</b> the same crate can be safe from one side and overloaded from the other.", "<b>Obrót pomaga:</b> ta sama skrzynia może być bezpieczna z jednej strony, a przeciążona z drugiej.", "<b>Поворот допомагає:</b> той самий ящик може бути безпечним з одного боку і перевантаженим з іншого.")),
            ],
            merke: t("Weißt du das Gewicht oder den Schwerpunkt nicht, frag nach, bevor du hebst.", "If you do not know the weight or the centre of gravity, ask before you lift.", "Jeśli nie znasz masy lub środka ciężkości, zapytaj, zanim podniesiesz.", "Якщо не знаєш маси чи центру ваги, спитай перед підйомом."),
            src: { de: `${I208} Abschn. 2.1, 6.3.3 und 6.3.4` },
        }),
        step("sim", { sim: "diagram", texts: DIAGRAM_TEXTS,
            title: t("Von welcher Seite nimmst du die Kiste auf?", "From which side do you pick up the crate?", "Od której strony podejmiesz skrzynię?", "З якого боку ти береш ящик?"),
            crates: [
                { name: t("Kiste A", "Crate A", "Skrzynia A", "Ящик A"), l: 1600, w: 1000, kg: 1300 },
                { name: t("Kiste B", "Crate B", "Skrzynia B", "Ящик B"), l: 1200, w: 800, kg: 1450 },
            ],
            done: t("Die gleiche Kiste kann je nach Seite sicher oder überlastet sein. Darum zählt beim Lastschwerpunktdiagramm immer auch der Abstand.", "The same crate can be safe or overloaded depending on the side. That is why distance always counts in the load centre diagram.", "Ta sama skrzynia może być bezpieczna albo przeciążona, zależnie od strony. Dlatego przy odczycie z wykresu udźwigu zawsze liczy się też odległość.", "Той самий ящик залежно від боку буває безпечним або перевантаженим. Тому на діаграмі вантажопідйомності завжди має значення і відстань."),
        }),
        step("learn", {
            title: t("Heben und Neigen verschieben den Schwerpunkt", "Lifting and tilting shift the centre of gravity", "Podnoszenie i pochylanie przesuwa środek ciężkości", "Підйом і нахил зсувають центр ваги"),
            lead: t("Mit Last bilden Stapler und Last einen Gesamtschwerpunkt. Er liegt näher an der Vorderachse als beim leeren Stapler.", "With a load, the truck and load form an overall centre of gravity. It is closer to the front axle than on the empty truck.", "Z ładunkiem wózek i ładunek tworzą wspólny środek ciężkości. Leży bliżej osi przedniej niż w pustym wózku.", "З вантажем навантажувач і вантаж мають загальний центр ваги. Він ближче до передньої осі, ніж у порожнього навантажувача."),
            points: [
                pt(t("<b>Heben:</b> Der Gesamtschwerpunkt wandert nach oben.", "<b>Lifting:</b> the overall centre of gravity moves up.", "<b>Podnoszenie:</b> wspólny środek ciężkości przesuwa się w górę.", "<b>Підйом:</b> загальний центр ваги зміщується вгору.")),
                pt(t("<b>Nach vorn neigen:</b> Er wandert zusätzlich nach vorn, zur Kippkante.", "<b>Tilting forwards:</b> it also moves forwards, towards the tipping edge.", "<b>Pochylanie do przodu:</b> dodatkowo przesuwa się do przodu, w stronę krawędzi, przez którą wózek się przewraca.", "<b>Нахил вперед:</b> він додатково зміщується вперед, до лінії перекидання.")),
                pt(t("<b>Bremsen:</b> Die Masse drückt nach vorn, umso stärker, je höher der Schwerpunkt liegt.", "<b>Braking:</b> the mass pushes forwards, the more so the higher the centre of gravity is.", "<b>Hamowanie:</b> masa napiera do przodu, tym mocniej, im wyżej jest środek ciężkości.", "<b>Гальмування:</b> маса тисне вперед, тим сильніше, чим вище центр ваги.")),
                pt(t("<b>Darum:</b> Last vor der Fahrt absenken, Mast zurückneigen, nur über der Stapelfläche nach vorn neigen.", "<b>Therefore:</b> lower the load before driving, tilt the mast back, tilt forwards only over the stacking area.", "<b>Dlatego:</b> przed jazdą opuść ładunek, odchyl maszt do tyłu, do przodu pochylaj tylko nad miejscem składowania.", "<b>Тому:</b> перед їздою опусти вантаж, нахили щоглу назад, вперед нахиляй лише над місцем складування.")),
            ],
            merke: t("Mit hochgestellter Last fährst du nur zum Auf- und Absetzen, Schritt für Schritt.", "With the load raised high, you only move to pick up and set down, step by step.", "Z wysoko podniesionym ładunkiem poruszasz się tylko przy podejmowaniu i odkładaniu, krok po kroku.", "З високо піднятим вантажем рухаєшся лише для підхоплення й опускання, крок за кроком."),
            src: { de: `${I208} Abschn. 6.4.2; DGUV V68 DA zu §8` },
        }),
        step("sim", { sim: "cog", texts: COG_TEXTS,
            title: t("Heben, neigen, bremsen", "Lift, tilt, brake", "Podnieś, pochyl, zahamuj", "Підйом, нахил, гальмування") }),
        step("video", {
            title: t("Fahrstellung im Vergleich", "Travel position compared", "Pozycja do jazdy w porównaniu", "Транспортне положення в порівнянні"),
            brief: t("Auf abgesperrtem Übungsplatz, langsam: Stapler fährt mit Last in Fahrstellung (ca. 15 cm, Mast zurück) und bremst. Danach Animation oder Grafik: dieselbe Bremsung mit hoch angehobener Last, Gesamtschwerpunkt wandert zur Vorderachse. Keine echte Kippfahrt filmen.", "On a cordoned-off practice area, slowly: forklift drives with load in travel position (about 15 cm, mast back) and brakes. Then animation or graphic: the same braking with the load raised high, overall centre of gravity moves to the front axle. Do not film a real tip-over.", "Na wydzielonym placu, powoli: wózek jedzie z ładunkiem w pozycji do jazdy (ok. 15 cm, maszt odchylony do tyłu) i hamuje. Potem animacja lub grafika: to samo hamowanie z wysoko podniesionym ładunkiem, wspólny środek ciężkości przesuwa się ku osi przedniej. Nie filmować prawdziwej wywrotki.", "На огородженому майданчику, повільно: навантажувач їде з вантажем у транспортному положенні (≈15 см, щогла назад) і гальмує. Потім анімація чи графіка: те саме гальмування з високо піднятим вантажем, центр ваги йде до передньої осі. Справжнє перекидання не знімати."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: t("Wo liegt der Schwerpunkt einer gleichmäßig gepackten Kiste?", "Where is the centre of gravity of an evenly packed crate?", "Gdzie jest środek ciężkości równomiernie zapakowanej skrzyni?", "Де центр ваги рівномірно запакованого ящика?"),
                    options: [t("Am Gabelrücken", "At the fork back", "Przy grzbiecie wideł", "Біля спинки вил"), t("Auf halber Lasttiefe", "At half the load depth", "W połowie głębokości ładunku", "На половині глибини вантажу"), t("An der Gabelspitze", "At the fork tip", "Na końcach wideł", "На кінці вил")], correct: 1,
                    why: t("Faustformel aus der DGUV Information 208-004.", "Rule of thumb from DGUV Information 208-004.", "Reguła praktyczna z DGUV Information 208-004.", "Правило з DGUV Information 208-004.") },
                { q: t("Welcher Stapler ist in Fahrtrichtung standfester?", "Which forklift is more stable in the direction of travel?", "Który wózek jest stabilniejszy w kierunku jazdy?", "Який навантажувач стійкіший у напрямку руху?"),
                    options: [t("Der leere", "The empty one", "Pusty", "Порожній"), t("Der beladene", "The loaded one", "Załadowany", "Завантажений")], correct: 0,
                    why: t("Mit Last liegt der Gesamtschwerpunkt näher an der Vorderachse.", "With a load, the overall centre of gravity is closer to the front axle.", "Z ładunkiem wspólny środek ciężkości jest bliżej osi przedniej.", "З вантажем загальний центр ваги ближче до передньої осі.") },
                { q: t("Wann darfst du den Mast mit hoher Last nach vorn neigen?", "When are you allowed to tilt the mast forwards with the load raised high?", "Kiedy możesz pochylić maszt do przodu z wysoko podniesionym ładunkiem?", "Коли можна нахиляти щоглу вперед з високо піднятим вантажем?"),
                    options: [t("Nur über der Stapelfläche", "Only over the stacking area", "Tylko nad miejscem składowania", "Лише над місцем складування"), t("Beim Fahren, für bessere Sicht", "While driving, for better visibility", "W czasie jazdy, dla lepszej widoczności", "Під час їзди, для кращого огляду")], correct: 0,
                    why: t("Nach vorn neigen schiebt den Schwerpunkt zur Kippkante.", "Tilting forwards pushes the centre of gravity towards the tipping edge.", "Pochylenie do przodu przesuwa środek ciężkości ku krawędzi wywrotu.", "Нахил вперед зсуває центр ваги до лінії перекидання.") },
            ],
            allRight: t("Alles richtig.", "All correct.", "Wszystko dobrze.", "Усе правильно."),
            someWrong: t("Schau dir die Karten bei Bedarf noch einmal an.", "Have another look at the cards if needed.", "W razie potrzeby wróć do kart.", "За потреби переглянь картки ще раз."),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Wippe:</b> Drehpunkt ist die Vorderachse: Last mal Lastarm wirkt gegen Staplergewicht mal Abstand zur Achse.", "<b>Seesaw:</b> pivot at the front axle: load times lever arm acts against truck weight times its distance from the axle.", "<b>Huśtawka:</b> oś przednia jest punktem podparcia: ładunek razy ramię dźwigni działa przeciw masie wózka razy jej odległość od osi.", "<b>Гойдалка:</b> опора — передня вісь: вантаж на плече діє проти маси навантажувача на її відстань до осі.")),
            pt(t("<b>Diagramm:</b> Gewicht und Abstand zusammen ablesen. Last an den Gabelrücken, notfalls Kiste drehen.", "<b>Diagram:</b> read weight and distance together. Load against the fork back, turn the crate if needed.", "<b>Wykres:</b> odczytuj masę i odległość razem. Ładunek dosuń do grzbietu wideł, w razie potrzeby obróć skrzynię.", "<b>Діаграма:</b> зчитуй масу й відстань разом. Вантаж притискай до спинки вил, за потреби поверни ящик.")),
            pt(t("<b>Fahrstellung:</b> Last tief, Mast zurück. Hoch und nach vorn geneigt nur über der Stapelfläche.", "<b>Travel position:</b> load low, mast back. Load high and mast tilted forwards only over the stacking area.", "<b>Pozycja jazdy:</b> ładunek nisko, maszt odchylony do tyłu. Ładunek wysoko i maszt pochylony do przodu tylko nad miejscem składowania.", "<b>Транспортне положення:</b> вантаж низько, щогла назад. Високо піднятий вантаж і нахил уперед — лише над місцем складування.")),
        ] }),
    ];
}

/* ════════════════ 4.2 Kippdreieck und Kurvenfahrt ════════════════ */
export function lesson42(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Welcher Stapler kippt in einer schnellen Kurve leichter zur Seite?", "Which forklift tips sideways more easily in a fast curve?", "Który wózek łatwiej przewraca się na bok na szybkim łuku?", "Який навантажувач легше перекидається набік у швидкому повороті?"),
            text: OPENER, options: [t("Leer", "Empty", "Pusty", "Порожній"), t("Beladen", "Loaded", "Załadowany", "Завантажений")], correct: 0,
            resultTitle: { right: t("Richtig, der leere", "Correct, the empty one", "Dobrze, pusty", "Правильно, порожній"), wrong: t("Überraschung: der leere", "Surprise: the empty one", "Niespodzianka: pusty", "Несподівано: порожній") },
            quote: t("„Unfalluntersuchungen haben ergeben, dass besonders unbeladene Gabelstapler bei zu schneller Kurvenfahrt umgekippt sind.“", "“Accident investigations have shown that unladen forklifts in particular have tipped over when cornering too fast.”", "„Badania wypadków wykazały, że przy zbyt szybkiej jeździe na łuku przewracały się szczególnie wózki bez ładunku.”", "«Розслідування аварій показали, що при надто швидкому повороті перекидалися передусім незавантажені навантажувачі.»"),
            body: t("Warum das so ist, zeigt dir das Kippdreieck.", "The stability triangle shows you why.", "Dlaczego tak jest, pokaże ci trójkąt stateczności.", "Чому так, покаже трикутник стійкості."),
            src: { de: `${I208} Abschn. 6.4.3` }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Das Kippdreieck", "The stability triangle", "Trójkąt stateczności", "Трикутник стійкості"),
            lead: t("Ein Gabelstapler steht nicht auf vier Punkten, sondern auf drei. Die Hinterachse ist als Pendelachse mittig gelagert.", "A forklift does not stand on four points, but on three. The rear axle is a pendulum axle mounted in the middle.", "Wózek nie stoi na czterech punktach, tylko na trzech. Tylna oś jest osią wahliwą zamocowaną pośrodku.", "Навантажувач стоїть не на чотирьох точках, а на трьох. Задня вісь — маятникова, закріплена посередині."),
            points: [
                pt(t("<b>Drei Punkte:</b> die beiden Vorderräder und das Lager der Pendelachse. Beim Dreirad-Stapler die drei Räder.", "<b>Three points:</b> the two front wheels and the pendulum axle bearing. On a three-wheel forklift, the three wheels.", "<b>Trzy punkty:</b> dwa przednie koła i łożysko osi wahliwej. W wózku trójkołowym są to trzy koła.", "<b>Три точки:</b> два передні колеса й опора маятникової осі. У триколісного — три колеса.")),
                pt(t("<b>Stehen bleibt er,</b> solange der Schwerpunkt im Dreieck liegt. Die Seiten sind die Kippkanten.", "<b>It stays upright</b> as long as the centre of gravity is within the triangle. The sides are the tipping edges.", "<b>Nie przewraca się,</b> dopóki środek ciężkości leży wewnątrz trójkąta. Boki trójkąta to krawędzie, przez które wózek może się przewrócić.", "<b>Він стоїть,</b> поки центр ваги в межах трикутника. Сторони трикутника — лінії, через які він може перекинутися.")),
                pt(t("<b>Leer:</b> Der Schwerpunkt liegt hinten, wo das Dreieck schmal ist. Wenig Abstand zur Kippkante.", "<b>Empty:</b> the centre of gravity is at the rear, where the triangle is narrow. Little distance to the tipping edge.", "<b>Pusty:</b> środek ciężkości jest z tyłu, gdzie trójkąt jest wąski. Do krawędzi wywrotu jest niewiele zapasu.", "<b>Порожній:</b> центр ваги ззаду, де трикутник вузький. До лінії перекидання мало запасу.")),
                pt(t("<b>Beladen:</b> Der Gesamtschwerpunkt rückt nach vorn ins breite Dreieck und hat mehr Gewicht. Das Sicherheitsmoment ist größer.", "<b>Loaded:</b> the overall centre of gravity moves forwards into the wide part and has more weight. The stability moment is greater.", "<b>Załadowany:</b> wspólny środek ciężkości przesuwa się do przodu, w szeroką część, i ma większą masę. Moment stateczności jest większy.", "<b>Завантажений:</b> загальний центр ваги зсувається вперед у широку частину і має більшу масу. Момент стійкості більший.")),
            ],
            merke: t("Gewicht mal Abstand zur Kippkante ergibt das Sicherheitsmoment. Die Fliehkraft in der Kurve arbeitet dagegen.", "Weight times distance to the tipping edge gives the stability moment. Centrifugal force in the curve works against it.", "Masa razy odległość do krawędzi wywrotu daje moment stateczności. Siła odśrodkowa na łuku działa przeciw niemu.", "Маса на відстань до лінії перекидання дає момент стійкості. Відцентрова сила в повороті діє проти нього."),
            src: { de: `${I208} Abschn. 6.4.3` },
        }),
        step("sim", { sim: "curve", texts: CURVE_TEXTS,
            title: t("Wie schnell darf es in der Kurve sein?", "How fast can you take the curve?", "Jak szybko można wziąć zakręt?", "Як швидко можна пройти поворот?") }),
        step("learn", {
            title: t("Tempo schlägt Radius", "Speed beats radius", "Prędkość ważniejsza od promienia", "Швидкість важливіша за радіус"),
            lead: t("Das Kippmoment entsteht aus Fliehkraft und Höhe des Schwerpunkts. Zwei Dinge hast du in der Hand.", "The tipping moment comes from centrifugal force and the height of the centre of gravity. You control both.", "Moment wywracający powstaje z siły odśrodkowej i wysokości środka ciężkości. Na obie te rzeczy masz wpływ.", "Момент перекидання виникає з відцентрової сили й висоти центру ваги. На обидві ти можеш вплинути."),
            points: [
                pt(t("<b>Halbe Geschwindigkeit</b> bedeutet nur noch ein Viertel der Fliehkraft.", "<b>Half the speed</b> means only a quarter of the centrifugal force.", "<b>Połowa prędkości</b> to tylko jedna czwarta siły odśrodkowej.", "<b>Половина швидкості</b> означає лише чверть відцентрової сили.")),
                pt(t("<b>Doppelter Kurvenradius</b> halbiert die Fliehkraft. Wirksam, aber weniger als das Tempo.", "<b>Double the curve radius</b> halves the centrifugal force. Effective, but less so than speed.", "<b>Podwójny promień łuku</b> zmniejsza siłę odśrodkową o połowę. Skuteczne, ale mniej niż prędkość.", "<b>Подвійний радіус повороту</b> зменшує відцентрову силу вдвічі. Дієво, але менше, ніж швидкість.")),
                pt(t("<b>Tiefer Schwerpunkt:</b> Last ca. 15 cm über dem Boden, Mast zurückgeneigt.", "<b>Low centre of gravity:</b> load about 15 cm above the floor, mast tilted back.", "<b>Nisko położony środek ciężkości:</b> ładunek ok. 15 cm nad podłogą, maszt odchylony do tyłu.", "<b>Низький центр ваги:</b> вантаж близько 15 см над підлогою, щогла нахилена назад.")),
                pt(t("<b>Niemals wenden</b> oder schräg fahren auf Rampen und Gefälle.", "<b>Never turn round</b> or drive diagonally on ramps and slopes.", "<b>Nigdy nie zawracaj</b> ani nie jedź ukośnie na rampach i spadkach.", "<b>Ніколи не розвертайся</b> й не їдь навскіс на рампах і схилах.")),
            ],
            merke: t("Vor der Kurve bremsen, nicht in der Kurve. Leer genauso vorsichtig wie beladen.", "Brake before the curve, not in it. Drive empty just as carefully as loaded.", "Hamuj przed łukiem, nie na łuku. Pusty jedź tak samo ostrożnie jak załadowany.", "Гальмуй перед поворотом, а не в ньому. Порожнім їзди так само обережно, як завантаженим."),
            src: { de: `${I208} Abschn. 6.4.3` },
        }),
        step("video", {
            title: t("Die Pendelachse in Aktion", "The pendulum axle in action", "Oś wahliwa w działaniu", "Маятникова вісь у дії"),
            brief: t("Nahaufnahme von hinten: Stapler fährt langsam mit einem Hinterrad über eine flache Schwelle, die Hinterachse pendelt sichtbar. Danach Grafik-Einblendung des Kippdreiecks.", "Close-up from behind: forklift drives slowly with one rear wheel over a low threshold, the rear axle visibly pivots. Then a graphic overlay of the stability triangle.", "Zbliżenie z tyłu: wózek powoli przejeżdża tylnym kołem przez niski próg, tylna oś widocznie się wychyla. Potem nakładka graficzna trójkąta stateczności.", "Крупний план ззаду: навантажувач повільно переїжджає одним заднім колесом поріг, задня вісь помітно хитається. Потім графіка трикутника."),
            length: t("20 bis 30 Sekunden", "20 to 30 seconds", "20 do 30 sekund", "20–30 секунд"),
        }),
        step("question", {
            title: t("Der Stapler kippt zur Seite. Was tust du?", "The forklift is tipping sideways. What do you do?", "Wózek przewraca się na bok. Co robisz?", "Навантажувач перекидається набік. Що робиш?"),
            layout: "list",
            options: [t("Zur tieferen Seite abspringen", "Jump off to the lower side", "Wyskakuję na niższą stronę", "Стрибаю в нижчий бік"), t("Festhalten am Lenkrad oder Schutzdach, im Sitz bleiben", "Hold on to the steering wheel or overhead guard, stay in the seat", "Trzymać się kierownicy lub daszka ochronnego, zostać w fotelu", "Триматися за кермо чи захисний дах, залишатися на сидінні")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, lebensgefährlich", "No, life-threatening", "Nie, śmiertelnie niebezpieczne", "Ні, смертельно небезпечно") },
            quote: t("„Kippt ein Gabelstapler, ist es die beste und sicherste Art solch einen Umsturz zu überstehen, sich am Lenkrad oder Fahrerschutzdach festzuhalten und den Fahrersitz nicht zu verlassen.“", "“If a forklift tips, the best and safest way to survive is to hold on to the steering wheel or overhead guard and not leave the seat.”", "„Gdy wózek się przewraca, najlepszym i najbezpieczniejszym sposobem jest trzymać się kierownicy lub daszka i nie opuszczać fotela.”", "«Якщо навантажувач перекидається, найкраще й найбезпечніше — триматися за кермо чи захисний дах і не залишати сидіння.»"),
            body: t("Wer abspringt, springt meist zur Seite, auf die der Stapler fällt, und wird erfasst. Darum gehört das Rückhaltesystem immer geschlossen.", "People who jump usually jump to the side the forklift falls to and get caught. That is why the restraint must always be closed.", "Kto wyskakuje, zwykle skacze na stronę, na którą wózek spada, i zostaje przygnieciony. Dlatego system przytrzymujący zawsze musi być zapięty lub zamknięty.", "Хто стрибає, зазвичай стрибає туди, куди падає навантажувач, і потрапляє під нього. Тому система утримання завжди має бути застебнута чи зачинена."),
            src: { de: `${I208} Abschn. 2.4 und 6.4.3` },
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: t("Du fährst eine Kurve halb so schnell. Wie groß ist die Fliehkraft?", "You take a curve at half the speed. How big is the centrifugal force?", "Pokonujesz łuk z połową prędkości. Jaka jest siła odśrodkowa?", "Ти проходиш поворот удвічі повільніше. Яка відцентрова сила?"),
                    options: [t("Halb so groß", "Half as big", "O połowę mniejsza", "Удвічі менша"), t("Ein Viertel", "A quarter", "Jedna czwarta", "Чверть"), t("Gleich", "The same", "Taka sama", "Така сама")], correct: 1,
                    why: t("Die Fliehkraft wächst mit dem Quadrat der Geschwindigkeit.", "Centrifugal force grows with the square of the speed.", "Siła odśrodkowa rośnie z kwadratem prędkości.", "Відцентрова сила зростає з квадратом швидкості.") },
                { q: t("Welche drei Punkte bilden beim Vierrad-Stapler das Kippdreieck?", "Which three points form the stability triangle on a four-wheel forklift?", "Które trzy punkty tworzą trójkąt stateczności w wózku czterokołowym?", "Які три точки утворюють трикутник стійкості у чотириколісного навантажувача?"),
                    options: [t("Beide Vorderräder und das Lager der Pendelachse", "Both front wheels and the pendulum axle bearing", "Oba przednie koła i łożysko osi wahliwej", "Обидва передні колеса й опора маятникової осі"), t("Beide Hinterräder und die Gabelspitze", "Both rear wheels and the fork tip", "Oba tylne koła i końce wideł", "Обидва задні колеса й кінець вил")], correct: 0,
                    why: t("Die Hinterachse stützt sich nur in ihrem Mittellager ab.", "The rear axle is only supported at its centre bearing.", "Tylna oś opiera się tylko w środkowym łożysku.", "Задня вісь спирається лише на центральну опору.") },
                { q: t("In welcher Höhe fährst du die Last?", "At what height do you carry the load?", "Na jakiej wysokości wieziesz ładunek?", "На якій висоті везеш вантаж?"),
                    options: [t("Ca. 15 cm über dem Boden, Mast zurück", "About 15 cm above the floor, mast back", "Ok. 15 cm nad podłogą, maszt do tyłu", "Близько 15 см над підлогою, щогла назад"), t("Auf Augenhöhe, damit sie nicht rutscht", "At eye level so it does not slip", "Na wysokości oczu, żeby się nie zsunął", "На рівні очей, щоб не зісковзнув")], correct: 0,
                    why: t("So bleibt der Gesamtschwerpunkt tief.", "This keeps the overall centre of gravity low.", "Tak wspólny środek ciężkości zostaje nisko.", "Так загальний центр ваги залишається низько.") },
            ],
            allRight: t("Alles richtig.", "All correct.", "Wszystko dobrze.", "Усе правильно."),
            someWrong: t("Probier die Kurve in der Simulation bei Bedarf noch einmal.", "Try the curve in the simulation again if needed.", "W razie potrzeby spróbuj jeszcze raz łuku w symulacji.", "За потреби спробуй поворот у симуляції ще раз."),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Kippdreieck:</b> Vorderräder und Pendelachse. Schwerpunkt außerhalb heißt Umsturz.", "<b>Stability triangle:</b> front wheels and pendulum axle. Centre of gravity outside means overturning.", "<b>Trójkąt stateczności:</b> przednie koła i oś wahliwa. Środek ciężkości poza nim oznacza wywrotkę.", "<b>Трикутник стійкості:</b> передні колеса й маятникова вісь. Центр ваги поза ним — перекидання.")),
            pt(t("<b>Leer ist in Kurven kippgefährlicher</b> als beladen.", "<b>Empty is more likely to tip in curves</b> than loaded.", "<b>Pusty łatwiej przewraca się na łukach</b> niż załadowany.", "<b>Порожній у поворотах перекидається легше,</b> ніж завантажений.")),
            pt(t("<b>Tempo runter wirkt am stärksten:</b> halbe Geschwindigkeit bedeutet nur ein Viertel der Fliehkraft.", "<b>Slowing down has the biggest effect:</b> half the speed means only a quarter of the centrifugal force.", "<b>Zwolnienie działa najmocniej:</b> połowa prędkości to tylko jedna czwarta siły odśrodkowej.", "<b>Зниження швидкості діє найсильніше:</b> половина швидкості — лише чверть відцентрової сили.")),
            pt(t("<b>Kippt er doch:</b> festhalten, sitzen bleiben, nicht springen.", "<b>If it tips anyway:</b> hold on, stay seated, do not jump.", "<b>Jeśli jednak się przewraca:</b> trzymaj się, zostań w fotelu, nie wyskakuj.", "<b>Якщо все ж перекидається:</b> тримайся, сиди, не вистрибуй.")),
        ] }),
    ];
}

/* ════════════════ 4.3 Boden, Reifen, Achsen und Gefälle ════════════════ */
export function lesson43(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Boden und Reifen", "Floor and tyres", "Podłoże i opony", "Підлога і шини"),
            lead: t("Der Stapler ist nur so standsicher wie das, worauf er steht.", "The forklift is only as stable as what it stands on.", "Wózek jest tak stateczny, jak to, na czym stoi.", "Навантажувач стійкий настільки, наскільки стійке те, на чому він стоїть."),
            points: [
                pt(t("<b>Unebene Wege:</b> Schwellen, Schienen, Bordsteine und Schlaglöcher vorsichtig und langsam überqueren und dabei die Last beobachten.", "<b>Uneven paths:</b> cross thresholds, rails, kerbs and potholes carefully and slowly while watching the load.", "<b>Nierówne drogi:</b> progi, szyny, krawężniki i dziury pokonuj ostrożnie i powoli, obserwując ładunek.", "<b>Нерівні шляхи:</b> пороги, рейки, бордюри й ями переїжджай обережно й повільно, стежачи за вантажем.")),
                pt(t("<b>Tragfähiger Untergrund:</b> Boden, Decken, Rampen und Überladebrücken müssen mehr tragen als das Gesamtgewicht des Staplers.", "<b>Load-bearing surface:</b> floors, ceilings, ramps and dock levellers must carry more than the forklift’s total weight.", "<b>Nośne podłoże:</b> podłoga, stropy, rampy i mostki przeładunkowe muszą unieść więcej niż całkowita masa wózka.", "<b>Несуча поверхня:</b> підлога, перекриття, рампи й містки мають витримувати більше за загальну масу навантажувача.")),
                pt(t("<b>Reifen:</b> schadhafte Reifen oder fehlender Luftdruck sind Mängel. Ein Reifen mit zu wenig Luft lässt den Stapler schief stehen.", "<b>Tyres:</b> damaged tyres or missing air pressure are defects. A tyre with too little air makes the forklift stand crooked.", "<b>Opony:</b> uszkodzone opony lub zbyt niskie ciśnienie to usterki. Przez oponę z za niskim ciśnieniem wózek stoi krzywo.", "<b>Шини:</b> пошкоджені шини чи замалий тиск — це несправності. Через шину з малим тиском навантажувач стоїть перекошено.")),
                pt(t("<b>Achsen:</b> Die meisten Stapler haben eine Pendelachse. Schwere Stapler können andere Bauarten haben, etwa Drehschemel- oder Kombiachsen. Wie dein Stapler reagiert, steht in der Betriebsanleitung.", "<b>Axles:</b> most forklifts have a pendulum axle. Heavy forklifts can have other designs, such as turntable or combination axles. How your forklift behaves is in the operating manual.", "<b>Osie:</b> większość wózków ma oś wahliwą. Ciężkie wózki mogą mieć inne konstrukcje, np. osie obrotnicowe lub kombinowane. Jak reaguje twój wózek, opisuje instrukcja obsługi.", "<b>Осі:</b> більшість навантажувачів має маятникову вісь. Важкі можуть мати інші конструкції, як-от поворотні чи комбіновані осі. Як поводиться твій, написано в інструкції з експлуатації.")),
            ],
            merke: t("Reifen und Luftdruck gehören zur täglichen Einsatzprüfung.", "Tyres and air pressure are part of the daily pre-use check.", "Opony i ciśnienie należą do codziennej kontroli przed pracą.", "Шини й тиск входять до щоденної перевірки перед роботою."),
            src: { de: `${I208} Abschn. 6.2, 6.4.1 und 5; DGUV V68 DA zu §8 und §9` },
        }),
        step("learn", {
            title: t("Steigung und Gefälle", "Uphill and downhill", "Wzniesienia i spadki", "Підйом і спуск"),
            lead: t("Auf geneigter Fahrbahn verschiebt sich der Schwerpunkt Richtung Tal. Zwei Regeln sind hier nicht verhandelbar.", "On a sloping surface, the centre of gravity shifts downhill. Two rules are non-negotiable here.", "Na pochyłości środek ciężkości przesuwa się w stronę spadku. Dwie zasady są tu bezwzględne.", "На схилі центр ваги зсувається в бік спуску. Два правила тут не обговорюються."),
            points: [
                pt(t("<b>Last bergseitig:</b> Mit Last hinauf vorwärts, hinunter rückwärts. Die Last ist immer auf der Bergseite.", "<b>Load uphill:</b> with a load, drive forwards up and backwards down. The load is always on the uphill side.", "<b>Ładunek od strony wzniesienia:</b> z ładunkiem pod górę przodem, w dół tyłem. Ładunek jest zawsze od strony wzniesienia.", "<b>Вантаж з боку підйому:</b> з вантажем угору передом, униз заднім ходом. Вантаж завжди з боку підйому.")),
                pt(t("<b>Bergseitig hat Vorrang</b> vor guter Sicht. Ist die Sicht versperrt, hilft ein Einweiser.", "<b>Keeping the load uphill takes priority</b> over good visibility. If the view is blocked, a banksman helps.", "<b>Ładunek od strony wzniesienia jest ważniejszy</b> niż dobra widoczność. Gdy widok jest zasłonięty, pomaga sygnalista.", "<b>Вантаж з боку підйому важливіший</b> за добрий огляд. Якщо огляд закритий, допоможе сигнальник.")),
                pt(t("<b>Niemals wenden</b> und nicht schräg fahren auf Steigungen und Gefälle.", "<b>Never turn round</b> and do not drive diagonally on uphill and downhill slopes.", "<b>Nigdy nie zawracaj</b> i nie jedź ukośnie na wzniesieniach i spadkach.", "<b>Ніколи не розвертайся</b> й не їдь навскіс на підйомах і спусках.")),
            ],
            merke: t("Merksatz: Last immer auf der Bergseite, wenden nur auf ebener Fläche.", "Rule of thumb: load always on the uphill side, turn only on level ground.", "Zasada: ładunek zawsze od strony wzniesienia, zawracaj tylko na płaskim terenie.", "Правило: вантаж завжди з боку підйому, розвертайся лише на рівній поверхні."),
            src: { de: `DGUV V68 §12 Abs. 7, DA zu §8; ${I208} Abschn. 6.4.2 und 6.4.3` },
        }),
        step("question", {
            title: t("Mitten auf der Rampe", "Halfway up the ramp", "W połowie rampy", "Посеред рампи"),
            text: t("Du fährst mit Last vorwärts die Rampe hinauf und merkst oben: falsches Tor. Am schnellsten wäre es, auf der Rampe zu wenden.", "You drive forwards up the ramp with a load and notice at the top: wrong gate. The quickest thing would be to turn round on the ramp.", "Jedziesz z ładunkiem przodem pod górę rampy i na górze zauważasz: zła brama. Najszybciej byłoby zawrócić na rampie.", "Ти їдеш з вантажем передом угору рампою і нагорі бачиш: не ті ворота. Найшвидше було б розвернутися на рампі."),
            layout: "list",
            options: [t("Langsam auf der Rampe wenden", "Turn round slowly on the ramp", "Powoli zawrócić na rampie", "Повільно розвернутися на рампі"), t("Oben auf ebener Fläche wenden, dann rückwärts hinunter", "Turn round on level ground at the top, then go down backwards", "Zawrócić na górze na płaskim, potem zjechać tyłem", "Розвернутися нагорі на рівному, потім спуститися заднім ходом"), t("Vorwärts hinunterfahren, ist ja kurz", "Drive down forwards, it is short", "Zjechać przodem, przecież to krótki odcinek", "Спуститися передом, це недовго")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, Kippgefahr", "No, tipping risk", "Nie, ryzyko wywrotki", "Ні, ризик перекидання") },
            quote: t("„Ein weiteres gefährliches Fahrmanöver, das zum seitlichen Kippen führen kann, ist das Wenden oder Kurvenfahren auf einer schiefen Ebene. Deshalb: Niemals auf geneigter Fahrbahn wenden!“", "“Another dangerous manoeuvre that can lead to tipping sideways is turning or cornering on an inclined plane. Therefore: never turn on a sloping surface!”", "„Kolejnym niebezpiecznym manewrem, który może przewrócić wózek na bok, jest zawracanie lub skręcanie na pochyłości. Dlatego: nigdy nie zawracaj na pochyłej drodze!”", "«Ще один небезпечний маневр, що може призвести до перекидання набік, — розворот чи поворот на схилі. Тому: ніколи не розвертайся на похилій дорозі!»"),
            body: t("Hinunter fährst du mit Last rückwärts, damit die Last bergseitig bleibt.", "Going down with a load, you drive backwards so the load stays uphill.", "W dół z ładunkiem jedziesz tyłem, by ładunek był od strony wzniesienia.", "Униз з вантажем їдеш задом, щоб вантаж залишався з боку підйому."),
            src: { de: `${I208} Abschn. 6.4.3; DGUV V68 §12 Abs. 7` },
        }),
        step("video", {
            title: t("Rampe richtig befahren", "Using a ramp correctly", "Prawidłowa jazda po rampie", "Правильна їзда рампою"),
            brief: t("Stapler mit Last fährt eine Rampe vorwärts hinauf, wendet oben auf ebener Fläche und fährt rückwärts hinunter, Last immer bergseitig. Seitliche Kamera.", "Forklift with load drives forwards up a ramp, turns on level ground at the top and drives down backwards, load always uphill. Side camera.", "Wózek z ładunkiem wjeżdża przodem na rampę, zawraca na górze na płaskim i zjeżdża tyłem, ładunek zawsze od strony wzniesienia. Kamera z boku.", "Навантажувач з вантажем заїжджає передом на рампу, розвертається нагорі на рівному і з’їжджає задом, вантаж завжди з боку підйому. Камера збоку."),
            length: t("25 bis 40 Sekunden", "25 to 40 seconds", "25 do 40 sekund", "25–40 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Boden:</b> Unebenheiten langsam und mit Blick auf die Last, Untergrund muss tragen.", "<b>Floor:</b> cross uneven spots slowly while watching the load; the surface must carry the weight.", "<b>Podłoże:</b> nierówności pokonuj powoli i obserwuj ładunek; podłoże musi wytrzymać ciężar.", "<b>Підлога:</b> нерівності переїжджай повільно, стежачи за вантажем; поверхня має витримувати масу.")),
            pt(t("<b>Reifen:</b> Schäden und Luftdruck täglich prüfen.", "<b>Tyres:</b> check damage and air pressure daily.", "<b>Opony:</b> codziennie sprawdzaj uszkodzenia i ciśnienie.", "<b>Шини:</b> щодня перевіряй пошкодження й тиск.")),
            pt(t("<b>Gefälle:</b> Last bergseitig, niemals wenden oder schräg fahren.", "<b>Slopes:</b> load uphill, never turn or drive diagonally.", "<b>Spadki:</b> ładunek od strony wzniesienia, nigdy nie zawracaj ani nie jedź ukośnie.", "<b>Схили:</b> вантаж з боку підйому, ніколи не розвертайся й не їдь навскіс.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson4Check(step: Mk): Step[] {
    return [
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Was zeigt das Lastschwerpunktdiagramm?", "What does the load centre diagram show?", "Co pokazuje wykres udźwigu?", "Що показує діаграма вантажопідйомності?"),
                    options: [t("Die zulässige Last je Lastschwerpunktabstand", "The permitted load per load centre distance", "Dopuszczalny ładunek dla danej odległości środka ciężkości", "Допустимий вантаж для кожної відстані центру ваги"), t("Die Höchstgeschwindigkeit", "The top speed", "Prędkość maksymalną", "Максимальну швидкість")], correct: 0,
                    why: t("DGUV Information 208-004, Abschn. 6.3.3.", "DGUV Information 208-004, section 6.3.3.", "DGUV Information 208-004, rozdz. 6.3.3.", "DGUV Information 208-004, розд. 6.3.3.") },
                { q: t("Was passiert mit dem Gesamtschwerpunkt, wenn du die Last hebst?", "What happens to the overall centre of gravity when you lift the load?", "Co dzieje się ze wspólnym środkiem ciężkości, gdy podnosisz ładunek?", "Що відбувається із загальним центром ваги під час підйому вантажу?"),
                    options: [t("Er wandert nach oben", "It moves up", "Przesuwa się w górę", "Зміщується вгору"), t("Er bleibt gleich", "It stays the same", "Zostaje bez zmian", "Не змінюється")], correct: 0,
                    why: t("Je höher der Schwerpunkt, desto größer die Kippgefahr.", "The higher the centre of gravity, the greater the risk of tipping.", "Im wyżej środek ciężkości, tym większe ryzyko wywrotki.", "Що вище центр ваги, то більший ризик перекидання.") },
                { q: t("Welcher Stapler kippt in einer zu schnellen Kurve leichter?", "Which forklift tips more easily in a curve taken too fast?", "Który wózek łatwiej przewraca się na zbyt szybkim łuku?", "Який навантажувач легше перекидається в надто швидкому повороті?"),
                    options: [t("Der leere", "The empty one", "Pusty", "Порожній"), t("Der beladene", "The loaded one", "Załadowany", "Завантажений")], correct: 0,
                    why: t("Sein Schwerpunkt liegt im schmalen Teil des Kippdreiecks.", "Its centre of gravity is in the narrow part of the stability triangle.", "Jego środek ciężkości jest w wąskiej części trójkąta stateczności.", "Його центр ваги у вузькій частині трикутника стійкості.") },
                { q: t("Was senkt die Fliehkraft am stärksten?", "What reduces centrifugal force the most?", "Co najbardziej zmniejsza siłę odśrodkową?", "Що найбільше зменшує відцентрову силу?"),
                    options: [t("Langsamer fahren", "Driving slower", "Wolniejsza jazda", "Повільніша їзда"), t("Größerer Kurvenradius", "A larger curve radius", "Większy promień łuku", "Більший радіус"), t("Mast nach vorn neigen", "Tilting the mast forwards", "Pochylenie masztu do przodu", "Нахил щогли вперед")], correct: 0,
                    why: t("Halbe Geschwindigkeit, ein Viertel der Fliehkraft.", "Half the speed, a quarter of the force.", "Połowa prędkości, ćwierć siły.", "Половина швидкості, чверть сили.") },
                { q: t("Du fährst mit Last eine Rampe hinunter. Wie?", "You drive down a ramp with a load. How?", "Zjeżdżasz z ładunkiem z rampy. Jak?", "Ти спускаєшся з вантажем рампою. Як?"),
                    options: [t("Rückwärts", "Backwards", "Tyłem", "Задом"), t("Vorwärts", "Forwards", "Przodem", "Передом")], correct: 0,
                    why: t("So bleibt die Last bergseitig.", "That way the load stays uphill.", "Tak ładunek zostaje od strony wzniesienia.", "Так вантаж залишається з боку підйому.") },
                { q: t("Der Stapler kippt. Was tust du?", "The forklift tips. What do you do?", "Wózek się przewraca. Co robisz?", "Навантажувач перекидається. Що робиш?"),
                    options: [t("Abspringen", "Jump off", "Wyskakuję", "Стрибаю"), t("Festhalten und sitzen bleiben", "Hold on and stay seated", "Trzymać się i zostać w fotelu", "Триматися й залишатися на сидінні")], correct: 1,
                    why: t("DGUV Information 208-004, Abschn. 6.4.3.", "DGUV Information 208-004, section 6.4.3.", "DGUV Information 208-004, rozdz. 6.4.3.", "DGUV Information 208-004, розд. 6.4.3.") },
            ],
            allRight: t("Stark. Modul geschafft.", "Great. Module complete.", "Świetnie. Moduł zaliczony.", "Чудово. Модуль пройдено."),
            someWrong: t("Fast. Geh bei Bedarf zu den Themen zurück.", "Almost. Go back to the topics if needed.", "Prawie. W razie potrzeby wróć do tematów.", "Майже. За потреби повернися до тем."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Schwerpunkt:</b> Lastarm klein halten, Diagramm lesen, Last tief fahren.", "<b>Centre of gravity:</b> keep the lever arm short, read the diagram, carry the load low.", "<b>Środek ciężkości:</b> utrzymuj krótkie ramię dźwigni, czytaj wykres udźwigu, wieź ładunek nisko.", "<b>Центр ваги:</b> тримай плече важеля коротким, читай діаграму вантажопідйомності, вези вантаж низько.")),
            pt(t("<b>Kurven und Gefälle:</b> langsam, große Radien, nie wenden auf der Rampe.", "<b>Curves and slopes:</b> slowly, wide radii, never turn on the ramp.", "<b>Łuki i spadki:</b> powoli, duże promienie, nie zawracaj na rampie.", "<b>Повороти й схили:</b> повільно, великі радіуси, не розвертайся на рампі.")),
        ] }),
    ];
}
