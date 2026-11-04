/**
 * Moduł „Regelmäßige Prüfung” (spis klienta, punkt 7, moduł 6 kursu), od razu w czterech językach.
 * Źródła: DGUV Vorschrift 68 §9 z DA, §10, §37–39 z DA (wyd. 2002); DGUV Information 208-004 „Gabelstapler”, rozdz. 5;
 * DGUV G 308-001 (Entwurf 2026) Anhang B 3.2.2.1 Nr. 7 i „Tägliche Einsatzprüfung”; BetrSichV §14 i TRBS 1203 (befähigte Person).
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
const G308 = "DGUV G 308-001 (Entwurf 2026), Anhang B";

const DAILY_TEXTS = texts([
    ["Sichtprüfung", "Visual check", "Kontrola wzrokowa", "Візуальна перевірка"],
    ["Funktionsprüfung", "Function check", "Kontrola działania", "Перевірка функцій"],
    ["Geprüft", "Checked", "Sprawdzone", "Перевірено"],
    ["Tippe auf einen Punkt am Stapler oder in der Liste.", "Tap a point on the forklift or in the list.", "Dotknij punktu na wózku albo na liście.", "Торкнися точки на навантажувачі або в списку."],
    ["Führe den Test durch und beobachte das Ergebnis.", "Carry out the test and watch the result.", "Wykonaj test i obserwuj wynik.", "Виконай тест і спостерігай результат."],
    ["Schau genau hin. Drehe das Modell, wenn nötig.", "Look closely. Rotate the model if needed.", "Przyjrzyj się dokładnie. W razie potrzeby obróć model.", "Придивись уважно. За потреби обертай модель."],
    ["Was stellst du fest?", "What do you find?", "Co stwierdzasz?", "Що ти виявив?"],
    ["In Ordnung", "OK", "W porządku", "Справно"],
    ["Mangel", "Defect", "Usterka", "Дефект"],
    ["Ganzen Stapler zeigen", "Show the whole forklift", "Pokaż cały wózek", "Показати весь навантажувач"],
    ["Ergebnis: {f} von {b} Mängeln erkannt.", "Result: {f} of {b} defects spotted.", "Wynik: rozpoznano {f} z {b} usterek.", "Результат: виявлено {f} з {b} дефектів."],
    ["Pedalweg", "Pedal travel", "Skok pedału", "Хід педалі"],
    ["Spürbarer Widerstand bei {p} des Weges", "Noticeable resistance at {p} of the travel", "Wyczuwalny opór przy {p} skoku", "Відчутний опір на {p} ходу"],
    ["Lenkungsspiel", "Steering play", "Luz kierownicy", "Люфт керма"],
    ["Spiel am Lenkrad: {n} Finger breit", "Play at the steering wheel: {n} fingers wide", "Luz na kierownicy: na {n} palce", "Люфт керма: на {n} пальці"],
]);
const PLATE_TEXTS = texts([
    ["Heute", "Today", "Dziś", "Сьогодні"],
    ["nächste Prüfung", "next inspection", "następny przegląd", "наступна перевірка"],
    ["keine Plakette", "no sticker", "brak plakietki", "немає наклейки"],
    ["Stapler {n}", "Forklift {n}", "Wózek {n}", "Навантажувач {n}"],
    ["Losfahren", "Drive off", "Jadę", "Їду"],
    ["Nicht fahren", "Do not drive", "Nie jadę", "Не їду"],
    ["{r} von {n} richtig entschieden.", "{r} of {n} decided correctly.", "{r} z {n} decyzji prawidłowych.", "{r} з {n} рішень правильні."],
]);
const SEQ_TEXTS = texts([
    ["Tippe unten den nächsten Schritt an", "Tap the next step below", "Dotknij poniżej następnego kroku", "Торкнися нижче наступного кроку"],
    ["Richtig: {s}", "Correct: {s}", "Prawidłowo: {s}", "Правильно: {s}"],
    ["Tippe die Schritte in der richtigen Reihenfolge an", "Tap the steps in the right order", "Dotykaj kroków we właściwej kolejności", "Торкайся кроків у правильному порядку"],
]);

/* ════════════════ Lernziele ════════════════ */
export function lesson6Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Regelmäßige Prüfung", "Regular inspection", "Regularne kontrole", "Регулярні перевірки"), image: "forklift",
            text: t("Ein Riss in der Gabel oder ein weiches Bremspedal fällt im Betrieb oft erst auf, wenn es zu spät ist. Deshalb prüfst du jeden Tag selbst, und einmal im Jahr prüft eine befähigte Person.",
                "A crack in the fork or a soft brake pedal often only shows up in operation when it is too late. That is why you check every day yourself, and once a year a competent person inspects the truck.",
                "Pęknięcie widły albo miękki pedał hamulca często wychodzą na jaw dopiero wtedy, gdy jest za późno. Dlatego codziennie sprawdzasz wózek sam, a raz w roku kontroluje go osoba uprawniona.",
                "Тріщину у вилах чи м’яку педаль гальма часто помічають, коли вже пізно. Тому ти щодня перевіряєш сам, а раз на рік навантажувач перевіряє компетентна особа."),
            meta: [t("ca. 25 Minuten", "about 25 minutes", "ok. 25 minut", "близько 25 хвилин"), t("3 Themen und Modul-Check", "3 topics and module check", "3 tematy i test modułu", "3 теми і перевірка модуля"), { de: "DGUV V68 §9, §10, §37–39" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "Your learning goals for this module. 1 = new to me, 5 = confident.", "Twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: [
                { code: "6.1", text: t("Ich prüfe den Stapler vor Arbeitsbeginn durch Sicht- und Funktionsprüfung.", "I check the forklift before work with a visual and function check.", "Przed pracą sprawdzam wózek wzrokowo i pod kątem działania.", "Перед роботою я оглядаю навантажувач і перевіряю, як працюють його функції."), short: t("Tägliche Prüfung", "Daily check", "Kontrola codzienna", "Щоденна перевірка") },
                { code: "6.2", text: t("Ich weiß, was ich bei einem Mangel tue und wie ich den Stapler gegen Weiterbetrieb sichere.", "I know what to do when I find a defect and how to secure the forklift against further use.", "Wiem, co robić przy usterce i jak zabezpieczyć wózek przed dalszym użyciem.", "Я знаю, що робити при дефекті і як убезпечити навантажувач від подальшого використання."), short: t("Mängel melden", "Report defects", "Zgłaszanie usterek", "Повідомлення про дефекти") },
                { code: "6.3", text: t("Ich kenne die jährliche Prüfung, den Prüfnachweis und die Prüfplakette.", "I know the annual inspection, the inspection record and the inspection sticker.", "Znam coroczną kontrolę, protokół kontroli i plakietkę kontrolną.", "Я знаю щорічну перевірку, протокол перевірки й наклейку."), short: t("Jährliche Prüfung", "Annual inspection", "Przegląd roczny", "Щорічна перевірка") },
            ],
        }),
        step("sort", {
            title: t("Mangel oder in Ordnung?", "Defect or OK?", "Usterka czy w porządku?", "Дефект чи справно?"),
            lead: t("Entscheide aus dem Bauch heraus.", "Go with your gut feeling.", "Zdecyduj intuicyjnie.", "Вирішуй інтуїтивно."),
            labels: [t("In Ordnung", "OK", "W porządku", "Справно"), t("Mangel", "Defect", "Usterka", "Дефект")],
            items: [
                { t: t("Ein Reifen hat einen tiefen Schnitt in der Lauffläche", "A tyre has a deep cut in the tread", "Opona ma głębokie nacięcie bieżnika", "На шині глибокий поріз протектора"), a: 1, why: t("Schadhafte Reifen sind ein Mangel, der die Sicherheit beeinträchtigt.", "Damaged tyres are a defect that affects safety.", "Uszkodzona opona to usterka, która wpływa na bezpieczeństwo.", "Пошкоджена шина — дефект, що впливає на безпеку.") },
                { t: t("Das Lenkrad hat etwa zwei Finger breit Spiel", "The steering wheel has about two fingers of play", "Kierownica ma luz na około dwa palce", "Кермо має люфт приблизно на два пальці"), a: 0, why: t("Bis zu zwei Finger breit ist in Ordnung. Mehr Spiel ist ein Mangel.", "Up to two fingers wide is OK. More play is a defect.", "Do dwóch palców jest w porządku. Większy luz to usterka.", "До двох пальців — справно. Більший люфт — дефект.") },
                { t: t("Die Hupe gibt keinen Ton", "The horn makes no sound", "Klakson nie wydaje dźwięku", "Сигнал не звучить"), a: 1, why: t("Die Warneinrichtung muss funktionieren. Ohne Hupe kannst du niemanden warnen.", "The warning device must work. Without a horn you cannot warn anyone.", "Urządzenie ostrzegawcze musi działać. Bez klaksonu nikogo nie ostrzeżesz.", "Попереджувальний пристрій має працювати. Без сигналу нікого не попередиш.") },
                { t: t("Auf dem Fahrersitz liegt Staub", "There is dust on the driver’s seat", "Na fotelu operatora leży kurz", "На сидінні водія пил"), a: 0, why: t("Unschön, aber kein Mangel, der die Sicherheit beeinträchtigt.", "Not nice, but not a defect that affects safety.", "Nieestetycznie, ale to nie usterka wpływająca na bezpieczeństwo.", "Неохайно, але це не дефект, що впливає на безпеку.") },
            ],
            allRight: t("Gutes Auge. Jetzt lernst du, worauf du genau achtest.", "Good eye. Now you learn exactly what to look for.", "Dobre oko. Teraz dowiesz się, na co dokładnie patrzeć.", "Гарне око. Тепер дізнаєшся, на що саме зважати."),
            someWrong: t("Kein Problem, genau das lernst du jetzt.", "No problem, that is exactly what you learn now.", "Nie szkodzi, właśnie tego się teraz nauczysz.", "Нічого, саме цього ти зараз навчишся."),
        }),
    ];
}

