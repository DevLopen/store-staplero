/**
 * Moduł „Antriebsarten” (spis klienta, punkt 4), od razu w czterech językach.
 * Źródła: DGUV Vorschrift 68 §18, §21 z DA; DGUV Information 208-004 „Gabelstapler” (BGHM 2012/2018), rozdz. 2.1, 3.1
 * i wzorcowe Betriebsanweisungen w załączniku („Batterie laden”, „Batterie wechseln”, „Austausch von Treibgasflaschen”);
 * DGUV Fachbereich AKTUELL FBRCI-013 „Explosionsschutz an Batterieladestationen” (Stand 30.09.2024);
 * DVFG/BGN „Gebrauchs-/Betriebsanweisung für Treibgasflaschen” (Stand 10/2017); DGUV G 308-001 (Entwurf 2026) Anhang B.
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
const kv = (k: LText, v: LText) => ({ k, v });

const BTN_GO = t("Los geht’s", "Let’s go", "Zaczynamy", "Почнімо");
const OPENER = t("Bevor wir starten: Was meinst du?", "Before we start: what do you think?", "Zanim zaczniemy: jak myślisz?", "Перш ніж почати: як ти думаєш?");
const RIGHT_T = t("Richtig", "Correct", "Dobrze", "Правильно");
const WRONG_T = t("Nicht ganz", "Not quite", "Nie do końca", "Не зовсім");
const SUM = t("Das nimmst du mit", "Key takeaways", "Najważniejsze", "Головне");
const QUICK = t("Kurztest", "Quick test", "Krótki test", "Короткий тест");
const I208 = "DGUV Information 208-004", BA = "DGUV Information 208-004, Anhang: Betriebsanweisung", FB13 = "DGUV FB AKTUELL FBRCI-013", DVFG = "DVFG/BGN Betriebsanweisung Treibgasflaschen (2017)";

const BATTERY_TEXTS = texts([
    ["lädt", "charging", "ładuje się", "заряджається"], ["voll", "full", "pełny", "повний"], ["fast leer", "almost empty", "prawie pusty", "майже порожній"], ["bereit", "ready", "gotowy", "готово"],
    ["Ladegerät", "Charger", "Ładowarka", "Зарядний пристрій"], ["Ladezustand", "State of charge", "Stan naładowania", "Рівень заряду"],
    ["Batterieart wählen", "Choose battery type", "Wybierz rodzaj akumulatora", "Обери тип батареї"],
    ["Unter 20 %: Tiefentladung vermeiden, jetzt laden.", "Below 20 %: avoid deep discharge, charge now.", "Poniżej 20 %: unikaj głębokiego rozładowania, naładuj teraz.", "Нижче 20 %: уникай глибокого розряду, заряджай зараз."],
    ["Lädt ohne Gasbildung. Das Batteriemanagement überwacht die Zellen.", "Charging without gassing. The battery management monitors the cells.", "Ładuje się bez gazowania. System zarządzania baterią pilnuje ogniw.", "Заряджається без газоутворення. Система керування батареєю стежить за елементами."],
    ["Lädt. Bei Überladung entweicht Gas über die Ventile.", "Charging. If overcharged, gas escapes through the valves.", "Ładuje się. Przy przeładowaniu gaz uchodzi przez zawory.", "Заряджається. При перезаряді газ виходить через клапани."],
    ["Lädt. Es entsteht Wasserstoff: Knallgasgefahr.", "Charging. Hydrogen is produced: risk of oxyhydrogen gas.", "Ładuje się. Powstaje wodór: niebezpieczeństwo gazu piorunującego.", "Заряджається. Утворюється водень: небезпека гримучого газу."],
    ["Voll geladen.", "Fully charged.", "W pełni naładowany.", "Повністю заряджено."], ["Bereit.", "Ready.", "Gotowy.", "Готово."],
    ["Batteriearten geladen", "Battery types charged", "Naładowane rodzaje akumulatorów", "Заряджені типи батарей"],
    ["Geladen", "Charged", "Naładowany", "Заряджено"], ["Ladegerät einschalten", "Switch on charger", "Włącz ładowarkę", "Увімкни зарядний пристрій"],
]);
const SEQ_TEXTS = texts([
    ["Tippe unten den nächsten Schritt an", "Tap the next step below", "Dotknij poniżej następnego kroku", "Торкнися нижче наступного кроку"],
    ["Richtig: {s}", "Correct: {s}", "Prawidłowo: {s}", "Правильно: {s}"],
    ["Tippe die Schritte in der richtigen Reihenfolge an", "Tap the steps in the right order", "Dotykaj kroków we właściwej kolejności", "Торкайся кроків у правильному порядку"],
]);
const SCENE_TEXTS = texts([
    ["Alle Gefahren gefunden", "All hazards found", "Wszystkie zagrożenia znalezione", "Усі небезпеки знайдено"],
    ["Gefahren gefunden", "Hazards found", "Znalezione zagrożenia", "Знайдені небезпеки"],
    ["Gefahr: {l}", "Hazard: {l}", "Zagrożenie: {l}", "Небезпека: {l}"],
    ["In Ordnung: {l}", "This is fine: {l}", "W porządku: {l}", "Усе гаразд: {l}"],
    ["Nicht hier: {l}", "Not here: {l}", "Nie tutaj: {l}", "Не тут: {l}"],
    ["Richtig: {l}", "Correct: {l}", "Dobrze: {l}", "Правильно: {l}"],
    ["Tippe auf die Punkte im Bild. Nicht alles ist falsch.", "Tap the dots in the picture. Not everything is wrong.", "Dotykaj punktów na rysunku. Nie wszystko jest złe.", "Торкайся точок на малюнку. Не все неправильно."],
    ["Tippe auf einen Platz im Bild.", "Tap a place in the picture.", "Dotknij miejsca na rysunku.", "Торкнися місця на малюнку."],
    ["Tippe auf die Punkte in der Halle. Nicht alles ist falsch.", "Tap the points. Not everything is wrong.", "Dotknij punktów. Nie wszystko jest złe.", "Торкайся точок. Не все неправильно."],
    ["Ganze Halle zeigen", "Show the whole station", "Pokaż całe stanowisko", "Показати всю станцію"],
]);

/* ════════════════ Lernziele ════════════════ */
export function lesson3Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Antriebsarten", "Drive types", "Rodzaje napędu", "Типи приводу"), image: "forklift",
            text: t("Elektro, Diesel, Treibgas: Jeder Antrieb hat eigene Gefahren. Du lernst, wie du Batterien sicher lädst, Gasflaschen wechselst und wo welcher Stapler fahren darf.",
                "Electric, diesel, LPG: every drive has its own hazards. You learn how to charge batteries safely, change gas cylinders and where each forklift may operate.",
                "Elektryczny, diesel, gaz: każdy napęd ma swoje zagrożenia. Nauczysz się bezpiecznie ładować akumulatory, wymieniać butle gazowe i dowiesz się, gdzie jaki wózek może jeździć.",
                "Електро, дизель, газ: кожен привід має свої небезпеки. Ти навчишся безпечно заряджати батареї, міняти газові балони і дізнаєшся, де який навантажувач може працювати."),
            meta: [t("ca. 25 Minuten", "about 25 minutes", "ok. 25 minut", "близько 25 хвилин"), t("3 Themen und Modul-Check", "3 topics and module check", "3 tematy i test modułu", "3 теми і перевірка модуля"), { de: "DGUV V68, DGUV I 208-004, FBRCI-013" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "Your learning goals for this module. 1 = new to me, 5 = confident.", "Twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: [
                { code: "3.1", text: t("Ich kenne Elektroantrieb und Batteriearten und ihre Gefahren.", "I know the electric drive, battery types and their hazards.", "Znam napęd elektryczny, rodzaje akumulatorów i ich zagrożenia.", "Я знаю електропривід, типи батарей і їхні небезпеки."), short: t("Elektro", "Electric", "Elektryczny", "Електропривід") },
                { code: "3.2", text: t("Ich kann eine Batterie sicher laden und weiß, was beim Wechsel gilt.", "I can charge a battery safely and know the rules for changing it.", "Umiem bezpiecznie naładować akumulator i wiem, co obowiązuje przy wymianie.", "Я вмію безпечно заряджати батарею і знаю правила її заміни."), short: t("Laden", "Charging", "Ładowanie", "Зарядка") },
                { code: "3.3", text: t("Ich kenne die Regeln für Diesel und Treibgas und kann eine Gasflasche wechseln.", "I know the rules for diesel and LPG and can change a gas cylinder.", "Znam zasady dla wózków z silnikiem diesla i na gaz płynny i umiem wymienić butlę gazową.", "Я знаю правила для дизельних і газових навантажувачів та вмію замінити газовий балон."), short: t("Verbrenner", "Combustion", "Spalinowy", "Двигун внутрішнього згоряння") },
            ],
        }),
        step("sort", {
            title: t("Elektro oder Verbrenner?", "Electric or combustion?", "Elektryczny czy spalinowy?", "Електропривід чи двигун внутрішнього згоряння?"),
            lead: t("Zu welchem Antrieb gehört das?", "Which drive does this belong to?", "Do którego napędu to pasuje?", "До якого приводу це належить?"),
            labels: [t("Elektroantrieb", "Electric drive", "Napęd elektryczny", "Електропривід"), t("Verbrennungsmotor", "Combustion engine", "Silnik spalinowy", "Двигун внутрішнього згоряння")],
            items: [
                { t: t("Batterie an der Ladestation laden", "Charging the battery at the charging station", "Ładowanie akumulatora na stanowisku ładowania", "Зарядка батареї на зарядній станції"), a: 0, why: t("Elektrostapler holen ihre Energie aus der Batterie.", "Electric forklifts take their energy from the battery.", "Wózki elektryczne czerpią energię z akumulatora.", "Електронавантажувачі беруть енергію з батареї.") },
                { t: t("Treibgasflasche wechseln", "Changing the LPG cylinder", "Wymiana butli gazowej", "Заміна газового балона"), a: 1, why: t("Treibgas (Flüssiggas) treibt einen Verbrennungsmotor an.", "LPG fuels a combustion engine.", "Gaz płynny napędza silnik spalinowy.", "Зріджений газ є пальним для двигуна внутрішнього згоряння.") },
                { t: t("Rußpartikel im Abgas", "Soot particles in the exhaust", "Cząstki sadzy w spalinach", "Частинки сажі у вихлопі"), a: 1, why: t("Ruß entsteht vor allem beim Dieselmotor.", "Soot comes mainly from diesel engines.", "Sadza powstaje głównie w silniku diesla.", "Сажа утворюється переважно в дизелі.") },
                { t: t("Wasserstoff entsteht beim Laden", "Hydrogen is produced during charging", "Podczas ładowania powstaje wodór", "Під час зарядки утворюється водень"), a: 0, why: t("Blei-Säure-Batterien gasen beim Laden.", "Lead-acid batteries give off gas when charging.", "Akumulatory ołowiowo-kwasowe wydzielają gaz przy ładowaniu.", "Свинцево-кислотні батареї виділяють газ під час зарядки.") },
                { t: t("Nicht unter Erdgleiche abstellen", "Do not park below ground level", "Nie odstawiać poniżej poziomu terenu", "Не залишати нижче рівня землі"), a: 1, why: t("Das gilt für Stapler mit Flüssiggasantrieb: Das Gas ist schwerer als Luft.", "This applies to LPG forklifts: the gas is heavier than air.", "Dotyczy wózków na gaz płynny: gaz jest cięższy od powietrza.", "Це стосується газових навантажувачів: газ важчий за повітря.") },
            ],
            allRight: t("Richtig. Du kannst die Antriebe unterscheiden.", "Correct. You can tell the drives apart.", "Dobrze. Rozróżniasz napędy.", "Правильно. Ти розрізняєш приводи."),
            someWrong: t("Kein Problem, genau das lernst du jetzt.", "No problem, that is exactly what you will learn now.", "Nie szkodzi, właśnie tego się teraz nauczysz.", "Нічого, саме цього ти зараз навчишся."),
        }),
    ];
}

