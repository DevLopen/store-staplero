/**
 * Moduł „Sondereinsätze” (spis klienta, punkt 9, moduł 8 kursu), od razu w czterech językach.
 * Źródła: DGUV Vorschrift 68 §5 DA Nr. 8, §19, §20, §24 z DA, §25, §26 z DA (wyd. 2002); DGUV Information 208-004 rozdz. 8.1–8.5;
 * DGUV G 308-001 (2022) Anhang 1 Nr. 9 i Übung 8, (Entwurf 2026) Abschn. 2.2; DGUV FBHM-144 „Umgang und Transport mit Pfannen” (04.08.2026) Abschn. 2.1 i 2.5;
 * DGUV Regel 110-003 (BGN, Kühlräume).
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
const FBHM = "DGUV FBHM-144 (Stand 04.08.2026)";

const ZONE_TEXTS = texts([
    ["Gefahren gefunden", "Hazards found", "Znalezione zagrożenia", "Знайдено небезпек"], ["Alle Gefahren gefunden", "All hazards found", "Wszystkie zagrożenia znalezione", "Усі небезпеки знайдено"],
    ["Gefahr: {l}", "Hazard: {l}", "Zagrożenie: {l}", "Небезпека: {l}"], ["In Ordnung: {l}", "All right: {l}", "W porządku: {l}", "Усе гаразд: {l}"],
    ["Tippe auf die Punkte in der Halle. Nicht alles ist falsch.", "Tap the points. Not everything is wrong.", "Dotknij punktów. Nie wszystko jest złe.", "Торкайся точок. Не все неправильно."],
    ["Ganze Halle zeigen", "Show the whole scene", "Pokaż całą scenę", "Показати всю сцену"],
]);
const TOW_TEXTS = texts([
    ["Anhängekupplung", "Trailer coupling", "Sprzęg holowniczy", "Тягово-зчіпний пристрій"],
    ["Fahrerschutzdach", "Overhead guard", "Dach ochronny", "Захисний дах"],
    ["Lenkachse", "Steering axle", "Oś skrętna", "Керована вісь"],
    ["Anhängelast max. {n} kg", "Trailer load max. {n} kg", "Dopuszczalna masa przyczepy maks. {n} kg", "Причіпне навантаження макс. {n} кг"],
    ["Wo kuppelst du an?", "Where do you couple?", "Gdzie podczepiasz przyczepę?", "Де зчіплюєш?"],
    ["Was kommt auf den Anhänger?", "What goes on the trailer?", "Co ładujesz na przyczepę?", "Що ставиш на причіп?"],
    ["Losfahren und bremsen", "Drive off and brake", "Ruszaj i hamuj", "Рушай і гальмуй"],
    ["Nochmal einstellen", "Adjust again", "Ustaw ponownie", "Налаштуй знову"],
]);

/* ════════════════ Lernziele ════════════════ */
export function lesson8Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Sondereinsätze", "Special operations", "Zastosowania specjalne", "Особливі види робіт"), image: "forklift",
            text: t("Menschen in die Höhe heben, auf die Straße fahren, Anhänger ziehen oder in Kälte, Ex-Bereichen und Gießereien arbeiten: Hier gelten zusätzliche Regeln.",
                "Lifting people up, driving on the road, towing trailers or working in cold stores, explosive areas and foundries: extra rules apply here.",
                "Podnoszenie ludzi, jazda po drodze publicznej, ciągnięcie przyczep albo praca w chłodni, strefie zagrożonej wybuchem i odlewni: tu obowiązują dodatkowe zasady.",
                "Піднімати людей, їздити дорогою, тягнути причепи або працювати в холоді, вибухонебезпечних зонах і ливарнях: тут діють додаткові правила."),
            meta: [t("ca. 45 Minuten", "about 45 minutes", "ok. 45 minut", "близько 45 хвилин"), t("4 Themen und Modul-Check", "4 topics and module check", "4 tematy i test modułu", "4 теми і перевірка модуля"), { de: "DGUV V68 §19, §20, §24–26" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "Your learning goals for this module. 1 = new to me, 5 = confident.", "Twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: [
                { code: "8.1", text: t("Ich weiß, wann Personen mitfahren oder mit einer Arbeitsbühne gehoben werden dürfen.", "I know when people may ride along or be lifted on a work platform.", "Wiem, kiedy wolno przewozić osoby lub podnosić je na podeście roboczym.", "Я знаю, коли можна возити людей або піднімати їх на робочій платформі."), short: t("Arbeitsbühne", "Work platform", "Podest roboczy", "Робоча платформа") },
                { code: "8.2", text: t("Ich kenne die Regeln für öffentliche Straßen, Anhänger und Eisenbahnwaggons.", "I know the rules for public roads, trailers and railway wagons.", "Znam zasady dla dróg publicznych, przyczep i wagonów kolejowych.", "Я знаю правила для доріг загального користування, причепів і вагонів."), short: t("Straße und Anhänger", "Road and trailer", "Droga i przyczepa", "Дорога й причіп") },
                { code: "8.3", text: t("Ich weiß, was in Ex-Bereichen, im Tiefkühllager und beim Transport feuerflüssiger Massen gilt.", "I know the rules in explosive areas, cold stores and when transporting molten masses.", "Wiem, co obowiązuje w strefach Ex, w mroźni i przy transporcie ciekłego metalu.", "Я знаю правила у вибухонебезпечних зонах, морозильних складах і при транспортуванні розплаву."), short: t("Besondere Bereiche", "Special areas", "Obszary szczególne", "Особливі зони") },
                { code: "8.4", text: t("Ich halte Abstand zu Freileitungen und weiß, was bei Kontakt zu tun ist.", "I keep away from overhead lines and know what to do on contact.", "Trzymam odstęp od linii napowietrznych i wiem, co robić przy kontakcie.", "Я тримаю відстань до повітряних ліній і знаю, що робити при контакті.") },
            ],
        }),
        step("sort", {
            title: t("Erlaubt oder nicht?", "Allowed or not?", "Wolno czy nie?", "Можна чи ні?"),
            lead: t("Entscheide aus dem Bauch heraus.", "Go with your gut feeling.", "Zdecyduj intuicyjnie.", "Вирішуй інтуїтивно."),
            labels: [t("Erlaubt", "Allowed", "Wolno", "Можна"), t("Verboten", "Not allowed", "Nie wolno", "Не можна")],
            items: [
                { t: t("Einen Kollegen auf einer leeren Palette hochheben, damit er eine Lampe wechselt", "Lifting a colleague on an empty pallet to change a lamp", "Podnieść kolegę na pustej palecie, żeby wymienił lampę", "Підняти колегу на порожній палеті, щоб він замінив лампу"), a: 1, why: t("Personen werden nur in einer geeigneten Arbeitsbühne gehoben.", "People are only lifted in a suitable work platform.", "Ludzi podnosi się tylko w odpowiednim podeście roboczym.", "Людей піднімають лише у відповідній робочій платформі.") },
                { t: t("Mit dem Gasstapler in einen explosionsgefährdeten Bereich fahren", "Driving into an explosive area with an LPG forklift", "Wjechać wózkiem gazowym do strefy zagrożonej wybuchem", "Заїхати газовим навантажувачем у вибухонебезпечну зону"), a: 1, why: t("In Ex-Bereichen dürfen nur explosionsgeschützte Stapler fahren.", "Only explosion-protected trucks may drive in explosive areas.", "W strefach Ex mogą jeździć tylko wózki w wykonaniu przeciwwybuchowym.", "У вибухонебезпечних зонах можуть їздити лише вибухозахищені навантажувачі.") },
                { t: t("Einen Anhänger an der dafür vorgesehenen Kupplung ziehen", "Towing a trailer on the coupling provided for it", "Ciągnąć przyczepę na przewidzianym do tego sprzęgu", "Тягнути причіп на призначеному зчіпному пристрої"), a: 0, why: t("Wenn Stapler und Anhänger dafür eingerichtet sind und die Anhängelast stimmt.", "If forklift and trailer are set up for it and the permitted trailer load is not exceeded.", "Jeśli wózek i przyczepa są do tego przystosowane, a dopuszczalna masa przyczepy nie jest przekroczona.", "Якщо навантажувач і причіп для цього обладнані, а допустиму масу причепа не перевищено.") },
                { t: t("Mit dem Werksstapler kurz über die öffentliche Straße zum Nachbarhof fahren", "Briefly driving the company forklift across the public road to the neighbouring yard", "Przejechać wózkiem zakładowym kawałek drogą publiczną na sąsiedni plac", "Коротко проїхати заводським навантажувачем дорогою на сусідній двір"), a: 1, why: t("Ohne Zulassung, Ausrüstung und passenden Führerschein nicht. Der Staplerschein allein reicht dafür nicht.", "Not without registration, equipment and the right driving licence. The forklift licence alone is not enough.", "Nie bez dopuszczenia do ruchu, wyposażenia i odpowiedniego prawa jazdy. Sam Staplerschein nie wystarczy.", "Не без допуску, обладнання й відповідного посвідчення водія. Самого Staplerschein недостатньо.") },
            ],
            allRight: t("Gutes Gespür. Jetzt schauen wir genauer hin.", "Good instinct. Now let us look closer.", "Dobre wyczucie. Teraz przyjrzymy się bliżej.", "Гарне чуття. Тепер придивимося ближче."),
            someWrong: t("Kein Problem, genau das klären wir jetzt.", "No problem, that is exactly what we will clear up now.", "Nie szkodzi, właśnie to teraz wyjaśnimy.", "Нічого, саме це зараз з’ясуємо."),
        }),
    ];
}