/* ════════════════ 6.1 Tägliche Sicht- und Funktionsprüfung ════════════════ */
export function lesson61(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Jeden Tag vor dem Einsatz", "Every day before use", "Codziennie przed pracą", "Щодня перед роботою"),
            lead: t("Die tägliche Prüfung machst du selbst. Sie dauert nur wenige Minuten.", "You do the daily check yourself. It only takes a few minutes.", "Codzienną kontrolę robisz sam. Trwa tylko kilka minut.", "Щоденну перевірку робиш сам. Вона триває лише кілька хвилин."),
            points: [
                pt(t("<b>Vor Einsatzbeginn:</b> Du prüfst den Stapler täglich auf erkennbare Mängel, durch Hinschauen und durch Ausprobieren.", "<b>Before starting work:</b> you check the forklift daily for visible defects, by looking and by trying things out.", "<b>Przed rozpoczęciem pracy:</b> codziennie sprawdzasz wózek pod kątem widocznych usterek, oglądając go i wypróbowując.", "<b>Перед початком роботи:</b> щодня перевіряєш навантажувач на помітні дефекти, оглядаючи й випробовуючи.")),
                pt(t("<b>Während der Arbeit:</b> Du beobachtest den Stapler weiter. Geräusche, Geruch oder ein anderes Fahrgefühl sind Warnzeichen.", "<b>During work:</b> you keep watching the forklift. Noises, smells or a different driving feel are warning signs.", "<b>W trakcie pracy:</b> dalej obserwujesz wózek. Hałas, zapach albo inne zachowanie podczas jazdy to sygnały ostrzegawcze.", "<b>Під час роботи:</b> ти далі спостерігаєш за навантажувачем. Шум, запах чи незвична поведінка під час їзди — тривожні сигнали.")),
                pt(t("<b>Erst ohne Mangel losfahren:</b> Mit einem Mangel, der die Sicherheit beeinträchtigt, setzt du den Stapler nicht in Betrieb.", "<b>Drive only when there are no defects:</b> with a defect that affects safety, you do not put the forklift into operation.", "<b>Ruszasz tylko sprawnym wózkiem:</b> z usterką wpływającą na bezpieczeństwo nie uruchamiasz wózka.", "<b>Рушаєш лише справним навантажувачем:</b> з дефектом, що впливає на безпеку, навантажувач не запускаєш.")),
                pt(t("<b>Checkliste:</b> Was genau zu prüfen ist, steht in der Betriebsanleitung und in der Betriebsanweisung deines Betriebs.", "<b>Checklist:</b> what exactly to check is in the operating manual and in your company’s operating instructions.", "<b>Lista kontrolna:</b> co dokładnie sprawdzić, jest w instrukcji obsługi i w instrukcji stanowiskowej twojego zakładu.", "<b>Чек-лист:</b> що саме перевіряти, написано в інструкції з експлуатації й робочій інструкції підприємства.")),
            ],
            merke: t("Erst prüfen, dann fahren. Jeden Tag.", "Check first, then drive. Every day.", "Najpierw sprawdź, potem jedź. Codziennie.", "Спершу перевір, потім їдь. Щодня."),
            src: { de: `${V68} §9 Abs. 1; ${I208} Abschn. 5` },
        }),
        step("learn", {
            title: t("Hinschauen: die Sichtprüfung", "Looking: the visual check", "Oglądanie: kontrola wzrokowa", "Огляд: візуальна перевірка"),
            lead: t("Einmal um den Stapler herum, von den Gabelspitzen bis zum Gegengewicht.", "Once around the forklift, from the fork tips to the counterweight.", "Raz dookoła wózka, od końców wideł do przeciwwagi.", "Один раз навколо навантажувача, від кінців вил до противаги."),
            points: [
                pt(t("<b>Gabelzinken und Gabelträger:</b> nicht verbogen, keine Risse, nicht stark abgeschliffen, beide gleich hoch. Die Sicherung gegen Herausheben und Verschieben ist intakt.", "<b>Fork arms and fork carriage:</b> not bent, no cracks, not heavily worn, both at the same height. The locking against lifting out and shifting is intact.", "<b>Widły i karetka:</b> nie są wygięte, nie mają pęknięć, nie są mocno starte i są na tej samej wysokości. Zabezpieczenie przed wyjęciem i przesunięciem jest sprawne.", "<b>Вила й каретка:</b> не погнуті, без тріщин, не сильно стерті, обидва на одній висоті. Фіксатор від виймання й зсуву справний.")),
                pt(t("<b>Reifen:</b> keine Schnitte oder Ausbrüche, keine Fremdkörper, richtiger Luftdruck, Radmuttern fest.", "<b>Tyres:</b> no cuts or chunks missing, no foreign objects, correct pressure, wheel nuts tight.", "<b>Opony:</b> bez nacięć i wyrw, bez ciał obcych, właściwe ciśnienie, dokręcone nakrętki kół.", "<b>Шини:</b> без порізів і вибоїн, без сторонніх предметів, правильний тиск, затягнуті гайки.")),
                pt(t("<b>Hubketten:</b> ausreichend und gleichmäßig gespannt. Hängt eine Kette durch, trägt die andere allein.", "<b>Lifting chains:</b> sufficiently and evenly tensioned. If one chain sags, the other carries alone.", "<b>Łańcuchy masztu:</b> wystarczająco i równo naprężone. Gdy jeden łańcuch zwisa, cały ciężar niesie drugi.", "<b>Ланцюги:</b> достатньо й рівномірно натягнуті. Якщо один провисає, другий тримає сам.")),
                pt(t("<b>Hydraulik:</b> keine Leckagen an Schläuchen und Zylindern. Ein Ölfleck unter dem Stapler ist ein Hinweis.", "<b>Hydraulics:</b> no leaks at hoses and cylinders. An oil stain under the forklift is a sign.", "<b>Hydraulika:</b> bez wycieków na wężach i siłownikach. Plama oleju pod wózkiem to sygnał ostrzegawczy.", "<b>Гідравліка:</b> без протікань на шлангах і циліндрах. Пляма оливи під навантажувачем — тривожна ознака.")),
                pt(t("<b>Fahrerschutzdach und Lastschutzgitter:</b> vorhanden, fest und ohne erkennbare Schäden. Dazu Batterie oder Gasflasche sicher befestigt.", "<b>Overhead guard and load backrest:</b> present, firmly fixed and without visible damage. Also battery or gas cylinder securely fixed.", "<b>Daszek ochronny i krata ochronna:</b> są na miejscu, mocno zamocowane i bez widocznych uszkodzeń. Do tego akumulator lub butla gazowa pewnie zamocowane.", "<b>Захисний дах і захисна решітка:</b> є, міцно закріплені, без помітних пошкоджень. Також батарея чи газовий балон надійно закріплені.")),
            ],
            src: { de: `${I208} Abschn. 5; ${V68} DA zu §9; ${G308} „Tägliche Einsatzprüfung“` },
        }),
        step("learn", {
            title: t("Ausprobieren: die Funktionsprüfung", "Trying: the function check", "Wypróbowanie: kontrola działania", "Випробування: перевірка функцій"),
            lead: t("Jetzt setzt du dich auf den Stapler und testest im Stand, ob alles funktioniert.", "Now you sit on the forklift and test, with the truck stationary, whether everything works.", "Teraz siadasz na wózek i w miejscu sprawdzasz, czy wszystko działa.", "Тепер сідаєш на навантажувач і на місці перевіряєш, чи все працює."),
            points: [
                pt(t("<b>Bremsen:</b> Betriebs- und Feststellbremse wirken. Das Bremspedal hat im Stand nach etwa einem Drittel des Weges spürbaren Widerstand.", "<b>Brakes:</b> service and parking brake work. When stationary, the brake pedal has noticeable resistance after about one third of its travel.", "<b>Hamulce:</b> hamulec roboczy i postojowy działają. Pedał hamulca w miejscu stawia wyczuwalny opór po około jednej trzeciej skoku.", "<b>Гальма:</b> робоче й стоянкове гальмо працюють. Педаль на місці має відчутний опір приблизно після третини ходу.")),
                pt(t("<b>Lenkung:</b> Das Spiel am Lenkrad ist höchstens zwei Finger breit.", "<b>Steering:</b> the play at the steering wheel is at most two fingers wide.", "<b>Układ kierowniczy:</b> luz na kierownicy wynosi najwyżej dwa palce.", "<b>Кермо:</b> люфт керма щонайбільше два пальці.")),
                pt(t("<b>Warnen und Sehen:</b> Hupe, Warnleuchten, Beleuchtung und Bremslicht sind in Ordnung.", "<b>Warning and seeing:</b> horn, warning lights, lighting and brake light are in order.", "<b>Ostrzeganie i widoczność:</b> klakson, światła ostrzegawcze, oświetlenie i światło stopu są sprawne.", "<b>Попередження й видимість:</b> сигнал, проблискові вогні, освітлення й стоп-сигнал справні.")),
                pt(t("<b>Hydraulik und Rückhaltesystem:</b> Heben, Senken, Neigen und Anbaugeräte arbeiten sauber. Gurt oder Bügel funktionieren, die Sicherung gegen unbefugtes Benutzen ebenso.", "<b>Hydraulics and restraint:</b> lifting, lowering, tilting and attachments work properly. Belt or bar work, as does the protection against unauthorised use.", "<b>Hydraulika i system przytrzymujący:</b> podnoszenie, opuszczanie, pochylanie i osprzęt działają płynnie. Pas lub pałąk działają, zabezpieczenie przed użyciem przez osoby nieupoważnione też.", "<b>Гідравліка й система утримання:</b> підйом, опускання, нахил і навісне обладнання працюють рівно. Пасок чи скоба працюють, захист від стороннього використання теж.")),
            ],
            merke: t("Bremspedal: Widerstand nach einem Drittel. Lenkrad: höchstens zwei Finger Spiel.", "Brake pedal: resistance after one third. Steering wheel: at most two fingers of play.", "Pedał hamulca: opór po jednej trzeciej. Kierownica: najwyżej dwa palce luzu.", "Педаль гальма: опір після третини. Кермо: щонайбільше два пальці люфту."),
            src: { de: `${I208} Abschn. 5; ${G308} „Tägliche Einsatzprüfung“` },
        }),
        step("sim", { sim: "daily", texts: DAILY_TEXTS,
            title: t("Dein Stapler vor Schichtbeginn", "Your forklift before the shift", "Twój wózek przed zmianą", "Твій навантажувач перед зміною"),
            lead: t("Prüfe alle Punkte: erst rundherum anschauen, dann im Stand testen. Entscheide jeweils, ob alles in Ordnung ist.", "Check every point: first look all around, then test while stationary. Decide each time whether everything is OK.", "Sprawdź wszystkie punkty: najpierw obejrzyj wózek dookoła, potem testuj w miejscu. Za każdym razem zdecyduj, czy wszystko jest w porządku.", "Перевір усі пункти: спершу огляд навколо, потім тести на місці. Щоразу вирішуй, чи все справно."),
            points: [
                { id: "forks", look: true, bad: true, label: t("Gabelzinken", "Fork arms", "Widły", "Вила"),
                    finding: t("Die rechte Zinke ist nach unten verbogen und hat einen Riss am Knick.", "The right fork arm is bent downwards and has a crack at the heel.", "Prawe ramię wideł jest wygięte w dół i ma pęknięcie na zagięciu.", "Правий зубець вил погнутий униз і має тріщину на згині."),
                    why: t("Verbogene oder gerissene Zinken können unter Last brechen. Die Zinken sind auch nicht mehr gleich hoch.", "Bent or cracked forks can break under load. The forks are no longer at the same height either.", "Wygięte lub pęknięte widły mogą się złamać pod obciążeniem. Widły nie są też już na równej wysokości.", "Погнуті чи тріснуті вила можуть зламатися під вантажем. До того ж вони вже не на одній висоті.") },
                { id: "tyre", look: true, bad: true, label: t("Reifen", "Tyres", "Opony", "Шини"),
                    finding: t("Am linken Vorderrad fehlt ein Stück Lauffläche, das Gewebe liegt frei.", "A piece of tread is missing on the left front wheel and the carcass is exposed.", "W lewym przednim kole brakuje kawałka bieżnika, widać osnowę.", "На лівому передньому колесі бракує шматка протектора, видно каркас."),
                    why: t("Ein beschädigter Reifen verändert die Standsicherheit und kann plötzlich versagen.", "A damaged tyre changes stability and can fail suddenly.", "Uszkodzona opona zmienia stateczność i może nagle zawieść.", "Пошкоджена шина змінює стійкість і може раптово відмовити.") },
                { id: "chain", look: true, bad: true, label: t("Hubketten", "Lifting chains", "Łańcuchy", "Ланцюги"),
                    finding: t("Die linke Kette hängt durch, die rechte ist straff.", "The left chain sags, the right one is tight.", "Lewy łańcuch zwisa, prawy jest napięty.", "Лівий ланцюг провисає, правий натягнутий."),
                    why: t("Die Ketten müssen ausreichend und gleichmäßig gespannt sein. Sonst trägt eine Kette die ganze Last.", "The chains must be sufficiently and evenly tensioned. Otherwise one chain carries the whole load.", "Łańcuchy muszą być wystarczająco i równo naprężone. Inaczej jeden łańcuch niesie cały ładunek.", "Ланцюги мають бути достатньо й рівномірно натягнуті. Інакше один ланцюг тримає весь вантаж.") },
                { id: "leak", look: true, bad: true, label: t("Hydraulik", "Hydraulics", "Hydraulika", "Гідравліка"),
                    finding: t("Unter dem Hubmast ist eine Öllache, am linken Neigezylinder läuft Öl herab.", "There is a pool of oil under the mast and oil is running down the left tilt cylinder.", "Pod masztem jest kałuża oleju, po lewym siłowniku pochylania spływa olej.", "Під щоглою калюжа оливи, по лівому циліндру нахилу стікає олива."),
                    why: t("Eine Leckage kann zum Absinken der Last führen. Ausgelaufenes Öl ist außerdem eine Rutschgefahr.", "A leak can cause the load to sink. Spilled oil is also a slipping hazard.", "Wyciek może spowodować opadanie ładunku. Rozlany olej to też ryzyko poślizgu.", "Протікання може спричинити опускання вантажу. Розлита олива ще й створює небезпеку посковзнутися.") },
                { id: "guard", look: true, label: t("Fahrerschutzdach", "Overhead guard", "Dach ochronne", "Захисний дах"),
                    finding: t("Fest verschraubt, keine Verformungen oder Risse.", "Firmly bolted, no deformation or cracks.", "Mocno przykręcony, bez odkształceń i pęknięć.", "Міцно прикручений, без деформацій і тріщин."),
                    why: t("Das Dach schützt dich vor herabfallenden Teilen. Hier ist alles in Ordnung.", "The guard protects you from falling objects. Everything is fine here.", "Daszek ochronny chroni cię przed spadającymi przedmiotami. Tu wszystko w porządku.", "Захисний дах захищає від падаючих предметів. Тут усе справно.") },
                { id: "lsg", look: true, label: t("Lastschutzgitter", "Load backrest", "Krata oporowa", "Захисна решітка"),
                    finding: t("Vorhanden, fest und unbeschädigt.", "Present, firm and undamaged.", "Jest na miejscu, mocno zamocowana i nieuszkodzona.", "Є, міцна й неушкоджена."),
                    why: t("Das Gitter verhindert, dass Teile der Last nach hinten auf dich fallen.", "The backrest prevents parts of the load from falling backwards onto you.", "Krata zapobiega spadaniu części ładunku do tyłu na ciebie.", "Решітка не дає частинам вантажу впасти назад на тебе.") },
                { id: "brake", label: t("Bremse", "Brake", "Hamulec", "Гальмо"), action: t("Bremspedal im Stand treten", "Press the brake pedal while stationary", "Wciśnij pedał hamulca w miejscu", "Натисни педаль гальма на місці"),
                    gauge: { kind: "pedal", at: 0.33 },
                    finding: t("Spürbarer Widerstand nach etwa einem Drittel, Feststellbremse hält.", "Noticeable resistance after about one third, parking brake holds.", "Wyczuwalny opór po około jednej trzeciej, hamulec postojowy trzyma.", "Відчутний опір приблизно після третини, стоянкове гальмо тримає."),
                    why: t("Genau so soll es sein.", "That is exactly how it should be.", "Dokładnie tak ma być.", "Саме так і має бути.") },
                { id: "steer", bad: true, label: t("Lenkung", "Steering", "Układ kierowniczy", "Кермо"), action: t("Lenkrad hin und her drehen", "Turn the steering wheel back and forth", "Obracaj kierownicę w obie strony", "Повертай кермо туди й назад"),
                    gauge: { kind: "play", fingers: 4, max: 2 },
                    finding: t("Das Lenkrad hat etwa vier Finger breit Spiel.", "The steering wheel has about four fingers of play.", "Kierownica ma luz na około cztery palce.", "Кермо має люфт приблизно на чотири пальці."),
                    why: t("Erlaubt sind höchstens zwei Finger breit. Zu großes Lenkungsspiel ist ein Mangel, der die Sicherheit beeinträchtigt.", "At most two fingers wide is allowed. Too much steering play is a defect that affects safety.", "Dozwolone są najwyżej dwa palce. Zbyt duży luz to usterka wpływająca na bezpieczeństwo.", "Дозволено щонайбільше два пальці. Завеликий люфт — дефект, що впливає на безпеку.") },
                { id: "horn", label: t("Hupe", "Horn", "Klakson", "Сигнал"), action: t("Hupe betätigen", "Sound the horn", "Naciśnij klakson", "Натисни сигнал"),
                    finding: t("Die Hupe ist laut und deutlich zu hören.", "The horn is loud and clearly audible.", "Klakson jest głośny i wyraźny.", "Сигнал гучний і чіткий."),
                    why: t("Die Warneinrichtung funktioniert.", "The warning device works.", "Urządzenie ostrzegawcze działa.", "Попереджувальний пристрій працює.") },
                { id: "light", label: t("Beleuchtung", "Lighting", "Oświetlenie", "Освітлення"), action: t("Licht und Warnleuchte einschalten", "Switch on the lights and warning light", "Włącz światła i lampę ostrzegawczą", "Увімкни світло й проблисковий вогонь"),
                    finding: t("Scheinwerfer und Rundumleuchte leuchten.", "Headlights and beacon are on.", "Reflektory i lampa błyskowa świecą.", "Фари й проблисковий маячок світять."),
                    why: t("Beleuchtung und Warnleuchte sind in Ordnung.", "Lighting and warning light are in order.", "Oświetlenie i lampa ostrzegawcza są sprawne.", "Освітлення й маячок справні.") },
                { id: "lift", label: t("Heben, Senken, Neigen", "Lift, lower, tilt", "Podnoszenie, opuszczanie, pochylanie", "Підйом, опускання, нахил"), action: t("Gabel heben, senken und Mast neigen", "Lift and lower the forks and tilt the mast", "Podnieś i opuść widły, pochyl maszt", "Підніми й опусти вила, нахили щоглу"),
                    finding: t("Alle Bewegungen laufen gleichmäßig, ohne Ruckeln.", "All movements run smoothly, without jerking.", "Wszystkie ruchy są płynne, bez szarpnięć.", "Усі рухи плавні, без ривків."),
                    why: t("Die Funktionen sind in Ordnung. Die Leckage aus der Sichtprüfung bleibt trotzdem ein Mangel.", "The functions are fine. The leak from the visual check is still a defect.", "Funkcje działają. Wyciek z kontroli wzrokowej i tak pozostaje usterką.", "Функції справні. Протікання з візуального огляду все одно лишається дефектом.") },
            ],
            done: t("Dieser Stapler darf heute nicht fahren.", "This forklift must not be driven today.", "Tego wózka nie wolno dziś używać.", "Цей навантажувач сьогодні не можна використовувати."),
            src: { de: `${V68} DA zu §9; ${I208} Abschn. 5` } }),
        step("question", {
            title: t("Plötzlich weich", "Suddenly soft", "Nagle miękki", "Раптом м’яка"),
            text: t("Die Prüfung am Morgen war in Ordnung. Am Nachmittag merkst du: Das Bremspedal geht viel weiter durch als sonst.", "This morning’s check was fine. In the afternoon you notice: the brake pedal goes much further down than usual.", "Rano kontrola była w porządku. Po południu zauważasz, że pedał hamulca wchodzi dużo głębiej niż zwykle.", "Ранкова перевірка була в порядку. Вдень помічаєш: педаль гальма йде значно глибше, ніж зазвичай."),
            layout: "list",
            options: [t("Bis Schichtende vorsichtig weiterfahren, dann melden", "Keep driving carefully until the end of the shift, then report it", "Ostrożnie jeździć do końca zmiany, potem zgłosić", "Обережно їздити до кінця зміни, потім повідомити"), t("Sicher anhalten, abstellen und den Mangel sofort melden", "Stop safely, park and report the defect immediately", "Bezpiecznie się zatrzymać, odstawić wózek i od razu zgłosić usterkę", "Безпечно зупинитися, поставити навантажувач і одразу повідомити про дефект")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, nicht weiterfahren", "No, do not keep driving", "Nie, nie wolno jeździć dalej", "Ні, далі не їдеш") },
            body: t("Du beobachtest den Stapler auch während der Arbeit. Einen Stapler mit erkanntem Sicherheitsmangel benutzt du nicht weiter und meldest den Mangel umgehend.", "You also watch the forklift during work. You do not keep using a forklift with a known safety defect, and you report the defect immediately.", "Obserwujesz wózek również w trakcie pracy. Wózka z rozpoznaną usterką wpływającą na bezpieczeństwo nie używasz dalej i od razu ją zgłaszasz.", "Ти спостерігаєш за навантажувачем і під час роботи. Навантажувач із виявленим дефектом безпеки далі не використовуєш і одразу повідомляєш про дефект."),
            src: { de: `${V68} §9 Abs. 1` },
        }),
        step("video", {
            title: t("Die tägliche Prüfung in drei Minuten", "The daily check in three minutes", "Codzienna kontrola w trzy minuty", "Щоденна перевірка за три хвилини"),
            brief: t("Fahrer geht einmal um den Stapler: Gabeln, Ketten, Reifen, Boden unter dem Stapler, Dach. Dann auf dem Sitz: Bremse, Lenkung, Hupe, Licht, Heben und Neigen. Nahaufnahmen von einem Riss und einer Öllache.", "Driver walks once around the forklift: forks, chains, tyres, floor under the forklift, guard. Then on the seat: brake, steering, horn, lights, lifting and tilting. Close-ups of a crack and an oil puddle.", "Operator obchodzi wózek: widły, łańcuchy, opony, podłoga pod wózkiem, daszek ochronny. Potem na fotelu: hamulec, kierownica, klakson, światła, podnoszenie i pochylanie. Zbliżenia pęknięcia i kałuży oleju.", "Водій обходить навантажувач: вила, ланцюги, шини, підлога під ним, захисний дах. Потім на сидінні: гальмо, кермо, сигнал, світло, підйом і нахил. Крупні плани тріщини й калюжі оливи."),
            length: t("60 bis 90 Sekunden", "60 to 90 seconds", "60 do 90 sekund", "60–90 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Täglich vor Einsatzbeginn</b> prüfen und während der Arbeit beobachten.", "<b>Daily before starting work</b> check, and keep watching during work.", "<b>Codziennie przed pracą</b> sprawdzaj, a w trakcie pracy obserwuj.", "<b>Щодня перед роботою</b> перевіряй, а під час роботи спостерігай.")),
            pt(t("<b>Sichtprüfung:</b> Gabeln, Reifen, Ketten, Hydraulik, Dach und Gitter.", "<b>Visual check:</b> forks, tyres, chains, hydraulics, guard and backrest.", "<b>Kontrola wzrokowa:</b> widły, opony, łańcuchy, hydraulika, daszek ochronny i krata ochronna.", "<b>Візуальна перевірка:</b> вила, шини, ланцюги, гідравліка, захисний дах і решітка.")),
            pt(t("<b>Funktionsprüfung:</b> Bremse, Lenkung, Hupe, Licht, Hydraulik, Rückhaltesystem.", "<b>Function check:</b> brake, steering, horn, lights, hydraulics, restraint.", "<b>Kontrola działania:</b> hamulec, kierownica, klakson, światła, hydraulika, system przytrzymujący.", "<b>Перевірка функцій:</b> гальмо, кермо, сигнал, світло, гідравліка, система утримання.")),
        ] }),
    ];
}