/* ════════════════ 3.1 Elektroantrieb und Batterien ════════════════ */
export function lesson31(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Kann es beim Laden eines Elektrostaplers zu einer Explosion kommen?", "Can an explosion happen when charging an electric forklift?", "Czy przy ładowaniu wózka elektrycznego może dojść do wybuchu?", "Чи може статися вибух під час зарядки електронавантажувача?"),
            text: OPENER, options: [t("Nein, da ist ja kein Kraftstoff", "No, there is no fuel", "Nie, przecież nie ma paliwa", "Ні, там немає пального"), t("Ja", "Yes", "Tak", "Так")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Doch, das kann passieren", "Yes, it can happen", "Owszem, może", "Так, може") },
            quote: t("„Das Gemisch aus Wasserstoff und dem in der Luft enthaltenen Sauerstoff ist gemeinhin als ‚Knallgas‘ bekannt.“", "“The mixture of hydrogen and the oxygen in the air is commonly known as ‘oxyhydrogen gas’.”", "„Mieszanina wodoru i tlenu z powietrza jest powszechnie znana jako »gaz piorunujący«.”", "«Суміш водню з киснем повітря відома як „гримучий газ“.»"),
            body: t("Beim Laden von Batterien mit flüssigem Elektrolyt entsteht Wasserstoff. Welche Batterien das betrifft und welche nicht, siehst du gleich.", "Charging batteries with a liquid electrolyte produces hydrogen. Which batteries this affects and which not, you will see shortly.", "Przy ładowaniu akumulatorów z ciekłym elektrolitem powstaje wodór. Których to dotyczy, a których nie, zobaczysz za chwilę.", "Під час зарядки батарей з рідким електролітом утворюється водень. Яких батарей це стосується, побачиш зараз."),
            src: { de: `${FB13}, Abschn. 1` }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Der Elektroantrieb", "The electric drive", "Napęd elektryczny", "Електропривід"),
            lead: t("Die Batterie liefert den Strom für Fahren und Heben. Elektrostapler sind leise und stoßen keine Abgase aus.", "The battery supplies the power for driving and lifting. Electric forklifts are quiet and emit no exhaust.", "Akumulator dostarcza prąd do jazdy i podnoszenia. Wózki elektryczne są ciche i nie wydzielają spalin.", "Батарея дає струм для руху і підйому. Електронавантажувачі тихі й не мають вихлопу."),
            points: [
                pt(t("<b>Erste Wahl in Hallen:</b> Für Transporte in Gebäuden sollen, wenn technisch möglich, Elektrostapler eingesetzt werden.", "<b>First choice indoors:</b> for transport inside buildings, electric forklifts should be used where technically possible.", "<b>Pierwszy wybór w halach:</b> do transportu w budynkach, jeśli to technicznie możliwe, należy używać wózków elektrycznych.", "<b>Перший вибір у приміщеннях:</b> для перевезень у будівлях, якщо технічно можливо, слід використовувати електронавантажувачі.")),
                pt(t("<b>Schwere Batterie:</b> Sie wiegt mehrere hundert Kilo und gehört zur Masse des Staplers. Darum wird das Leergewicht ohne Batterie angegeben.", "<b>Heavy battery:</b> it weighs several hundred kilos and is part of the truck’s mass. That is why the unladen weight is stated without the battery.", "<b>Ciężki akumulator:</b> waży kilkaset kilogramów i należy do masy wózka. Dlatego masę własną podaje się bez akumulatora.", "<b>Важка батарея:</b> важить кількасот кілограмів і входить у масу навантажувача. Тому власну масу вказують без батареї.")),
                pt(t("<b>Nur zugelassene Batterien:</b> Einbauen darfst du nur Batterien, die der Hersteller nach Größe und Gewicht zugelassen hat.", "<b>Approved batteries only:</b> you may only fit batteries approved by the manufacturer for size and weight.", "<b>Tylko dopuszczone akumulatory:</b> wolno montować tylko akumulatory dopuszczone przez producenta pod względem wymiarów i masy.", "<b>Лише дозволені батареї:</b> ставити можна лише батареї, дозволені виробником за розміром і масою.")),
                pt(t("<b>Gefahren:</b> Explosion und Brand beim Laden, Verätzung durch Säure und elektrischer Strom.", "<b>Hazards:</b> explosion and fire during charging, acid burns and electric shock.", "<b>Zagrożenia:</b> wybuch i pożar przy ładowaniu, oparzenie kwasem i porażenie prądem.", "<b>Небезпеки:</b> вибух і пожежа під час зарядки, опіки кислотою та ураження струмом.")),
            ],
            merke: t("Kein Auspuff heißt nicht ungefährlich. Die Gefahr steckt in der Batterie.", "No exhaust does not mean harmless. The danger lies in the battery.", "Brak rury wydechowej nie znaczy, że jest bezpiecznie. Zagrożenie tkwi w akumulatorze.", "Відсутність вихлопу не означає безпеки. Небезпека в батареї."),
            src: { de: `${I208} Abschn. 2.1 und 3.1; ${BA} „Batterie laden“ und „Batterie wechseln“` },
        }),
        step("learn", {
            title: t("Drei Batteriearten", "Three battery types", "Trzy rodzaje akumulatorów", "Три типи батарей"),
            lead: t("Im Stapler stecken heute meist Bleibatterien oder Lithium-Ionen-Batterien. Sie verhalten sich beim Laden sehr unterschiedlich.", "Forklifts today mostly use lead batteries or lithium-ion batteries. They behave very differently when charging.", "W wózkach są dziś głównie akumulatory ołowiowe albo litowo-jonowe. Przy ładowaniu zachowują się zupełnie inaczej.", "У навантажувачах сьогодні переважно свинцеві або літій-іонні батареї. Під час зарядки вони поводяться дуже по-різному."),
            points: [
                pt(t("<b>Blei-Säure (geschlossen):</b> Zellen mit Stopfen, Elektrolyt ist verdünnte Schwefelsäure. Beim Laden entsteht Wasserstoff, Wasser wird nachgefüllt.", "<b>Lead-acid (vented):</b> cells with plugs, the electrolyte is dilute sulphuric acid. Charging produces hydrogen, water is topped up.", "<b>Ołowiowo-kwasowy (otwarty):</b> ogniwa z korkami, elektrolit to rozcieńczony kwas siarkowy. Przy ładowaniu powstaje wodór, uzupełnia się wodę.", "<b>Свинцево-кислотна (відкрита):</b> елементи з пробками, електроліт — розведена сірчана кислота. Під час зарядки утворюється водень, доливають воду.")),
                pt(t("<b>Blei-Gel oder Vlies (verschlossen):</b> Der Elektrolyt ist gebunden. Wartungsfrei, aber Überdruckventile lassen bei Überladung Gas entweichen.", "<b>Lead gel or AGM (sealed):</b> the electrolyte is bound. Maintenance-free, but pressure valves let gas escape when overcharged.", "<b>Ołowiowo-żelowy lub AGM (szczelny):</b> elektrolit jest związany. Bezobsługowy, ale przy przeładowaniu zawory nadciśnieniowe wypuszczają gaz.", "<b>Свинцево-гелева або AGM (герметична):</b> електроліт зв’язаний. Не потребує обслуговування, але клапани випускають газ при перезаряді.")),
                pt(t("<b>Lithium-Ionen</b>(zum Beispiel Lithium-Eisenphosphat): kein Wasserstoff, schnell ladbar, viel Energie. Brandgefahr vor allem beim Laden, bei Beschädigung und bei Kurzschluss.", "<b>Lithium-ion</b>(for example lithium iron phosphate): no hydrogen, fast charging, lots of energy. Fire risk mainly during charging, when damaged and in a short circuit.", "<b>Litowo-jonowy</b>(np. litowo-żelazowo-fosforanowy): bez wodoru, szybkie ładowanie, dużo energii. Ryzyko pożaru głównie przy ładowaniu, po uszkodzeniu i przy zwarciu.", "<b>Літій-іонна</b>(наприклад літій-залізо-фосфатна): без водню, швидка зарядка, багато енергії. Ризик пожежі переважно під час зарядки, при пошкодженні та короткому замиканні.")),
            ],
            merke: t("Bleibatterien gasen beim Laden, Lithiumbatterien können bei Schäden brennen. Beide brauchen eine sichere Ladestation.", "Lead batteries give off gas when charging, lithium batteries can catch fire when damaged. Both need a safe charging station.", "Akumulator ołowiowy wydziela gaz przy ładowaniu, litowy może się zapalić po uszkodzeniu. Oba wymagają bezpiecznego stanowiska ładowania.", "Свинцева батарея виділяє газ під час зарядки, літієва може загорітися при пошкодженні. Обидві потребують безпечної зарядної станції."),
            src: { de: `${FB13}, Abschn. 1; DGUV G 308-001 (Entwurf 2026) Anhang B` },
        }),
        step("sim", { sim: "battery", texts: BATTERY_TEXTS,
            title: t("Lade jede Batterieart einmal", "Charge each battery type once", "Naładuj raz każdy rodzaj akumulatora", "Заряди один раз батарею кожного типу"),
            types: [
                { id: "lead", name: t("Blei-Säure", "Lead-acid", "Ołowiowo-kwasowy", "Свинцево-кислотна"),
                    rows: [
                        kv(t("Aufbau", "Design", "Budowa", "Будова"), t("Zellen mit Stopfen, verdünnte Schwefelsäure", "Cells with plugs, dilute sulphuric acid", "Ogniwa z korkami, rozcieńczony kwas siarkowy", "Елементи з пробками, розведена сірчана кислота")),
                        kv(t("Beim Laden", "When charging", "Przy ładowaniu", "Під час зарядки"), t("Wasserstoff entsteht: lüften, keine Zündquellen", "Hydrogen forms: ventilate, no ignition sources", "Powstaje wodór: wietrz pomieszczenie, żadnych źródeł zapłonu", "Утворюється водень: провітрюй, жодних джерел запалювання")),
                        kv(t("Wartung", "Maintenance", "Konserwacja", "Обслуговування"), t("Säuredichte prüfen, destilliertes Wasser erst nach dem Laden auffüllen", "Check acid density, top up distilled water only after charging", "Sprawdzać gęstość kwasu, wodę destylowaną dolewać dopiero po ładowaniu", "Перевіряти густину кислоти, дистильовану воду доливати лише після зарядки")),
                    ],
                    after: t("Voll. Jetzt bei Bedarf destilliertes Wasser auffüllen, erst nach dem Laden.", "Full. Now top up distilled water if needed, only after charging.", "Pełny. Teraz w razie potrzeby dolej wodę destylowaną, dopiero po ładowaniu.", "Повний. Тепер за потреби долий дистильовану воду, лише після зарядки.") },
                { id: "gel", name: t("Blei-Gel", "Lead gel", "Ołowiowo-żelowy", "Свинцево-гелева"),
                    rows: [
                        kv(t("Aufbau", "Design", "Budowa", "Будова"), t("Verschlossene Zellen, Elektrolyt als Gel oder im Vlies", "Sealed cells, electrolyte as gel or in a glass mat (AGM)", "Zamknięte ogniwa, elektrolit jako żel lub w macie z włókna szklanego (AGM)", "Закриті елементи, електроліт у вигляді гелю або в склоповстяному сепараторі (AGM)")),
                        kv(t("Beim Laden", "When charging", "Przy ładowaniu", "Під час зарядки"), t("Wenig Gas, bei Überladung über Überdruckventile", "Little gas, through pressure valves if overcharged", "Mało gazu, przy przeładowaniu przez zawory nadciśnieniowe", "Мало газу, при перезаряді через запобіжні клапани")),
                        kv(t("Wartung", "Maintenance", "Konserwacja", "Обслуговування"), t("Wartungsfrei, nicht öffnen", "Maintenance-free, do not open", "Bezobsługowy, nie otwierać", "Без обслуговування, не відкривати")),
                    ],
                    after: t("Voll. Verschlossene Batterien werden nicht geöffnet und nicht nachgefüllt.", "Full. Sealed batteries are not opened or topped up.", "Pełny. Zamkniętych akumulatorów się nie otwiera i nie dolewa.", "Повний. Закриті батареї не відкривають і не доливають.") },
                { id: "li", name: t("Lithium-Ionen", "Lithium-ion", "Litowo-jonowy", "Літій-іонна"),
                    rows: [
                        kv(t("Aufbau", "Design", "Budowa", "Будова"), t("Module mit Batteriemanagementsystem (BMS)", "Modules with a battery management system (BMS)", "Moduły z systemem zarządzania baterią (BMS)", "Модулі з системою керування батареєю (BMS)")),
                        kv(t("Beim Laden", "When charging", "Przy ładowaniu", "Під час зарядки"), t("Kein Wasserstoff. Brandgefahr beim Laden, bei Schäden und Kurzschluss", "No hydrogen. Fire risk when charging, when damaged and in a short circuit", "Bez wodoru. Ryzyko pożaru przy ładowaniu, uszkodzeniu i zwarciu", "Без водню. Ризик пожежі під час зарядки, при пошкодженні та короткому замиканні")),
                        kv(t("Wartung", "Maintenance", "Konserwacja", "Обслуговування"), t("Kein Wasser. Nur mit dem passenden Ladegerät laden", "No water. Only charge with the matching charger", "Bez wody. Ładować tylko odpowiednią ładowarką", "Без води. Заряджати лише відповідним зарядним пристроєм")),
                    ],
                    after: t("Voll. Lithium-Ionen-Batterien lassen sich schnell laden, zum Beispiel in Pausen.", "Full. Lithium-ion batteries can be charged quickly, for example during breaks.", "Pełny. Akumulatory litowo-jonowe można szybko ładować, np. w przerwach.", "Повний. Літій-іонні батареї можна швидко заряджати, наприклад у перервах.") },
            ],
        }),
        step("learn", {
            title: t("Richtig mit der Batterie umgehen", "Handling the battery correctly", "Prawidłowe obchodzenie się z akumulatorem", "Правильне поводження з батареєю"),
            lead: t("Diese Regeln stammen aus der Muster-Betriebsanweisung der Berufsgenossenschaft. In deinem Betrieb gilt die Betriebsanweisung vor Ort.", "These rules come from the employers’ liability insurance association’s sample operating instructions. At your company, the local operating instructions apply.", "Te zasady pochodzą ze wzorcowej instrukcji stanowiskowej Berufsgenossenschaft. W twoim zakładzie obowiązuje instrukcja stanowiskowa tego zakładu.", "Ці правила взяті зі зразкової робочої інструкції страхової спілки. На твоєму підприємстві діє його власна робоча інструкція."),
            points: [
                pt(t("<b>Rechtzeitig laden:</b> Batterie nicht im entladenen Zustand abstellen. Entladungen unter 20 % verkürzen die Lebensdauer.", "<b>Charge in good time:</b> do not leave the battery discharged. Discharges below 20 % shorten its life.", "<b>Ładuj na czas:</b> nie zostawiaj rozładowanego akumulatora. Rozładowanie poniżej 20 % skraca jego żywotność.", "<b>Заряджай вчасно:</b> не залишай батарею розрядженою. Розряд нижче 20 % скорочує її ресурс.")),
                pt(t("<b>Nichts auf die Batterie legen:</b> Werkzeug oder andere Metallteile können einen Kurzschluss auslösen.", "<b>Put nothing on the battery:</b> tools or other metal parts can cause a short circuit.", "<b>Nic nie kładź na akumulatorze:</b> narzędzia i inne metalowe części mogą spowodować zwarcie.", "<b>Нічого не клади на батарею:</b> інструмент чи інші металеві предмети можуть спричинити коротке замикання.")),
                pt(t("<b>Schutzausrüstung:</b> Beim Umgang mit Säure Schutzhandschuhe, Gesichtsschutz und Sicherheitsschuhe tragen.", "<b>Protective equipment:</b> when handling acid, wear protective gloves, face protection and safety shoes.", "<b>Środki ochrony:</b> przy kwasie noś rękawice ochronne, osłonę twarzy i obuwie ochronne.", "<b>Засоби захисту:</b> при роботі з кислотою вдягай захисні рукавиці, захист обличчя і захисне взуття.")),
                pt(t("<b>Säurespritzer:</b> sofort mit viel klarem Wasser ausspülen, verschüttete Säure mit viel Wasser wegspülen und den Vorgesetzten informieren.", "<b>Acid splashes:</b> rinse immediately with plenty of clean water, wash away spilled acid with plenty of water and inform your supervisor.", "<b>Bryzgi kwasu:</b> od razu spłucz dużą ilością czystej wody, rozlany kwas spłucz dużą ilością wody i poinformuj przełożonego.", "<b>Бризки кислоти:</b> одразу промий великою кількістю чистої води, розлиту кислоту змий великою кількістю води і повідом керівника.")),
            ],
            merke: t("Säure im Auge: sofort spülen, lange spülen, dann zum Arzt.", "Acid in the eye: rinse immediately, rinse for a long time, then see a doctor.", "Kwas w oku: płucz od razu, płucz długo, potem idź do lekarza.", "Кислота в оці: промивай одразу й довго, потім іди до лікаря."),
            src: { de: `${BA} „Batterie laden“` },
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: t("Welche Batterie setzt beim Laden Wasserstoff frei?", "Which battery releases hydrogen when charging?", "Który akumulator wydziela wodór przy ładowaniu?", "Яка батарея виділяє водень під час зарядки?"),
                    options: [t("Blei-Säure", "Lead-acid", "Ołowiowo-kwasowy", "Свинцево-кислотна"), t("Lithium-Ionen", "Lithium-ion", "Litowo-jonowy", "Літій-іонна")], correct: 0,
                    why: t("Batterien mit wässrigem Elektrolyt gasen beim Laden. Lithium-Ionen-Batterien nicht.", "Batteries with an aqueous electrolyte gas when charging. Lithium-ion batteries do not.", "Akumulatory z elektrolitem wodnym wydzielają gaz przy ładowaniu. Litowo-jonowe nie.", "Батареї з водним електролітом виділяють газ під час зарядки. Літій-іонні ні.") },
                { q: t("Wann füllst du destilliertes Wasser in eine Blei-Säure-Batterie?", "When do you top up distilled water in a lead-acid battery?", "Kiedy dolewasz wodę destylowaną do akumulatora ołowiowo-kwasowego?", "Коли доливати дистильовану воду в свинцево-кислотну батарею?"),
                    options: [t("Vor dem Laden", "Before charging", "Przed ładowaniem", "Перед зарядкою"), t("Nach dem Laden", "After charging", "Po ładowaniu", "Після зарядки"), t("Während des Ladens", "While charging", "W trakcie ładowania", "Під час зарядки")], correct: 1,
                    why: t("Beim Laden steigt der Säurespiegel. Wer vorher auffüllt, riskiert überlaufende Säure.", "The acid level rises during charging. Topping up beforehand risks acid overflowing.", "Przy ładowaniu poziom kwasu rośnie. Jeśli dolejesz wodę wcześniej, kwas może się przelać.", "Під час зарядки рівень кислоти піднімається. Якщо долити воду заздалегідь, кислота може перелитися.") },
                { q: t("Warum darfst du keine beliebige Batterie einbauen?", "Why can’t you fit just any battery?", "Dlaczego nie możesz zamontować dowolnego akumulatora?", "Чому не можна ставити будь-яку батарею?"),
                    options: [t("Wegen der Farbe", "Because of the colour", "Z powodu koloru", "Через колір"), t("Größe und Gewicht müssen vom Hersteller zugelassen sein", "Size and weight must be approved by the manufacturer", "Wymiary i masa muszą być dopuszczone przez producenta", "Розмір і маса мають бути дозволені виробником")], correct: 1,
                    why: t("Die Batterie gehört zur Masse des Staplers. Eine falsche Batterie verändert Masse und Standsicherheit.", "The battery is part of the truck’s mass. A wrong battery changes its mass and stability.", "Akumulator należy do masy wózka. Niewłaściwy akumulator zmienia jego masę i stateczność.", "Батарея входить у масу навантажувача. Неправильна батарея змінює його масу й стійкість.") },
            ],
            allRight: t("Alles richtig.", "All correct.", "Wszystko dobrze.", "Усе правильно."),
            someWrong: t("Schau dir die Batteriearten bei Bedarf noch einmal an.", "Have another look at the battery types if needed.", "W razie potrzeby obejrzyj jeszcze raz rodzaje akumulatorów.", "За потреби переглянь ще раз типи батарей."),
        }),
        step("video", {
            title: t("Die Batterie im Stapler", "The battery in the forklift", "Akumulator w wózku", "Батарея в навантажувачі"),
            brief: t("Batteriehaube eines Elektrostaplers öffnen: Batterie mit Zellen, Stopfen und Stecker zeigen. Nahaufnahme des Batterie-Typenschilds mit Gewicht. Zum Vergleich kurz eine Lithium-Ionen-Batterie mit BMS-Anzeige.", "Open the battery cover of an electric forklift: show the battery with cells, plugs and connector. Close-up of the battery type plate with weight. For comparison, briefly a lithium-ion battery with BMS display.", "Otwórz pokrywę akumulatora wózka elektrycznego: pokaż ogniwa, korki i wtyczkę. Zbliżenie tabliczki akumulatora z masą. Dla porównania krótko akumulator litowo-jonowy z wyświetlaczem BMS.", "Відкрити кришку батареї електронавантажувача: показати елементи, пробки й роз’єм. Крупно табличку батареї з масою. Для порівняння коротко літій-іонну батарею з індикатором BMS."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Elektro in der Halle:</b> keine Abgase, leise, erste Wahl in Gebäuden.", "<b>Electric indoors:</b> no exhaust, quiet, first choice inside buildings.", "<b>Wózek elektryczny w hali:</b> bez spalin, cichy, pierwszy wybór w budynkach.", "<b>Електропривід у приміщенні:</b> без вихлопу, тихий, перший вибір у будівлях.")),
            pt(t("<b>Blei gast, Lithium kann brennen:</b> Blei-Säure bildet beim Laden Wasserstoff, Lithium-Ionen hat Brandgefahr bei Schäden.", "<b>Lead gives off gas, lithium can burn:</b> lead-acid forms hydrogen when charging, lithium-ion has a fire risk when damaged.", "<b>Ołowiowy wydziela gaz, litowy może się zapalić:</b> ołowiowo-kwasowy wydziela wodór przy ładowaniu, litowo-jonowy grozi pożarem przy uszkodzeniu.", "<b>Свинцева виділяє газ, літієва може загорітися:</b> свинцево-кислотна виділяє водень, літій-іонна має ризик пожежі при пошкодженні.")),
            pt(t("<b>Pflege:</b> rechtzeitig laden, nichts auf die Batterie legen, Wasser erst nach dem Laden, Schutzausrüstung bei Säure.", "<b>Care:</b> charge in time, put nothing on the battery, water only after charging, protective equipment with acid.", "<b>Pielęgnacja:</b> ładuj na czas, nic nie kładź na akumulatorze, wodę dolewaj dopiero po ładowaniu, przy kwasie używaj środków ochrony.", "<b>Догляд:</b> заряджай вчасно, нічого не клади на батарею, воду доливай лише після зарядки, при роботі з кислотою — засоби захисту.")),
        ] }),
    ];
}