/* ════════════════ 8.1 Arbeitsbühnen und Mitnahme ════════════════ */
export function lesson81(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Mitfahren nur mit eigenem Platz", "Riding along only with a dedicated place", "Przewóz osób tylko na osobnym miejscu", "Возити людей лише на окремому місці"),
            lead: t("Der Stapler ist kein Taxi. Mitnahme gibt es nur, wenn alles dafür vorbereitet ist.", "The forklift is not a taxi. Carrying people only when everything is prepared for it.", "Wózek to nie taksówka. Przewóz osób tylko wtedy, gdy wszystko jest do tego przygotowane.", "Навантажувач не таксі. Возити людей можна лише тоді, коли все для цього підготовлено."),
            points: [
                pt(t("<b>Beifahrersitz:</b> mit Rückhalteeinrichtung und Haltegriff innerhalb der Kontur des Staplers.", "<b>Passenger seat:</b> with a restraint and a grab handle within the contour of the forklift.", "<b>Fotel pasażera:</b> z systemem przytrzymującym i uchwytem w obrysie wózka.", "<b>Сидіння пасажира:</b> із системою утримання й поручнем у межах контуру навантажувача.")),
                pt(t("<b>Erlaubt vom Unternehmer:</b> geregelt in der Betriebsanweisung, zum Beispiel für Fahrlehrer oder Helfer beim Be- und Entladen.", "<b>Permitted by the employer:</b> regulated in the operating instructions, e.g. for driving instructors or helpers when loading.", "<b>Zgoda pracodawcy:</b> uregulowana w instrukcji stanowiskowej, np. dla instruktora albo pomocnika przy załadunku.", "<b>Дозвіл роботодавця:</b> урегульовано в робочій інструкції, напр. для інструктора чи помічника при навантаженні.")),
                pt(t("<b>Während der Fahrt verboten:</b> auf- und absteigen, von einem Gerät auf ein anderes steigen, die Beine heraushängen lassen.", "<b>Forbidden while driving:</b> getting on or off, climbing from one truck to another, letting legs hang out.", "<b>W czasie jazdy zakazane:</b> wsiadanie i wysiadanie, przechodzenie z pojazdu na pojazd, zwieszanie nóg.", "<b>Під час руху заборонено:</b> заходити й сходити, переходити з машини на машину, звішувати ноги.")),
            ],
            src: { de: `${V68} §25; ${I208} Abschn. 8.1` },
        }),
        step("learn", {
            title: t("Die Arbeitsbühne", "The work platform", "Podest roboczy", "Робоча платформа"),
            lead: t("Wer mit dem Hubgerüst nach oben fährt, steht in einer Arbeitsbühne. Nie auf Gabel oder Palette.", "Anyone lifted by the mast stands in a work platform. Never on the forks or a pallet.", "Kto jest podnoszony masztem, stoi w podeście roboczym. Nigdy na widłach ani na palecie.", "Кого піднімають щоглою, той стоїть у робочій платформі. Ніколи на вилах чи палеті."),
            points: [
                pt(t("<b>Sicher befestigt:</b> formschlüssig am Lastaufnahmemittel, damit sie nicht abrutschen oder abkippen kann.", "<b>Securely fixed:</b> positively locked to the load handling device so it cannot slip or tip off.", "<b>Pewnie zamocowany:</b> połączony kształtowo z osprzętem (np. zablokowany na widłach), żeby nie mógł się zsunąć ani przechylić.", "<b>Надійно закріплена:</b> з геометричним замиканням на вантажозахоплювачі, щоб не зісковзнула й не перекинулась.")),
                pt(t("<b>Geländer:</b> fest, mindestens 1 m hoch, mit Handlauf, Knie- und Fußleiste. Ketten oder Seile als Absturzsicherung sind verboten.", "<b>Railing:</b> rigid, at least 1 m high, with handrail, knee rail and toe board. Chains or ropes as fall protection are forbidden.", "<b>Barierka:</b> sztywna, co najmniej 1 m wysokości, z poręczą, poprzeczką kolanową i bortnicą. Łańcuchy lub liny jako zabezpieczenie przed upadkiem są zakazane.", "<b>Огородження:</b> жорстке, щонайменше 1 м, з поручнем, колінною планкою й бортиком. Ланцюги чи троси як захист від падіння заборонені.")),
                pt(t("<b>Rückenschutz zum Hubmast:</b> mindestens 1,80 m hoch und durchgriffsicher, gegen Quetschen und Scheren.", "<b>Back guard towards the mast:</b> at least 1.80 m high and reach-proof, against crushing and shearing.", "<b>Osłona od strony masztu:</b> co najmniej 1,80 m wysokości, bez możliwości przełożenia rąk, przeciw zgnieceniu i ścięciu.", "<b>Захист з боку щогли:</b> щонайменше 1,80 м, без можливості просунути руку, від затискання й зрізання.")),
                pt(t("<b>Tragfähigkeit:</b> wenn der Hersteller die Bühne vorsieht. Sonst beim Frontstapler: Bühne höchstens so groß wie eine Europalette, Standplatz auf Höhe der Gabel und mindestens 5-fache Tragfähigkeit für Bühne, Personen und Zuladung.", "<b>Capacity:</b> if the manufacturer provides for the platform. Otherwise for front forklifts: platform no larger than a Euro pallet, standing place at fork height and at least 5 times the capacity for platform, people and payload.", "<b>Udźwig:</b> jeśli producent przewiduje podest. W przeciwnym razie przy wózku czołowym: podest nie większy niż europaleta, stanowisko na wysokości wideł i co najmniej 5-krotny udźwig dla podestu, osób i ładunku.", "<b>Вантажопідйомність:</b> якщо виробник передбачає платформу. Інакше для фронтального навантажувача: платформа не більша за європалету, місце на рівні вил і щонайменше 5-кратна вантажопідйомність для платформи, людей і вантажу.")),
            ],
            src: { de: `${V68} §26 Abs. 1 und 4 mit DA; ${I208} Abschn. 8.2` },
        }),
        step("learn", {
            title: t("Während die Bühne oben ist", "While the platform is up", "Gdy podest jest w górze", "Поки платформа вгорі"),
            lead: t("Fahrer und Person auf der Bühne arbeiten als Team.", "The driver and the person on the platform work as a team.", "Operator i osoba na podeście pracują jako zespół.", "Водій і людина на платформі працюють як команда."),
            points: [
                pt(t("<b>Erst heben, wenn alles zu ist:</b> Bühne befestigt, Umwehrung geschlossen. Ihr müsst euch jederzeit verständigen können.", "<b>Lift only when everything is closed:</b> platform fixed, guard closed. You must be able to communicate at all times.", "<b>Podnoś dopiero, gdy wszystko jest zamknięte:</b> podest zamocowany, barierka zamknięta. Musicie mieć możliwość porozumiewania się przez cały czas.", "<b>Піднімай лише, коли все закрито:</b> платформа закріплена, огородження зачинене. Ви повинні весь час мати змогу порозумітися.")),
                pt(t("<b>Du bleibst auf deinem Platz,</b> solange die Bühne oben ist.", "<b>You stay in your place</b> as long as the platform is up.", "<b>Zostajesz na swoim miejscu,</b> dopóki podest jest w górze.", "<b>Ти лишаєшся на своєму місці,</b> доки платформа вгорі.")),
                pt(t("<b>Nicht verfahren</b> mit besetzter Bühne. Ausnahme: Feinpositionieren an der Einsatzstelle.", "<b>Do not drive</b> with an occupied platform. Exception: fine positioning at the work spot.", "<b>Nie przemieszczaj wózka</b> z zajętym podestem. Wyjątek: precyzyjne ustawienie na miejscu pracy.", "<b>Не переїжджай</b> із зайнятою платформою. Виняток: точне позиціонування на місці.")),
                pt(t("<b>Auf der Bühne:</b> Standplatz nicht mit Kisten oder Leitern erhöhen, nicht hinauslehnen oder hinausgreifen, solange sie sich bewegt.", "<b>On the platform:</b> do not raise the standing place with boxes or ladders, do not lean or reach out while it moves.", "<b>Na podeście:</b> nie podwyższać stanowiska skrzynkami ani drabinami, nie wychylać się ani nie sięgać na zewnątrz w czasie ruchu.", "<b>На платформі:</b> не підвищувати місце для стояння ящиками чи драбинами, не перехилятися й не тягнутися назовні під час руху.")),
            ],
            merke: t("Bühne oben heißt: Fahrer auf dem Sitz, Stapler steht.", "Platform up means: driver in the seat, forklift stays put.", "Podest w górze oznacza: operator na fotelu, wózek stoi.", "Платформа вгорі означає: водій на сидінні, навантажувач стоїть."),
            src: { de: `${V68} §26 Abs. 3, 5–9` },
        }),
        step("sim", { sim: "people", scene: "platform", texts: ZONE_TEXTS,
            title: t("Was stimmt hier nicht?", "What is wrong here?", "Co tu jest nie tak?", "Що тут не так?"),
            lead: t("Ein Kollege wechselt eine Hallenleuchte. Finde die drei Fehler. Drehe die Szene mit dem Finger.", "A colleague is changing a hall light. Find the three mistakes. Rotate the scene with your finger.", "Kolega wymienia lampę w hali. Znajdź trzy błędy. Obracaj scenę palcem.", "Колега міняє світильник у цеху. Знайди три помилки. Обертай сцену пальцем."),
            zones: [
                { id: "chain", bad: true, label: t("Ketten statt Geländer", "Chains instead of railing", "Łańcuchy zamiast barierki", "Ланцюги замість огородження"), why: t("Auf der linken Seite hängen nur Ketten. Umwehrungen aus Ketten oder Seilen sind als Absturzsicherung verboten.", "On the left side only chains hang. Guards made of chains or ropes are forbidden as fall protection.", "Z lewej strony wiszą tylko łańcuchy. Barierki z łańcuchów lub lin są zakazane jako zabezpieczenie przed upadkiem.", "Зліва висять лише ланцюги. Огородження з ланцюгів чи тросів заборонене як захист від падіння.") },
                { id: "boost", bad: true, label: t("Kiste als Tritt", "Box as a step", "Skrzynka jako podwyższenie", "Ящик як підставка"), why: t("Wer auf einer Kiste steht, ist über das Geländer hinaus. Der Standplatz darf nicht erhöht werden.", "Anyone standing on a box is above the railing. The standing place must not be raised.", "Kto stoi na skrzynce, jest ponad barierką. Stanowiska nie wolno podwyższać.", "Хто стоїть на ящику, опиняється вище за огородження. Місце для стояння не можна підвищувати.") },
                { id: "driver", bad: true, label: t("Fahrer nicht auf dem Stapler", "Driver not on the forklift", "Operator poza wózkiem", "Водій не на навантажувачі"), why: t("Bei hochgefahrener Bühne bleibt der Fahrer auf seinem Platz. Nur so kann er sofort absenken und reagieren.", "With the platform raised, the driver stays in place. Only then can they lower and react immediately.", "Przy podniesionym podeście operator zostaje na miejscu. Tylko wtedy może od razu opuścić podest i zareagować.", "Коли платформа піднята, водій лишається на місці. Лише так він може одразу опустити платформу й зреагувати.") },
                { id: "back", label: t("Rückenschutz zum Mast", "Back guard towards the mast", "Osłona od strony masztu", "Захист з боку щогли"), why: t("1,80 m hohes Gitter zur Mastseite: schützt vor Quetschen und Scheren im Hubgerüst.", "1.80 m high mesh on the mast side: protects against crushing and shearing in the mast.", "Siatka o wysokości 1,80 m od strony masztu chroni przed zgnieceniem i ścięciem w maszcie.", "Сітка висотою 1,80 м з боку щогли захищає від затискання й зрізання в щоглі.") },
                { id: "cones", label: t("Bereich abgesperrt", "Area cordoned off", "Strefa odgrodzona", "Зону огороджено"), why: t("Niemand läuft unter der Bühne durch. So soll es sein.", "Nobody walks under the platform. That is how it should be.", "Nikt nie przechodzi pod podestem. Tak ma być.", "Ніхто не проходить під платформою. Так і має бути.") },
            ],
            done: t("Alle drei Fehler gefunden.", "All three mistakes found.", "Znalazłeś wszystkie trzy błędy.", "Усі три помилки знайдено."),
            src: { de: `${V68} §26 mit DA; ${I208} Abschn. 8.2` } }),
        step("question", {
            title: t("Reicht die Tragfähigkeit?", "Is the capacity enough?", "Czy udźwig wystarczy?", "Чи вистачить вантажопідйомності?"),
            text: t("Der Hersteller sieht keine Arbeitsbühne vor. Bühne 160 kg, ein Kollege 90 kg, Werkzeug 20 kg. Der Stapler trägt bei dieser Hubhöhe 1200 kg.", "The manufacturer does not provide for a work platform. Platform 160 kg, one colleague 90 kg, tools 20 kg. The forklift carries 1200 kg at this lift height.", "Producent nie przewiduje podestu. Podest 160 kg, kolega 90 kg, narzędzia 20 kg. Wózek na tej wysokości ma udźwig 1200 kg.", "Виробник не передбачає платформу. Платформа 160 кг, колега 90 кг, інструмент 20 кг. На цій висоті навантажувач тримає 1200 кг."),
            layout: "list",
            options: [t("Ja, 1200 kg sind viel mehr als 270 kg", "Yes, 1200 kg is far more than 270 kg", "Tak, 1200 kg to dużo więcej niż 270 kg", "Так, 1200 кг значно більше за 270 кг"), t("Nein, nötig wären 5 × 270 kg = 1350 kg", "No, 5 × 270 kg = 1350 kg would be needed", "Nie, potrzeba by 5 × 270 kg = 1350 kg", "Ні, потрібно 5 × 270 кг = 1350 кг")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, hier gilt das Fünffache", "No, five times applies here", "Nie, tu obowiązuje pięciokrotność", "Ні, тут діє п’ятикратний запас") },
            body: t("Ohne Herstellerfreigabe braucht der Frontstapler bei der jeweiligen Hubhöhe mindestens die 5-fache Tragfähigkeit von Bühne, Personen und Zuladung. 1200 kg reichen nicht.", "Without manufacturer approval, the front forklift needs a capacity of at least 5 times the weight of platform, people and payload at the lift height in question. 1200 kg is not enough.", "Bez zgody producenta wózek czołowy potrzebuje na danej wysokości udźwigu równego co najmniej 5-krotności masy podestu, osób i ładunku. 1200 kg nie wystarczy.", "Без дозволу виробника фронтальному навантажувачу на цій висоті потрібна вантажопідйомність щонайменше в 5 разів більша за масу платформи, людей і вантажу. 1200 кг замало."),
            src: { de: `${V68} DA zu §26 Abs. 1` },
        }),
        step("video", {
            title: t("Arbeiten mit der Arbeitsbühne", "Working with the work platform", "Praca z podestem roboczym", "Робота з робочою платформою"),
            brief: t("Bühne wird auf die Gabeln geschoben und verriegelt, Tür geschlossen, Bereich abgesperrt. Fahrer hebt langsam, bleibt sitzen, Verständigung per Handzeichen. Nahaufnahme Verriegelung und Rückenschutz.", "Platform is pushed onto the forks and locked, door closed, area cordoned off. Driver lifts slowly, stays seated, communication by hand signals. Close-up of the lock and back guard.", "Podest zostaje nasunięty na widły i zablokowany, furtka zamknięta, strefa odgrodzona. Operator powoli podnosi, zostaje na fotelu, porozumiewanie się gestami. Zbliżenie blokady i osłony od strony masztu.", "Платформу насувають на вила й фіксують, дверцята зачинено, зону огороджено. Водій повільно піднімає, сидить, зв’язок жестами. Крупний план фіксатора й захисту."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Mitfahren</b> nur auf eigenem Sitz mit Rückhaltung und Erlaubnis.", "<b>Riding along</b> only on a dedicated seat with a restraint and with permission.", "<b>Przewóz osób</b> tylko na osobnym siedzeniu z systemem przytrzymującym i za zgodą pracodawcy.", "<b>Возити людей</b> лише на окремому сидінні із системою утримання й з дозволу.")),
            pt(t("<b>Arbeitsbühne:</b> befestigt, festes Geländer, Rückenschutz, genug Tragfähigkeit.", "<b>Work platform:</b> fixed, rigid railing, back guard, enough capacity.", "<b>Podest roboczy:</b> zamocowany, sztywna barierka, osłona od strony masztu, wystarczający udźwig.", "<b>Робоча платформа:</b> закріплена, жорстке огородження, захист з боку щогли, достатня вантажопідйомність.")),
            pt(t("<b>Bühne oben:</b> Fahrer bleibt sitzen, Stapler wird nicht verfahren.", "<b>Platform up:</b> driver stays seated, forklift is not driven.", "<b>Podest w górze:</b> operator zostaje na fotelu, wózek się nie przemieszcza.", "<b>Платформа вгорі:</b> водій сидить, навантажувач не переїжджає.")),
        ] }),
    ];
}

