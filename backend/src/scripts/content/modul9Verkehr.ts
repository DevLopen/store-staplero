/**
 * Moduł „Verkehrsregelung / Verkehrswege” (spis klienta, punkt 10, moduł 9 kursu), od razu w czterech językach.
 * Źródła: DGUV Vorschrift 68 §12, §14, §16, §28, §29, §31, §33 z DA (wyd. 2002); DGUV Information 208-004 rozdz. 6.2, 6.4.1;
 * DGUV G 308-001 (Entwurf 2026) Anhang B Nr. 9.
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
const G308 = "DGUV G 308-001 (Entwurf 2026), Anhang B Nr. 9";

const ROW_TEXTS = texts([
    ["Situation {n} von {m}", "Situation {n} of {m}", "Sytuacja {n} z {m}", "Ситуація {n} з {m}"],
    ["Fahren", "Drive", "Jadę", "Їду"], ["Warten", "Wait", "Czekam", "Чекаю"],
    ["Nächste Situation", "Next situation", "Następna sytuacja", "Наступна ситуація"],
    ["{r} von {n} Situationen richtig.", "{r} of {n} situations correct.", "{r} z {n} sytuacji ocenionych prawidłowo.", "{r} з {n} ситуацій оцінено правильно."],
]);
const ROUTE_TEXTS = texts([
    ["Gefahren gefunden", "Hazards found", "Znalezione zagrożenia", "Знайдено небезпек"], ["Alle Gefahren gefunden", "All hazards found", "Wszystkie zagrożenia znalezione", "Усі небезпеки знайдено"],
    ["Gefahr: {l}", "Hazard: {l}", "Zagrożenie: {l}", "Небезпека: {l}"], ["In Ordnung: {l}", "All right: {l}", "W porządku: {l}", "Усе гаразд: {l}"],
    ["Tippe auf die Punkte in der Halle. Nicht alles ist falsch.", "Tap the points on the route. Not everything is wrong.", "Dotknij punktów na trasie. Nie wszystko jest złe.", "Торкайся точок на маршруті. Не все неправильно."],
    ["Ganze Halle zeigen", "Show the whole route", "Pokaż całą trasę", "Показати весь маршрут"],
]);

/* ════════════════ Lernziele ════════════════ */
export function lesson9Lz(step: Mk): Step[] {
    return [
        step("intro", {
            title: t("Verkehrsregelung und Verkehrswege", "Traffic rules and traffic routes", "Zasady ruchu i drogi komunikacyjne", "Правила руху й транспортні шляхи"), image: "forklift",
            text: t("Im Betrieb teilen sich Stapler, Fußgänger, Lkw und manchmal Züge dieselben Wege. Klare Regeln und gute Wege verhindern, dass es kracht.",
                "At work, forklifts, pedestrians, lorries and sometimes trains share the same routes. Clear rules and good routes prevent collisions.",
                "W zakładzie wózki, piesi, ciężarówki, a czasem pociągi dzielą te same drogi. Jasne zasady i dobre drogi zapobiegają zderzeniom.",
                "На підприємстві навантажувачі, пішоходи, вантажівки, а іноді й поїзди ділять ті самі шляхи. Чіткі правила й добрі шляхи запобігають зіткненням."),
            meta: [t("ca. 25 Minuten", "about 25 minutes", "ok. 25 minut", "близько 25 хвилин"), t("3 Themen und Modul-Check", "3 topics and module check", "3 tematy i test modułu", "3 теми і перевірка модуля"), { de: "DGUV V68 §12, §14, §28–33" }],
        }),
        step("self", {
            title: t("Wie sicher bist du heute?", "How confident are you today?", "Jak pewnie czujesz się dziś?", "Наскільки впевнено ти почуваєшся?"),
            lead: t("Deine Lernziele für dieses Modul. 1 = unbekannt, 5 = sicher.", "Your learning goals for this module. 1 = new to me, 5 = confident.", "Twoje cele nauki w tym module. 1 = nie znam, 5 = pewnie.", "Твої цілі в цьому модулі. 1 = незнайомо, 5 = впевнено."),
            goals: [
                { code: "9.1", text: t("Ich kenne die Verkehrsregeln im Betrieb: Vorfahrt, Tempo, Zeichen.", "I know the traffic rules at work: right of way, speed, signs.", "Znam zasady ruchu w zakładzie: pierwszeństwo, prędkość, znaki.", "Я знаю правила руху на підприємстві: перевага, швидкість, знаки."), short: t("Verkehrsregeln", "Traffic rules", "Zasady ruchu", "Правила руху") },
                { code: "9.2", text: t("Ich erkenne, ob ein Verkehrsweg breit genug, frei und in Ordnung ist.", "I can tell whether a traffic route is wide enough, clear and in order.", "Rozpoznaję, czy droga komunikacyjna jest wystarczająco szeroka, wolna i w dobrym stanie.", "Я розпізнаю, чи шлях достатньо широкий, вільний і в доброму стані."), short: t("Verkehrswege", "Traffic routes", "Drogi komunikacyjne", "Транспортні шляхи") },
                { code: "9.3", text: t("Ich fahre sicher durch Tore, über Rampen, in Aufzüge, über Gleise und in Regalgänge.", "I drive safely through gates, over ramps, into lifts, across tracks and into rack aisles.", "Bezpiecznie przejeżdżam przez bramy, rampy, windy, tory i alejki regałowe.", "Я безпечно проїжджаю ворота, рампи, ліфти, колії й проходи між стелажами."), short: t("Engstellen", "Tight spots", "Trudne miejsca", "Складні місця") },
            ],
        }),
        step("sort", {
            title: t("Erlaubt oder nicht?", "Allowed or not?", "Wolno czy nie?", "Можна чи ні?"),
            lead: t("Entscheide aus dem Bauch heraus.", "Go with your gut feeling.", "Zdecyduj intuicyjnie.", "Вирішуй інтуїтивно."),
            labels: [t("Erlaubt", "Allowed", "Wolno", "Можна"), t("Verboten", "Not allowed", "Nie wolno", "Не можна")],
            items: [
                { t: t("Eine Abkürzung durch einen Bereich nehmen, der für Stapler nicht freigegeben ist", "Taking a shortcut through an area not released for forklifts", "Skrócić drogę przez obszar, w którym ruch wózków nie jest dozwolony", "Зрізати шлях через зону, не дозволену для навантажувачів"), a: 1, why: t("Befahren werden nur die freigegebenen Verkehrswege.", "Only released traffic routes may be used.", "Jeździ się tylko po drogach dopuszczonych do ruchu wózków.", "Їздять лише дозволеними шляхами.") },
                { t: t("Vor einem Tor langsamer werden und hupen", "Slowing down and sounding the horn before a gate", "Zwolnić i zatrąbić przed bramą", "Сповільнитися й посигналити перед воротами"), a: 0, why: t("Vor Türen, Toren und unübersichtlichen Stellen langsam fahren und Warnsignal geben.", "Drive slowly and give a warning signal before doors, gates and blind spots.", "Przed drzwiami, bramami i miejscami bez widoczności zwolnij i daj sygnał.", "Перед дверима, воротами й місцями без огляду їдь повільно й подавай сигнал.") },
                { t: t("Leere Paletten kurz auf dem Fahrweg abstellen", "Briefly leaving empty pallets on the driveway", "Na chwilę odstawić puste palety na drodze", "Ненадовго поставити порожні палети на проїзді"), a: 1, why: t("Verkehrswege werden nicht verstellt, auch nicht kurz.", "Traffic routes are not blocked, not even briefly.", "Dróg komunikacyjnych się nie zastawia, nawet na chwilę.", "Шляхи не загороджують, навіть ненадовго.") },
                { t: t("Einer Werkslok am Gleisübergang den Vortritt lassen", "Giving way to a works locomotive at the level crossing", "Przepuścić lokomotywę zakładową na przejeździe", "Пропустити заводський локомотив на переїзді"), a: 0, why: t("Schienenfahrzeuge haben Vorfahrt.", "Rail vehicles have right of way.", "Pojazdy szynowe mają pierwszeństwo.", "Рейковий транспорт має перевагу.") },
            ],
            allRight: t("Gutes Gespür. Jetzt üben wir an der Kreuzung.", "Good instinct. Now let us practise at the crossing.", "Dobre wyczucie. Teraz poćwiczymy na skrzyżowaniu.", "Гарне чуття. Тепер потренуємося на перехресті."),
            someWrong: t("Kein Problem, genau das klären wir jetzt.", "No problem, that is exactly what we will clear up now.", "Nie szkodzi, właśnie to teraz wyjaśnimy.", "Нічого, саме це зараз з’ясуємо."),
        }),
    ];
}