/* ════════════════ 3.2 Batterie laden und wechseln ════════════════ */
export function lesson32(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Die Ladestation", "The charging station", "Stanowisko ładowania", "Зарядна станція"),
            lead: t("Geladen wird an einem festgelegten Platz. Er ist so eingerichtet, dass sich Wasserstoff nicht ansammeln und nichts entzünden kann.", "Charging takes place at a designated spot. It is set up so that hydrogen cannot build up and nothing can ignite.", "Ładuje się w wyznaczonym miejscu. Jest ono urządzone tak, by wodór się nie gromadził i nic nie mogło się zapalić.", "Заряджають у визначеному місці. Воно облаштоване так, щоб водень не накопичувався і ніщо не займалося."),
            points: [
                pt(t("<b>Kennzeichnung:</b> „Zutritt für Unbefugte verboten“, „Keine offene Flamme, Feuer und Rauchen verboten“ und das Warnzeichen für das Laden von Batterien.", "<b>Signs:</b> “No unauthorised access”, “No open flame, fire and smoking prohibited” and the warning sign for battery charging.", "<b>Oznakowanie:</b> „Wstęp dla nieupoważnionych wzbroniony”, „Zakaz otwartego ognia i palenia” oraz znak ostrzegawczy ładowania akumulatorów.", "<b>Знаки:</b> «Стороннім вхід заборонено», «Відкритий вогонь і куріння заборонені» та знак небезпеки зарядки батарей.")),
                pt(t("<b>Lüftung:</b> Die Ladestation ist stets gut belüftet.", "<b>Ventilation:</b> the charging station is always well ventilated.", "<b>Wentylacja:</b> stanowisko ładowania jest zawsze dobrze wietrzone.", "<b>Вентиляція:</b> зарядна станція завжди добре провітрюється.")),
                pt(t("<b>Abstand:</b> Brennbares wie Regale oder Schränke steht mindestens 2,5 m vom Ladeplatz entfernt und nicht darüber.", "<b>Distance:</b> combustible things like racks or cabinets stand at least 2.5 m from the charging spot and not above it.", "<b>Odstęp:</b> rzeczy palne, jak regały czy szafy, stoją co najmniej 2,5 m od miejsca ładowania i nie nad nim.", "<b>Відстань:</b> горючі предмети, як-от стелажі чи шафи, стоять щонайменше за 2,5 м від місця зарядки і не над ним.")),
                pt(t("<b>Bereit liegt:</b> persönliche Schutzausrüstung, Löschmittel und eine Möglichkeit zum Augenspülen.", "<b>Ready to hand:</b> personal protective equipment, extinguishing agent and an eye-rinsing option.", "<b>Pod ręką:</b> środki ochrony osobistej, środek gaśniczy i możliwość płukania oczu.", "<b>Під рукою:</b> засоби індивідуального захисту, вогнегасний засіб і можливість промити очі.")),
            ],
            merke: t("In der Ladestation sind offene Flammen, Funken und Rauchen verboten. Immer.", "Open flames, sparks and smoking are prohibited in the charging station. Always.", "Na stanowisku ładowania zakazany jest otwarty ogień, iskry i palenie. Zawsze.", "На зарядній станції відкритий вогонь, іскри й куріння заборонені. Завжди."),
            src: { de: `${FB13}, Abschn. 2 und 4; ${BA} „Batterie laden“` },
        }),
        step("sim", { sim: "people", scene: "charging", texts: SCENE_TEXTS,
            title: t("Was ist hier falsch?", "What is wrong here?", "Co tu jest nie tak?", "Що тут не так?"),
            lead: t("Finde die vier Gefahren an dieser Ladestation. Drehe die Szene mit dem Finger.", "Find the four hazards at this charging station. Rotate the scene with your finger.", "Znajdź cztery zagrożenia na tym stanowisku ładowania. Obracaj scenę palcem.", "Знайди чотири небезпеки на цій станції. Обертай сцену пальцем."),
            zones: [
                { id: "smoke", bad: true, label: t("Rauchen", "Smoking", "Palenie", "Куріння"), why: t("Beim Laden entsteht Wasserstoff. Eine Zigarette kann das Knallgas zünden. Rauchen ist in der Ladestation verboten.", "Charging produces hydrogen. A cigarette can ignite the oxyhydrogen gas. Smoking is prohibited in the charging station.", "Przy ładowaniu powstaje wodór. Papieros może zapalić gaz piorunujący. Palenie na stanowisku jest zakazane.", "Під час зарядки утворюється водень. Сигарета може запалити гримучий газ. Куріння на станції заборонене.") },
                { id: "tool", bad: true, label: t("Werkzeug auf der Batterie", "Tool on the battery", "Narzędzie na akumulatorze", "Інструмент на батареї"), why: t("Ein Schraubenschlüssel kann zwei Pole verbinden: Kurzschluss, Funken, Verbrennungen.", "A spanner can connect two poles: short circuit, sparks, burns.", "Klucz może połączyć dwa bieguny: zwarcie, iskry, oparzenia.", "Ключ може з’єднати два полюси: коротке замикання, іскри, опіки.") },
                { id: "water", bad: true, label: t("Wasser nachfüllen beim Laden", "Topping up while charging", "Dolewanie wody w trakcie ładowania", "Доливання води під час зарядки"), why: t("Destilliertes Wasser kommt erst nach dem Laden in die Batterie. Während des Ladens steigt der Säurespiegel.", "Distilled water only goes into the battery after charging. The acid level rises while charging.", "Wodę destylowaną dolewa się dopiero po ładowaniu. W trakcie ładowania poziom kwasu rośnie.", "Дистильовану воду доливають лише після зарядки. Під час зарядки рівень кислоти піднімається.") },
                { id: "shelf", bad: true, label: t("Regal mit Kartons am Ladeplatz", "Rack with cartons at the charging spot", "Regał z kartonami przy miejscu ładowania", "Стелаж з коробками біля місця зарядки"), why: t("Brennbares muss mindestens 2,5 m vom Ladeplatz entfernt sein.", "Combustible material must be at least 2.5 m from the charging spot.", "Materiały palne muszą być co najmniej 2,5 m od miejsca ładowania.", "Горючі матеріали мають бути щонайменше за 2,5 м від місця зарядки.") },
                { id: "sign", label: t("Warn- und Verbotszeichen", "Warning and prohibition signs", "Znaki ostrzegawcze i zakazu", "Знаки небезпеки і заборони"), why: t("Richtig: Warnzeichen „Laden von Batterien“ und „Feuer, offene Flamme und Rauchen verboten“.", "Correct: warning sign “battery charging” and “fire, open flame and smoking prohibited”.", "Dobrze: znak „ładowanie akumulatorów” i „zakaz używania otwartego ognia i palenia”.", "Правильно: знак «зарядка батарей» і «вогонь і куріння заборонені».") },
                { id: "vent", label: t("Lüftungsgitter", "Ventilation grille", "Kratka wentylacyjna", "Вентиляційна решітка"), why: t("Richtig: Lüftung verdünnt den Wasserstoff.", "Correct: ventilation dilutes the hydrogen.", "Dobrze: wentylacja rozrzedza wodór.", "Правильно: вентиляція розріджує водень.") },
                { id: "eyewash", label: t("Augenspülflasche", "Eyewash bottle", "Butelka do płukania oczu", "Пляшка для промивання очей"), why: t("Richtig: Bei Säurespritzern zählt jede Sekunde.", "Correct: with acid splashes, every second counts.", "Dobrze: przy bryzgach kwasu liczy się każda sekunda.", "Правильно: при бризках кислоти важлива кожна секунда.") },
            ],
            done: t("Alle vier Gefahren erkannt.", "All four hazards spotted.", "Rozpoznałeś wszystkie cztery zagrożenia.", "Усі чотири небезпеки виявлено."),
            src: { de: `${FB13}, Abschn. 2 und 4; ${BA} „Batterie laden“` },
        }),
        step("sim", { sim: "sequence", texts: SEQ_TEXTS,
            title: t("So lädst du richtig", "How to charge correctly", "Tak ładujesz prawidłowo", "Як правильно заряджати"),
            lead: t("Bring die Schritte in die richtige Reihenfolge.", "Put the steps in the right order.", "Ułóż kroki we właściwej kolejności.", "Розстав кроки в правильному порядку."),
            items: [
                { t: t("Stapler am Ladeplatz abstellen und gegen unbefugtes Benutzen sichern", "Park the forklift at the charging spot and secure it against unauthorised use", "Odstaw wózek na miejscu ładowania i zabezpiecz przed użyciem przez osoby nieupoważnione", "Постав навантажувач на місце зарядки й захисти від стороннього використання") },
                { t: t("Batterie auf Schäden und austretende Säure prüfen", "Check the battery for damage and leaking acid", "Sprawdź akumulator pod kątem uszkodzeń i wycieku kwasu", "Перевір батарею на пошкодження й витік кислоти") },
                { t: t("Batteriestecker am Stapler herausziehen", "Pull the battery connector out of the forklift", "Wyciągnij wtyczkę akumulatora z wózka", "Витягни роз’єм батареї з навантажувача") },
                { t: t("Ladegerätstecker in die Batteriesteckdose stecken", "Plug the charger connector into the battery socket", "Włóż wtyczkę ładowarki do gniazda akumulatora", "Встав штекер зарядного пристрою в гніздо батареї") },
                { t: t("Ladegerät einschalten", "Switch on the charger", "Włącz ładowarkę", "Увімкни зарядний пристрій") },
                { t: t("Nach dem Laden: falls nötig destilliertes Wasser auffüllen", "After charging: top up distilled water if needed", "Po ładowaniu: w razie potrzeby dolej wody destylowanej", "Після зарядки: за потреби долий дистильовану воду") },
            ],
            shuffle: [3, 0, 5, 2, 4, 1],
            allRight: t("Perfekt. Genau so steht es in der Betriebsanweisung.", "Perfect. That is exactly what the operating instructions say.", "Świetnie. Dokładnie tak mówi instrukcja stanowiskowa.", "Чудово. Саме так написано в робочій інструкції."),
            someWrong: t("Erst sichern und prüfen, dann den Stapler trennen, dann das Ladegerät anschließen und einschalten. Wasser kommt zum Schluss.", "First secure and check, then disconnect the truck, then connect and switch on the charger. Water comes last.", "Najpierw zabezpiecz i sprawdź, potem odłącz wózek, potem podłącz i włącz ładowarkę. Wodę dolewasz na końcu.", "Спершу захисти й перевір, потім від’єднай навантажувач, потім під’єднай і ввімкни зарядний пристрій. Воду доливаєш наприкінці."),
            src: { de: `${BA} „Batterie laden“` },
        }),
        step("video", {
            title: t("Laden an der Ladestation", "Charging at the charging station", "Ładowanie na stanowisku ładowania", "Зарядка на станції"),
            brief: t("Ein Fahrer stellt den Stapler am Ladeplatz ab, zieht den Schlüssel, öffnet die Haube, prüft die Batterie, trennt den Batteriestecker, steckt das Ladegerät an und schaltet es ein. Schilder und Lüftung kurz im Bild.", "A driver parks the forklift at the charging spot, removes the key, opens the cover, checks the battery, disconnects the battery connector, plugs in the charger and switches it on. Signs and ventilation briefly in shot.", "Operator odstawia wózek na miejscu ładowania, wyjmuje kluczyk, otwiera pokrywę, sprawdza akumulator, rozłącza wtyczkę akumulatora, podłącza ładowarkę i ją włącza. Krótko w kadrze znaki i wentylacja.", "Водій ставить навантажувач на місце зарядки, виймає ключ, відкриває кришку, перевіряє батарею, від’єднує роз’єм батареї, під’єднує зарядний пристрій і вмикає його. Коротко в кадрі знаки й вентиляція."),
            length: t("40 bis 60 Sekunden", "40 to 60 seconds", "40 do 60 sekund", "40–60 секунд"),
        }),
        step("learn", {
            title: t("Batterie wechseln", "Changing the battery", "Wymiana akumulatora", "Заміна батареї"),
            lead: t("Bei Mehrschichtbetrieb wird die Batterie oft gewechselt statt geladen. Sie wiegt mehrere hundert Kilo, darum gelten feste Regeln.", "In multi-shift operation the battery is often changed instead of charged. It weighs several hundred kilos, so fixed rules apply.", "Przy pracy wielozmianowej akumulator często się wymienia zamiast ładować. Waży kilkaset kilogramów, więc obowiązują stałe zasady.", "У багатозмінній роботі батарею часто міняють замість зарядки. Вона важить кількасот кілограмів, тому діють чіткі правила."),
            points: [
                pt(t("<b>Vorbereiten:</b> Stapler sicher abstellen, Gabeln absenken, Mast nach vorn neigen, Batteriestecker ziehen.", "<b>Prepare:</b> park the truck safely, lower the forks, tilt the mast forwards, pull the battery connector.", "<b>Przygotowanie:</b> bezpiecznie odstaw wózek, opuść widły, pochyl maszt do przodu, wyciągnij wtyczkę akumulatora.", "<b>Підготовка:</b> безпечно постав навантажувач, опусти вила, нахили щоглу вперед, витягни роз’єм батареї.")),
                pt(t("<b>Heben:</b> nur mit dem bereitgestellten Hebezeug und Anschlagmittel, vorsichtig anheben und auf das Fahrerschutzdach achten.", "<b>Lifting:</b> only with the lifting gear and slings provided, lift carefully and watch the overhead guard.", "<b>Podnoszenie:</b> tylko udostępnionym urządzeniem dźwignicowym i zawiesiem; podnoś ostrożnie i uważaj na daszek ochronny.", "<b>Підйом:</b> лише наданим підйомним пристроєм і стропами, обережно, стежачи за захисним дахом.")),
                pt(t("<b>Einbauen:</b> nur vom Hersteller nach Größe und Gewicht zugelassene Batterien. Gegen Verrutschen sichern, Polklemmen fest.", "<b>Fitting:</b> only batteries approved by the manufacturer for size and weight. Secure against slipping, terminals tight.", "<b>Montaż:</b> tylko akumulatory dopuszczone przez producenta co do wymiarów i masy. Zabezpieczyć przed przesunięciem, zaciski dokręcone.", "<b>Встановлення:</b> лише батареї, дозволені виробником за розміром і масою. Зафіксувати від зсуву, клеми затягнути.")),
                pt(t("<b>Schutz:</b> Sicherheitsschuhe und Schutzhandschuhe tragen.", "<b>Protection:</b> wear safety shoes and protective gloves.", "<b>Ochrona:</b> noś obuwie ochronne i rękawice ochronne.", "<b>Захист:</b> вдягай захисне взуття і рукавиці.")),
            ],
            merke: t("Die Batterie gehört zur Masse des Staplers. Eine leichtere Batterie ist kein Gewinn, sondern ein Risiko.", "The battery is part of the truck’s mass. A lighter battery is not a gain but a risk.", "Akumulator należy do masy wózka. Lżejszy akumulator to nie zysk, tylko ryzyko.", "Батарея входить у масу навантажувача. Легша батарея — це не виграш, а ризик."),
            src: { de: `${BA} „Batterie wechseln“` },
        }),
        step("question", {
            title: t("Die Batterie vom Nachbarstapler", "The battery from the next forklift", "Akumulator z sąsiedniego wózka", "Батарея із сусіднього навантажувача"),
            text: t("Dein Kollege will eine Batterie aus einem anderen Stapler einbauen. Sie ist etwas leichter, passt aber in den Batterieraum. „Hauptsache sie ist voll“, sagt er.", "Your colleague wants to fit a battery from another forklift. It is slightly lighter but fits into the battery compartment. “The main thing is it’s full,” he says.", "Kolega chce zamontować akumulator z innego wózka. Jest trochę lżejszy, ale mieści się w komorze. „Grunt, że jest naładowany” — mówi.", "Колега хоче поставити батарею з іншого навантажувача. Вона трохи легша, але влазить у відсік. «Головне, що заряджена», — каже він."),
            layout: "list",
            options: [t("Passt, also einbauen", "It fits, so fit it", "Pasuje, więc montujemy", "Підходить, отже ставимо"), t("Nur einbauen, wenn der Hersteller sie zugelassen hat", "Only fit it if the manufacturer has approved it", "Montować tylko, jeśli producent go dopuścił", "Ставити лише, якщо виробник її дозволив")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein", "No", "Nie", "Ні") },
            quote: t("„Nur vom Hersteller nach Größe und Gewicht zugelassene Batterien einbauen.“", "“Only fit batteries approved by the manufacturer for size and weight.”", "„Montować tylko akumulatory dopuszczone przez producenta co do wymiarów i masy.”", "«Встановлювати лише батареї, дозволені виробником за розміром і масою.»"),
            body: t("Passen allein reicht nicht. Mit dem falschen Gewicht stimmt die Standsicherheit nicht mehr, die auf dem Typenschild angegeben ist.", "Fitting alone is not enough. With the wrong weight, the stability stated on the type plate no longer applies.", "Samo zmieszczenie się nie wystarczy. Przy złej masie stateczność podana na tabliczce przestaje się zgadzać.", "Самого розміру замало. З неправильною масою стійкість, вказана на табличці, вже не відповідає."),
            src: { de: `${BA} „Batterie wechseln“` },
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Ladestation:</b> gekennzeichnet, belüftet, 2,5 m Abstand zu Brennbarem, keine Zündquellen.", "<b>Charging station:</b> signposted, ventilated, 2.5 m from combustibles, no ignition sources.", "<b>Stanowisko ładowania:</b> oznakowane, wietrzone, 2,5 m od materiałów palnych, bez źródeł zapłonu.", "<b>Зарядна станція:</b> позначена, провітрювана, 2,5 м до горючих матеріалів, без джерел запалювання.")),
            pt(t("<b>Reihenfolge:</b> sichern, prüfen, Stapler trennen, Ladegerät anschließen und einschalten, Wasser zum Schluss.", "<b>Order:</b> secure, check, disconnect the truck, connect and switch on the charger, water last.", "<b>Kolejność:</b> zabezpiecz, sprawdź, odłącz wózek, podłącz i włącz ładowarkę, wodę dolewasz na końcu.", "<b>Порядок:</b> захисти, перевір, від’єднай навантажувач, під’єднай і ввімкни зарядний пристрій, воду доливаєш наприкінці.")),
            pt(t("<b>Wechsel:</b> nur zugelassene Batterien, mit Hebezeug, gesichert und mit Schutzausrüstung.", "<b>Change:</b> approved batteries only, with lifting gear, secured and with protective equipment.", "<b>Wymiana:</b> tylko dopuszczone akumulatory, z urządzeniem dźwignicowym, zabezpieczone, w środkach ochrony.", "<b>Заміна:</b> лише дозволені батареї, з підйомником, зафіксовані, у засобах захисту.")),
        ] }),
    ];
}