/* ════════════════ 8.2 Straße, Anhänger, Waggons ════════════════ */
export function lesson82(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Auf der öffentlichen Straße", "On the public road", "Na drodze publicznej", "На дорозі загального користування"),
            lead: t("Öffentlich ist alles, was jeder benutzen darf, auch der Gehweg vor dem Tor.", "Public means anything anyone may use, including the pavement in front of the gate.", "Drogą publiczną jest wszystko, z czego każdy może korzystać, także chodnik przed bramą.", "Дорогою загального користування є все, чим може користуватися будь-хто, навіть тротуар перед воротами."),
            points: [
                pt(t("<b>Straßenverkehrsrecht gilt:</b> Der Stapler braucht eine Zulassung oder Ausnahmegenehmigung und die passende Ausrüstung, zum Beispiel Beleuchtung, Blinker, Bremslichter, Außenspiegel und Reifenprofil.", "<b>Road traffic law applies:</b> the forklift needs registration or an exemption permit and suitable equipment, e.g. lights, indicators, brake lights, exterior mirrors and tyre tread.", "<b>Obowiązuje prawo drogowe:</b> wózek potrzebuje dopuszczenia lub zezwolenia wyjątkowego i odpowiedniego wyposażenia, np. świateł, kierunkowskazów, świateł stopu, lusterek zewnętrznych i odpowiedniego bieżnika opon.", "<b>Діють правила дорожнього руху:</b> навантажувачу потрібен допуск або винятковий дозвіл і відповідне обладнання, наприклад фари, покажчики повороту, стоп-сигнали, зовнішні дзеркала й протектор шин.")),
                pt(t("<b>Führerschein:</b> Bis 6 km/h ist keiner nötig. Bis 25 km/h reicht Klasse L. Schnellere Stapler brauchen je nach Gewicht B, C1 oder C.", "<b>Driving licence:</b> none needed up to 6 km/h. Class L is enough up to 25 km/h. Faster trucks need B, C1 or C depending on weight.", "<b>Prawo jazdy:</b> do 6 km/h nie jest potrzebne. Do 25 km/h wystarczy kat. L. Szybsze wózki wymagają zależnie od masy kat. B, C1 albo C.", "<b>Посвідчення водія:</b> до 6 км/год не потрібне. До 25 км/год досить категорії L. Швидшим навантажувачам потрібні категорії B, C1 або C залежно від маси.")),
                pt(t("<b>Zwei verschiedene Nachweise:</b> Der Staplerschein ersetzt keinen Führerschein, und ein Autoführerschein macht dich nicht zum Staplerfahrer.", "<b>Two different proofs:</b> the forklift licence does not replace a driving licence, and a car licence does not make you a forklift driver.", "<b>Dwa różne dokumenty:</b> Staplerschein nie zastępuje prawa jazdy, a prawo jazdy na samochód nie czyni cię operatorem wózka.", "<b>Два різні документи:</b> Staplerschein не замінює посвідчення водія, а права на авто не роблять тебе водієм навантажувача.")),
            ],
            src: { de: `${I208} Abschn. 8.5; DGUV G 308-001 (Entwurf 2026) Abschn. 2.2; FeV` },
        }),
        step("learn", {
            title: t("Anhänger ziehen", "Towing trailers", "Ciągnięcie przyczep", "Буксирування причепів"),
            lead: t("Gezogen wird nur, was der Zug auch sicher bremsen kann.", "Only tow what the train can also brake safely.", "Ciągniesz tylko to, co zestaw bezpiecznie wyhamuje.", "Тягнеш лише те, що весь потяг безпечно загальмує."),
            points: [
                pt(t("<b>Dafür eingerichtet:</b> Stapler und Anhänger sind fürs Ziehen gebaut. Angekuppelt wird nur an der vom Hersteller vorgesehenen Stelle.", "<b>Set up for it:</b> forklift and trailer are built for towing. Couple only at the point the manufacturer provides.", "<b>Przystosowanie:</b> wózek i przyczepa są przeznaczone do ciągnięcia. Podczepiasz tylko w miejscu przewidzianym przez producenta.", "<b>Обладнані для цього:</b> навантажувач і причіп призначені для буксирування. Зчіплюєш лише в місці, передбаченому виробником.")),
                pt(t("<b>Anhängelast:</b> Anhänger plus Ladung. Der Unternehmer nennt dir den Wert für deinen Einsatzort. Faustregel: Nur ziehen, was du auch mit der Gabel heben könntest.", "<b>Trailer load:</b> trailer plus cargo. The employer tells you the value for your site. Rule of thumb: only tow what you could also lift with the forks.", "<b>Dopuszczalna masa przyczepy:</b> przyczepa plus ładunek. Pracodawca podaje ci wartość dla twojego miejsca pracy. Zasada: ciągnij tylko to, co dałbyś radę podnieść widłami.", "<b>Причіпне навантаження:</b> причіп плюс вантаж. Роботодавець називає значення для твого місця. Правило: тягни лише те, що міг би підняти вилами.")),
                pt(t("<b>Vor der Fahrt:</b> prüfen, ob richtig gekuppelt ist. Der Zug muss bei allen Fahrbewegungen sicher gebremst werden können.", "<b>Before driving:</b> check the coupling is correct. The train must be able to brake safely in all movements.", "<b>Przed jazdą:</b> sprawdź, czy przyczepa jest prawidłowo podczepiona. Zestaw musi bezpiecznie hamować przy każdym ruchu.", "<b>Перед рухом:</b> перевір правильність зчеплення. Потяг має безпечно гальмувати за будь-якого руху.")),
            ],
            src: { de: `${V68} §24 mit DA; ${I208} Abschn. 8.3` },
        }),
        step("sim", { sim: "tow", texts: TOW_TEXTS,
            title: t("Anhänger ankuppeln und losfahren", "Couple the trailer and drive off", "Podczep przyczepę i ruszaj", "Зчепи причіп і рушай"),
            lead: t("Wähle den Kupplungspunkt und die Ladung. Achte auf das Schild an der Kupplung.", "Choose the coupling point and the cargo. Watch the sign on the coupling.", "Wybierz punkt podczepienia i ładunek. Zwróć uwagę na tabliczkę przy sprzęgu.", "Обери точку зчеплення й вантаж. Зверни увагу на табличку біля зчеплення."),
            maxKg: 3000,
            loads: [
                { id: "light", kg: 1400, label: t("Zwei Paletten Kartons", "Two pallets of cartons", "Dwie palety kartonów", "Дві палети коробок") },
                { id: "heavy", kg: 4200, label: t("Drei Gitterboxen Stahlteile", "Three mesh boxes of steel parts", "Trzy palety siatkowe z częściami stalowymi", "Три сітчасті бокси зі сталевими деталями") },
            ],
            outcomes: {
                ok: { title: t("Sicherer Zug", "Safe train", "Bezpieczny zestaw", "Безпечний потяг"), text: t("Angekuppelt an der vorgesehenen Kupplung und unter der Anhängelast. Der Zug bremst ruhig.", "Coupled at the intended coupling and below the trailer load. The train brakes calmly.", "Podczepione na właściwym sprzęgu i poniżej dopuszczalnej masy przyczepy. Zestaw hamuje spokojnie.", "Зчеплено на призначеному пристрої й у межах допустимого причіпного навантаження. Потяг гальмує спокійно.") },
                wrong: { title: t("Falscher Kupplungspunkt", "Wrong coupling point", "Zły punkt podczepienia", "Неправильна точка зчеплення"), text: t("Fahrerschutzdach und Lenkachse sind keine Zugpunkte. Sie können verbiegen oder abreißen. Angekuppelt wird nur an der vom Hersteller vorgesehenen Kupplung.", "The overhead guard and steering axle are not towing points. They can bend or tear off. Couple only at the coupling provided by the manufacturer.", "Daszek ochronny i oś skrętna to nie punkty holowania. Mogą się wygiąć albo urwać. Podczepiasz tylko na sprzęgu przewidzianym przez producenta.", "Захисний дах і керована вісь — не точки буксирування. Вони можуть погнутися чи відірватися. Зчіплюй лише на зчіпному пристрої, передбаченому виробником.") },
                over: { title: t("Anhänger zu schwer", "Trailer too heavy", "Przyczepa za ciężka", "Причіп заважкий"), text: t("4200 kg bei erlaubten 3000 kg: Beim Bremsen schiebt der Anhänger den Stapler weiter und knickt ein. Die Anhängelast darf nicht überschritten werden.", "4200 kg with 3000 kg allowed: when braking, the trailer pushes the forklift on and jackknifes. The trailer load must not be exceeded.", "4200 kg przy dozwolonych 3000 kg: przy hamowaniu przyczepa pcha wózek dalej i zestaw się składa. Dopuszczalnej masy przyczepy nie wolno przekraczać.", "4200 кг при дозволених 3000 кг: при гальмуванні причіп штовхає навантажувач і потяг складається. Причіпне навантаження перевищувати не можна.") },
            },
            done: t("So ziehst du sicher.", "That is how you tow safely.", "Tak bezpiecznie ciągniesz przyczepę.", "Так буксируєш безпечно."),
            src: { de: `${V68} §24; ${I208} Abschn. 8.3` } }),
        step("learn", {
            title: t("Eisenbahnwaggons", "Railway wagons", "Wagony kolejowe", "Залізничні вагони"),
            lead: t("Waggons sind schwer und rollen leicht. Hier passieren schnell schwere Unfälle.", "Wagons are heavy and roll easily. Serious accidents happen quickly here.", "Wagony są ciężkie i łatwo się toczą. Tu szybko dochodzi do ciężkich wypadków.", "Вагони важкі й легко котяться. Тут швидко стаються тяжкі нещасні випадки."),
            points: [
                pt(t("<b>Verziehen nur mit dem richtigen Gerät:</b> Der Stapler muss dafür bestimmt sein und eine Einrichtung haben, die verhindert, dass er vom Waggon mit- oder umgerissen wird.", "<b>Moving wagons only with the right equipment:</b> the forklift must be intended for it and have a device that prevents it from being dragged along or overturned by the wagon.", "<b>Przetaczanie tylko właściwym sprzętem:</b> wózek musi być do tego przeznaczony i mieć urządzenie, które nie pozwoli, by wagon go pociągnął lub przewrócił.", "<b>Пересувати вагони лише відповідною технікою:</b> навантажувач має бути для цього призначений і мати пристрій, що не дасть вагону його потягнути чи перекинути.")),
                pt(t("<b>Beladen:</b> nur wenn der Waggon gegen Wegrollen gesichert ist, über eine sichere Ladebrücke.", "<b>Loading:</b> only when the wagon is secured against rolling, via a safe loading bridge.", "<b>Załadunek:</b> tylko gdy wagon jest zabezpieczony przed odtoczeniem, po bezpiecznym pomoście.", "<b>Навантаження:</b> лише коли вагон захищений від скочування, через безпечний місток.")),
                pt(t("<b>Beim Herausfahren:</b> besonders vorsichtig, hupen. Gleise langsam und unter Beobachtung der Last überqueren. Schienenfahrzeuge haben Vorfahrt.", "<b>When driving out:</b> take special care, sound the horn. Cross tracks slowly while watching the load. Rail vehicles have right of way.", "<b>Przy wyjeżdżaniu:</b> zachowaj szczególną ostrożność i daj sygnał klaksonem. Tory przekraczaj powoli, obserwując ładunek. Pojazdy szynowe mają pierwszeństwo.", "<b>Під час виїзду:</b> будь особливо обережним, подавай сигнал. Колії переїжджай повільно, стежачи за вантажем. Рейкові транспортні засоби мають перевагу.")),
            ],
            src: { de: `${V68} DA zu §24 Abs. 1; ${I208} Abschn. 6.4.1; DGUV G 308-001 (2022) Anhang 1 Nr. 9 und Übung 8` },
        }),
        step("question", {
            title: t("Nur ein paar Meter", "Just a few metres", "Tylko kilka metrów", "Лише кілька метрів"),
            text: t("Ein Waggon steht zu weit vom Ladegleis-Ende entfernt. Ein Kollege schlägt vor, ihn mit dem Stapler und einem Seil ein Stück zu ziehen.", "A wagon is too far from the end of the loading track. A colleague suggests pulling it a bit with the forklift and a rope.", "Wagon stoi za daleko od końca toru ładunkowego. Kolega proponuje przeciągnąć go kawałek wózkiem i liną.", "Вагон стоїть задалеко від кінця вантажної колії. Колега пропонує трохи протягнути його навантажувачем і тросом."),
            layout: "list",
            options: [t("Langsam ziehen, dann passiert nichts", "Pull slowly, then nothing will happen", "Ciągnąć powoli, nic się nie stanie", "Тягнути повільно, нічого не станеться"), t("Nein. Nur mit einem dafür bestimmten Gerät mit Sicherung gegen Mitreißen", "No. Only with equipment intended for it that is secured against being dragged", "Nie. Tylko sprzętem do tego przeznaczonym, z zabezpieczeniem przed pociągnięciem", "Ні. Лише призначеною технікою із захистом від затягування")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das ist lebensgefährlich", "No, that is life-threatening", "Nie, to zagraża życiu", "Ні, це небезпечно для життя") },
            body: t("Ein rollender Waggon hat ein Vielfaches der Masse des Staplers. Er kann den Stapler mitreißen oder umwerfen.", "A rolling wagon has many times the mass of the forklift. It can drag the forklift along or overturn it.", "Toczący się wagon waży wielokrotnie więcej niż wózek. Może go pociągnąć albo przewrócić.", "Вагон, що котиться, у багато разів важчий за навантажувач. Він може його потягнути чи перекинути."),
            src: { de: `${V68} DA zu §24 Abs. 1` },
        }),
        step("video", {
            title: t("Zug mit Anhängern", "Train with trailers", "Zestaw z przyczepami", "Потяг із причепами"),
            brief: t("Fahrer prüft Kupplung und Bolzensicherung, liest das Schild mit der Anhängelast, fährt langsam an und bremst vorausschauend vor einer Kurve. Seitliche Kamera und Nahaufnahme Kupplung.", "Driver checks the coupling and pin lock, reads the trailer load sign, starts slowly and brakes with foresight before a bend. Side camera and close-up of the coupling.", "Operator sprawdza sprzęg i zabezpieczenie sworznia, czyta tabliczkę z dopuszczalną masą przyczepy, rusza powoli i hamuje przewidująco przed zakrętem. Kamera z boku i zbliżenie sprzęgu.", "Водій перевіряє зчеплення й фіксатор пальця, читає табличку, повільно рушає й завчасно гальмує перед поворотом. Камера збоку й крупний план зчеплення."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Straße:</b> Zulassung, Ausrüstung und passender Führerschein. Der Staplerschein reicht nicht.", "<b>Road:</b> registration, equipment and the right driving licence. The forklift licence is not enough.", "<b>Droga:</b> dopuszczenie, wyposażenie i właściwe prawo jazdy. Staplerschein nie wystarczy.", "<b>Дорога:</b> допуск, обладнання й відповідне посвідчення водія. Самого Staplerschein недостатньо.")),
            pt(t("<b>Anhänger:</b> vorgesehene Kupplung, Anhängelast einhalten, Kupplung prüfen.", "<b>Trailer:</b> intended coupling, respect the trailer load, check the coupling.", "<b>Przyczepa:</b> właściwy sprzęg, przestrzegaj dopuszczalnej masy przyczepy, sprawdź podczepienie.", "<b>Причіп:</b> призначене зчеплення, дотримуйся допустимого причіпного навантаження, перевір зчеплення.")),
            pt(t("<b>Waggons:</b> nur mit geeignetem Gerät verziehen, gesichert beladen.", "<b>Wagons:</b> move only with suitable equipment, load only when secured.", "<b>Wagony:</b> przetaczaj tylko właściwym sprzętem, ładuj tylko zabezpieczone.", "<b>Вагони:</b> пересувай лише відповідною технікою, завантажуй лише убезпечені.")),
        ] }),
    ];
}