/* ════════════════ 9.1 Verkehrsregeln im Betrieb ════════════════ */
export function lesson91(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Regeln wie auf der Straße", "Rules like on the road", "Zasady jak na drodze", "Правила як на дорозі"),
            lead: t("Die Verkehrsregeln im Betrieb lehnen sich an die Straßenverkehrsordnung an.", "Traffic rules at work are based on the road traffic regulations.", "Zasady ruchu w zakładzie opierają się na przepisach ruchu drogowego (StVO).", "Правила руху на підприємстві спираються на правила дорожнього руху."),
            points: [
                pt(t("<b>Nur freigegebene Wege:</b> Du fährst dort, wo der Unternehmer Staplerverkehr erlaubt hat. Oft sind auch verbotene Bereiche gekennzeichnet.", "<b>Only approved routes:</b> you drive where the employer has allowed forklift traffic. Forbidden areas are often marked too.", "<b>Tylko dopuszczone drogi:</b> jeździsz tam, gdzie pracodawca pozwolił na ruch wózków. Często oznaczone są też obszary zakazane.", "<b>Лише дозволені шляхи:</b> їдеш там, де роботодавець дозволив рух навантажувачів. Часто позначені й заборонені зони.")),
                pt(t("<b>Rechts vor links,</b> wenn nichts anderes geregelt ist. Schienenfahrzeuge haben immer Vorfahrt.", "<b>Priority to the right</b> unless otherwise regulated. Rail vehicles always have right of way.", "<b>Pierwszeństwo z prawej,</b> jeśli nie ustalono inaczej. Pojazdy szynowe mają zawsze pierwszeństwo.", "<b>Перевага праворуч,</b> якщо не встановлено інше. Рейковий транспорт має перевагу завжди.")),
                pt(t("<b>Zeichen und Markierungen:</b> Verkehrszeichen der StVO und betriebliche Schilder, Stoppstellen, Zebrastreifen. An Fußgängerüberwegen haben Fußgänger Vorrang.", "<b>Signs and markings:</b> road traffic signs and company signs, stop points, zebra crossings. At pedestrian crossings pedestrians have priority.", "<b>Znaki i oznakowanie:</b> znaki drogowe według StVO i znaki zakładowe, miejsca zatrzymania, przejścia dla pieszych. Na przejściach piesi mają pierwszeństwo.", "<b>Знаки й розмітка:</b> дорожні та заводські знаки, місця зупинки, пішохідні переходи. На переходах пішоходи мають перевагу.")),
                pt(t("<b>Spiegel an unübersichtlichen Stellen</b> helfen, ersetzen aber nicht das Anhalten, wenn du nichts siehst.", "<b>Mirrors at blind spots</b> help but do not replace stopping when you cannot see.", "<b>Lustra w miejscach bez widoczności</b> pomagają, ale nie zastępują zatrzymania, gdy nic nie widzisz.", "<b>Дзеркала в місцях без огляду</b> допомагають, але не замінюють зупинку, коли нічого не видно.")),
            ],
            merke: t("Vorfahrt hat man, erzwingen darf man sie nicht.", "You may have right of way, but you must never force it.", "Pierwszeństwo możesz mieć, ale nie wolno go wymuszać.", "Перевагу можна мати, але не можна її нав’язувати."),
            src: { de: `${I208} Abschn. 6.2, 6.2.1 und 6.4.1; ${G308}` },
        }),
        step("learn", {
            title: t("Tempo und Licht", "Speed and lights", "Prędkość i światła", "Швидкість і світло"),
            lead: t("Du fährst immer so schnell, dass du rechtzeitig anhalten kannst.", "You always drive at a speed that lets you stop in time.", "Zawsze jedziesz tak, by zdążyć się zatrzymać.", "Завжди їдеш так, щоб вчасно зупинитися."),
            points: [
                pt(t("<b>Angepasst an die Fahrbahn:</b> Nässe, Schmutz und schmale Wege verlangen langsamere Fahrt. Höchstgeschwindigkeiten aus Schildern oder der Betriebsanweisung gelten immer.", "<b>Adapted to the route:</b> wetness, dirt and narrow routes demand slower driving. Speed limits on signs or in the operating instructions always apply.", "<b>Dostosowana do nawierzchni:</b> mokra lub brudna nawierzchnia i wąskie drogi wymagają wolniejszej jazdy. Ograniczenia prędkości ze znaków i z instrukcji stanowiskowej obowiązują zawsze.", "<b>Відповідно до покриття:</b> волога, бруд і вузькі шляхи вимагають повільнішої їзди. Обмеження швидкості зі знаків чи робочої інструкції діють завжди.")),
                pt(t("<b>Gefahrstellen:</b> Vor Türen, Toren und unübersichtlichen Stellen langsam fahren und Warnsignal geben.", "<b>Danger points:</b> drive slowly and give a warning signal before doors, gates and blind spots.", "<b>Miejsca niebezpieczne:</b> przed drzwiami, bramami i miejscami bez widoczności zwolnij i daj sygnał.", "<b>Небезпечні місця:</b> перед дверима, воротами й місцями без огляду повільно й із сигналом.")),
                pt(t("<b>Licht an:</b> Auf nicht ausreichend beleuchteten Wegen nur mit eingeschalteter Beleuchtung fahren.", "<b>Lights on:</b> on insufficiently lit routes drive only with the lights switched on.", "<b>Światła włączone:</b> na słabo oświetlonych drogach jeździsz tylko z włączonymi światłami.", "<b>Світло ввімкнене:</b> на погано освітлених шляхах їздиш лише з увімкненим світлом.")),
            ],
            src: { de: `${V68} §12 Abs. 2 und 8 mit DA; ${I208} Abschn. 6.4.1` },
        }),
        step("sim", { sim: "row", texts: ROW_TEXTS,
            title: t("Fahren oder warten?", "Drive or wait?", "Jechać czy czekać?", "Їхати чи чекати?"),
            lead: t("Vier Situationen an der Kreuzung. Du kommst von unten. Entscheide jedes Mal.", "Four situations at the crossing. You come from the bottom of the screen. Decide each time.", "Cztery sytuacje na skrzyżowaniu. Nadjeżdżasz od dołu ekranu. Za każdym razem zdecyduj.", "Чотири ситуації на перехресті. Ти під’їжджаєш знизу екрана. Щоразу вирішуй."),
            rounds: [
                { id: "right", correct: "wait",
                    text: t("Von rechts kommt ein Stapler. Es gibt keine Schilder.", "A forklift is coming from the right. There are no signs.", "Z prawej nadjeżdża wózek. Nie ma znaków.", "Праворуч під’їжджає навантажувач. Знаків немає."),
                    why: t("Rechts vor links: Der Stapler von rechts hat Vorfahrt. Du wartest.", "Priority to the right: the forklift from the right has right of way. You wait.", "Pierwszeństwo z prawej: wózek z prawej ma pierwszeństwo. Czekasz.", "Перевага праворуч: навантажувач справа має перевагу. Ти чекаєш.") },
                { id: "left", correct: "go",
                    text: t("Jetzt kommt ein Stapler von links. Er bremst an seiner Linie.", "Now a forklift is coming from the left. It brakes at its line.", "Teraz wózek nadjeżdża z lewej. Zatrzymuje się przed swoją linią.", "Тепер навантажувач їде зліва. Він гальмує біля своєї лінії."),
                    why: t("Du kommst für ihn von rechts, also hast du Vorfahrt. Fahr mit Blickkontakt und erzwinge sie nie.", "For the other driver you come from the right, so you have right of way. Drive with eye contact and never force it.", "Dla niego nadjeżdżasz z prawej, więc masz pierwszeństwo. Jedź, utrzymując kontakt wzrokowy, i nigdy go nie wymuszaj.", "Для нього ти під’їжджаєш справа, тож маєш перевагу. Їдь, тримаючи зоровий контакт, і ніколи не нав’язуй її.") },
                { id: "zebra", correct: "wait",
                    text: t("Am Zebrastreifen vor dir geht eine Kollegin los.", "At the zebra crossing ahead, a colleague starts walking.", "Na przejściu przed tobą koleżanka zaczyna przechodzić.", "На переході перед тобою колега починає йти."),
                    why: t("Am Fußgängerüberweg haben Fußgänger Vorrang. Du hältst an und wartest, bis der Weg frei ist.", "At the pedestrian crossing pedestrians have priority. You stop and wait until the way is clear.", "Na przejściu piesi mają pierwszeństwo. Zatrzymujesz się i czekasz, aż droga będzie wolna.", "На переході пішоходи мають перевагу. Зупиняєшся й чекаєш, доки шлях звільниться.") },
                { id: "rail", correct: "wait",
                    text: t("Auf dem Werksgleis nähert sich ein Waggon.", "A wagon is approaching on the works track.", "Na torze zakładowym zbliża się wagon.", "По заводській колії наближається вагон."),
                    why: t("Schienenfahrzeuge haben immer Vorfahrt und können nicht ausweichen. Erst wenn das Gleis frei ist, überquerst du es langsam.", "Rail vehicles always have right of way and cannot swerve. Only when the track is clear do you cross it slowly.", "Pojazdy szynowe mają zawsze pierwszeństwo i nie mogą ominąć przeszkody. Przejeżdżasz powoli dopiero, gdy tor jest wolny.", "Рейковий транспорт має перевагу й не може об’їхати перешкоду. Колію переїжджаєш повільно, лише коли вона вільна.") },
            ],
            src: { de: `${I208} Abschn. 6.2 und 6.4.1` } }),
        step("question", {
            title: t("Die blinde Ecke", "The blind corner", "Narożnik bez widoczności", "Кут без огляду"),
            text: t("Du fährst auf eine Hallenecke zu. Dahinter siehst du nichts, im Spiegel ist gerade niemand.", "You are approaching a hall corner. You cannot see behind it, and the mirror shows nobody right now.", "Zbliżasz się do narożnika hali. Nie widzisz, co jest za nim, a w lustrze akurat nikogo nie ma.", "Ти під’їжджаєш до кута цеху. За ним нічого не видно, у дзеркалі зараз нікого."),
            layout: "list",
            options: [t("Im normalen Tempo weiter, der Spiegel ist leer", "Continue at normal speed, the mirror is empty", "Jechać dalej normalnie, lustro jest puste", "Їхати далі як завжди, дзеркало порожнє"), t("Langsam, Warnsignal geben, bremsbereit um die Ecke", "Slowly, give a warning signal, round the corner ready to brake", "Powoli, z sygnałem, wjechać za róg w gotowości do hamowania", "Повільно, з сигналом, за ріг із готовністю гальмувати")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, der Spiegel zeigt nicht alles", "No, the mirror does not show everything", "Nie, lustro nie pokazuje wszystkiego", "Ні, дзеркало показує не все") },
            body: t("Vor unübersichtlichen Stellen fährst du langsam und gibst ein Warnsignal. So kannst du auf kürzestem Weg anhalten, wenn plötzlich jemand auftaucht.", "Before blind spots you drive slowly and give a warning signal. That way you can stop in the shortest distance if someone suddenly appears.", "Przed miejscami bez widoczności zwalniasz i dajesz sygnał. Wtedy zatrzymasz się na najkrótszym odcinku, gdy ktoś nagle się pojawi.", "Перед місцями без огляду їдеш повільно й сигналиш. Так зупинишся якнайшвидше, якщо хтось раптом з’явиться."),
            src: { de: `${I208} Abschn. 6.4.1` },
        }),
        step("video", {
            title: t("Kreuzung in der Halle", "Crossing in the hall", "Skrzyżowanie w hali", "Перехрестя в цеху"),
            brief: t("Stapler nähert sich einer Hallenkreuzung, wird langsamer, Blick in den Spiegel, lässt einen Stapler von rechts durch, wartet am Zebrastreifen auf eine Fußgängerin und fährt dann weiter. Kamera aus Fahrersicht.", "Forklift approaches a hall crossing, slows down, checks the mirror, lets a forklift from the right pass, waits at the zebra crossing for a pedestrian and then continues. Camera from the driver’s view.", "Wózek zbliża się do skrzyżowania w hali, zwalnia, patrzy w lustro, przepuszcza wózek z prawej, czeka na przejściu na pieszą i jedzie dalej. Kamera z perspektywy operatora.", "Навантажувач під’їжджає до перехрестя, сповільнюється, дивиться в дзеркало, пропускає навантажувач справа, чекає на переході пішохідку й їде далі. Камера з місця водія."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Wege:</b> nur freigegebene Verkehrswege, Zeichen beachten.", "<b>Routes:</b> only released traffic routes, follow the signs.", "<b>Drogi:</b> tylko dopuszczone drogi komunikacyjne, przestrzegaj znaków.", "<b>Шляхи:</b> лише дозволені шляхи руху, дотримуйся знаків.")),
            pt(t("<b>Vorfahrt:</b> rechts vor links, Zebrastreifen, Schienenfahrzeuge zuerst.", "<b>Right of way:</b> priority to the right, zebra crossings, rail vehicles first.", "<b>Pierwszeństwo:</b> pierwszeństwo z prawej, przejścia dla pieszych, pojazdy szynowe zawsze pierwsze.", "<b>Перевага:</b> перевага праворуч, пішохідні переходи, рейковий транспорт — завжди першим.")),
            pt(t("<b>Tempo:</b> so, dass du immer rechtzeitig anhalten kannst. Licht an, wo es dunkel ist.", "<b>Speed:</b> so that you can always stop in time. Lights on where it is dark.", "<b>Prędkość:</b> tak, by zawsze zdążyć się zatrzymać. Gdzie jest ciemno, włącz światła.", "<b>Швидкість:</b> щоб завжди вчасно зупинитися. Де темно, вмикай світло.")),
        ] }),
    ];
}