/* ════════════════ 3.3 Verbrennungsmotor und Treibgas ════════════════ */
export function lesson33(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Treibgas tritt aus. Wohin zieht es?", "LPG is leaking. Where does it go?", "Gaz płynny się ulatnia. Dokąd się przemieszcza?", "Зріджений газ витікає. Куди він рухається?"),
            text: OPENER, layout: "list",
            options: [t("Nach oben, wie Rauch", "Upwards, like smoke", "Do góry, jak dym", "Угору, як дим"), t("Nach unten, in Gruben und Keller", "Downwards, into pits and cellars", "W dół, do zagłębień, kanałów montażowych i piwnic", "Униз, у ями та підвали"), t("Es verteilt sich sofort", "It disperses immediately", "Od razu się rozprasza", "Одразу розсіюється")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: WRONG_T },
            quote: t("„Da Flüssiggas schwerer als Luft ist, kann sich ausgetretenes Flüssiggas in tiefergelegenen Räumen ansammeln.“", "“Because LPG is heavier than air, leaked LPG can collect in lower-lying rooms.”", "„Ponieważ gaz płynny jest cięższy od powietrza, może gromadzić się w niżej położonych pomieszczeniach.”", "«Оскільки зріджений газ важчий за повітря, він може накопичуватися в нижче розташованих приміщеннях.»"),
            body: t("Darum gelten für Gasstapler besondere Regeln beim Abstellen. Vorher schauen wir uns alle Verbrennungsmotoren an.", "That is why special parking rules apply to LPG forklifts. First, let us look at all combustion engines.", "Dlatego dla wózków gazowych obowiązują szczególne zasady odstawiania. Najpierw przyjrzymy się wszystkim silnikom spalinowym.", "Тому для газових навантажувачів діють особливі правила паркування. Спершу розглянемо всі двигуни внутрішнього згоряння."),
            src: { de: "DGUV V68 DA zu §18" }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Diesel, Treibgas, Erdgas, Benzin", "Diesel, LPG, natural gas, petrol", "Diesel, gaz płynny, gaz ziemny, benzyna", "Дизель, зріджений газ, природний газ, бензин"),
            lead: t("Verbrennungsmotoren sind stark und schnell betankt. Alle erzeugen aber gesundheitsschädliche Abgase.", "Combustion engines are powerful and quick to refuel. But all produce harmful exhaust gases.", "Silniki spalinowe są mocne i szybko się je tankuje. Wszystkie wytwarzają jednak szkodliwe spaliny.", "Двигуни внутрішнього згоряння потужні й швидко заправляються. Але всі виробляють шкідливі вихлопні гази."),
            points: [
                pt(t("<b>Abgase:</b> Kohlenmonoxid, Kohlendioxid, Stickoxide, Kohlenwasserstoffe und beim Diesel Rußpartikel. Ruß gilt als Ursache für Lungenkrebs.", "<b>Exhaust:</b> carbon monoxide, carbon dioxide, nitrogen oxides, hydrocarbons and, with diesel, soot particles. Soot is considered a cause of lung cancer.", "<b>Spaliny:</b> tlenek węgla, dwutlenek węgla, tlenki azotu, węglowodory, a w dieslu cząstki sadzy. Sadza uchodzi za przyczynę raka płuc.", "<b>Вихлоп:</b> чадний газ, вуглекислий газ, оксиди азоту, вуглеводні, а в дизеля сажа. Сажу вважають причиною раку легень.")),
                pt(t("<b>In Hallen:</b> nur, wenn in der Atemluft keine gefährlichen Konzentrationen entstehen. Diesel ist in Gebäuden stark eingeschränkt und braucht einen Partikelfilter.", "<b>Indoors:</b> only if no dangerous concentrations build up in the breathing air. Diesel is heavily restricted in buildings and needs a particle filter.", "<b>W halach:</b> tylko wtedy, gdy w powietrzu nie powstają niebezpieczne stężenia. Diesel w budynkach jest mocno ograniczony i wymaga filtra cząstek.", "<b>У приміщеннях:</b> лише якщо в повітрі не утворюються небезпечні концентрації. Дизель у будівлях суворо обмежений і потребує сажового фільтра.")),
                pt(t("<b>Treibgas und Benzin</b> fahren mit geregeltem Katalysator sauberer, sind aber nicht abgasfrei.", "<b>LPG and petrol</b> run cleaner with a controlled catalytic converter, but are not exhaust-free.", "<b>Gaz płynny i benzyna</b> z regulowanym katalizatorem spalają czyściej, ale też wytwarzają spaliny.", "<b>Зріджений газ і бензин</b> з регульованим каталізатором працюють чистіше, але теж мають вихлоп.")),
                pt(t("<b>Dein Beitrag:</b> Motor nicht unnötig laufen lassen, kein Vollgas, kein starkes Beschleunigen.", "<b>Your part:</b> do not let the engine run unnecessarily, no full throttle, no hard acceleration.", "<b>Twój wkład:</b> nie zostawiaj silnika włączonego bez potrzeby, bez pełnego gazu i gwałtownego przyspieszania.", "<b>Твій внесок:</b> не тримай двигун увімкненим без потреби, без повного газу й різкого розгону.")),
            ],
            merke: t("Riechst du Abgas in der Halle, ist es schon zu viel. Melde es.", "If you can smell exhaust in the hall, it is already too much. Report it.", "Jeśli czujesz spaliny w hali, to już za dużo. Zgłoś to.", "Якщо відчуваєш вихлоп у приміщенні, це вже забагато. Повідом."),
            src: { de: `DGUV V68 §21 mit DA; ${I208} Abschn. 3.1` },
        }),
        step("learn", {
            title: t("Treibgas: was du wissen musst", "LPG: what you need to know", "Gaz płynny: co musisz wiedzieć", "Зріджений газ: що треба знати"),
            lead: t("Treibgas ist Flüssiggas in einer Druckflasche am Heck des Staplers.", "LPG is liquefied gas in a pressure cylinder at the rear of the forklift.", "Gaz napędowy to gaz płynny w butli ciśnieniowej z tyłu wózka.", "Пальний газ — це зріджений газ у балоні під тиском ззаду навантажувача."),
            points: [
                pt(t("<b>Gefahren:</b> extrem entzündbar, schwerer als Luft, Brand- und Explosionsgefahr, Kälteverbrennungen an Haut und Händen.", "<b>Hazards:</b> extremely flammable, heavier than air, fire and explosion risk, cold burns to skin and hands.", "<b>Zagrożenia:</b> skrajnie łatwopalny, cięższy od powietrza, ryzyko pożaru i wybuchu, odmrożenia skóry i dłoni.", "<b>Небезпеки:</b> надзвичайно займистий, важчий за повітря, ризик пожежі й вибуху, холодові опіки шкіри й рук.")),
                pt(t("<b>Im Betrieb:</b> Flaschenventil ganz öffnen, nur so wirkt das Rohrbruchventil. Flasche vor Hitze über 40 °C schützen.", "<b>In operation:</b> open the cylinder valve fully, only then does the excess-flow valve work. Protect the cylinder from heat above 40 °C.", "<b>W pracy:</b> otwórz zawór butli całkowicie, tylko wtedy działa zawór zabezpieczający przed pęknięciem przewodu. Chroń butlę przed temperaturą powyżej 40 °C.", "<b>У роботі:</b> відкривай вентиль балона повністю: лише так спрацьовує клапан захисту від розриву трубопроводу. Захищай балон від тепла понад 40 °C.")),
                pt(t("<b>Pause und Feierabend:</b> Flaschenventil schließen.", "<b>Breaks and end of shift:</b> close the cylinder valve.", "<b>Przerwa i koniec pracy:</b> zamknij zawór butli.", "<b>Перерва і кінець зміни:</b> закрий вентиль балона.")),
                pt(t("<b>Abstellen:</b> nicht unter Erdgleiche und mindestens 3 m entfernt von Kellerzugängen, Gruben, Schächten und Kanaleinläufen.", "<b>Parking:</b> not below ground level and at least 3 m away from cellar entrances, pits, shafts and drains.", "<b>Odstawianie:</b> nie poniżej poziomu terenu i co najmniej 3 m od zejść do piwnic, kanałów, szybów i wpustów kanalizacyjnych.", "<b>Паркування:</b> не нижче рівня землі і щонайменше за 3 м від входів у підвали, ям, шахт і водостоків.")),
            ],
            merke: t("Die Gasanlage wird mindestens jährlich von einem Sachkundigen geprüft, die Flaschen alle 2 Jahre vom Befüller.", "The gas system is inspected at least once a year by a competent person, the cylinders every 2 years by the filling company.", "Instalację gazową sprawdza osoba uprawniona co najmniej raz w roku, a butle co 2 lata firma, która je napełnia.", "Газову систему щонайменше раз на рік перевіряє фахівець, а балони кожні 2 роки перевіряє компанія, що їх заправляє."),
            src: { de: `${DVFG}; DGUV V68 §18 mit DA; ${BA} „Austausch von Treibgasflaschen“` },
        }),
        step("sim", { sim: "scene", scene: "gaspark", mode: "choose", layout: "tiles", texts: SCENE_TEXTS,
            title: t("Wo stellst du den Gasstapler ab?", "Where do you park the LPG forklift?", "Gdzie odstawiasz wózek gazowy?", "Де ставиш газовий навантажувач?"),
            lead: t("Feierabend. Wähle den richtigen Platz.", "End of shift. Choose the right place.", "Koniec zmiany. Wybierz właściwe miejsce.", "Кінець зміни. Обери правильне місце."),
            zones: [
                { id: "keller", short: t("Keller", "Cellar", "Piwnica", "Підвал"), bad: true, label: t("Tiefgarage", "Underground garage", "Garaż podziemny", "Підземний гараж"), why: t("Unter Erdgleiche sammelt sich ausgetretenes Gas und kann nicht abfließen.", "Below ground level, leaked gas collects and cannot escape.", "Poniżej poziomu terenu ulatniający się gaz gromadzi się i nie może odpłynąć.", "Нижче рівня землі газ, що витік, накопичується і не може вийти.") },
                { id: "gully", short: t("Gully", "Drain", "Wpust kanalizacyjny", "Водостік"), bad: true, label: t("Neben dem Kanaleinlauf", "Next to the drain", "Przy wpuście kanalizacyjnym", "Біля водостоку"), why: t("Gas kann in den Kanal fließen und sich dort entzünden. Halte mindestens 3 m Abstand.", "Gas can flow into the drain and ignite there. Keep at least 3 m away.", "Gaz może spłynąć do kanału i tam się zapalić. Zachowaj co najmniej 3 m odstępu.", "Газ може стекти в каналізацію і там займитися. Тримай відстань щонайменше 3 м.") },
                { id: "grube", short: t("Grube", "Pit", "Kanał montażowy", "Яма"), bad: true, label: t("Werkstatt mit Montagegrube", "Workshop with inspection pit", "Warsztat z kanałem montażowym", "Майстерня з оглядовою ямою"), why: t("In der Grube sammelt sich das schwere Gas. Nicht in Räumen mit Gruben oder Schächten abstellen.", "The heavy gas collects in the pit. Do not park in rooms with pits or shafts.", "Ciężki gaz gromadzi się w kanale montażowym. Nie odstawiaj wózka w pomieszczeniach z kanałami montażowymi lub szybami.", "Важкий газ накопичується в ямі. Не став у приміщеннях з ямами чи шахтами.") },
                { id: "frei", short: t("Platz", "Yard", "Plac", "Майданчик"), label: t("Abstellplatz über Erdgleiche", "Parking area above ground level", "Miejsce postojowe na poziomie terenu", "Стоянка над рівнем землі"), why: t("Über Erdgleiche, gut belüftet und mehr als 3 m von Öffnungen entfernt. Flaschenventil schließen.", "Above ground level, well ventilated and more than 3 m from openings. Close the cylinder valve.", "Na poziomie terenu, dobrze wietrzone miejsce, ponad 3 m od otworów. Zamknij zawór butli.", "Над рівнем землі, добре провітрюване і більше 3 м від отворів. Закрий вентиль балона.") },
            ],
            done: t("Richtig abgestellt.", "Parked correctly.", "Prawidłowo odstawiony.", "Правильно поставлено."),
            src: { de: "DGUV V68 §18 mit DA" },
        }),
        step("sim", { sim: "sequence", texts: SEQ_TEXTS,
            title: t("Treibgasflasche wechseln", "Changing the LPG cylinder", "Wymiana butli gazowej", "Заміна газового балона"),
            lead: t("Bring die Schritte in die richtige Reihenfolge.", "Put the steps in the right order.", "Ułóż kroki we właściwej kolejności.", "Розстав кроки в правильному порядку."),
            items: [
                { t: t("Im Freien über Erdgleiche: Motor abstellen, Zündquellen fernhalten, nicht rauchen", "Outdoors above ground level: switch off the engine, keep ignition sources away, no smoking", "Na zewnątrz, na poziomie terenu: wyłącz silnik, usuń źródła zapłonu, nie pal", "Надворі над рівнем землі: вимкни двигун, прибери джерела запалювання, не кури") },
                { t: t("Lederhandschuhe anziehen", "Put on leather gloves", "Załóż skórzane rękawice", "Вдягни шкіряні рукавиці") },
                { t: t("Ventil der leeren Flasche schließen (im Uhrzeigersinn)", "Close the valve of the empty cylinder (clockwise)", "Zamknij zawór pustej butli (zgodnie z ruchem wskazówek zegara)", "Закрий вентиль порожнього балона (за годинниковою стрілкою)") },
                { t: t("Überwurfmutter vorsichtig lösen, Achtung Linksgewinde", "Loosen the union nut carefully, note: left-hand thread", "Ostrożnie odkręć nakrętkę, uwaga: gwint lewy", "Обережно відкрути накидну гайку, увага: ліва різьба") },
                { t: t("Volle Flasche liegend einsetzen, Kragenöffnung nach unten, Dichtring prüfen", "Insert the full cylinder lying down, collar opening facing down, check the seal", "Włóż pełną butlę na leżąco, otworem kołnierza w dół, sprawdź uszczelkę", "Встав повний балон лежачи, отвором коміра вниз, перевір ущільнювач") },
                { t: t("Mit der Halterung befestigen und anschließen", "Fix it with the holder and connect it", "Zamocuj uchwytem i podłącz", "Закріпи тримачем і під’єднай") },
                { t: t("Flaschenventil langsam und vorsichtig ganz öffnen", "Open the cylinder valve slowly and carefully all the way", "Powoli i ostrożnie otwórz zawór całkowicie", "Повільно й обережно повністю відкрий вентиль") },
            ],
            shuffle: [2, 5, 0, 6, 3, 1, 4],
            allRight: t("Perfekt. So wechselst du sicher.", "Perfect. That is how to change safely.", "Świetnie. Tak wymieniasz bezpiecznie.", "Чудово. Так балон міняють безпечно."),
            someWrong: t("Erst sicherer Ort und Handschuhe, dann leere Flasche zu und abschrauben, volle liegend einsetzen und befestigen, zum Schluss das Ventil öffnen.", "First a safe place and gloves, then close and unscrew the empty cylinder, insert and fix the full one lying down, and open the valve last.", "Najpierw bezpieczne miejsce i rękawice, potem zamknij i odkręć pustą butlę, pełną włóż na leżąco i zamocuj, na końcu otwórz zawór.", "Спершу безпечне місце й рукавиці, потім закрий і відкрути порожній балон, повний встав лежачи й закріпи, наприкінці відкрий вентиль."),
            src: { de: `${DVFG}, Abschn. 3.2; ${BA} „Austausch von Treibgasflaschen“` },
        }),
        step("video", {
            title: t("Flaschenwechsel in echt", "A real cylinder change", "Wymiana butli w praktyce", "Заміна балона в реальних умовах"),
            brief: t("Im Freien: Fahrer stellt den Motor ab, zieht Lederhandschuhe an, schließt das Ventil, löst die Mutter (Linksgewinde betonen), setzt die volle Flasche liegend mit Kragen nach unten ein, befestigt sie und öffnet das Ventil langsam.", "Outdoors: driver switches off the engine, puts on leather gloves, closes the valve, loosens the nut (emphasise the left-hand thread), inserts the full cylinder lying down with the collar facing down, fixes it and opens the valve slowly.", "Na zewnątrz: operator wyłącza silnik, zakłada skórzane rękawice, zamyka zawór, odkręca nakrętkę (podkreślić gwint lewy), wkłada pełną butlę na leżąco kołnierzem w dół, mocuje ją i powoli otwiera zawór.", "Надворі: водій вимикає двигун, вдягає шкіряні рукавиці, закриває вентиль, відкручує гайку (підкреслити ліву різьбу), ставить повний балон лежачи коміром униз, закріплює і повільно відкриває вентиль."),
            length: t("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("question", {
            title: t("Gasgeruch in der Halle", "Smell of gas in the hall", "Zapach gazu w hali", "Запах газу в приміщенні"),
            text: t("Du riechst am Gasstapler deutlich Gas und hörst ein leises Zischen. Was tust du?", "You clearly smell gas at the LPG forklift and hear a quiet hiss. What do you do?", "Wyraźnie czujesz gaz przy wózku gazowym i słyszysz ciche syczenie. Co robisz?", "Ти чітко чуєш запах газу біля газового навантажувача і тихе шипіння. Що робиш?"),
            layout: "list",
            options: [t("Schnell mit dem Stapler ins Freie fahren", "Drive the forklift outside quickly", "Szybko wyjechać wózkiem na zewnątrz", "Швидко виїхати навантажувачем надвір"), t("Motor aus, Flaschenventil schließen, keine Schalter betätigen, lüften, Halle verlassen", "Engine off, close the cylinder valve, operate no switches, ventilate, leave the hall", "Wyłączyć silnik, zamknąć zawór butli, nie używać włączników elektrycznych, przewietrzyć, opuścić halę", "Вимкнути двигун, закрити вентиль балона, не чіпати електровимикачі, провітрити, вийти з приміщення"), t("Licht einschalten und das Leck suchen", "Switch on the light and look for the leak", "Włączyć światło i szukać wycieku", "Увімкнути світло й шукати витік")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das kann zünden", "No, that can cause ignition", "Nie, to może spowodować zapłon", "Ні, це може спричинити займання") },
            quote: t("„Motor abschalten! Sofort Flaschenventil schließen (im Uhrzeigersinn)! Keine Elektroschalter betätigen! Fenster und Türen öffnen!“", "“Switch off the engine! Close the cylinder valve immediately (clockwise)! Do not operate electrical switches! Open windows and doors!”", "„Wyłączyć silnik! Natychmiast zamknąć zawór butli (zgodnie z ruchem wskazówek zegara)! Nie używać włączników elektrycznych! Otworzyć okna i drzwi!”", "«Вимкнути двигун! Негайно закрити вентиль (за годинниковою стрілкою)! Не вмикати електровимикачі! Відчинити вікна й двері!»"),
            body: t("Jeder Funke kann das Gas zünden, auch ein Lichtschalter oder ein laufender Motor. Danach Vorgesetzten informieren und einen Fachmann rufen.", "Any spark can ignite the gas, even a light switch or a running engine. Then inform your supervisor and call a specialist.", "Każda iskra może zapalić gaz, nawet włącznik światła lub pracujący silnik. Potem poinformuj przełożonego i wezwij fachowca.", "Будь-яка іскра може запалити газ, навіть вимикач світла чи працюючий двигун. Потім повідом керівника й виклич фахівця."),
            src: { de: `${DVFG}, Abschn. 3.4` },
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Abgase:</b> Alle Verbrenner sind schädlich, Diesel-Ruß besonders. In Hallen nur eingeschränkt, Elektro ist erste Wahl.", "<b>Exhaust:</b> all combustion engines are harmful, diesel soot especially. Restricted indoors, electric is first choice.", "<b>Spaliny:</b> wszystkie silniki spalinowe szkodzą, sadza z diesla szczególnie. W halach ich użycie jest ograniczone, wózek elektryczny to pierwszy wybór.", "<b>Вихлоп:</b> усі двигуни внутрішнього згоряння шкідливі, дизельна сажа особливо. У приміщеннях їх використання обмежене, електропривід — перший вибір.")),
            pt(t("<b>Treibgas ist schwerer als Luft:</b> nicht unter Erdgleiche abstellen, 3 m Abstand zu Öffnungen.", "<b>LPG is heavier than air:</b> do not park below ground level, 3 m from openings.", "<b>Gaz płynny jest cięższy od powietrza:</b> nie odstawiaj poniżej poziomu terenu, 3 m od otworów.", "<b>Зріджений газ важчий за повітря:</b> не став нижче рівня землі, 3 м від отворів.")),
            pt(t("<b>Flaschenwechsel:</b> im Freien, Handschuhe, Ventil zu, Linksgewinde, liegend einsetzen, Ventil langsam auf.", "<b>Cylinder change:</b> outdoors, gloves, valve closed, left-hand thread, insert lying down, open valve slowly.", "<b>Wymiana butli:</b> na zewnątrz, w rękawicach, zawór zamknąć, gwint lewy, butlę wkładać na leżąco, zawór otwierać powoli.", "<b>Заміна балона:</b> надворі, у рукавицях, вентиль закрити, ліва різьба, балон ставити лежачи, вентиль відкривати повільно.")),
            pt(t("<b>Gasgeruch:</b> Motor aus, Ventil zu, keine Schalter, lüften, raus.", "<b>Smell of gas:</b> engine off, valve closed, no switches, ventilate, get out.", "<b>Zapach gazu:</b> wyłącz silnik, zamknij zawór, nie używaj włączników, przewietrz, wyjdź.", "<b>Запах газу:</b> вимкни двигун, закрий вентиль, не чіпай вимикачі, провітри, вийди.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson3Check(step: Mk): Step[] {
    return [
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Warum ist Rauchen in der Ladestation verboten?", "Why is smoking prohibited in the charging station?", "Dlaczego na stanowisku ładowania nie wolno palić?", "Чому на зарядній станції не можна курити?"),
                    options: [t("Wegen des Geruchs", "Because of the smell", "Z powodu zapachu", "Через запах"), t("Wasserstoff kann sich entzünden", "Hydrogen can ignite", "Wodór może się zapalić", "Водень може загорітися"), t("Wegen der Säure", "Because of the acid", "Z powodu kwasu", "Через кислоту")], correct: 1,
                    why: t("Beim Laden entsteht Wasserstoff, mit Luft bildet er Knallgas.", "Charging produces hydrogen, which forms oxyhydrogen gas with air.", "Przy ładowaniu powstaje wodór, który z powietrzem tworzy gaz piorunujący.", "Під час зарядки утворюється водень, який з повітрям дає гримучий газ.") },
                { q: t("Wie weit muss Brennbares mindestens vom Ladeplatz entfernt sein?", "How far must combustibles be from the charging spot at least?", "Jak daleko co najmniej muszą być materiały palne od miejsca ładowania?", "Як далеко щонайменше мають бути горючі матеріали від місця зарядки?"),
                    options: [{ de: "0,5 m" }, { de: "1 m", en: "1 m" }, t("2,5 m", "2.5 m", "2,5 m", "2,5 м")], correct: 2,
                    why: t("DGUV FB AKTUELL FBRCI-013, Abschn. 2.", "DGUV FB AKTUELL FBRCI-013, section 2.", "DGUV FB AKTUELL FBRCI-013, rozdz. 2.", "DGUV FB AKTUELL FBRCI-013, розд. 2.") },
                { q: t("Was tust du zuerst, bevor du das Ladegerät anschließt?", "What do you do first before connecting the charger?", "Co robisz najpierw, zanim podłączysz ładowarkę?", "Що робиш спершу, перш ніж під’єднати зарядний пристрій?"),
                    options: [t("Wasser auffüllen", "Top up water", "Dolewam wodę", "Доливаю воду"), t("Batteriestecker am Stapler ziehen", "Pull the battery connector out of the forklift", "Wyciągnąć wtyczkę akumulatora z wózka", "Витягнути роз’єм батареї з навантажувача")], correct: 1,
                    why: t("Erst den Stapler trennen, dann das Ladegerät anschließen. Wasser kommt nach dem Laden.", "Disconnect the truck first, then connect the charger. Water comes after charging.", "Najpierw odłącz wózek, potem podłącz ładowarkę. Wodę dolewa się po ładowaniu.", "Спершу від’єднай навантажувач, потім під’єднай зарядний пристрій. Воду доливають після зарядки.") },
                { q: t("Wo darf ein Gasstapler nicht abgestellt werden?", "Where must an LPG forklift not be parked?", "Gdzie nie wolno odstawiać wózka gazowego?", "Де не можна ставити газовий навантажувач?"),
                    options: [t("Im Keller oder neben einem Schacht", "In the cellar or next to a shaft", "W piwnicy lub przy szybie", "У підвалі або біля шахти"), t("Auf einem belüfteten Platz über Erdgleiche", "In a ventilated place above ground level", "Na przewiewnym miejscu na poziomie terenu", "У провітрюваному місці над рівнем землі")], correct: 0,
                    why: t("Flüssiggas ist schwerer als Luft und sammelt sich in Vertiefungen.", "LPG is heavier than air and collects in hollows.", "Gaz płynny jest cięższy od powietrza i gromadzi się w zagłębieniach.", "Зріджений газ важчий за повітря і збирається в заглибленнях.") },
                { q: t("Warum trägst du beim Flaschenwechsel Lederhandschuhe?", "Why do you wear leather gloves when changing the cylinder?", "Dlaczego przy wymianie butli nosisz skórzane rękawice?", "Чому під час заміни балона вдягаєш шкіряні рукавиці?"),
                    options: [t("Gegen Kälteverbrennungen", "Against cold burns", "Przeciw odmrożeniom", "Від холодових опіків"), t("Damit die Flasche sauber bleibt", "So the cylinder stays clean", "Żeby butla była czysta", "Щоб балон залишався чистим")], correct: 0,
                    why: t("Austretendes Flüssiggas verdampft und kühlt dabei stark ab.", "Escaping LPG evaporates and cools down sharply.", "Ulatniający się gaz płynny paruje i mocno się schładza.", "Зріджений газ, що виходить, випаровується і сильно охолоджується.") },
                { q: t("Welcher Antrieb ist in Hallen die erste Wahl?", "Which drive is the first choice indoors?", "Który napęd jest pierwszym wyborem w halach?", "Який привід — перший вибір у приміщеннях?"),
                    options: [t("Diesel", "Diesel", "Diesel", "Дизель"), t("Elektro", "Electric", "Elektryczny", "Електропривід"), t("Treibgas", "LPG", "Gaz płynny", "Газ")], correct: 1,
                    why: t("DGUV Information 208-004, Abschn. 3.1.", "DGUV Information 208-004, section 3.1.", "DGUV Information 208-004, rozdz. 3.1.", "DGUV Information 208-004, розд. 3.1.") },
            ],
            allRight: t("Stark. Modul geschafft.", "Great. Module complete.", "Świetnie. Moduł zaliczony.", "Чудово. Модуль пройдено."),
            someWrong: t("Fast. Geh bei Bedarf zu den Themen zurück.", "Almost. Go back to the topics if needed.", "Prawie. W razie potrzeby wróć do tematów.", "Майже. За потреби повернися до тем."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Elektro:</b> Batterie richtig laden, nichts darauflegen, Säure ernst nehmen.", "<b>Electric:</b> charge the battery correctly, put nothing on it, take acid seriously.", "<b>Elektryczny:</b> prawidłowo ładuj, nic nie kładź na akumulatorze, uważaj na kwas.", "<b>Електропривід:</b> правильно заряджай, нічого не клади на батарею, обережно з кислотою.")),
            pt(t("<b>Verbrenner:</b> Abgase vermeiden, Gasstapler richtig abstellen, Flasche sicher wechseln.", "<b>Combustion:</b> avoid exhaust, park LPG forklifts correctly, change cylinders safely.", "<b>Napęd spalinowy:</b> unikaj spalin, prawidłowo odstawiaj wózek gazowy, bezpiecznie wymieniaj butlę.", "<b>Двигун внутрішнього згоряння:</b> уникай вихлопу, правильно став газовий навантажувач, безпечно міняй балон.")),
        ] }),
    ];
}