/* ════════════════ 6.2 Mängel melden und Stapler sichern ════════════════ */
export function lesson62(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Mangel gefunden. Was jetzt?", "Defect found. What now?", "Znalazłeś usterkę. Co teraz?", "Дефект знайдено. Що далі?"),
            lead: t("Du entscheidest nicht, ob es „noch geht“. Du sorgst dafür, dass der Mangel behoben wird.", "You do not decide whether it is “still fine”. You make sure the defect gets fixed.", "Nie decydujesz, czy „jeszcze da radę”. Dbasz o to, by usterkę usunięto.", "Ти не вирішуєш, чи «ще можна». Ти дбаєш, щоб дефект усунули."),
            points: [
                pt(t("<b>Nicht fahren:</b> Mit einem Sicherheitsmangel setzt du den Stapler nicht in Betrieb und benutzt ihn nicht weiter.", "<b>Do not drive:</b> with a safety defect you do not start the forklift or keep using it.", "<b>Nie jeździsz:</b> z usterką wpływającą na bezpieczeństwo nie uruchamiasz wózka i nie używasz go dalej.", "<b>Не їдеш:</b> з дефектом, що впливає на безпеку, не запускаєш навантажувач і далі його не використовуєш.")),
                pt(t("<b>Umgehend melden:</b> Du meldest den Mangel sofort deinem Vorgesetzten. Gemeint ist jeder, dem Unternehmeraufgaben übertragen wurden.", "<b>Report immediately:</b> you report the defect straight away to your supervisor. This means anyone who has been given the employer’s duties.", "<b>Zgłaszasz od razu:</b> natychmiast informujesz przełożonego. Chodzi o każdego, komu przekazano obowiązki pracodawcy.", "<b>Повідомляєш одразу:</b> негайно кажеш керівнику. Це будь-хто, кому передали обов’язки роботодавця.")),
                pt(t("<b>Nicht selbst reparieren:</b> Instandsetzung machen nur fachkundige Personen. Auch „nur kurz nachziehen“ ist tabu.", "<b>Do not repair it yourself:</b> repairs are done only by competent specialists. Even “just tightening it quickly” is off limits.", "<b>Nie naprawiasz sam:</b> naprawy wykonują tylko osoby z fachową wiedzą. Nawet „tylko szybko dokręcić” jest zabronione.", "<b>Не ремонтуєш сам:</b> ремонт роблять лише фахівці. Навіть «тільки підтягнути» — заборонено.")),
                pt(t("<b>Behebung vor dem Weiterbetrieb:</b> Der Unternehmer sorgt dafür, dass der Mangel behoben ist, bevor der Stapler wieder fährt.", "<b>Fixed before further use:</b> the employer makes sure the defect is fixed before the forklift runs again.", "<b>Naprawa przed dalszą pracą:</b> pracodawca dba o usunięcie usterki, zanim wózek znów pojedzie.", "<b>Усунення перед подальшою роботою:</b> роботодавець дбає, щоб дефект усунули ще до того, як навантажувач знову поїде.")),
            ],
            merke: t("Nicht fahren, sichern, melden. Reparieren lassen.", "Do not drive, secure, report. Have it repaired.", "Nie jedź, zabezpiecz, zgłoś. Zleć naprawę.", "Не їдь, убезпеч, повідом. Доручи ремонт."),
            src: { de: `${V68} §9 mit DA, §10 Abs. 1; ${I208} Abschn. 5` },
        }),
        step("learn", {
            title: t("Sicher gegen Weiterbetrieb", "Secured against further use", "Zabezpieczony przed dalszym użyciem", "Убезпечений від подальшого використання"),
            lead: t("Gehst du zum Melden weg, darf kein Kollege mit dem defekten Stapler losfahren.", "When you go to report it, no colleague may drive off with the faulty forklift.", "Gdy idziesz zgłosić usterkę, żaden kolega nie może odjechać uszkodzonym wózkiem.", "Коли йдеш повідомляти, жоден колега не повинен поїхати на несправному навантажувачі."),
            points: [
                pt(t("<b>Sicher abstellen:</b> wie gewohnt auf einem geeigneten Platz, Gabeln ab, Feststellbremse.", "<b>Park safely:</b> as usual in a suitable place, forks down, parking brake.", "<b>Bezpiecznie odstaw:</b> jak zwykle we właściwym miejscu, widły w dół, hamulec postojowy.", "<b>Безпечно постав:</b> як зазвичай у відповідному місці, вила вниз, стоянкове гальмо.")),
                pt(t("<b>Schlüssel abziehen:</b> und so verwahren, wie es dein Betrieb festlegt, zum Beispiel beim Vorgesetzten abgeben.", "<b>Remove the key:</b> and keep it as your company specifies, for example hand it to your supervisor.", "<b>Wyjmij kluczyk:</b> i przechowuj go tak, jak ustala twój zakład, na przykład oddaj go przełożonemu.", "<b>Вийми ключ:</b> і зберігай так, як визначає підприємство, наприклад віддай керівнику.")),
                pt(t("<b>Deutlich kennzeichnen:</b> zum Beispiel mit einem Schild „Außer Betrieb“ am Lenkrad, damit jeder den Mangel sieht.", "<b>Mark it clearly:</b> for example with an “Out of service” sign on the steering wheel so everyone sees the defect.", "<b>Wyraźnie oznacz:</b> na przykład tabliczką „Nieczynny” na kierownicy, żeby każdy widział usterkę.", "<b>Чітко познач:</b> наприклад табличкою «Не працює» на кермі, щоб кожен бачив дефект.")),
            ],
            merke: t("Ein gemeldeter Mangel hilft nur, wenn der Stapler bis zur Reparatur stehen bleibt.", "A reported defect only helps if the forklift stays put until it is repaired.", "Zgłoszona usterka pomaga tylko wtedy, gdy wózek stoi aż do naprawy.", "Повідомлення про дефект допомагає, лише якщо навантажувач стоїть до ремонту."),
            src: { de: `${G308} Nr. 7 „Sicherung gegen Weiterbetrieb“; ${V68} §9, §15` },
        }),
        step("sim", { sim: "sequence", texts: SEQ_TEXTS,
            title: t("Riss in der Gabel: der richtige Ablauf", "Crack in the fork: the right procedure", "Pęknięte ramię wideł: właściwa kolejność", "Тріщина у вилах: правильний порядок"),
            lead: t("Bring die Schritte in die richtige Reihenfolge.", "Put the steps in the right order.", "Ułóż kroki we właściwej kolejności.", "Розстав кроки в правильному порядку."),
            items: [
                { t: t("Stapler nicht in Betrieb nehmen und sicher abgestellt lassen", "Do not start the forklift and leave it safely parked", "Nie uruchamiać wózka, zostawić go bezpiecznie odstawionego", "Не запускати навантажувач і залишити його безпечно поставленим") },
                { t: t("Schlüssel abziehen", "Remove the key", "Wyjąć kluczyk", "Вийняти ключ") },
                { t: t("Schild „Außer Betrieb“ gut sichtbar anbringen", "Put up an “Out of service” sign where it is clearly visible", "Wywiesić dobrze widoczną tabliczkę „Nieczynny”", "Повісити добре видиму табличку «Не працює»") },
                { t: t("Mangel sofort dem Vorgesetzten melden", "Report the defect to the supervisor immediately", "Od razu zgłosić usterkę przełożonemu", "Одразу повідомити керівника про дефект") },
                { t: t("Reparatur durch Fachpersonal", "Repair by specialist staff", "Naprawa przez fachowy personel", "Ремонт фахівцями") },
                { t: t("Erst nach Freigabe wieder fahren", "Drive again only after it has been released", "Jeździć dopiero po ponownym dopuszczeniu wózka do pracy", "Їздити лише після допуску до роботи") },
            ],
            shuffle: [3, 0, 5, 2, 4, 1],
            allRight: t("Genau so. Erst sichern, dann melden, und gefahren wird erst nach der Reparatur.", "Exactly. Secure first, then report, and nobody drives until it is repaired.", "Dokładnie tak. Najpierw zabezpiecz, potem zgłoś, a jazda dopiero po naprawie.", "Саме так. Спершу убезпеч, потім повідом, а їздять лише після ремонту."),
            someWrong: t("Fast. Erst sichern, damit niemand losfährt, dann melden. Gefahren wird erst nach der Reparatur.", "Almost. Secure first so nobody drives off, then report. Driving only after the repair.", "Prawie. Najpierw zabezpiecz, żeby nikt nie odjechał, potem zgłoś. Jazda dopiero po naprawie.", "Майже. Спершу убезпеч, щоб ніхто не поїхав, потім повідом. Їздять лише після ремонту."),
            src: { de: `${V68} §9, §10` } }),
        step("sort", {
            title: t("Selbst machen oder Fachpersonal?", "Do it yourself or specialist?", "Sam czy fachowiec?", "Сам чи фахівець?"),
            lead: t("Was darfst du als Fahrer selbst erledigen?", "What are you, as a driver, allowed to do yourself?", "Co jako operator możesz zrobić sam?", "Що ти як водій можеш зробити сам?"),
            labels: [t("Darf ich selbst", "I may do it myself", "Mogę sam", "Можу сам"), t("Fachpersonal", "Specialist", "Fachowiec", "Фахівець")],
            items: [
                { t: t("Sitz auf deine Größe einstellen", "Adjust the seat to your size", "Ustawić fotel pod swój wzrost", "Налаштувати сидіння під свій зріст"), a: 0, why: t("Das ist Bedienung, keine Reparatur. Die Betriebsanleitung beschreibt, wie es geht.", "That is operation, not repair. The operating manual describes how to do it.", "To obsługa, nie naprawa. Instrukcja obsługi opisuje, jak to zrobić.", "Це керування, а не ремонт. Інструкція з експлуатації описує, як це зробити.") },
                { t: t("Undichten Hydraulikschlauch nachziehen", "Tighten a leaking hydraulic hose", "Dokręcić nieszczelny wąż hydrauliczny", "Підтягнути шланг гідравліки, що протікає"), a: 1, why: t("Arbeiten an der Hydraulik sind Instandsetzung. Die macht nur fachkundiges Personal.", "Work on the hydraulics is repair. Only competent specialists do it.", "Prace przy hydraulice to naprawa. Robi ją tylko fachowy personel.", "Роботи з гідравлікою — це ремонт. Його роблять лише фахівці.") },
                { t: t("Verbogene Gabelzinke zurückbiegen", "Bend a bent fork arm back", "Odgiąć wygięte ramię wideł", "Вирівняти погнутий зубець вил"), a: 1, why: t("Eine verbogene Zinke wird nicht gerichtet, sondern vom Fachpersonal geprüft und meist ersetzt.", "A bent fork arm is not straightened but checked by specialists and usually replaced.", "Wygiętego ramienia wideł się nie prostuje. Sprawdza je fachowiec i zwykle wymienia.", "Погнутий зубець не рівняють: його перевіряє фахівець і зазвичай замінює.") },
                { t: t("Spiegel richtig einstellen", "Adjust the mirror correctly", "Prawidłowo ustawić lusterko", "Правильно налаштувати дзеркало"), a: 0, why: t("Spiegel einstellen gehört zur Bedienung vor der Fahrt.", "Adjusting the mirror is part of operation before driving.", "Ustawienie lusterka należy do obsługi przed jazdą.", "Налаштування дзеркала — частина підготовки до поїздки.") },
            ],
            allRight: t("Richtig. Einstellen ja, reparieren nein.", "Right. Adjusting yes, repairing no.", "Dobrze. Ustawiać tak, naprawiać nie.", "Правильно. Налаштовувати так, ремонтувати ні."),
            someWrong: t("Merke: Was die Betriebsanleitung als Bedienung beschreibt, machst du. Reparaturen nie.", "Remember: what the operating manual describes as operation, you do. Repairs never.", "Zapamiętaj: co instrukcja opisuje jako obsługę, robisz. Naprawy nigdy.", "Запам’ятай: те, що інструкція з експлуатації описує як керування, робиш. Ремонт — ніколи."),
        }),
        step("question", {
            title: t("Fahr doch noch die Schicht", "Just finish the shift", "Dokończ jeszcze zmianę", "Доїзди зміну"),
            text: t("Du meldest den beschädigten Reifen. Dein Vorgesetzter sagt: „Der hält noch. Fahr die Schicht zu Ende, morgen kommt der Service.“", "You report the damaged tyre. Your supervisor says: “It will hold. Finish the shift, the service comes tomorrow.”", "Zgłaszasz uszkodzoną oponę. Przełożony mówi: „Wytrzyma. Dokończ zmianę, serwis będzie jutro”.", "Ти повідомляєш про пошкоджену шину. Керівник каже: «Витримає. Доїзди зміну, сервіс буде завтра»."),
            layout: "list",
            options: [t("Weiterfahren, der Vorgesetzte hat entschieden", "Keep driving, the supervisor has decided", "Jeździć dalej, przełożony zdecydował", "Їздити далі, керівник вирішив"), t("Nicht fahren und auf die Pflicht zur Behebung vor dem Weiterbetrieb hinweisen", "Do not drive and point out that it must be fixed before further use", "Nie jechać i wskazać, że usterkę trzeba usunąć przed dalszą pracą", "Не їхати й нагадати, що дефект треба усунути до подальшої роботи")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, auch nicht auf Anweisung", "No, not even when told to", "Nie, nawet na polecenie", "Ні, навіть за вказівкою") },
            quote: t("„Der Unternehmer hat dafür zu sorgen, dass Mängel, die die Sicherheit beeinträchtigen, vor dem Weiterbetrieb des Flurförderzeuges behoben werden.“", "“The employer must ensure that defects affecting safety are remedied before the industrial truck is operated further.”", "„Pracodawca musi zadbać o to, by usterki wpływające na bezpieczeństwo zostały usunięte przed dalszą eksploatacją wózka.”", "«Роботодавець має забезпечити, щоб дефекти, які впливають на безпеку, були усунені до подальшої експлуатації навантажувача.»"),
            body: t("Ein beschädigter Reifen ist ein Sicherheitsmangel. Du darfst den Stapler damit nicht weiter benutzen, und dein Vorgesetzter muss für die Behebung sorgen.", "A damaged tyre is a safety defect. You may not keep using the forklift with it, and your supervisor must have it fixed.", "Uszkodzona opona to usterka wpływająca na bezpieczeństwo. Nie wolno ci dalej używać wózka, a przełożony musi zlecić naprawę.", "Пошкоджена шина — дефект, що впливає на безпеку. Далі використовувати навантажувач не можна, а керівник має організувати ремонт."),
            src: { de: `${V68} §9 Abs. 1 und 2, DA zu §9` },
        }),
        step("video", {
            title: t("Mangel melden und Stapler sichern", "Reporting a defect and securing the forklift", "Zgłoszenie usterki i zabezpieczenie wózka", "Повідомлення про дефект і убезпечення навантажувача"),
            brief: t("Fahrer entdeckt bei der Prüfung eine Öllache, zieht den Schlüssel ab, hängt ein Schild „Außer Betrieb“ ans Lenkrad und meldet den Mangel beim Schichtleiter. Kurze Szene: Servicetechniker bei der Reparatur.", "Driver finds an oil puddle during the check, removes the key, hangs an “Out of service” sign on the steering wheel and reports the defect to the shift leader. Short scene: service technician repairing.", "Operator podczas kontroli zauważa kałużę oleju, wyjmuje kluczyk, wiesza tabliczkę „Nieczynny” na kierownicy i zgłasza usterkę kierownikowi zmiany. Krótka scena: serwisant przy naprawie.", "Водій під час перевірки бачить калюжу оливи, виймає ключ, вішає табличку «Не працює» на кермо й повідомляє начальника зміни. Коротка сцена: сервісний технік ремонтує."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Mangel:</b> nicht fahren, sichern, umgehend melden.", "<b>Defect:</b> do not drive, secure, report immediately.", "<b>Usterka:</b> nie jedź, zabezpiecz, od razu zgłoś.", "<b>Дефект:</b> не їдь, убезпеч, одразу повідом.")),
            pt(t("<b>Sichern:</b> Schlüssel ab, deutlich kennzeichnen, zum Beispiel „Außer Betrieb“.", "<b>Secure:</b> key out, mark clearly, for example “Out of service”.", "<b>Zabezpiecz:</b> kluczyk wyjęty, wyraźne oznaczenie, np. „Nieczynny”.", "<b>Убезпеч:</b> ключ вийняти, чітко позначити, напр. «Не працює».")),
            pt(t("<b>Reparatur</b> nur durch Fachpersonal, gefahren wird erst danach.", "<b>Repair</b> only by specialists, driving only afterwards.", "<b>Naprawa</b> tylko przez fachowców, jazda dopiero po naprawie.", "<b>Ремонт</b> лише фахівцями, їздити можна тільки після ремонту.")),
        ] }),
    ];
}