/* ════════════════ 9.2 Verkehrswege und ihr Zustand ════════════════ */
export function lesson92(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Breit genug und frei", "Wide enough and clear", "Wystarczająco szerokie i wolne", "Достатньо широкі й вільні"),
            lead: t("Neben Stapler und Last muss auf beiden Seiten Platz bleiben.", "There must be space on both sides of the forklift and load.", "Po obu stronach wózka i ładunku musi zostać miejsce.", "З обох боків навантажувача й вантажу має лишатися місце."),
            points: [
                pt(t("<b>Sicherheitsabstand:</b> mindestens 0,5 m auf jeder Seite zwischen Stapler oder Ladegut und Rand des Verkehrsweges. Bei starkem Gehverkehr können 0,75 m nötig sein.", "<b>Safety distance:</b> at least 0.5 m on each side between forklift or load and the edge of the route. With heavy pedestrian traffic 0.75 m may be needed.", "<b>Odstęp bezpieczeństwa:</b> co najmniej 0,5 m z każdej strony między wózkiem lub ładunkiem a krawędzią drogi. Przy dużym ruchu pieszych może być potrzebne 0,75 m.", "<b>Безпечна відстань:</b> щонайменше 0,5 м з кожного боку між навантажувачем чи вантажем і краєм шляху. При інтенсивному русі пішоходів може знадобитися 0,75 м.")),
                pt(t("<b>Breitere Last ausnahmsweise:</b> nur mit Genehmigung des Aufsichtführenden, mit Absperrung, Einweiser und im Schritttempo.", "<b>Wider load as an exception:</b> only with the supervisor’s approval, with barriers, a banksman and at walking pace.", "<b>Szerszy ładunek wyjątkowo:</b> tylko za zgodą osoby sprawującej nadzór, z odgrodzeniem, sygnalistą i w tempie pieszego.", "<b>Ширший вантаж як виняток:</b> лише з дозволу керівника, з огородженням, сигнальником і зі швидкістю пішохода.")),
                pt(t("<b>Frei halten:</b> kein Transportgut, keine leeren Paletten und kein abgestellter Stapler auf dem Verkehrsweg.", "<b>Keep clear:</b> no goods, no empty pallets and no parked forklift on the traffic route.", "<b>Utrzymuj wolne:</b> żadnych towarów, pustych palet ani odstawionego wózka na drodze komunikacyjnej.", "<b>Тримай вільним:</b> жодних вантажів, порожніх палет чи поставленого навантажувача на шляху.")),
                pt(t("<b>Kennzeichnung beachten:</b> Tragfähigkeit von Böden, Decken und Brücken sowie die Höhe von Durchfahrten.", "<b>Observe markings:</b> load capacity of floors, ceilings and bridges and the height of passages.", "<b>Przestrzegaj oznaczeń:</b> nośność podłóg, stropów i pomostów oraz wysokość przejazdów.", "<b>Зважай на маркування:</b> несуча здатність підлог, перекриттів і містків, висота проїздів.")),
            ],
            src: { de: `${I208} Abschn. 6.2, 6.2.1 und 6.2.2` },
        }),
        step("learn", {
            title: t("Der Zustand des Weges", "The condition of the route", "Stan drogi", "Стан шляху"),
            lead: t("Ein Schlagloch oder eine Öllache kann die Last ins Rutschen bringen oder den Stapler kippen.", "A pothole or an oil puddle can make the load slide or tip the forklift.", "Przez dziurę albo plamę oleju ładunek może się zsunąć, a wózek przewrócić.", "Вибоїна чи калюжа оливи можуть зсунути вантаж або перекинути навантажувач."),
            points: [
                pt(t("<b>Tragfähig, eben und befestigt:</b> Der Untergrund muss Stapler und Last tragen.", "<b>Load-bearing, level and paved:</b> the surface must carry forklift and load.", "<b>Nośne, równe i utwardzone:</b> podłoże musi utrzymać wózek i ładunek.", "<b>Міцне, рівне й з твердим покриттям:</b> покриття має витримувати навантажувач і вантаж.")),
                pt(t("<b>Griffig statt rutschig:</b> Öl, Nässe, Eis, Laub oder Staub verlängern den Bremsweg.", "<b>Grippy instead of slippery:</b> oil, wetness, ice, leaves or dust lengthen the braking distance.", "<b>Przyczepne, nie śliskie:</b> olej, woda, lód, liście albo pył wydłużają drogę hamowania.", "<b>З добрим зчепленням, не слизьке:</b> олива, волога, лід, листя чи пил подовжують гальмівний шлях.")),
                pt(t("<b>Frei von Hindernissen und Löchern:</b> Schlaglöcher, offene Schächte, Rinnen und Kanten langsam umfahren oder überqueren und die Last beobachten.", "<b>Free of obstacles and holes:</b> drive slowly around or over potholes, open shafts, gutters and edges and watch the load.", "<b>Bez przeszkód i dziur:</b> dziury, otwarte studzienki, rynny i krawędzie omijaj lub pokonuj powoli, obserwując ładunek.", "<b>Без перешкод і ям:</b> вибоїни, відкриті люки, жолоби й краї об’їжджай чи переїжджай повільно, стежачи за вантажем.")),
                pt(t("<b>Melden:</b> Schäden am Weg meldest du, statt jeden Tag drumherum zu fahren.", "<b>Report:</b> you report damage to the route instead of driving around it every day.", "<b>Zgłaszaj:</b> uszkodzenia drogi zgłaszasz, zamiast codziennie je omijać.", "<b>Повідомляй:</b> про пошкодження шляху повідомляєш, а не об’їжджаєш його щодня.")),
            ],
            src: { de: `${G308}; ${I208} Abschn. 6.4.1` },
        }),
        step("sim", { sim: "people", scene: "route", texts: ROUTE_TEXTS,
            title: t("Ist der Weg in Ordnung?", "Is the route in order?", "Czy droga jest w porządku?", "Чи шлях у порядку?"),
            lead: t("Finde die vier Mängel auf dem Fahrweg. Drehe die Szene mit dem Finger.", "Find the four defects on the driveway. Rotate the scene with your finger.", "Znajdź cztery usterki na drodze. Obracaj scenę palcem.", "Знайди чотири недоліки на проїзді. Обертай сцену пальцем."),
            zones: [
                { id: "hole", bad: true, label: t("Schlagloch", "Pothole", "Dziura", "Вибоїна"), why: t("Ein Rad im Loch reißt Lenkung und Last zur Seite. Langsam umfahren und den Schaden melden.", "A wheel in the hole jerks the steering and load sideways. Drive slowly around it and report the damage.", "Koło w dziurze szarpie kierownicą i ładunkiem na bok. Omiń powoli i zgłoś uszkodzenie.", "Колесо у вибоїні смикає кермо й вантаж убік. Повільно об’їдь і повідом про пошкодження.") },
                { id: "oil", bad: true, label: t("Öllache", "Oil puddle", "Plama oleju", "Калюжа оливи"), why: t("Auf Öl rutschen Räder beim Bremsen weg. Bereich absichern, Bindemittel anfordern, melden.", "On oil, wheels slide away when braking. Secure the area, request absorbent, report it.", "Na oleju koła ślizgają się przy hamowaniu. Zabezpiecz miejsce, poproś o sorbent, zgłoś.", "На оливі колеса ковзають при гальмуванні. Огороди місце, попроси сорбент, повідом.") },
                { id: "blocked", bad: true, label: t("Paletten auf dem Fahrweg", "Pallets on the driveway", "Palety na drodze", "Палети на проїзді"), why: t("Der Verkehrsweg ist verstellt. Wer ausweicht, gerät in den Gehbereich oder an Regale.", "The traffic route is blocked. Anyone swerving ends up in the walkway or at racks.", "Droga jest zastawiona. Kto ją omija, trafia w strefę pieszych albo na regały.", "Шлях загороджено. Хто об’їжджає, потрапляє в зону пішоходів чи на стелажі.") },
                { id: "shaft", bad: true, label: t("Offener Schacht", "Open shaft", "Otwarta studzienka", "Відкритий люк"), why: t("Ein offener Schacht im Fahrweg kann ein Rad verschlucken und den Stapler kippen. Absperren und melden.", "An open shaft in the driveway can swallow a wheel and tip the forklift. Cordon off and report.", "Otwarta studzienka może wciągnąć koło i przewrócić wózek. Odgrodź i zgłoś.", "Відкритий люк може «проковтнути» колесо й перекинути навантажувач. Огороди й повідом.") },
                { id: "mirror", label: t("Spiegel an der Ecke", "Mirror at the corner", "Lustro na rogu", "Дзеркало на розі"), why: t("Ein Kugelspiegel an der unübersichtlichen Ecke. So soll es sein.", "A convex mirror at the blind corner. That is how it should be.", "Lustro sferyczne na narożniku bez widoczności. Tak ma być.", "Сферичне дзеркало на розі без огляду. Так і має бути.") },
                { id: "zebra", label: t("Zebrastreifen", "Zebra crossing", "Przejście dla pieszych", "Пішохідний перехід"), why: t("Ein markierter Fußgängerüberweg sichert die gefährliche Stelle. So soll es sein.", "A marked pedestrian crossing secures the dangerous point. That is how it should be.", "Oznaczone przejście zabezpiecza niebezpieczne miejsce. Tak ma być.", "Позначений перехід убезпечує небезпечне місце. Так і має бути.") },
            ],
            done: t("Alle vier Mängel gefunden.", "All four defects found.", "Znalazłeś wszystkie cztery usterki.", "Усі чотири недоліки знайдено."),
            src: { de: `${G308}; ${I208} Abschn. 6.2.2` } }),
        step("question", {
            title: t("Passt die Last durch?", "Does the load fit through?", "Czy ładunek się zmieści?", "Чи пройде вантаж?"),
            text: t("Deine Last ist 1,20 m breit, breiter als der Stapler. Der Gang zwischen den Regalen ist 2,00 m breit.", "Your load is 1.20 m wide, wider than the forklift. The aisle between the racks is 2.00 m wide.", "Twój ładunek ma 1,20 m szerokości, więcej niż wózek. Alejka między regałami ma 2,00 m.", "Твій вантаж завширшки 1,20 м, ширший за навантажувач. Прохід між стелажами 2,00 м."),
            layout: "list",
            options: [t("Ja, es sind 80 cm Platz übrig", "Yes, there are 80 cm to spare", "Tak, zostaje 80 cm zapasu", "Так, лишається 80 см запасу"), t("Nein, nötig wären 1,20 + 2 × 0,5 = 2,20 m", "No, 1.20 + 2 × 0.5 = 2.20 m would be needed", "Nie, potrzeba by 1,20 + 2 × 0,5 = 2,20 m", "Ні, потрібно 1,20 + 2 × 0,5 = 2,20 м")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, der Abstand gilt auf beiden Seiten", "No, the distance applies on both sides", "Nie, odstęp obowiązuje z obu stron", "Ні, відстань діє з обох боків") },
            body: t("Auf jeder Seite braucht es mindestens 0,5 m. Für diese Fahrt brauchst du eine Genehmigung, Absperrung, einen Einweiser und Schritttempo, oder einen anderen Weg.", "At least 0.5 m is needed on each side. For this trip you need approval, barriers, a banksman and walking pace, or a different route.", "Z każdej strony potrzeba co najmniej 0,5 m. Na taki przejazd potrzebujesz zgody, odgrodzenia, sygnalisty i tempa pieszego albo innej drogi.", "З кожного боку потрібно щонайменше 0,5 м. Для такого проїзду потрібні дозвіл, огородження, сигнальник і швидкість пішохода або інший шлях."),
            src: { de: `${I208} Abschn. 6.2.1` },
        }),
        step("video", {
            title: t("Verkehrsweg-Check", "Traffic route check", "Kontrola drogi komunikacyjnej", "Перевірка шляху"),
            brief: t("Fahrer fährt einen Rundkurs durch Halle und Hof, hält an einer Öllache, an abgestellten Paletten und an einem offenen Schacht an und meldet die Stellen. Nahaufnahmen der Mängel.", "Driver drives a circuit through hall and yard, stops at an oil puddle, at parked pallets and at an open shaft and reports the spots. Close-ups of the defects.", "Operator objeżdża halę i plac, zatrzymuje się przy plamie oleju, odstawionych paletach i otwartej studzience i zgłasza te miejsca. Zbliżenia usterek.", "Водій об’їжджає цех і двір, зупиняється біля калюжі оливи, поставлених палет і відкритого люка й повідомляє про ці місця. Крупні плани недоліків."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Breite:</b> mindestens 0,5 m Abstand auf jeder Seite, bei viel Gehverkehr mehr.", "<b>Width:</b> at least 0.5 m distance on each side, more with heavy pedestrian traffic.", "<b>Szerokość:</b> co najmniej 0,5 m odstępu z każdej strony, przy dużym ruchu pieszych więcej.", "<b>Ширина:</b> щонайменше 0,5 м з кожного боку, при інтенсивному русі пішоходів більше.")),
            pt(t("<b>Frei:</b> nichts auf dem Verkehrsweg abstellen.", "<b>Clear:</b> leave nothing on the traffic route.", "<b>Wolne:</b> niczego nie odstawiaj na drodze komunikacyjnej.", "<b>Вільно:</b> нічого не став на шляху.")),
            pt(t("<b>Zustand:</b> Löcher, Öl, offene Schächte umfahren und melden.", "<b>Condition:</b> drive around holes, oil and open shafts and report them.", "<b>Stan:</b> dziury, olej, otwarte studzienki omijaj i zgłaszaj.", "<b>Стан:</b> ями, оливу, відкриті люки об’їжджай і повідомляй.")),
        ] }),
    ];
}