/* ════════════════ 8.3 Besondere Bereiche ════════════════ */
export function lesson83(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Feuer- und explosionsgefährdete Bereiche", "Fire and explosion hazard areas", "Obszary zagrożone pożarem i wybuchem", "Пожежо- й вибухонебезпечні зони"),
            lead: t("Ein Funke, ein heißes Auspuffrohr oder ein Elektromotor kann hier genügen.", "A spark, a hot exhaust or an electric motor can be enough here.", "Tu wystarczy iskra, gorąca rura wydechowa albo silnik elektryczny.", "Тут досить іскри, гарячої вихлопної труби чи електродвигуна."),
            points: [
                pt(t("<b>Ex-Bereich:</b> nur explosionsgeschützte Stapler. Du erkennst den Bereich am gelben Warnzeichen mit „Ex“.", "<b>Explosive area:</b> only explosion-protected trucks. You recognise the area by the yellow warning sign marked “Ex”.", "<b>Strefa Ex:</b> tylko wózki w wykonaniu przeciwwybuchowym. Rozpoznasz ją po żółtym znaku ostrzegawczym z napisem „Ex”.", "<b>Ex-зона:</b> лише вибухозахищені навантажувачі. Зону впізнаєш за жовтим знаком «Ex».")),
                pt(t("<b>Ausnahme nur schriftlich:</b> Ist sicher, dass keine explosionsfähige Atmosphäre entsteht, darf der Unternehmer andere Stapler zulassen, mit schriftlicher Anweisung. Du brauchst dann einen schriftlichen Auftrag.", "<b>Exception only in writing:</b> if it is certain no explosive atmosphere can occur, the employer may allow other trucks with written instructions. You then need a written work order.", "<b>Wyjątek tylko na piśmie:</b> jeśli pewne jest, że nie powstanie atmosfera wybuchowa, pracodawca może dopuścić inne wózki pisemną instrukcją. Ty potrzebujesz wtedy pisemnego zlecenia.", "<b>Виняток лише письмово:</b> якщо гарантовано, що вибухонебезпечна атмосфера не утвориться, роботодавець може дозволити інші навантажувачі письмовою інструкцією. Тобі потрібне письмове доручення.")),
                pt(t("<b>Feuergefährdete Bereiche:</b> Stapler mit Verbrennungsmotor nur, wenn von ihnen keine Brandgefahr ausgeht.", "<b>Fire hazard areas:</b> trucks with combustion engines only if they pose no fire risk.", "<b>Obszary zagrożone pożarem:</b> wózki spalinowe tylko wtedy, gdy nie stwarzają zagrożenia pożarowego.", "<b>Пожежонебезпечні зони:</b> навантажувачі з двигуном внутрішнього згоряння лише тоді, коли вони не створюють пожежної небезпеки.")),
            ],
            src: { de: `${V68} §20 mit DA; ASR A1.3 Warnzeichen W021` },
        }),
        step("learn", {
            title: t("Kälte, Wetter und Tiefkühllager", "Cold, weather and freezer stores", "Zimno, pogoda i mroźnia", "Холод, погода й морозильний склад"),
            lead: t("Kälte belastet Mensch und Maschine.", "Cold strains people and machines.", "Zimno obciąża ludzi i maszyny.", "Холод навантажує людей і техніку."),
            points: [
                pt(t("<b>Im Freien:</b> Wer nicht nur gelegentlich draußen fährt, wird gegen Witterung geschützt, zum Beispiel mit einer Fahrerkabine.", "<b>Outdoors:</b> anyone driving outside more than occasionally is protected against the weather, e.g. with a driver’s cab.", "<b>Na zewnątrz:</b> kto jeździ na zewnątrz częściej niż okazjonalnie, jest chroniony przed pogodą, np. kabiną.", "<b>Надворі:</b> хто їздить надворі не лише зрідка, має захист від погоди, напр. кабіну.")),
                pt(t("<b>Tiefkühllager:</b> nur Stapler, die der Hersteller für diese Temperaturen vorsieht. Für längere Aufenthalte gibt es Kälteschutzkleidung.", "<b>Freezer store:</b> only trucks the manufacturer intends for these temperatures. Cold protective clothing is provided for longer stays.", "<b>Mroźnia:</b> tylko wózki, które producent przewiduje do takich temperatur. Przy dłuższym pobycie jest odzież chroniąca przed zimnem.", "<b>Морозильний склад:</b> лише навантажувачі, які виробник передбачає для таких температур. Для довшого перебування є захисний одяг від холоду.")),
                pt(t("<b>Türen:</b> Kühlraumtüren müssen sich immer von innen öffnen lassen. Stelle nie etwas vor die Notentriegelung.", "<b>Doors:</b> cold room doors must always be openable from inside. Never put anything in front of the emergency release.", "<b>Drzwi:</b> drzwi chłodni muszą zawsze otwierać się od środka. Nigdy nie zastawiaj awaryjnego otwierania.", "<b>Двері:</b> двері холодильних камер завжди мають відчинятися зсередини. Ніколи не загороджуй аварійне розблокування.")),
                pt(t("<b>Wechsel zwischen kalt und warm:</b> Die Betriebsanleitung sagt dir, worauf du bei Kondenswasser, Glätte und Batterie achten musst.", "<b>Switching between cold and warm:</b> the operating manual tells you what to watch for regarding condensation, slipperiness and the battery.", "<b>Przejścia między zimnem a ciepłem:</b> instrukcja obsługi mówi, na co uważać w związku ze skraplaniem się wody, śliskością i akumulatorem.", "<b>Перехід між холодом і теплом:</b> інструкція з експлуатації каже, на що зважати щодо конденсату, слизькості й батареї.")),
            ],
            src: { de: `${V68} §6, §19 mit DA; DGUV Regel 110-003 (Kühlräume)` },
        }),
        step("learn", {
            title: t("Feuerflüssige Massen", "Molten masses", "Ciekły metal", "Розплавлені маси"),
            lead: t("In Gießereien und Hütten transportieren Stapler Pfannen mit flüssigem Metall. Hier zählt jeder Zentimeter.", "In foundries and smelters, forklifts transport ladles of molten metal. Every centimetre counts here.", "W odlewniach i hutach wózki wożą kadzie z ciekłym metalem. Tu liczy się każdy centymetr.", "У ливарнях і на металургійних заводах навантажувачі возять ковші з розплавом. Тут важить кожен сантиметр."),
            points: [
                pt(t("<b>Geeigneter Stapler:</b> keine Luftreifen, kein Gasantrieb. Der Fahrer ist gegen Wärmestrahlung und Spritzer geschützt, mit Rückhaltesystem und zweitem Ausstieg.", "<b>Suitable truck:</b> no pneumatic tyres, no LPG drive. The driver is protected against heat radiation and splashes, with a restraint system and a second exit.", "<b>Odpowiedni wózek:</b> bez opon pneumatycznych, bez napędu gazowego. Operator jest chroniony przed promieniowaniem cieplnym i rozpryskami, ma system przytrzymujący i drugie wyjście.", "<b>Відповідний навантажувач:</b> без пневматичних шин, без газового приводу. Водій захищений від теплового випромінювання й бризок, має систему утримання й другий вихід.")),
                pt(t("<b>Pfanne sichern:</b> mit mechanischer Verriegelung gegen Verrutschen. Pfannen nie mit den Gabelzinken schieben.", "<b>Secure the ladle:</b> with a mechanical lock against slipping. Never push ladles with the fork arms.", "<b>Zabezpiecz kadź:</b> mechaniczną blokadą przed zsunięciem. Nigdy nie przesuwaj kadzi widłami.", "<b>Закріпи ківш:</b> механічною фіксацією від зсуву. Ніколи не штовхай ковші вилами.")),
                pt(t("<b>Fahren:</b> Gefüllte Pfannen nur in Schrittgeschwindigkeit, empfohlen höchstens 4 bis 7 km/h. Gabeln 10 bis 30 cm über dem Boden, alle Bewegungen sanft. Auch eine Notbremsung darf nichts überschwappen lassen.", "<b>Driving:</b> full ladles only at walking pace, recommended max. 4 to 7 km/h. Forks 10 to 30 cm above the floor, all movements gentle. Even emergency braking must not make anything slosh over.", "<b>Jazda:</b> pełne kadzie tylko w tempie pieszego, zalecane maks. 4–7 km/h. Widły 10–30 cm nad podłogą, wszystkie ruchy łagodne. Nawet hamowanie awaryjne nie może spowodować wychlapania.", "<b>Їзда:</b> повні ковші лише зі швидкістю пішохода, рекомендовано макс. 4–7 км/год. Вила 10–30 см над підлогою, усі рухи плавні. Навіть аварійне гальмування не повинне спричинити виплеск.")),
                pt(t("<b>Wege und Wasser:</b> nur festgelegte, freie Transportwege, nie über Personen hinweg. Der Pfannentransport hat Vorfahrt. Feuchtigkeit und Schmelze vertragen sich nicht: Kalte oder nasse Gegenstände lassen flüssiges Metall herausspritzen.", "<b>Routes and water:</b> only fixed, clear routes, never over people. Ladle transport has right of way. Moisture and molten metal do not mix: cold or wet objects make molten metal spatter.", "<b>Drogi i woda:</b> tylko wyznaczone, wolne trasy, nigdy nad ludźmi. Transport kadzi ma pierwszeństwo. Wilgoć i ciekły metal się nie znoszą: zimne lub mokre przedmioty powodują wyrzut metalu.", "<b>Шляхи й вода:</b> лише визначені, вільні маршрути, ніколи над людьми. Транспорт ковшів має перевагу. Волога й розплав несумісні: холодні чи мокрі предмети спричиняють викид металу.")),
            ],
            merke: t("Langsam, sanft, gesichert und immer trocken.", "Slow, gentle, secured and always dry.", "Powoli, łagodnie, z zabezpieczoną kadzią i zawsze na sucho.", "Повільно, плавно, закріплено й завжди сухо."),
            src: { de: `${FBHM} Abschn. 2.1, 2.5 und 1; ${V68} DA zu §5 Abs. 1 Nr. 8` },
        }),
        step("sort", {
            title: t("Darf dieser Stapler hier fahren?", "Is this forklift allowed to drive here?", "Czy ten wózek może tu jechać?", "Чи може цей навантажувач тут їздити?"),
            lead: t("Ordne jede Situation zu.", "Assign each situation.", "Przyporządkuj każdą sytuację.", "Віднеси кожну ситуацію."),
            labels: [t("Ja", "Yes", "Tak", "Так"), t("Nein", "No", "Nie", "Ні")],
            items: [
                { t: t("Explosionsgeschützter Stapler im gekennzeichneten Ex-Bereich", "Explosion-protected forklift in the marked explosive area", "Wózek przeciwwybuchowy w oznaczonej strefie Ex", "Вибухозахищений навантажувач у позначеній Ex-зоні"), a: 0, why: t("Genau dafür ist er gebaut.", "That is exactly what it is built for.", "Właśnie do tego jest zbudowany.", "Саме для цього він створений.") },
                { t: t("Gasstapler fährt eine gefüllte Gießpfanne", "LPG forklift carrying a full casting ladle", "Wózek gazowy wiezie pełną kadź", "Газовий навантажувач везе повний ківш"), a: 1, why: t("Gasbetriebene Stapler sind beim Transport feuerflüssiger Massen unzulässig.", "LPG-powered trucks are not permitted for transporting molten masses.", "Wózki gazowe są niedopuszczalne przy transporcie ciekłego metalu.", "Газові навантажувачі заборонені для транспортування розплаву.") },
                { t: t("Stapler mit Luftreifen in der Gießhalle mit flüssigem Metall", "Forklift with pneumatic tyres in the casting hall with molten metal", "Wózek na oponach pneumatycznych w hali odlewni z ciekłym metalem", "Навантажувач на пневматичних шинах у ливарному цеху з розплавом"), a: 1, why: t("Luftreifen sind beim Transport feuerflüssiger Massen unzulässig.", "Pneumatic tyres are not permitted for transporting molten masses.", "Opony pneumatyczne są niedopuszczalne przy transporcie ciekłego metalu.", "Пневматичні шини заборонені для транспортування розплаву.") },
                { t: t("Kühlhaus-Stapler mit Kabine im Tiefkühllager", "Cold store forklift with cab in the freezer store", "Wózek do pracy w chłodni, z kabiną, w mroźni", "Навантажувач для холодильних складів із кабіною в морозильному складі"), a: 0, why: t("Vom Hersteller für Kälte vorgesehen, Fahrer geschützt.", "Intended by the manufacturer for cold, driver protected.", "Przewidziany przez producenta do zimna, operator chroniony.", "Передбачений виробником для холоду, водій захищений.") },
            ],
            allRight: t("Sicher erkannt.", "Recognised confidently.", "Rozpoznane bezbłędnie.", "Упевнено розпізнано."),
            someWrong: t("Merke: Ex nur mit Ex-Schutz, Schmelze nie mit Gas oder Luftreifen.", "Remember: Ex only with Ex protection, molten metal never with LPG or pneumatic tyres.", "Zapamiętaj: Ex tylko z ochroną Ex, ciekły metal nigdy z gazem ani oponami pneumatycznymi.", "Запам’ятай: Ex лише з Ex-захистом, розплав ніколи з газом чи пневматичними шинами."),
        }),
        step("question", {
            title: t("Der Weg zur Gießmaschine", "The way to the casting machine", "Droga do maszyny odlewniczej", "Дорога до ливарної машини"),
            text: t("Du fährst eine gefüllte Pfanne. Vor dir überquert ein Kollege den Transportweg, du bist schon spät dran.", "You are carrying a full ladle. Ahead of you a colleague crosses the transport route, and you are already running late.", "Wieziesz pełną kadź. Przed tobą kolega przechodzi przez trasę transportu, a ty już się spóźniasz.", "Ти везеш повний ківш. Попереду колега перетинає маршрут, а ти вже запізнюєшся."),
            layout: "list",
            options: [t("Zügig vorbeifahren, solange Platz ist", "Drive past quickly while there is room", "Szybko przejechać, póki jest miejsce", "Швидко проїхати, поки є місце"), t("Schrittgeschwindigkeit halten, sanft anhalten und warten", "Keep to walking pace, stop gently and wait", "Utrzymać tempo pieszego, łagodnie się zatrzymać i poczekać", "Тримати швидкість пішохода, плавно зупинитися й чекати")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, Tempo ist hier der Feind", "No, speed is the enemy here", "Nie, prędkość to tu wróg", "Ні, швидкість тут — ворог") },
            body: t("Gefüllte Pfannen werden nur in Schrittgeschwindigkeit gefahren und nie in der Nähe von Personen beschleunigt. Ein abruptes Bremsen kann Schmelze überschwappen lassen.", "Full ladles are only moved at walking pace and never accelerated near people. Braking abruptly can make the molten metal slosh over.", "Pełne kadzie wozi się tylko w tempie pieszego i nigdy nie przyspiesza przy ludziach. Gwałtowne hamowanie może spowodować wychlapanie metalu.", "Повні ковші возять лише зі швидкістю пішохода й не прискорюються біля людей. Різке гальмування може спричинити виплеск розплаву."),
            src: { de: `${FBHM} Abschn. 2.1 und 2.5` },
        }),
        step("video", {
            title: t("Sondereinsätze im Überblick", "Special operations at a glance", "Zadania specjalne w skrócie", "Особливі роботи: огляд"),
            brief: t("Drei kurze Szenen: Ex-Warnschild am Hallentor und Ex-Stapler, Kühlhaustür mit Notentriegelung, Stapler mit verriegelter Pfanne in Schrittgeschwindigkeit. Ruhige Kamera, Nahaufnahmen der Kennzeichnungen.", "Three short scenes: Ex warning sign at the hall gate and Ex forklift, cold store door with emergency release, forklift with locked ladle at walking pace. Steady camera, close-ups of markings.", "Trzy krótkie sceny: znak Ex przy bramie i wózek Ex, drzwi chłodni z awaryjnym otwieraniem, wózek z zablokowaną kadzią w tempie pieszego. Spokojna kamera, zbliżenia oznaczeń.", "Три короткі сцени: знак Ex біля воріт і Ex-навантажувач, двері холодильної камери з аварійним розблокуванням, навантажувач із зафіксованим ковшем на швидкості пішохода. Спокійна камера, крупні плани маркувань."),
            length: t("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Ex-Bereich:</b> nur explosionsgeschützte Stapler, Ausnahmen nur schriftlich.", "<b>Explosive area:</b> only explosion-protected trucks, exceptions only in writing.", "<b>Strefa Ex:</b> tylko wózki przeciwwybuchowe, wyjątki tylko na piśmie.", "<b>Ex-зона:</b> лише вибухозахищені навантажувачі, винятки лише письмово.")),
            pt(t("<b>Kälte:</b> passender Stapler, Kälteschutz, Türen von innen zu öffnen.", "<b>Cold:</b> suitable truck, cold protection, doors openable from inside.", "<b>Zimno:</b> odpowiedni wózek, ochrona przed zimnem, drzwi otwierane od środka.", "<b>Холод:</b> відповідний навантажувач, захист від холоду, двері відчиняються зсередини.")),
            pt(t("<b>Schmelze:</b> geeigneter Stapler, Pfanne verriegelt, Schrittgeschwindigkeit, trocken.", "<b>Molten metal:</b> suitable truck, ladle locked, walking pace, dry.", "<b>Ciekły metal:</b> odpowiedni wózek, kadź zablokowana, tempo pieszego, sucho.", "<b>Розплав:</b> відповідний навантажувач, ківш зафіксовано, швидкість пішохода, сухо.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson8Check(step: Mk): Step[] {
    return [
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Womit darf eine Person mit dem Hubgerüst nach oben fahren?", "In what may a person be lifted with the mast?", "W czym wolno podnosić osobę masztem?", "У чому можна піднімати людину щоглою?"),
                    options: [t("Nur in einer geeigneten Arbeitsbühne", "Only in a suitable work platform", "Tylko w odpowiednim podeście roboczym", "Лише у відповідній робочій платформі"), t("Auf einer Palette, wenn sie sich gut festhält", "On a pallet if they hold on well", "Na palecie, jeśli dobrze się trzyma", "На палеті, якщо вона добре тримається")], correct: 0,
                    why: t("DGUV Vorschrift 68 §26 Abs. 1.", "DGUV Regulation 68 §26 para. 1.", "DGUV Vorschrift 68 §26 ust. 1.", "DGUV Vorschrift 68 §26 абз. 1.") },
                { q: t("Die Bühne ist oben. Was gilt für dich als Fahrer?", "The platform is up. What applies to you as the driver?", "Podest jest w górze. Co dotyczy ciebie jako operatora?", "Платформа вгорі. Що діє для тебе як водія?"),
                    options: [t("Kurz Material holen ist erlaubt", "Briefly fetching material is allowed", "Wolno na chwilę przynieść materiał", "Можна ненадовго принести матеріал"), t("Auf dem Platz bleiben, nicht verfahren", "Stay in place, do not drive", "Zostać na miejscu, nie przemieszczać wózka", "Лишатися на місці, не переїжджати")], correct: 1,
                    why: t("DGUV Vorschrift 68 §26 Abs. 7 und 8.", "DGUV Regulation 68 §26 paras. 7 and 8.", "DGUV Vorschrift 68 §26 ust. 7 i 8.", "DGUV Vorschrift 68 §26 абз. 7 і 8.") },
                { q: t("Bis zu welcher Geschwindigkeit braucht ein Stapler auf öffentlichen Straßen keinen Führerschein?", "Up to what speed does a forklift on public roads need no driving licence?", "Do jakiej prędkości wózek na drodze publicznej nie wymaga prawa jazdy?", "До якої швидкості навантажувачу на дорозі не потрібне посвідчення водія?"),
                    options: [t("6 km/h", "6 km/h", "6 km/h", "6 км/год"), t("25 km/h", "25 km/h", "25 km/h", "25 км/год")], correct: 0,
                    why: t("DGUV Information 208-004, Abschnitt 8.5. Bis 25 km/h reicht Klasse L.", "DGUV Information 208-004, section 8.5. Up to 25 km/h class L is enough.", "DGUV Information 208-004, rozdz. 8.5. Do 25 km/h wystarczy kat. L.", "DGUV Information 208-004, розд. 8.5. До 25 км/год досить категорії L.") },
                { q: t("Wo kuppelst du einen Anhänger an?", "Where do you couple a trailer?", "Gdzie podczepiasz przyczepę?", "Де зчіплюєш причіп?"),
                    options: [t("An der vom Hersteller vorgesehenen Kupplung", "At the coupling provided by the manufacturer", "Na sprzęgu przewidzianym przez producenta", "На зчіпному пристрої, передбаченому виробником"), t("An jedem stabilen Rahmenteil", "At any solid frame part", "Na dowolnym mocnym elemencie ramy", "На будь-якій міцній частині рами")], correct: 0,
                    why: t("DGUV Vorschrift 68, DA zu §24 Abs. 1.", "DGUV Regulation 68, note on §24 para. 1.", "DGUV Vorschrift 68, DA do §24 ust. 1.", "DGUV Vorschrift 68, DA до §24 абз. 1.") },
                { q: t("Welche Stapler dürfen in Ex-Bereichen fahren?", "Which trucks may drive in explosive areas?", "Jakie wózki mogą jeździć w strefach Ex?", "Які навантажувачі можуть їздити в Ex-зонах?"),
                    options: [t("Jeder Elektrostapler", "Any electric forklift", "Każdy wózek elektryczny", "Будь-який електронавантажувач"), t("Nur explosionsgeschützte Stapler", "Only explosion-protected trucks", "Tylko wózki przeciwwybuchowe", "Лише вибухозахищені навантажувачі")], correct: 1,
                    why: t("DGUV Vorschrift 68 §20 Abs. 2.", "DGUV Regulation 68 §20 para. 2.", "DGUV Vorschrift 68 §20 ust. 2.", "DGUV Vorschrift 68 §20 абз. 2.") },
                { q: t("Wie schnell fährst du mit einer gefüllten Pfanne?", "How fast do you drive with a full ladle?", "Jak szybko jedziesz z pełną kadzią?", "Як швидко їдеш із повним ковшем?"),
                    options: [t("Schrittgeschwindigkeit", "Walking pace", "W tempie pieszego", "Зі швидкістю пішохода"), t("Normales Hallentempo", "Normal hall speed", "Zwykłe tempo w hali", "Звичайна швидкість у цеху")], correct: 0,
                    why: t("DGUV FBHM-144, Abschnitt 2.5: Empfehlung höchstens 4 bis 7 km/h.", "DGUV FBHM-144, section 2.5: recommended max. 4 to 7 km/h.", "DGUV FBHM-144, rozdz. 2.5: zalecane maks. 4–7 km/h.", "DGUV FBHM-144, розд. 2.5: рекомендовано макс. 4–7 км/год.") },
            ],
            allRight: t("Alles richtig. Auch Sondereinsätze hast du im Griff.", "All correct. You have special operations under control too.", "Wszystko dobrze. Zadania specjalne też masz opanowane.", "Усе правильно. Особливі роботи теж під контролем."),
            someWrong: t("Schau dir die markierten Fragen noch einmal an.", "Take another look at the marked questions.", "Przejrzyj jeszcze raz zaznaczone pytania.", "Переглянь ще раз позначені питання."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Menschen heben:</b> nur in der Arbeitsbühne, Fahrer bleibt auf dem Platz.", "<b>Lifting people:</b> only in the work platform, the driver stays in place.", "<b>Podnoszenie ludzi:</b> tylko w podeście roboczym, operator zostaje na miejscu.", "<b>Підйом людей:</b> лише в робочій платформі, водій лишається на місці.")),
            pt(t("<b>Straße, Anhänger, Waggons:</b> Zulassung und Führerschein, vorgesehene Kupplung, geeignetes Gerät.", "<b>Road, trailers, wagons:</b> registration and licence, intended coupling, suitable equipment.", "<b>Droga, przyczepy, wagony:</b> dopuszczenie i prawo jazdy, właściwy sprzęg, odpowiedni sprzęt.", "<b>Дорога, причепи, вагони:</b> допуск і посвідчення водія, призначене зчеплення, відповідна техніка.")),
            pt(t("<b>Besondere Bereiche:</b> Ex-Schutz, Kälteschutz, bei Schmelze langsam und trocken.", "<b>Special areas:</b> Ex protection, cold protection, slow and dry with molten metal.", "<b>Obszary szczególne:</b> ochrona Ex, ochrona przed zimnem, przy ciekłym metalu powoli i na sucho.", "<b>Особливі зони:</b> Ex-захист, захист від холоду, з розплавом повільно й сухо.")),
        ] }),
    ];
}