/* ════════════════ 6.3 Prüfung durch die befähigte Person ════════════════ */
export function lesson63(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Einmal im Jahr zur Prüfung", "Inspected once a year", "Raz w roku na przegląd", "Раз на рік на перевірку"),
            lead: t("Deine tägliche Prüfung sieht, was offensichtlich ist. Die wiederkehrende Prüfung geht tiefer.", "Your daily check sees what is obvious. The periodic inspection goes deeper.", "Codzienna kontrola wychwytuje to, co widać od razu. Przegląd okresowy sięga głębiej.", "Щоденна перевірка бачить очевидне. Періодична перевірка йде глибше."),
            points: [
                pt(t("<b>Mindestens jährlich:</b> Der Unternehmer lässt Stapler und Anbaugeräte in Abständen von höchstens einem Jahr prüfen. Bei Mehrschichtbetrieb auch öfter.", "<b>At least annually:</b> the employer has forklifts and attachments inspected at intervals of no more than one year. More often with multi-shift operation.", "<b>Co najmniej raz w roku:</b> pracodawca zleca przegląd wózków i osprzętu w odstępach nie dłuższych niż rok. Przy pracy wielozmianowej częściej.", "<b>Щонайменше щороку:</b> роботодавець організовує перевірку навантажувачів і навісного обладнання не рідше ніж раз на рік. При багатозмінній роботі частіше.")),
                pt(t("<b>Wer prüft:</b> eine zur Prüfung befähigte Person, früher Sachkundiger. Sie hat eine passende Berufsausbildung, Berufserfahrung und arbeitet zeitnah in diesem Bereich.", "<b>Who inspects:</b> a person competent to inspect, formerly called a Sachkundiger (expert). They have suitable vocational training, professional experience and recent work in this field.", "<b>Kto przeprowadza przegląd:</b> osoba uprawniona do przeglądów (dawniej Sachkundiger). Ma odpowiednie wykształcenie zawodowe, doświadczenie i aktualną praktykę w tej dziedzinie.", "<b>Хто перевіряє:</b> особа, компетентна для перевірки (раніше Sachkundiger). Має відповідну професійну освіту, досвід і актуальну практику в цій галузі.")),
                pt(t("<b>Was geprüft wird:</b> der Zustand der Bauteile und Einrichtungen, ob Sicherheitseinrichtungen vollständig sind und wirken, und ob der Prüfnachweis vollständig ist.", "<b>What is inspected:</b> the condition of components and equipment, whether safety devices are complete and effective, and whether the inspection record is complete.", "<b>Co jest sprawdzane:</b> stan części i urządzeń, kompletność i skuteczność urządzeń bezpieczeństwa oraz kompletność protokołu przeglądu.", "<b>Що перевіряють:</b> стан деталей і пристроїв, повноту й дієвість засобів безпеки та повноту протоколу.")),
            ],
            merke: t("Die Jahresprüfung ersetzt nicht deine tägliche Prüfung, und umgekehrt.", "The annual inspection does not replace your daily check, and vice versa.", "Przegląd roczny nie zastępuje twojej codziennej kontroli i odwrotnie.", "Щорічна перевірка не замінює щоденну, і навпаки."),
            src: { de: `${V68} §37 Abs. 1 mit DA, §38; ${I208} Abschn. 5; BetrSichV §14; TRBS 1203` },
        }),
        step("learn", {
            title: t("Prüfnachweis und Plakette", "Inspection record and sticker", "Protokół i plakietka", "Протокол і наклейка"),
            lead: t("Jede Prüfung wird dokumentiert. Die Plakette am Stapler zeigt dir auf einen Blick, wann die nächste fällig ist.", "Every inspection is documented. The sticker on the forklift shows you at a glance when the next one is due.", "Każdy przegląd jest dokumentowany. Plakietka na wózku pokazuje od razu, kiedy wypada następny.", "Кожну перевірку документують. Наклейка на навантажувачі одразу показує, коли наступна перевірка."),
            points: [
                pt(t("<b>Im Prüfnachweis steht:</b> Datum und Umfang der Prüfung, das Ergebnis mit den Mängeln, ob gegen den Weiterbetrieb Bedenken bestehen, nötige Nachprüfungen sowie Name und Anschrift des Prüfers.", "<b>The inspection record contains:</b> date and scope of the inspection, the result with the defects, whether there are concerns about further use, required re-inspections, and the inspector’s name and address.", "<b>Protokół zawiera:</b> datę i zakres przeglądu, wynik ze stwierdzonymi usterkami, ocenę, czy można dalej użytkować wózek, potrzebne przeglądy uzupełniające oraz imię, nazwisko i adres osoby, która przeprowadziła przegląd.", "<b>У протоколі:</b> дата й обсяг перевірки, результат із дефектами, чи є заперечення щодо подальшої роботи, потрібні повторні перевірки, ім’я та адреса особи, яка проводила перевірку.")),
                pt(t("<b>Behobene Mängel</b> werden im Prüfnachweis vermerkt. Er kann auch digital geführt werden und liegt möglichst nah am Einsatzort.", "<b>Fixed defects</b> are noted in the inspection record. It can also be kept digitally and is kept as close to the place of use as possible.", "<b>Usunięte usterki</b> odnotowuje się w protokole. Może być prowadzony elektronicznie i powinien być jak najbliżej miejsca pracy.", "<b>Усунені дефекти</b> позначають у протоколі. Його можна вести електронно, і він має бути якомога ближче до місця роботи.")),
                pt(t("<b>Die Plakette</b> hilft dir, die Prüffrist im Blick zu behalten. Lies sie so, wie sie beschriftet ist. Im Zweifel zählt der Prüfnachweis.", "<b>The sticker</b> helps you keep an eye on the inspection deadline. Read it as it is labelled. When in doubt, the inspection record counts.", "<b>Plakietka</b> pomaga pilnować terminu przeglądu. Odczytuj ją zgodnie z jej opisem. W razie wątpliwości liczy się protokół.", "<b>Наклейка</b> допомагає стежити за строком перевірки. Читай її так, як на ній написано. У разі сумніву важить протокол.")),
                pt(t("<b>Neue Plakette erst nach der Reparatur:</b> Eine Plakette mit dem nächsten Prüftermin soll erst auf den Stapler, wenn die bei der Prüfung gefundenen Mängel behoben sind.", "<b>New sticker only after the repair:</b> a sticker with the next inspection date should only go on the forklift once the defects found during the inspection are fixed.", "<b>Nowa plakietka dopiero po naprawie:</b> plakietkę z datą następnego przeglądu nakleja się dopiero po usunięciu usterek stwierdzonych podczas przeglądu.", "<b>Нова наклейка лише після ремонту:</b> наклейку з датою наступної перевірки клеять, коли виявлені дефекти усунено.")),
            ],
            src: { de: `${V68} §39 mit DA; ${I208} Abschn. 5, Bild 5-2` },
        }),
        step("sim", { sim: "plakette", texts: PLATE_TEXTS,
            title: t("Darfst du losfahren?", "Are you allowed to drive off?", "Czy możesz jechać?", "Чи можна рушати?"),
            lead: t("Vier Stapler, vier Plaketten. Entscheide für jeden.", "Four forklifts, four stickers. Decide for each.", "Cztery wózki, cztery plakietki. Zdecyduj dla każdego.", "Чотири навантажувачі, чотири наклейки. Виріши для кожного."),
            today: t("3. März 2027", "3 March 2027", "3 marca 2027", "3 березня 2027"),
            cases: [
                { id: "a", plate: { m: 9, y: 2027 }, ok: true,
                    note: t("Tägliche Prüfung ohne Befund.", "Daily check without findings.", "Codzienna kontrola bez uwag.", "Щоденна перевірка без зауважень."),
                    why: t("Die nächste Prüfung ist erst im September 2027 fällig, und deine tägliche Prüfung war in Ordnung.", "The next inspection is only due in September 2027, and your daily check was fine.", "Następny przegląd wypada dopiero we wrześniu 2027, a twoja codzienna kontrola była w porządku.", "Наступна перевірка лише у вересні 2027, а щоденна перевірка була в порядку.") },
                { id: "b", plate: { m: 1, y: 2027 }, ok: false,
                    note: t("Tägliche Prüfung ohne Befund.", "Daily check without findings.", "Codzienna kontrola bez uwag.", "Щоденна перевірка без зауважень."),
                    why: t("Die Prüfung war im Januar 2027 fällig und ist überschritten. Melde das deinem Vorgesetzten und frag nach dem Prüfnachweis.", "The inspection was due in January 2027 and is overdue. Report this to your supervisor and ask about the inspection record.", "Przegląd wypadał w styczniu 2027 i termin minął. Zgłoś to przełożonemu i zapytaj o protokół przeglądu.", "Перевірка мала бути в січні 2027, строк минув. Повідом керівника й запитай про протокол.") },
                { id: "c", plate: null, ok: true,
                    note: t("Keine Plakette. Im Prüfnachweis am Staplerplatz steht: geprüft im Mai 2026, keine Mängel, nächste Prüfung Mai 2027.", "No sticker. The inspection record at the forklift area says: inspected May 2026, no defects, next inspection May 2027.", "Brak plakietki. W protokole przy stanowisku wózków: przegląd w maju 2026, bez usterek, następny w maju 2027.", "Наклейки немає. У протоколі біля місця навантажувачів: перевірено в травні 2026, без дефектів, наступна — травень 2027."),
                    why: t("Die Plakette ist eine Hilfe, entscheidend ist der Prüfnachweis. Die Frist läuft bis Mai 2027. Sag trotzdem Bescheid, dass die Plakette fehlt.", "The sticker is an aid, the inspection record is what counts. The deadline runs until May 2027. Still mention that the sticker is missing.", "Plakietka to pomoc, rozstrzyga protokół. Termin mija w maju 2027. Mimo to zgłoś, że brakuje plakietki.", "Наклейка — допомога, вирішальний протокол. Строк до травня 2027. Все одно скажи, що наклейки немає.") },
                { id: "d", plate: { m: 11, y: 2027 }, ok: false,
                    note: t("Bei der täglichen Prüfung tropft Öl aus dem Neigezylinder.", "During the daily check, oil is dripping from the tilt cylinder.", "Podczas codziennej kontroli z siłownika pochylania kapie olej.", "Під час щоденної перевірки з циліндра нахилу капає олива."),
                    why: t("Eine gültige Plakette ersetzt nicht deine tägliche Prüfung. Mit einer Leckage fährst du nicht, du sicherst und meldest.", "A valid sticker does not replace your daily check. With a leak you do not drive. You secure the forklift and report it.", "Ważna plakietka nie zastępuje codziennej kontroli. Z wyciekiem nie jedziesz, tylko zabezpieczasz i zgłaszasz.", "Дійсна наклейка не замінює щоденну перевірку. З протіканням не їдеш, а убезпечуєш і повідомляєш.") },
            ],
            src: { de: `${V68} §9, §37, §39 mit DA; ${I208} Abschn. 5` } }),
        step("question", {
            title: t("Wann kommt die neue Plakette?", "When does the new sticker go on?", "Kiedy nakleić nową plakietkę?", "Коли клеїти нову наклейку?"),
            text: t("Bei der Jahresprüfung hat der Prüfer zwei Mängel gefunden. Die Ersatzteile kommen nächste Woche. Wann sollte die Plakette mit dem neuen Prüftermin auf den Stapler?", "At the annual inspection the inspector found two defects. The spare parts arrive next week. When should the sticker with the new inspection date go on the forklift?", "Podczas przeglądu rocznego stwierdzono dwie usterki. Części przyjdą w przyszłym tygodniu. Kiedy nakleić plakietkę z nowym terminem?", "Під час щорічної перевірки знайшли два дефекти. Запчастини прийдуть наступного тижня. Коли клеїти наклейку з новою датою?"),
            layout: "list",
            options: [t("Gleich nach der Prüfung", "Right after the inspection", "Od razu po przeglądzie", "Одразу після перевірки"), t("Erst wenn die Mängel behoben sind", "Only once the defects are fixed", "Dopiero po usunięciu usterek", "Лише після усунення дефектів")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das führt in die Irre", "No, that is misleading", "Nie, to wprowadza w błąd", "Ні, це вводить в оману") },
            body: t("Eine neue Plakette sagt jedem Fahrer: alles geprüft und in Ordnung. Deshalb soll sie erst angebracht werden, wenn die gefundenen Mängel behoben sind.", "A new sticker tells every driver: everything inspected and fine. That is why it should only be applied once the defects found are fixed.", "Nowa plakietka mówi każdemu operatorowi: wszystko sprawdzone i w porządku. Dlatego nakleja się ją dopiero po usunięciu usterek.", "Нова наклейка каже кожному водієві: усе перевірено й справно. Тому її клеять лише після усунення дефектів."),
            src: { de: `${V68} DA zu §39 Abs. 1` },
        }),
        step("video", {
            title: t("Die Jahresprüfung", "The annual inspection", "Przegląd roczny", "Щорічна перевірка"),
            brief: t("Prüfer mit Checkliste am Stapler: Gabeln vermessen, Ketten prüfen, Bremsen testen. Danach Eintrag im Prüfnachweis und die neue Plakette am Stapler. Nahaufnahme der Plakette.", "Inspector with a checklist at the forklift: measuring the forks, checking the chains, testing the brakes. Then the entry in the inspection record and the new sticker on the forklift. Close-up of the sticker.", "Osoba uprawniona z listą kontrolną przy wózku: mierzy widły, sprawdza łańcuchy, testuje hamulce. Potem wpis do protokołu przeglądu i nowa plakietka na wózku. Zbliżenie plakietki.", "Фахівець із чек-листом біля навантажувача: вимірює вила, перевіряє ланцюги, тестує гальма. Потім запис у протокол і нова наклейка. Крупний план наклейки."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Mindestens jährlich</b> prüft eine befähigte Person, bei Mehrschichtbetrieb auch öfter.", "<b>At least annually</b> a competent person inspects, more often with multi-shift operation.", "<b>Co najmniej raz w roku</b> przegląd przeprowadza osoba uprawniona, przy pracy wielozmianowej częściej.", "<b>Щонайменше щороку</b> перевіряє компетентна особа, при багатозмінній роботі частіше.")),
            pt(t("<b>Prüfnachweis:</b> Datum, Umfang, Mängel, Bewertung, Prüfer. Behobene Mängel werden vermerkt.", "<b>Inspection record:</b> date, scope, defects, assessment, inspector. Fixed defects are noted.", "<b>Protokół:</b> data, zakres, usterki, ocena, kto przeprowadził przegląd. Usunięte usterki są odnotowane.", "<b>Протокол:</b> дата, обсяг, дефекти, оцінка, хто перевіряв. Усунені дефекти позначають.")),
            pt(t("<b>Plakette:</b> hilft dir bei der Frist, ersetzt aber nie deine tägliche Prüfung.", "<b>Sticker:</b> helps you with the deadline but never replaces your daily check.", "<b>Plakietka:</b> pomaga pilnować terminu, ale nigdy nie zastępuje codziennej kontroli.", "<b>Наклейка:</b> допомагає зі строком, але ніколи не замінює щоденну перевірку.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson6Check(step: Mk): Step[] {
    return [
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Wann prüfst du den Stapler auf Mängel?", "When do you check the forklift for defects?", "Kiedy sprawdzasz wózek pod kątem usterek?", "Коли перевіряєш навантажувач на дефекти?"),
                    options: [t("Täglich vor Einsatzbeginn und beobachtend während der Arbeit", "Daily before starting work and by watching during work", "Codziennie przed pracą i obserwując w trakcie pracy", "Щодня перед роботою і спостерігаючи під час роботи"), t("Einmal pro Woche", "Once a week", "Raz w tygodniu", "Раз на тиждень")], correct: 0,
                    why: t("DGUV Vorschrift 68 §9 Abs. 1.", "DGUV Regulation 68 §9 para. 1.", "DGUV Vorschrift 68 §9 ust. 1.", "DGUV Vorschrift 68 §9 абз. 1.") },
                { q: t("Wann muss das Bremspedal im Stand spürbaren Widerstand haben?", "When must the brake pedal have noticeable resistance when stationary?", "Kiedy pedał hamulca w miejscu musi stawiać wyczuwalny opór?", "Коли педаль гальма на місці має чинити відчутний опір?"),
                    options: [t("Nach etwa einem Drittel des Weges", "After about one third of the travel", "Po około jednej trzeciej skoku", "Приблизно після третини ходу"), t("Erst kurz vor dem Bodenblech", "Only just before the floor plate", "Dopiero tuż przy podłodze", "Лише біля самої підлоги")], correct: 0,
                    why: t("DGUV Information 208-004, Abschnitt 5.", "DGUV Information 208-004, section 5.", "DGUV Information 208-004, rozdz. 5.", "DGUV Information 208-004, розд. 5.") },
                { q: t("Wie viel Spiel darf das Lenkrad höchstens haben?", "How much play may the steering wheel have at most?", "Jaki największy luz może mieć kierownica?", "Який найбільший люфт керма допустимий?"),
                    options: [t("Eine Handbreit", "A hand’s width", "Szerokość dłoni", "На ширину долоні"), t("Zwei Finger breit", "Two fingers wide", "Dwa palce", "Два пальці")], correct: 1,
                    why: t("DGUV Information 208-004, Abschnitt 5.", "DGUV Information 208-004, section 5.", "DGUV Information 208-004, rozdz. 5.", "DGUV Information 208-004, розд. 5.") },
                { q: t("Du entdeckst einen Riss im Gabelträger. Was tust du?", "You find a crack in the fork carriage. What do you do?", "Zauważasz pęknięcie karetki wideł. Co robisz?", "Ти бачиш тріщину на каретці вил. Що робиш?"),
                    options: [t("Vorsichtig weiterfahren und abends melden", "Keep driving carefully and report it in the evening", "Ostrożnie jeździć i zgłosić wieczorem", "Обережно їздити й повідомити ввечері"), t("Nicht fahren, sichern und umgehend melden", "Do not drive, secure it and report it immediately", "Nie jechać, zabezpieczyć i od razu zgłosić", "Не їхати, убезпечити й одразу повідомити")], correct: 1,
                    why: t("DGUV Vorschrift 68 §9 Abs. 1.", "DGUV Regulation 68 §9 para. 1.", "DGUV Vorschrift 68 §9 ust. 1.", "DGUV Vorschrift 68 §9 абз. 1.") },
                { q: t("In welchen Abständen wird der Stapler durch eine befähigte Person geprüft?", "At what intervals is the forklift inspected by a competent person?", "W jakich odstępach osoba uprawniona przeprowadza przegląd wózka?", "Як часто навантажувач перевіряє компетентна особа?"),
                    options: [t("Höchstens alle drei Jahre", "At most every three years", "Najwyżej co trzy lata", "Щонайбільше раз на три роки"), t("Längstens jährlich, bei Bedarf öfter", "At least once a year, more often if needed", "Co najmniej raz w roku, w razie potrzeby częściej", "Щонайменше раз на рік, за потреби частіше")], correct: 1,
                    why: t("DGUV Vorschrift 68 §37 Abs. 1; DGUV Information 208-004, Abschnitt 5.", "DGUV Regulation 68 §37 para. 1; DGUV Information 208-004, section 5.", "DGUV Vorschrift 68 §37 ust. 1; DGUV Information 208-004, rozdz. 5.", "DGUV Vorschrift 68 §37 абз. 1; DGUV Information 208-004, розд. 5.") },
                { q: t("Was gehört in den Prüfnachweis?", "What belongs in the inspection record?", "Co zawiera protokół przeglądu?", "Що входить до протоколу перевірки?"),
                    options: [t("Datum, Umfang, Ergebnis mit Mängeln und der Prüfer", "Date, scope, result with defects and the inspector", "Data, zakres, wynik z usterkami i osoba, która przeprowadziła przegląd", "Дата, обсяг, результат із дефектами й особа, яка перевіряла"), t("Nur der nächste Prüftermin", "Only the next inspection date", "Tylko termin następnej kontroli", "Лише дата наступної перевірки")], correct: 0,
                    why: t("DGUV Vorschrift 68 §39 Abs. 1.", "DGUV Regulation 68 §39 para. 1.", "DGUV Vorschrift 68 §39 ust. 1.", "DGUV Vorschrift 68 §39 абз. 1.") },
            ],
            allRight: t("Alles richtig. Du kennst die Prüfungen.", "All correct. You know the inspections.", "Wszystko dobrze. Znasz kontrole i przeglądy.", "Усе правильно. Ти знаєш перевірки."),
            someWrong: t("Schau dir die markierten Fragen noch einmal an.", "Take another look at the marked questions.", "Przejrzyj jeszcze raz zaznaczone pytania.", "Переглянь ще раз позначені питання."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Täglich:</b> Sicht- und Funktionsprüfung vor dem Einsatz, bei Mangel nicht fahren, sichern, melden.", "<b>Daily:</b> visual and function check before use. With a defect: do not drive, secure, report.", "<b>Codziennie:</b> kontrola wzrokowa i działania przed pracą. Przy usterce nie jedź, zabezpiecz, zgłoś.", "<b>Щодня:</b> візуальна перевірка й перевірка функцій. При дефекті не їдь, убезпеч, повідом.")),
            pt(t("<b>Jährlich:</b> Prüfung durch die befähigte Person, mit Prüfnachweis und Plakette.", "<b>Annually:</b> inspection by the competent person, with an inspection record and sticker.", "<b>Co roku:</b> przegląd przez osobę uprawnioną, z protokołem i plakietką.", "<b>Щороку:</b> перевірка компетентною особою, з протоколом і наклейкою.")),
        ] }),
    ];
}