/* ════════════════ 9.3 Engstellen, Rampen, Aufzüge, Gleise, Regalgänge ════════════════ */
export function lesson93(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Tore, Rampen und Gleise", "Gates, ramps and tracks", "Bramy, rampy i tory", "Ворота, рампи й колії"),
            lead: t("An diesen Stellen ändert sich schlagartig, was um dich herum passiert.", "At these spots, what happens around you changes suddenly.", "W tych miejscach sytuacja wokół ciebie zmienia się nagle.", "У цих місцях обстановка навколо раптово змінюється."),
            points: [
                pt(t("<b>Tore und Durchfahrten:</b> langsam, Warnsignal geben. Achte auf die Durchfahrtshöhe: Hubmast, Schutzdach und Last müssen darunter passen.", "<b>Gates and passages:</b> slowly, give a warning signal. Watch the clearance height: mast, overhead guard and load must fit underneath.", "<b>Bramy i przejazdy:</b> powoli, z sygnałem. Pilnuj wysokości przejazdu: maszt, daszek ochronny i ładunek muszą się zmieścić.", "<b>Ворота й проїзди:</b> повільно, із сигналом. Зважай на висоту проїзду: щогла, захисний дах і вантаж мають пройти.")),
                pt(t("<b>Laderampen und Überladebrücken:</b> nur befahren, wenn sie tragfähig und gesichert sind. Abstand zur Rampenkante halten.", "<b>Loading ramps and dock plates:</b> only drive on them when they are load-bearing and secured. Keep away from the ramp edge.", "<b>Rampy i pomosty przeładunkowe:</b> wjeżdżaj tylko, gdy są nośne i zabezpieczone. Trzymaj odstęp od krawędzi rampy.", "<b>Рампи й перехідні містки:</b> заїжджай лише, коли вони міцні й закріплені. Тримайся подалі від краю рампи.")),
                pt(t("<b>Gefälle und Steigungen:</b> Die Last wird immer bergseitig geführt.", "<b>Slopes and inclines:</b> the load is always carried on the uphill side.", "<b>Spadki i wzniesienia:</b> ładunek prowadzi się zawsze od strony wzniesienia.", "<b>Спуски й підйоми:</b> вантаж завжди тримають з боку підйому.")),
                pt(t("<b>Gleise, Rinnen, Schächte:</b> langsam überqueren und die Last beobachten. Schienenfahrzeuge haben Vorfahrt.", "<b>Tracks, gutters, shafts:</b> cross slowly and watch the load. Rail vehicles have right of way.", "<b>Tory, rynny, studzienki:</b> przejeżdżaj powoli, obserwując ładunek. Pojazdy szynowe mają pierwszeństwo.", "<b>Колії, жолоби, люки:</b> переїжджай повільно, стежачи за вантажем. Рейковий транспорт має перевагу.")),
            ],
            src: { de: `${V68} §12 Abs. 7; ${I208} Abschn. 6.2 und 6.4.1; ${G308}` },
        }),
        step("learn", {
            title: t("Aufzüge und Regalgänge", "Lifts and rack aisles", "Windy i alejki regałowe", "Ліфти й проходи між стелажами"),
            lead: t("Enge Räume, in denen Menschen und Stapler sich nicht begegnen sollen.", "Tight spaces where people and forklifts should not meet.", "Ciasne miejsca, w których ludzie i wózki nie powinni się spotykać.", "Тісні місця, де люди й навантажувачі не повинні зустрічатися."),
            points: [
                pt(t("<b>Aufzug:</b> nur einen, der für Stapler freigegeben ist. Beim Ein- und Ausfahren ist niemand im Fahrkorb. Stapler und Last dürfen nicht am Schacht anstoßen.", "<b>Lift:</b> only one released for forklifts. When driving in and out, nobody is in the car. Forklift and load must not hit the shaft.", "<b>Winda:</b> tylko taka, która jest dopuszczona dla wózków. Przy wjeździe i wyjeździe nikogo nie ma w kabinie. Wózek i ładunek nie mogą zahaczyć o szyb.", "<b>Ліфт:</b> лише дозволений для навантажувачів. Під час заїзду й виїзду в кабіні нікого. Навантажувач і вантаж не повинні зачіпати шахту.")),
                pt(t("<b>Schmalgänge:</b> Fußgänger werden durch Bauweise oder Technik ferngehalten. Wer im Gang arbeiten muss, braucht einen Auftrag und geht erst rein, wenn kein Stapler im Gang ist.", "<b>Narrow aisles:</b> pedestrians are kept out by construction or technology. Anyone who must work in the aisle needs an order and only enters when no truck is in the aisle.", "<b>Wąskie alejki:</b> pieszych trzyma się z dala dzięki konstrukcji lub zabezpieczeniom technicznym. Kto musi pracować w alejce, potrzebuje polecenia i wchodzi dopiero, gdy nie ma w niej wózka.", "<b>Вузькі проходи:</b> пішоходів не допускають завдяки конструкції чи технічним засобам. Хто має там працювати, потребує доручення й заходить, лише коли в проході немає навантажувача.")),
                pt(t("<b>Ein Gerät pro Gang,</b> außer automatische Einrichtungen verhindern einen Zusammenstoß.", "<b>One truck per aisle,</b> unless automatic devices prevent a collision.", "<b>Jeden wózek na alejkę,</b> chyba że urządzenia automatyczne zapobiegają zderzeniu.", "<b>Одна машина на прохід,</b> хіба що автоматичні пристрої запобігають зіткненню.")),
                pt(t("<b>Fluchtwege sind keine Abkürzung:</b> Quergänge, die nur Fluchtweg sind, werden nicht als Verkehrsweg benutzt.", "<b>Escape routes are not shortcuts:</b> cross aisles that are only escape routes are not used as traffic routes.", "<b>Drogi ewakuacyjne to nie skrót:</b> przejść poprzecznych przeznaczonych tylko do ewakuacji nie używa się jako dróg komunikacyjnych.", "<b>Шляхи евакуації — не скорочення:</b> поперечні проходи, що є лише шляхом евакуації, не використовують для руху.")),
            ],
            src: { de: `${V68} §14, §28, §29 Abs. 3, §31, §33` },
        }),
        step("sort", {
            title: t("Richtig oder falsch?", "Right or wrong?", "Dobrze czy źle?", "Правильно чи ні?"),
            lead: t("Ordne jede Situation zu.", "Assign each situation.", "Przyporządkuj każdą sytuację.", "Віднеси кожну ситуацію."),
            labels: [t("Richtig", "Right", "Dobrze", "Правильно"), t("Falsch", "Wrong", "Źle", "Неправильно")],
            items: [
                { t: t("In den Lastenaufzug fahren, während noch ein Kollege drinsteht", "Driving into the goods lift while a colleague is still inside", "Wjechać do windy towarowej, gdy w środku stoi jeszcze kolega", "Заїхати у вантажний ліфт, коли там ще стоїть колега"), a: 1, why: t("Beim Ein- und Ausfahren darf niemand im Fahrkorb sein.", "Nobody may be in the car when driving in or out.", "Przy wjeździe i wyjeździe nikt nie może być w kabinie.", "Під час заїзду й виїзду в кабіні нікого не має бути.") },
                { t: t("Den Fluchtweg-Quergang als Abkürzung zur Rampe nehmen", "Using the escape-route cross aisle as a shortcut to the dock", "Pojechać przejściem ewakuacyjnym na skróty do rampy", "Поїхати евакуаційним поперечним проходом навпростець до рампи"), a: 1, why: t("Quergänge, die nur Fluchtweg sind, sind kein Verkehrsweg.", "Cross aisles that are only escape routes are not traffic routes.", "Przejścia wyłącznie ewakuacyjne nie są drogą komunikacyjną.", "Проходи, що є лише шляхом евакуації, — не транспортні шляхи.") },
                { t: t("Mit Last die Rampe vorwärts hinunterfahren", "Driving forwards down the ramp with a load", "Zjeżdżać z ładunkiem z rampy przodem", "З’їжджати з вантажем по рампі передом"), a: 1, why: t("Die Last wird bergseitig geführt: Bergab mit Last fährst du rückwärts.", "The load is carried on the uphill side: downhill with a load, you drive backwards.", "Ładunek od strony wzniesienia: w dół z ładunkiem jedziesz tyłem.", "Вантаж із боку підйому: вниз із вантажем їдеш заднім ходом.") },
                { t: t("Vor der Durchfahrt prüfen, ob Mast und Last unter das Tor passen", "Checking before the passage whether mast and load fit under the gate", "Przed przejazdem sprawdzić, czy maszt i ładunek zmieszczą się pod bramą", "Перед проїздом перевірити, чи щогла й вантаж пройдуть під воротами"), a: 0, why: t("Die Durchfahrtshöhe ist gekennzeichnet. Du vergleichst sie mit der Bauhöhe deines Staplers und der Last.", "The clearance height is marked. You compare it with the height of your forklift and load.", "Wysokość przejazdu jest oznaczona. Porównujesz ją z wysokością konstrukcyjną wózka i ładunku.", "Висота проїзду позначена. Ти порівнюєш її з будівельною висотою навантажувача й вантажу.") },
            ],
            allRight: t("Sicher. Auch die Engstellen hast du im Griff.", "Confident. You have the tight spots under control too.", "Pewnie. Trudne miejsca też masz opanowane.", "Упевнено. Складні місця теж під контролем."),
            someWrong: t("Schau dir die Erklärungen noch einmal an.", "Take another look at the explanations.", "Przejrzyj jeszcze raz wyjaśnienia.", "Переглянь ще раз пояснення."),
        }),
        step("question", {
            title: t("Jemand im Schmalgang", "Someone in the narrow aisle", "Ktoś w wąskiej alejce", "Хтось у вузькому проході"),
            text: t("Du willst mit dem Schmalgangstapler in Gang 7. Dort zählt ein Kollege gerade Ware.", "You want to drive into aisle 7 with the narrow-aisle truck. A colleague is counting goods there.", "Chcesz wjechać wózkiem systemowym w alejkę 7. Kolega właśnie liczy tam towar.", "Ти хочеш заїхати у прохід 7 вузькопрохідним навантажувачем. Там колега рахує товар."),
            layout: "list",
            options: [t("Langsam einfahren und hupen", "Drive in slowly and sound the horn", "Wjechać powoli i zatrąbić", "Заїхати повільно й посигналити"), t("Warten, bis er den Gang verlassen hat", "Wait until the colleague has left the aisle", "Poczekać, aż opuści alejkę", "Чекати, доки він вийде з проходу")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, im Schmalgang ist kein Platz zum Ausweichen", "No, there is no room to get out of the way in the narrow aisle", "Nie, w wąskiej alejce nie ma miejsca, żeby zejść z drogi", "Ні, у вузькому проході немає місця, щоб відійти вбік") },
            body: t("Fußgänger und Schmalgangstapler sind nur dann gleichzeitig im Gang, wenn das ausdrücklich vorgesehen und technisch abgesichert ist. Sonst wartest du.", "Pedestrians and narrow-aisle trucks are only in the aisle at the same time if this is expressly intended and technically safeguarded. Otherwise you wait.", "Piesi i wózki systemowe są w alejce jednocześnie tylko wtedy, gdy jest to wyraźnie przewidziane i technicznie zabezpieczone. W przeciwnym razie czekasz.", "Пішоходи й вузькопрохідні навантажувачі можуть бути в проході одночасно лише тоді, коли це прямо передбачено й технічно захищено. Інакше ти чекаєш."),
            src: { de: `${V68} §28, §33 Abs. 3` },
        }),
        step("video", {
            title: t("Durch Tor und Aufzug", "Through gate and lift", "Przez bramę i windę", "Через ворота й ліфт"),
            brief: t("Stapler hält vor einem Rolltor, hupt, prüft die Durchfahrtshöhe am Schild, fährt langsam durch. Danach Lastenaufzug: Fahrkorb leer, Stapler fährt ein, Last nicht am Schacht. Kamera seitlich und aus Fahrersicht.", "Forklift stops at a roller door, sounds the horn, checks the clearance sign, drives through slowly. Then goods lift: car empty, forklift drives in, load clear of the shaft. Camera from the side and driver’s view.", "Wózek staje przed bramą rolowaną, trąbi, sprawdza na tablicy dopuszczalną wysokość przejazdu i powoli przejeżdża. Potem winda towarowa: kabina pusta, wózek wjeżdża, ładunek nie opiera się o szyb. Kamera z boku i z perspektywy operatora.", "Навантажувач зупиняється перед рулонними воротами, сигналить, перевіряє на табличці допустиму висоту проїзду й повільно проїжджає. Потім вантажний ліфт: кабіна порожня, навантажувач заїжджає, вантаж не впирається в шахту. Камера збоку й з місця водія."),
            length: t("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Tore und Rampen:</b> langsam, Warnsignal, Höhe prüfen, Last bergseitig.", "<b>Gates and ramps:</b> slowly, warning signal, check the clearance height, load on the uphill side.", "<b>Bramy i rampy:</b> powoli, sygnał ostrzegawczy, sprawdź wysokość przejazdu, ładunek od strony wzniesienia.", "<b>Ворота й рампи:</b> повільно, попереджувальний сигнал, перевір висоту проїзду, вантаж з боку підйому.")),
            pt(t("<b>Aufzug:</b> freigegeben, Fahrkorb leer, nichts stößt an.", "<b>Lift:</b> approved for forklifts, car empty, nothing catches.", "<b>Winda:</b> dopuszczona dla wózków, kabina pusta, nic nie zahacza.", "<b>Ліфт:</b> дозволений для навантажувачів, кабіна порожня, нічого не зачіпає.")),
            pt(t("<b>Schmalgang:</b> nur ohne Fußgänger, ein Gerät pro Gang, Fluchtwege frei.", "<b>Narrow aisle:</b> only without pedestrians, one truck per aisle, escape routes clear.", "<b>Wąska alejka:</b> tylko bez pieszych, jeden wózek w alejce, drogi ewakuacyjne wolne.", "<b>Вузький прохід:</b> лише без пішоходів, один навантажувач у проході, шляхи евакуації вільні.")),
        ] }),
    ];
}

/* ════════════════ Modul-Check ════════════════ */
export function lesson9Check(step: Mk): Step[] {
    return [
        step("choice", {
            title: t("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"),
            items: [
                { q: t("Welche Wege darfst du mit dem Stapler befahren?", "Which routes may you use with the forklift?", "Po jakich drogach możesz jeździć wózkiem?", "Якими шляхами можна їздити навантажувачем?"),
                    options: [t("Nur die vom Unternehmer freigegebenen", "Only those approved by the employer", "Tylko dopuszczone przez pracodawcę", "Лише дозволені роботодавцем"), t("Alle, die breit genug sind", "All that are wide enough", "Wszystkie wystarczająco szerokie", "Усі достатньо широкі")], correct: 0,
                    why: t("DGUV Information 208-004, Abschnitt 6.2.1.", "DGUV Information 208-004, section 6.2.1.", "DGUV Information 208-004, rozdz. 6.2.1.", "DGUV Information 208-004, розд. 6.2.1.") },
                { q: t("Keine Schilder an der Kreuzung. Wer hat Vorfahrt?", "No signs at the crossing. Who has right of way?", "Na skrzyżowaniu nie ma znaków. Kto ma pierwszeństwo?", "На перехресті немає знаків. Хто має переважне право проїзду?"),
                    options: [t("Wer von rechts kommt", "Whoever comes from the right", "Ten, kto nadjeżdża z prawej", "Хто їде справа"), t("Wer die schwerere Last hat", "Whoever has the heavier load", "Ten, kto ma cięższy ładunek", "У кого важчий вантаж")], correct: 0,
                    why: t("DGUV Information 208-004, Abschnitte 6.2 und 6.4.1.", "DGUV Information 208-004, sections 6.2 and 6.4.1.", "DGUV Information 208-004, rozdz. 6.2 i 6.4.1.", "DGUV Information 208-004, розд. 6.2 і 6.4.1.") },
                { q: t("Wie viel Sicherheitsabstand brauchst du seitlich auf dem Verkehrsweg?", "How much lateral safety distance do you need on the traffic route?", "Jaki boczny odstęp bezpieczeństwa potrzebujesz na drodze komunikacyjnej?", "Яка бічна безпечна відстань потрібна на транспортному шляху?"),
                    options: [t("Mindestens 0,5 m auf jeder Seite", "At least 0.5 m on each side", "Co najmniej 0,5 m z każdej strony", "Щонайменше 0,5 м з кожного боку"), t("10 cm reichen, wenn du langsam fährst", "10 cm is enough if you drive slowly", "10 cm wystarczy, jeśli jedziesz powoli", "10 см досить, якщо їдеш повільно")], correct: 0,
                    why: t("DGUV Information 208-004, Abschnitt 6.2.1.", "DGUV Information 208-004, section 6.2.1.", "DGUV Information 208-004, rozdz. 6.2.1.", "DGUV Information 208-004, розд. 6.2.1.") },
                { q: t("Wie fährst du auf einen dunklen Hof?", "How do you drive into a dark yard?", "Jak wjeżdżasz na nieoświetlony plac?", "Як ти заїжджаєш на неосвітлений двір?"),
                    options: [t("Mit eingeschalteter Beleuchtung", "With the lights switched on", "Z włączonymi światłami", "З увімкненим світлом"), t("Ohne Licht, aber langsam", "Without lights but slowly", "Bez świateł, ale powoli", "Без світла, але повільно")], correct: 0,
                    why: t("DGUV Vorschrift 68 §12 Abs. 8.", "DGUV Regulation 68 §12 para. 8.", "DGUV Vorschrift 68 §12 ust. 8.", "DGUV Vorschrift 68 §12 абз. 8.") },
                { q: t("Was gilt beim Einfahren in einen Lastenaufzug?", "What applies when driving into a goods lift?", "Co obowiązuje przy wjeździe do windy towarowej?", "Що діє під час заїзду у вантажний ліфт?"),
                    options: [t("Niemand darf im Fahrkorb sein", "Nobody may be in the lift car", "Nikt nie może przebywać w kabinie windy", "У кабіні ліфта нікого не має бути"), t("Ein Kollege hält die Tür von innen", "A colleague holds the door from inside", "Kolega trzyma drzwi od środka", "Колега тримає двері зсередини")], correct: 0,
                    why: t("DGUV Vorschrift 68 §14 Abs. 4.", "DGUV Regulation 68 §14 para. 4.", "DGUV Vorschrift 68 §14 ust. 4.", "DGUV Vorschrift 68 §14 абз. 4.") },
                { q: t("Wann darf ein Kollege einen Schmalgang zum Kommissionieren betreten?", "When may a colleague enter a narrow aisle to pick goods?", "Kiedy kolega może wejść do wąskiej alejki, żeby kompletować towar?", "Коли колега може зайти у вузький прохід, щоб комплектувати товар?"),
                    options: [t("Mit Auftrag und wenn kein Stapler im Gang ist", "With authorisation and when no truck is in the aisle", "Gdy ma upoważnienie i w alejce nie ma wózka", "Якщо має доручення і в проході немає навантажувача"), t("Jederzeit, wenn er eine Warnweste trägt", "Any time if wearing a high-visibility vest", "W każdej chwili, jeśli ma na sobie kamizelkę ostrzegawczą", "Будь-коли, якщо він у сигнальному жилеті")], correct: 0,
                    why: t("DGUV Vorschrift 68 §33.", "DGUV Regulation 68 §33.", "DGUV Vorschrift 68 §33.", "DGUV Vorschrift 68 §33.") },
            ],
            allRight: t("Alles richtig. Du bewegst dich sicher im Betriebsverkehr.", "All correct. You move safely in in-plant traffic.", "Wszystko dobrze. Bezpiecznie poruszasz się w ruchu na terenie zakładu.", "Усе правильно. Ти безпечно поводишся в русі на території підприємства."),
            someWrong: t("Schau dir die markierten Fragen noch einmal an.", "Take another look at the marked questions.", "Przejrzyj jeszcze raz zaznaczone pytania.", "Переглянь ще раз позначені питання."),
        }),
        step("summary", { title: t("Modul geschafft", "Module complete", "Moduł zaliczony", "Модуль пройдено"), points: [
            pt(t("<b>Regeln:</b> freigegebene Wege, rechts vor links, Fußgänger und Schienen zuerst, angepasstes Tempo.", "<b>Rules:</b> approved routes, priority to the right, pedestrians and rail vehicles first, speed adapted to the conditions.", "<b>Zasady:</b> dopuszczone drogi, pierwszeństwo dla nadjeżdżających z prawej, najpierw piesi i pojazdy szynowe, prędkość dostosowana do warunków.", "<b>Правила:</b> дозволені шляхи, перевага тому, хто праворуч, спершу пішоходи й рейковий транспорт, швидкість відповідно до умов.")),
            pt(t("<b>Wege:</b> breit genug, frei, in gutem Zustand.", "<b>Routes:</b> wide enough, clear, in good condition.", "<b>Drogi:</b> wystarczająco szerokie, wolne, w dobrym stanie.", "<b>Шляхи:</b> достатньо широкі, вільні, у доброму стані.")),
            pt(t("<b>Engstellen:</b> Tore, Rampen, Aufzüge, Gleise und Schmalgänge mit Vorsicht.", "<b>Tight spots:</b> pass gates, ramps, lifts, tracks and narrow aisles with care.", "<b>Trudne miejsca:</b> bramy, rampy, windy, tory i wąskie alejki pokonuj ostrożnie.", "<b>Складні місця:</b> ворота, рампи, ліфти, колії й вузькі проходи проїжджай обережно.")),
        ] }),
    ];
}
