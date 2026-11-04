/**
 * Uzupełnienie kursu o tematy z pytań klienta i wyrównanie czasu do DGUV G 308-001 (2022), tab. 1 (min. 10 LE teorii).
 * Nowe lekcje: Unfallgeschehen 3, 4.4, 5.4, 5.5, 7.4, 8.4. Pytania mają od razu cztery odpowiedzi.
 * Źródła:
 *  - DGUV Vorschrift 68 §1, §7, §12; DGUV Vorschrift 1 §7, §15, §16, §30; SGB VII §15, §209; ArbSchG §4
 *  - DGUV Information 208-004 „Gabelstapler”, Abschn. 4, 6.2, 6.4 (Leergewicht ≈ 2× Nenntragfähigkeit, 90 % na oś przednią)
 *  - DGUV Information 208-061 „Lagereinrichtungen und Ladungsträger”, Abschn. 5.4 (2 %, 6:1, 4× paleta dolna)
 *  - DGUV Information 250-001 (epilepsja), DGUV Empfehlungen für arbeitsmedizinische Beratungen und Untersuchungen (dawniej G 25)
 *  - DGUV G 308-001 Entwurf 2026: Übungen „in Fahrtrichtung blicken”, Modul MFFZ 3.2.9 (Notausschalter/Batteriestecker)
 *  - DIN EN ISO 3691-1 (Mitgänger: Deichsel-Endstellung bremst, Auffahrschutz)
 *  - BG BAU Baustein C 441 / DIN VDE 0105-100 (Schutzabstände zu Freileitungen), Merkblätter der Netzbetreiber
 *  - DGUV Statistik „Arbeitsunfallgeschehen 2024”, Tab. 58 und 59
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
const num = (c: string) => ({ id: c, text: { de: c, en: c.replace(",", "."), pl: c, uk: c } });

const RIGHT_T = t("Richtig", "Correct", "Dobrze", "Правильно");
const SUM = t("Das nimmst du mit", "Key takeaways", "Najważniejsze", "Головне");
const ALL_OK = t("Alles richtig.", "All correct.", "Wszystko dobrze.", "Усе правильно.");
const LOOK = t("Schau dir die Erklärungen an.", "Look at the explanations.", "Przejrzyj wyjaśnienia.", "Переглянь пояснення.");
const QUIZ = t("Kurz geprüft", "Quick check", "Szybki sprawdzian", "Швидка перевірка");
const V68 = "DGUV Vorschrift 68";
const V1 = "DGUV Vorschrift 1";
const I208 = "DGUV Information 208-004";
const I061 = "DGUV Information 208-061";
const G308E = "DGUV G 308-001 (Entwurf 2026)";
const STAT24 = "DGUV, Arbeitsunfallgeschehen 2024";

/* ════════════════ Unfallgeschehen 3: Warum Unfälle passieren ════════════════ */
export function lessonU3(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Selten nur eine Ursache", "Rarely just one cause", "Rzadko jedna przyczyna", "Рідко одна причина"),
            lead: t("Hinter fast jedem Unfall stecken mehrere Dinge, die zusammenkommen.", "Behind almost every accident, several things come together.", "Za prawie każdym wypadkiem stoi kilka rzeczy naraz.", "За майже кожним нещасним випадком стоїть кілька чинників одночасно."),
            points: [
                pt(t("<b>Technik:</b> ein Mangel am Stapler, etwa schwache Bremsen, eine defekte Hupe oder abgefahrene Reifen.", "<b>Technology:</b> a defect on the forklift, such as weak brakes, a broken horn or worn tyres.", "<b>Technika:</b> usterka wózka, np. słabe hamulce, niedziałający klakson albo zużyte opony.", "<b>Техніка:</b> несправність навантажувача, наприклад слабкі гальма, непрацюючий сигнал або зношені шини.")),
                pt(t("<b>Organisation:</b> Fuß- und Fahrwege nicht getrennt, Zeitdruck, fehlende Unterweisung, keine freigegebenen Fahrwege.", "<b>Organisation:</b> pedestrian and vehicle routes not separated, time pressure, missing briefing, no approved routes.", "<b>Organizacja:</b> drogi dla pieszych i wózków nierozdzielone, presja czasu, brak instruktażu, brak wyznaczonych tras jazdy.", "<b>Організація:</b> шляхи для пішоходів і техніки не розділені, поспіх, немає інструктажу, немає дозволених маршрутів.")),
                pt(t("<b>Mensch:</b> zu schnell, abgelenkt, nicht umgeschaut, Last zu hoch, Regeln bewusst umgangen.", "<b>People:</b> too fast, distracted, not looking around, load too high, rules deliberately bypassed.", "<b>Człowiek:</b> za szybka jazda, nieuwaga, brak rozejrzenia się, ładunek podniesiony za wysoko, świadome łamanie zasad.", "<b>Людина:</b> зашвидка їзда, неуважність, не озирнувся, вантаж піднято зависоко, свідоме порушення правил.")),
                pt(t("<b>Was die Statistik sagt:</b> Bei tödlichen Stapler-Unfällen stehen der Verlust der Kontrolle über das Gerät und das Erfasstwerden durch einen Gegenstand im Vordergrund.", "<b>What the statistics say:</b> in fatal forklift accidents, losing control of the truck and being struck by an object come first.", "<b>Co mówi statystyka:</b> w śmiertelnych wypadkach z wózkami najczęściej operator traci panowanie nad wózkiem albo człowieka uderza lub pochwyca przedmiot.", "<b>Що каже статистика:</b> у смертельних нещасних випадках з навантажувачами найчастіше водій втрачає контроль над машиною або людину вдаряє чи захоплює предмет.")),
            ],
            merke: t("Fällt ein Baustein weg, passiert der Unfall oft gar nicht. Dein Verhalten ist der Baustein, den du selbst in der Hand hast.", "Remove one building block and the accident often does not happen. Your behaviour is the block you control.", "Gdy zabraknie jednego elementu, do wypadku często nie dochodzi. Twoje zachowanie to element, który masz w ręku.", "Прибери одну ланку — і випадку часто не буде. Твоя поведінка — ланка, яка у твоїх руках."),
            src: { de: `${STAT24}, Abschn. 7; ArbSchG §4` },
        }),
        step("sort", {
            title: t("Woran lag es?", "What caused it?", "Co było przyczyną?", "Що стало причиною?"),
            lead: t("Ordne jede Ursache zu.", "Assign each cause.", "Przypisz każdą przyczynę.", "Віднеси кожну причину."),
            labels: [t("Technik", "Technology", "Technika", "Техніка"), t("Organisation", "Organisation", "Organizacja", "Організація"), t("Mensch", "People", "Człowiek", "Людина")],
            items: [
                { t: t("Die Hupe funktioniert seit Tagen nicht", "The horn has not worked for days", "Klakson nie działa od kilku dni", "Сигнал не працює вже кілька днів"), a: 0, why: t("Ein technischer Mangel. Er gehört gemeldet und der Stapler stillgelegt.", "A technical defect. It must be reported and the forklift taken out of service.", "Usterka techniczna. Trzeba ją zgłosić i wyłączyć wózek z użytku.", "Технічна несправність. Її треба повідомити й вивести машину з роботи.") },
                { t: t("Fußgänger und Stapler nutzen denselben Gang ohne Markierung", "Pedestrians and forklifts share the same aisle without markings", "Piesi i wózki korzystają z tego samego przejścia bez oznakowania", "Пішоходи й навантажувачі користуються одним проходом без розмітки"), a: 1, why: t("Verkehrswege regelt der Unternehmer.", "The employer organises traffic routes.", "Drogi komunikacyjne wyznacza pracodawca.", "Шляхи руху організовує роботодавець.") },
                { t: t("Rückwärts gefahren, ohne sich umzuschauen", "Reversed without looking around", "Jazda tyłem bez rozejrzenia się", "Їхав назад, не озирнувшись"), a: 2, why: t("Verhalten des Fahrers.", "The driver’s behaviour.", "Zachowanie operatora.", "Поведінка водія.") },
                { t: t("Neuer Fahrer ohne Unterweisung zum Anbaugerät", "New driver without a briefing on the attachment", "Nowy operator bez instruktażu do osprzętu", "Новий водій без інструктажу щодо навісного обладнання"), a: 1, why: t("Unterweisen muss der Unternehmer.", "Briefing is the employer’s duty.", "Instruktaż musi zapewnić pracodawca.", "Інструктаж має забезпечити роботодавець.") },
                { t: t("Kurve mit angehobener Last gefahren", "Cornering with a raised load", "Zakręt z podniesionym ładunkiem", "Поворот із піднятим вантажем"), a: 2, why: t("Verhalten des Fahrers.", "The driver’s behaviour.", "Zachowanie operatora.", "Поведінка водія.") },
                { t: t("Riss in der Gabelzinke übersehen", "Crack in the fork arm overlooked", "Przeoczone pęknięcie widły", "Тріщину на вилі не помітили"), a: 0, why: t("Technischer Mangel, den die Einsatzprüfung hätte finden können.", "A technical defect the daily check could have found.", "Usterka techniczna, którą wykryłaby kontrola przed pracą.", "Технічна несправність, яку виявила б щоденна перевірка.") },
            ],
            allRight: t("Genau. Und oft spielen alle drei zusammen.", "Exactly. And often all three come together.", "Dokładnie. A często wszystkie trzy działają razem.", "Саме так. І часто всі три діють разом."),
            someWrong: t("Technik ist das Gerät, Organisation der Betrieb, Mensch das Verhalten.", "Technology is the truck, organisation is the company, people means behaviour.", "Technika to sprzęt, organizacja to zakład, człowiek to zachowanie.", "Техніка — машина, організація — підприємство, людина — поведінка."),
        }),
        step("learn", {
            title: t("Was du selbst beeinflusst", "What you control yourself", "Na co sam masz wpływ", "На що ти впливаєш сам"),
            lead: t("Auch wenn der Betrieb Fehler macht: Du kannst die Kette fast immer unterbrechen.", "Even if the company makes mistakes, you can almost always break the chain.", "Nawet gdy zakład popełnia błędy, prawie zawsze możesz przerwać łańcuch.", "Навіть якщо підприємство помиляється, ти майже завжди можеш розірвати ланцюг."),
            points: [
                pt(t("<b>Mängel melden</b> statt damit weiterfahren.", "<b>Report defects</b> instead of driving on.", "<b>Zgłaszaj usterki</b>i nie jeździj dalej z usterką.", "<b>Повідомляй про несправності</b>і не їдь далі з несправністю.")),
                pt(t("<b>Tempo anpassen</b> an Sicht, Boden und Last.", "<b>Adjust speed</b> to visibility, floor and load.", "<b>Dostosuj prędkość</b> do widoczności, podłoża i ładunku.", "<b>Пристосовуй швидкість</b> до видимості, стану підлоги й вантажу.")),
                pt(t("<b>Umschauen</b> vor jedem Rückwärtsfahren und an unübersichtlichen Stellen.", "<b>Look around</b> every time before reversing and at blind spots.", "<b>Rozglądaj się</b> przed każdą jazdą tyłem i w miejscach bez widoczności.", "<b>Озирайся</b> перед кожним рухом заднім ходом і в місцях без огляду.")),
                pt(t("<b>Nein sagen</b>bei jeder Anweisung, die erkennbar gegen die Sicherheit geht.", "<b>Say no</b> to any instruction that clearly goes against safety.", "<b>Odmów</b>wykonania polecenia, które wyraźnie zagraża bezpieczeństwu.", "<b>Відмовся</b>виконувати вказівку, яка явно суперечить безпеці.")),
            ],
            merke: t("Sicher fahren ist keine Frage von Glück, sondern von Gewohnheiten.", "Driving safely is not a matter of luck but of habits.", "Bezpieczna jazda to nie szczęście, tylko nawyki.", "Безпечна їзда — це не везіння, а звички."),
            src: { de: `${V1} §15, §16` },
        }),
        step("question", {
            title: t("Die Kette unterbrechen", "Breaking the chain", "Przerwać łańcuch", "Розірвати ланцюг"),
            text: t("Schichtbeginn. Die Hupe geht nicht, im Gang zur Rampe arbeiten heute viele Leiharbeiter, und dein Chef will die Lkw schnell leer haben.", "Start of shift. The horn does not work, many temporary workers are in the aisle to the ramp today, and your boss wants the lorries unloaded fast.", "Początek zmiany. Klakson nie działa, w przejściu do rampy pracuje dziś wielu pracowników tymczasowych, a szef chce szybko rozładować ciężarówki.", "Початок зміни. Сигнал не працює, у проході до рампи сьогодні багато тимчасових працівників, а начальник хоче швидко розвантажити вантажівки."),
            layout: "list",
            options: [
                t("Mangel melden und erst mit funktionierender Hupe fahren", "Report the defect and drive only once the horn works", "Zgłosić usterkę i jeździć dopiero z działającym klaksonem", "Повідомити про несправність і їздити лише зі справним сигналом"),
                t("Langsamer fahren und laut rufen statt hupen", "Drive slower and shout instead of using the horn", "Jechać wolniej i wołać zamiast trąbić", "Їхати повільніше й кричати замість сигналу"),
                t("Fahren, aber den Mangel am Schichtende melden", "Drive, but report the defect at the end of the shift", "Jeździć, a usterkę zgłosić na koniec zmiany", "Їздити, а про несправність повідомити наприкінці зміни"),
                t("Einen Kollegen als Warnposten vorausgehen lassen", "Have a colleague walk ahead as a lookout", "Kazać koledze iść przodem i ostrzegać innych", "Попросити колегу йти попереду й попереджати інших"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das Risiko bleibt", "No, the risk remains", "Nie, ryzyko zostaje", "Ні, ризик лишається") },
            body: t("Die Warneinrichtung ist ein sicherheitsrelevantes Teil. Mit dem Mangel darfst du den Stapler nicht weiter einsetzen. Zusammen mit den vielen Fußgängern wäre das genau die Kette, die zum Unfall führt.", "The warning device is safety-relevant. With this defect you must not keep using the forklift. The defect together with many pedestrians is exactly the chain of events that leads to an accident.", "Urządzenie ostrzegawcze jest istotne dla bezpieczeństwa. Z niedziałającym klaksonem nie wolno dalej używać wózka. Ta usterka razem z wieloma pieszymi tworzy dokładnie taki łańcuch zdarzeń, który prowadzi do wypadku.", "Попереджувальний пристрій важливий для безпеки. З такою несправністю не можна далі працювати на навантажувачі. Несправність разом із великою кількістю пішоходів — це саме той ланцюг подій, що веде до нещасного випадку."),
            src: { de: `${V68} §9; ${V1} §16` },
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Technik, Organisation, Mensch:</b> Unfälle entstehen, wenn mehrere Ursachen zusammenkommen.", "<b>Technology, organisation, people:</b> accidents happen when several causes come together.", "<b>Technika, organizacja, człowiek:</b> do wypadku dochodzi, gdy zbiegnie się kilka przyczyn.", "<b>Техніка, організація, людина:</b> нещасні випадки стаються, коли збігаються кілька причин.")),
            pt(t("<b>Dein Teil:</b> Mängel melden, Tempo anpassen, umschauen, Nein sagen zu unsicheren Anweisungen.", "<b>Your part:</b> report defects, adjust speed, look around, say no to unsafe instructions.", "<b>Twoja rola:</b> zgłaszaj usterki, dostosuj prędkość, rozglądaj się, odmawiaj niebezpiecznych poleceń.", "<b>Твоя роль:</b> повідомляй про несправності, пристосовуй швидкість, озирайся, відмовляйся від небезпечних вказівок.")),
        ] }),
    ];
}

/* ════════════════ 4.4 Bremsen, Anhalteweg und Gewicht ════════════════ */
export function lesson44(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Der Anhalteweg", "Stopping distance", "Droga zatrzymania", "Шлях зупинки"),
            lead: t("Bis der Stapler steht, fährt er weiter, als die meisten denken.", "The forklift travels further before it stops than most people think.", "Zanim wózek stanie, przejedzie dalej, niż większość myśli.", "Поки навантажувач зупиниться, він проїде більше, ніж здається."),
            points: [
                pt(t("<b>Anhalteweg = Reaktionsweg + Bremsweg.</b> Jedes Fahrzeug hat einen, auch ein Mitgänger-Gerät.", "<b>Stopping distance = reaction distance + braking distance.</b> Every vehicle has one, including pedestrian-controlled trucks.", "<b>Droga zatrzymania = droga reakcji + droga hamowania.</b> Ma ją każdy pojazd, także wózek prowadzony.", "<b>Шлях зупинки = шлях реакції + гальмівний шлях.</b> Він є в кожної машини, і в електровізка із супроводом пішки теж.")),
                pt(t("<b>Reaktionsweg:</b> Die Strecke, die du fährst, bis dein Fuß auf der Bremse ist. Bei rund 1 Sekunde Reaktionszeit sind das bei 10 km/h schon knapp 3 m.", "<b>Reaction distance:</b> the distance you travel until your foot is on the brake. With about 1 second reaction time that is almost 3 m at 10 km/h.", "<b>Droga reakcji:</b> odcinek, który przejedziesz, zanim noga trafi na hamulec. Przy ok. 1 sekundzie reakcji to przy 10 km/h prawie 3 m.", "<b>Шлях реакції:</b> відстань, яку проїдеш, поки нога дійде до гальма. За реакції близько 1 секунди при 10 км/год це майже 3 м.")),
                pt(t("<b>Bremsweg:</b> die Strecke ab dem Bremsen bis zum Stillstand. Er wächst mit dem Quadrat der Geschwindigkeit: doppelt so schnell heißt etwa viermal so lang.", "<b>Braking distance:</b> from the moment you brake until standstill. It grows with the square of speed: twice as fast means about four times as long.", "<b>Droga hamowania:</b> od rozpoczęcia hamowania do zatrzymania. Rośnie z kwadratem prędkości: dwa razy szybciej to ok. cztery razy dłużej.", "<b>Гальмівний шлях:</b> від початку гальмування до зупинки. Росте з квадратом швидкості: удвічі швидше — приблизно вчетверо довше.")),
                pt(t("<b>Die Fahrbahn zählt:</b> Nässe, Öl, Staub, Laub oder Eis verringern die Reibung. Weniger Reibung bedeutet einen längeren Bremsweg.", "<b>The surface matters:</b> wetness, oil, dust, leaves or ice reduce friction. Less friction means a longer braking distance.", "<b>Nawierzchnia ma znaczenie:</b> wilgoć, olej, pył, liście czy lód zmniejszają tarcie. Mniejsze tarcie to dłuższa droga hamowania.", "<b>Покриття має значення:</b> волога, олива, пил, листя чи лід зменшують зчеплення. Менше зчеплення — довший гальмівний шлях.")),
            ],
            merke: t("Wer schneller fährt, verlängert beide Teile: Reaktionsweg linear, Bremsweg im Quadrat.", "Driving faster lengthens both parts: reaction distance linearly, braking distance by the square.", "Szybsza jazda wydłuża obie części: drogę reakcji liniowo, drogę hamowania w kwadracie.", "Більша швидкість подовжує обидві частини: шлях реакції лінійно, гальмівний — у квадраті."),
            src: { de: "DGUV G 308-001, Anhang 1 Nr. 5 und 6 (Anfahren, Bremsen, Folgen bei abruptem Bremsen)" },
            layout: "rows",
            chart: {
                note: t("Vereinfachtes Modell: Reaktionsweg = Tempo × Reaktionszeit, Bremsweg mit einer Bremsverzögerung von 1,5 m/s² auf trockenem Boden. Auf nassem oder öligem Boden ist der Bremsweg länger.", "Simplified model: reaction distance = speed × reaction time, braking distance with a braking deceleration of 1.5 m/s² on a dry floor. On a wet or oily floor the braking distance is longer.", "Model uproszczony: droga reakcji = prędkość × czas reakcji, droga hamowania przy opóźnieniu 1,5 m/s² na suchej posadzce. Na mokrej lub zaolejonej posadzce droga hamowania jest dłuższa.", "Спрощена модель: шлях реакції = швидкість × час реакції, гальмівний шлях при сповільненні 1,5 м/с² на сухій підлозі. На мокрій або замасленій підлозі гальмівний шлях довший."),
            },
            facts: [
                { v: t("≈ 3 m", "≈ 3 m", "≈ 3 m", "≈ 3 м"), k: t("Reaktionsweg bei 10 km/h und 1 Sekunde Reaktionszeit", "Reaction distance at 10 km/h and a reaction time of 1 second", "Droga reakcji przy 10 km/h i czasie reakcji 1 sekundy", "Шлях реакції при 10 км/год і часі реакції 1 секунда") },
                { v: t("× 4", "× 4", "× 4", "× 4"), k: t("so lang wird der Bremsweg bei doppeltem Tempo", "is how much longer the braking distance becomes at twice the speed", "tyle razy wydłuża się droga hamowania przy dwukrotnie większej prędkości", "у стільки разів довшає гальмівний шлях при подвійній швидкості") },
            ],
        }),
        step("gap", {
            title: t("Setz den Anhalteweg zusammen", "Build the stopping distance", "Złóż drogę zatrzymania", "Склади шлях зупинки"),
            sentence: t("Der Anhalteweg besteht aus dem {1} und dem {2}. Fährst du doppelt so schnell, wird der Bremsweg etwa {3} so lang.",
                "Stopping distance consists of the {1} and the {2}. If you drive twice as fast, the braking distance becomes about {3} as long.",
                "Droga zatrzymania składa się z {1} i {2}. Jeśli jedziesz dwa razy szybciej, droga hamowania jest ok. {3} dłuższa.",
                "Шлях зупинки складається з {1} і {2}. Якщо їдеш удвічі швидше, гальмівний шлях стає приблизно {3} довшим."),
            chips: [
                { id: "r", text: t("Reaktionsweg", "reaction distance", "drogi reakcji", "шляху реакції") },
                { id: "b", text: t("Bremsweg", "braking distance", "drogi hamowania", "гальмівного шляху") },
                { id: "4", text: t("viermal", "four times", "cztery razy", "учетверо") },
                { id: "2", text: t("doppelt", "twice", "dwa razy", "удвічі") },
                { id: "l", text: t("Lastweg", "load distance", "drogi ładunku", "шляху вантажу") },
                { id: "1", text: t("genauso", "just", "tak samo", "так само") },
            ],
            answer: ["r", "b", "4"],
            interchangeable: [[0, 1]],
            success: { title: t("Genau", "Exactly", "Dokładnie", "Саме так"), body: t("Darum bringt schon wenig mehr Tempo deutlich mehr Anhalteweg.", "That is why even a little more speed adds a lot of stopping distance.", "Dlatego nawet trochę większa prędkość mocno wydłuża drogę zatrzymania.", "Тому навіть трохи більша швидкість помітно подовжує шлях зупинки."), src: t("Fahrphysik", "Vehicle physics", "Fizyka jazdy", "Фізика руху") },
        }),
        step("learn", {
            title: t("Wenn du hart bremsen musst", "When you have to brake hard", "Gdy musisz ostro hamować", "Коли доводиться різко гальмувати"),
            lead: t("Ein beladener Stapler ist nach vorn weniger standsicher als ein leerer.", "A loaded forklift is less stable forwards than an empty one.", "Załadowany wózek jest mniej stateczny do przodu niż pusty.", "Навантажений навантажувач менш стійкий уперед, ніж порожній."),
            points: [
                pt(t("<b>Last rutscht:</b> Bei abruptem Bremsen schiebt die Last nach vorn. Mit zurückgeneigtem Mast liegt sie sicherer.", "<b>The load slides:</b> when braking abruptly the load pushes forwards. With the mast tilted back it sits more securely.", "<b>Ładunek się zsuwa:</b> przy gwałtownym hamowaniu ładunek pcha do przodu. Przy maszcie odchylonym do tyłu leży pewniej.", "<b>Вантаж зсувається:</b> при різкому гальмуванні вантаж штовхає вперед. Із щоглою, нахиленою назад, він лежить надійніше.")),
                pt(t("<b>Stapler kippt nach vorn:</b> besonders mit angehobener Last. Darum Last immer nur bodenfrei anheben.", "<b>The forklift tips forwards:</b> especially with a raised load. So only lift the load just clear of the floor.", "<b>Wózek przewraca się do przodu:</b> szczególnie z podniesionym ładunkiem. Dlatego podnoś ładunek tylko tyle, by oderwał się od podłogi.", "<b>Навантажувач перекидається вперед:</b> особливо з піднятим вантажем. Тому піднімай вантаж лише настільки, щоб він відірвався від підлоги.")),
                pt(t("<b>Vorausschauend fahren:</b> Wer früh vom Gas geht, muss selten hart bremsen. Vor einem Fahrtrichtungswechsel immer erst ganz anhalten.", "<b>Drive with foresight:</b> if you ease off early you rarely have to brake hard. Always stop fully before changing direction.", "<b>Jedź przewidująco:</b> kto wcześnie zwalnia, rzadko musi ostro hamować. Przed zmianą kierunku zawsze najpierw zatrzymaj się całkowicie.", "<b>Їдь передбачливо:</b> хто рано скидає газ, рідко гальмує різко. Перед зміною напрямку завжди повністю зупиняйся.")),
            ],
            merke: t("Langsam anfahren, weich bremsen, Tempo vor der Kurve abbauen.", "Start slowly, brake gently, slow down before the bend.", "Ruszaj powoli, hamuj łagodnie, zwalniaj przed zakrętem.", "Рушай плавно, гальмуй м’яко, зменшуй швидкість перед поворотом."),
            src: { de: `${I208} Abschn. 6.3 und 6.4.2; ${G308E}, Übung Gabelstapler (Hinweise)` },
        }),
        step("question", {
            title: t("Nasser Hallenboden", "Wet hall floor", "Mokra posadzka", "Мокра підлога в цеху"),
            text: t("Die Reinigungsmaschine ist gerade durch. Du fährst mit Last zur Rampe, vorne kreuzt gleich ein Fußgängerweg.", "The cleaning machine has just been through. You drive with a load towards the ramp, and a pedestrian crossing is just ahead.", "Maszyna czyszcząca właśnie przejechała. Jedziesz z ładunkiem do rampy, zaraz przed tobą przejście dla pieszych.", "Щойно проїхала прибиральна машина. Ти їдеш із вантажем до рампи, попереду пішохідний перехід."),
            layout: "list",
            options: [
                t("Tempo schon jetzt deutlich verringern und früher bremsbereit sein", "Reduce speed clearly now and be ready to brake earlier", "Już teraz wyraźnie zwolnić i wcześniej być gotowym do hamowania", "Уже зараз помітно зменшити швидкість і раніше бути готовим гальмувати"),
                t("Normal weiterfahren, die Bremsen sind ja geprüft", "Carry on as normal, the brakes have been checked", "Jechać normalnie, hamulce są przecież sprawdzone", "Їхати як зазвичай, гальма ж перевірені"),
                t("Mast nach vorn neigen, damit die Last nicht nach hinten rutscht", "Tilt the mast forwards so the load does not slide back", "Pochylić maszt do przodu, żeby ładunek nie zsunął się do tyłu", "Нахилити щоглу вперед, щоб вантаж не зсунувся назад"),
                t("Kurz vor dem Fußgängerweg kräftig bremsen und dann weiter", "Brake hard just before the crossing and then carry on", "Mocno zahamować tuż przed przejściem i jechać dalej", "Сильно загальмувати перед переходом і їхати далі"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, der Bremsweg ist jetzt länger", "No, the braking distance is now longer", "Nie, droga hamowania jest teraz dłuższa", "Ні, гальмівний шлях тепер довший") },
            body: t("Auf nassem Boden ist die Reibung geringer und der Bremsweg länger. Hartes Bremsen mit Last bringt zusätzlich die Standsicherheit in Gefahr. Also früher und langsamer.", "On a wet floor friction is lower and the braking distance longer. Hard braking with a load also endangers stability. So earlier and slower.", "Na mokrej posadzce tarcie jest mniejsze, a droga hamowania dłuższa. Ostre hamowanie z ładunkiem dodatkowo zagraża stateczności. Czyli wcześniej i wolniej.", "На мокрій підлозі зчеплення менше, а гальмівний шлях довший. Різке гальмування з вантажем ще й загрожує стійкості. Отже, раніше й повільніше."),
            src: { de: `${V68} §12 mit DA; ${I208} Abschn. 6.4` },
        }),
        step("learn", {
            title: t("Wie schwer ist dein Stapler?", "How heavy is your forklift?", "Ile waży twój wózek?", "Скільки важить твій навантажувач?"),
            lead: t("Damit er nicht kippt, ist er selbst schwer, viel schwerer als seine Last.", "To avoid tipping it is heavy itself, much heavier than its load.", "Żeby się nie przewrócił, sam jest ciężki, znacznie cięższy od ładunku.", "Щоб не перекинутися, він сам важкий, значно важчий за вантаж."),
            points: [
                pt(t("<b>Faustregel:</b> Das Leergewicht eines Gabelstaplers beträgt etwa das Doppelte seiner Nenn-Tragfähigkeit. Ein 2-t-Stapler wiegt also rund 4 t.", "<b>Rule of thumb:</b> a forklift’s unladen weight is about twice its rated capacity. So a 2 t forklift weighs about 4 t.", "<b>Zasada:</b> masa własna wózka czołowego to ok. dwukrotność jego udźwigu nominalnego. Wózek 2 t waży więc ok. 4 t.", "<b>Правило:</b> власна маса навантажувача приблизно вдвічі більша за номінальну вантажопідйомність. Тож 2-тонний важить близько 4 т.")),
                pt(t("<b>Gesamtgewicht = Eigengewicht + Last.</b> Beladen trägt die Vorderachse etwa 90 % davon.", "<b>Total weight = own weight + load.</b> When loaded, the front axle carries about 90 % of it.", "<b>Masa całkowita = masa własna + ładunek.</b> Z ładunkiem oś przednia przenosi ok. 90 % tej masy.", "<b>Загальна маса = власна + вантаж.</b> З вантажем передня вісь несе близько 90 % цієї маси.")),
                pt(t("<b>Der Boden muss das tragen:</b> Decken, Kanalabdeckungen, Rampen, Überladebrücken und Aufzüge nur befahren, wenn ihre Tragfähigkeit größer ist als das Gesamtgewicht.", "<b>The floor must carry it:</b> only drive on floors, drain covers, ramps, dock levellers and lifts if their capacity exceeds the total weight.", "<b>Podłoże musi to unieść:</b> stropy, pokrywy kanałów, rampy, mostki przeładunkowe i windy tylko wtedy, gdy ich nośność przekracza masę całkowitą.", "<b>Основа має це витримати:</b> перекриття, кришки каналів, рампи, перехідні містки й ліфти — лише якщо їхня несуча здатність більша за загальну масу.")),
                pt(t("<b>Hebelgesetz:</b> Der Stapler funktioniert wie eine Wippe mit der Vorderachse als Drehpunkt. Last mal Lastarm darf nie größer werden als Stapler mal Hebelarm.", "<b>Law of the lever:</b> the forklift works like a seesaw with the front axle as pivot. Load times its lever arm must never exceed truck weight times its lever arm.", "<b>Prawo dźwigni:</b> wózek działa jak huśtawka z osią przednią jako punktem podparcia. Ciężar ładunku razy jego ramię nigdy nie może być większy niż ciężar wózka razy jego ramię.", "<b>Закон важеля:</b> навантажувач працює як гойдалка з передньою віссю як опорою. Вага вантажу на його плече ніколи не має перевищувати вагу навантажувача на його плече.")),
            ],
            merke: t("Gewicht ist beim Stapler gewollt: Es hält die Last im Gleichgewicht. Aber der Untergrund muss es auch aushalten.", "Weight is intentional on a forklift: it balances the load. But the floor has to withstand it too.", "Masa wózka jest zamierzona: równoważy ładunek. Ale podłoże też musi ją wytrzymać.", "Маса навантажувача задумана: вона врівноважує вантаж. Але й основа має її витримати."),
            src: { de: `${I208} Abschn. 4 und 6.2; DGUV G 308-001, Anhang 1 Nr. 5 (Hebelgesetz)` },
            layout: "rows",
            figure: {
                name: "wippe",
                hint: t("Zieh den Finger oder die Maus nach vorn: Die Palette rutscht auf den Gabeln weiter nach vorn.", "Drag your finger or the mouse forward: the pallet slides further forward on the forks.", "Przesuń palcem lub myszą do przodu: paleta przesuwa się dalej na widłach.", "Проведи пальцем або мишею вперед: палета зсувається далі по вилах."),
                choice: { label: t("Last", "Load", "Ładunek", "Вантаж"), values: [1000, 1500, 2000], names: [t("1.000 kg", "1,000 kg", "1000 kg", "1000 кг"), t("1.500 kg", "1,500 kg", "1500 kg", "1500 кг"), t("2.000 kg", "2,000 kg", "2000 kg", "2000 кг")] },
                legend: [
                    { mark: "dot", text: t("Dunkler Punkt: Drehpunkt an der Vorderachse.", "Dark dot: pivot point at the front axle.", "Ciemna kropka: punkt obrotu na przedniej osi.", "Темна крапка: точка обертання на передній осі.") },
                    { mark: "dot-lo", text: t("Heller Punkt: Lastschwerpunkt. Der Abstand zwischen beiden Punkten ist der Lastarm.", "Light dot: load centre. The distance between the two dots is the load arm.", "Jasna kropka: środek ciężkości ładunku. Odległość między kropkami to ramię ładunku.", "Світла крапка: центр ваги вантажу. Відстань між крапками — це плече вантажу.") },
                    { mark: "hi", text: t("Orange Umrandung: zuerst die Last. Hebt die Hinterachse ab, wandert sie zum Gegengewicht.", "Orange outline: first the load. When the rear axle lifts, it moves to the counterweight.", "Pomarańczowy obrys: najpierw ładunek. Gdy tylna oś się unosi, obrys przechodzi na przeciwwagę.", "Помаранчевий контур: спершу вантаж. Коли задня вісь піднімається, контур переходить на противагу.") },
                ],
                note: t("Vereinfachtes Modell eines Staplers mit 1.500 kg Nenn-Tragfähigkeit. Die echten Grenzen stehen im Lastschwerpunktdiagramm deines Staplers.", "Simplified model of a forklift with a rated capacity of 1,500 kg. The real limits are shown in your forklift's load centre diagram.", "Uproszczony model wózka o udźwigu nominalnym 1500 kg. Rzeczywiste granice podaje wykres udźwigu twojego wózka.", "Спрощена модель навантажувача з номінальною вантажопідйомністю 1500 кг. Справжні межі вказано на діаграмі вантажопідйомності твого навантажувача."),
            },
            facts: [
                { v: t("≈ 2 ×", "≈ 2 ×", "≈ 2 ×", "≈ 2 ×"), k: t("so schwer ist der leere Stapler im Verhältnis zu seiner Nenn-Tragfähigkeit", "is how heavy the empty forklift is compared with its rated capacity", "tyle waży pusty wózek w stosunku do swojego udźwigu nominalnego", "стільки важить порожній навантажувач порівняно з його номінальною вантажопідйомністю") },
                { v: t("≈ 90 %", "≈ 90 %", "≈ 90 %", "≈ 90 %"), k: t("des Gesamtgewichts trägt beim beladenen Stapler die Vorderachse", "of the total weight is carried by the front axle when the forklift is loaded", "całkowitej masy przenosi przednia oś, gdy wózek jest załadowany", "загальної ваги несе передня вісь, коли навантажувач завантажений") },
            ],
        }),
        step("question", {
            title: t("Der Lastenaufzug", "The goods lift", "Winda towarowa", "Вантажний ліфт"),
            text: t("Du sollst mit einem 2,5-t-Stapler und einer Palette von 1.500 kg ins Obergeschoss. Am Lastenaufzug steht: Tragfähigkeit 5.000 kg.", "You are to go upstairs with a 2.5 t forklift and a 1,500 kg pallet. The goods lift says: capacity 5,000 kg.", "Masz wjechać na piętro wózkiem 2,5 t z paletą 1500 kg. Na windzie towarowej: udźwig 5000 kg.", "Тобі треба на поверх вище 2,5-тонним навантажувачем із палетою 1500 кг. На вантажному ліфті: вантажопідйомність 5000 кг."),
            layout: "list",
            options: [
                t("Nicht befahren: Stapler und Last wiegen zusammen rund 6.500 kg", "Do not use it: forklift and load together weigh about 6,500 kg", "Nie wjeżdżać: wózek z ładunkiem waży razem ok. 6500 kg", "Не заїжджати: навантажувач із вантажем разом важать близько 6500 кг"),
                t("Befahren: 1.500 kg Last liegen weit unter 5.000 kg", "Use it: the 1,500 kg load is well below 5,000 kg", "Wjechać: 1500 kg ładunku to dużo poniżej 5000 kg", "Заїжджати: 1500 кг вантажу набагато менше за 5000 кг"),
                t("Befahren: 2.500 kg Tragfähigkeit plus 1.500 kg sind 4.000 kg", "Use it: 2,500 kg capacity plus 1,500 kg is 4,000 kg", "Wjechać: 2500 kg udźwigu plus 1500 kg to 4000 kg", "Заїжджати: 2500 кг вантажопідйомності плюс 1500 кг — це 4000 кг"),
                t("Befahren, aber nur ohne Fahrer im Aufzug", "Use it, but only without the driver in the lift", "Wjechać, ale bez operatora w windzie", "Заїжджати, але без водія в ліфті"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, zu schwer", "No, too heavy", "Nie, za ciężko", "Ні, заважко") },
            body: t("Ein 2,5-t-Stapler wiegt selbst etwa 5.000 kg. Mit der Last sind es rund 6.500 kg, das trägt der Aufzug nicht. Die Nenn-Tragfähigkeit sagt nichts über das Eigengewicht.", "A 2.5 t forklift itself weighs about 5,000 kg. With the load it is about 6,500 kg, more than the lift can carry. The rated capacity says nothing about the truck’s own weight.", "Wózek 2,5 t sam waży ok. 5000 kg. Z ładunkiem to ok. 6500 kg, czego winda nie uniesie. Udźwig nominalny nic nie mówi o masie własnej.", "2,5-тонний навантажувач сам важить близько 5000 кг. З вантажем — близько 6500 кг, ліфт цього не витримає. Номінальна вантажопідйомність нічого не каже про власну масу."),
            src: { de: `${I208} Abschn. 4 und 6.2` },
        }),
        step("choice", {
            title: QUIZ,
            items: [
                { q: t("Woraus setzt sich der Anhalteweg zusammen?", "What does stopping distance consist of?", "Z czego składa się droga zatrzymania?", "З чого складається шлях зупинки?"),
                    options: [t("Aus Reaktionsweg und Bremsweg", "Reaction distance and braking distance", "Z drogi reakcji i drogi hamowania", "Зі шляху реакції та гальмівного шляху"), t("Nur aus dem Bremsweg, die Reaktion zählt nicht", "Only braking distance, reaction does not count", "Tylko z drogi hamowania, reakcja się nie liczy", "Лише з гальмівного шляху, реакція не рахується"), t("Aus Bremsweg minus Reaktionsweg", "Braking distance minus reaction distance", "Z drogi hamowania minus droga reakcji", "Гальмівний шлях мінус шлях реакції"), t("Aus Bremsweg und Lastschwerpunktabstand", "Braking distance and load centre distance", "Z drogi hamowania i odległości środka ciężkości", "Гальмівний шлях і відстань до центру ваги")], correct: 0,
                    why: t("Erst reagierst du, dann bremst der Stapler. Beides zusammen ergibt den Anhalteweg.", "First you react, then the forklift brakes. Together they make the stopping distance.", "Najpierw reagujesz, potem wózek hamuje. Razem daje to drogę zatrzymania.", "Спершу реагуєш, потім навантажувач гальмує. Разом це шлях зупинки.") },
                { q: t("Du fährst doppelt so schnell. Wie ändert sich der Bremsweg ungefähr?", "You drive twice as fast. How does the braking distance change roughly?", "Jedziesz dwa razy szybciej. Jak mniej więcej zmienia się droga hamowania?", "Ти їдеш удвічі швидше. Як приблизно змінюється гальмівний шлях?"),
                    options: [t("Er wird etwa viermal so lang", "It becomes about four times as long", "Wydłuża się ok. czterokrotnie", "Стає приблизно вчетверо довшим"), t("Er wird doppelt so lang", "It becomes twice as long", "Wydłuża się dwukrotnie", "Стає вдвічі довшим"), t("Er bleibt gleich, nur der Reaktionsweg wächst", "It stays the same, only reaction distance grows", "Zostaje taka sama, rośnie tylko droga reakcji", "Не змінюється, росте лише шлях реакції"), t("Er wird etwa dreimal so lang", "It becomes about three times as long", "Wydłuża się ok. trzykrotnie", "Стає приблизно втричі довшим")], correct: 0,
                    why: t("Der Bremsweg wächst mit dem Quadrat der Geschwindigkeit: 2 × 2 = 4.", "Braking distance grows with the square of speed: 2 × 2 = 4.", "Droga hamowania rośnie z kwadratem prędkości: 2 × 2 = 4.", "Гальмівний шлях росте з квадратом швидкості: 2 × 2 = 4.") },
                { q: t("Welches Eigengewicht hat ein Gabelstapler mit 2 t Nenn-Tragfähigkeit ungefähr?", "Roughly what is the own weight of a forklift with 2 t rated capacity?", "Jaką mniej więcej masę własną ma wózek o udźwigu nominalnym 2 t?", "Яку приблизно власну масу має навантажувач із номінальною вантажопідйомністю 2 т?"),
                    options: [t("Rund 4 t", "About 4 t", "Ok. 4 t", "Близько 4 т"), t("Rund 2 t", "About 2 t", "Ok. 2 t", "Близько 2 т"), t("Rund 6 t", "About 6 t", "Ok. 6 t", "Близько 6 т"), t("Rund 1 t", "About 1 t", "Ok. 1 t", "Близько 1 т")], correct: 0,
                    why: t("DGUV Information 208-004: etwa das Doppelte der Nenn-Tragfähigkeit.", "DGUV Information 208-004: about twice the rated capacity.", "DGUV Information 208-004: ok. dwukrotność udźwigu nominalnego.", "DGUV Information 208-004: приблизно вдвічі більше за номінальну вантажопідйомність.") },
            ],
            allRight: ALL_OK, someWrong: LOOK,
        }),
        step("video", {
            title: t("Bremsen auf trockenem und nassem Boden", "Braking on a dry and a wet floor", "Hamowanie na suchej i mokrej posadzce", "Гальмування на сухій і мокрій підлозі"),
            brief: t("Ein Ausbilder fährt mit leerer Palette zweimal mit gleichem Tempo auf eine Markierung zu und bremst: einmal trocken, einmal nass. Kreide markiert den Haltepunkt, Seitenansicht und Draufsicht.", "A trainer drives towards a mark twice at the same speed with an empty pallet and brakes: once dry, once wet. Chalk marks the stopping point, side and top view.", "Instruktor dwa razy z tą samą prędkością podjeżdża z pustą paletą do znacznika i hamuje: raz na sucho, raz na mokro. Kreda zaznacza punkt zatrzymania, ujęcie z boku i z góry.", "Інструктор двічі з однаковою швидкістю під’їжджає з порожньою палетою до позначки й гальмує: на сухому і на мокрому. Крейда позначає точку зупинки, вид збоку й згори."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Anhalteweg</b> = Reaktionsweg + Bremsweg. Doppelt so schnell, etwa vierfacher Bremsweg.", "<b>Stopping distance</b> = reaction + braking distance. Twice the speed, about four times the braking distance.", "<b>Droga zatrzymania</b> = reakcja + hamowanie. Dwa razy szybciej to ok. cztery razy dłuższa droga hamowania.", "<b>Шлях зупинки</b> = реакція + гальмування. Удвічі швидше — приблизно вчетверо довший гальмівний шлях.")),
            pt(t("<b>Nass, ölig, staubig:</b> weniger Reibung, längerer Bremsweg.", "<b>Wet, oily, dusty:</b> less friction, longer braking distance.", "<b>Mokro, olej, pył:</b> mniejsze tarcie, dłuższa droga hamowania.", "<b>Мокро, олива, пил:</b> менше зчеплення, довший гальмівний шлях.")),
            pt(t("<b>Eigengewicht</b> etwa doppelte Nenn-Tragfähigkeit. Boden, Rampe und Aufzug müssen das Gesamtgewicht tragen.", "<b>Own weight</b> about twice the rated capacity. Floor, ramp and lift must carry the total weight.", "<b>Masa własna</b> ok. dwukrotność udźwigu nominalnego. Podłoże, rampa i winda muszą unieść masę całkowitą.", "<b>Власна маса</b> приблизно вдвічі більша за вантажопідйомність. Підлога, рампа й ліфт мають витримати загальну масу.")),
        ] }),
    ];
}

/* ════════════════ 5.4 Recht, Eignung und Pflichten ════════════════ */
export function lesson54(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Unfallverhütungsvorschriften sind Recht", "Accident prevention regulations are law", "Przepisy BHP (UVV) to prawo", "Правила запобігання нещасним випадкам — це право"),
            lead: t("Die DGUV Vorschrift 68 ist keine Empfehlung, sondern verbindlich.", "DGUV Regulation 68 is not a recommendation; it is binding.", "DGUV Vorschrift 68 to nie zalecenie, tylko obowiązujący przepis.", "DGUV Vorschrift 68 — не рекомендація, а обов’язковий припис."),
            points: [
                pt(t("<b>Rechtsnorm:</b> Die Berufsgenossenschaften erlassen Unfallverhütungsvorschriften auf Grundlage des Sozialgesetzbuchs VII. Sie gelten wie ein Gesetz.", "<b>Legal norm:</b> the employers’ liability insurance associations issue accident prevention regulations under Social Code Book VII. They apply like a law.", "<b>Norma prawna:</b> Berufsgenossenschaften wydają przepisy o zapobieganiu wypadkom (UVV) na podstawie niemieckiego Kodeksu socjalnego, księga VII. Obowiązują jak ustawa.", "<b>Правова норма:</b> страхові спілки видають правила запобігання нещасним випадкам (UVV) на підставі Соціального кодексу Німеччини, книга VII. Вони діють як закон.")),
                pt(t("<b>Für wen:</b> für den Unternehmer und für jeden versicherten Beschäftigten, also auch für dich. Sie gelten auch, wenn sie nicht ausgehängt sind.", "<b>For whom:</b> for the employer and for every insured employee, so also for you. They apply even if they are not posted.", "<b>Dla kogo:</b> dla przedsiębiorcy i każdego ubezpieczonego pracownika, czyli także dla ciebie. Obowiązują także wtedy, gdy nie zostały wywieszone.", "<b>Для кого:</b> для роботодавця і кожного застрахованого працівника, тобто й для тебе. Вони діють і тоді, коли їх не вивішено.")),
                pt(t("<b>Verstöße</b> können als Ordnungswidrigkeit mit Bußgeld geahndet werden, gegen den Unternehmer und gegen Beschäftigte.", "<b>Violations</b> can be punished as an administrative offence with a fine, against the employer and against employees.", "<b>Naruszenia</b> mogą być karane jako wykroczenie grzywną, wobec pracodawcy i pracowników.", "<b>Порушення</b> можуть каратися як адмінправопорушення зі штрафом — і для роботодавця, і для працівників.")),
                pt(t("<b>Geltungsbereich:</b> Die DGUV Vorschrift 68 gilt für alle Flurförderzeuge mit ihren Anhängern. Ausgenommen sind nur solche mit Muskelkraft-Fahrwerk ohne Hubeinrichtung.", "<b>Scope:</b> DGUV Regulation 68 applies to all industrial trucks and their trailers. Only those with a muscle-powered chassis and no lifting device are excluded.", "<b>Zakres:</b> DGUV Vorschrift 68 dotyczy wszystkich wózków jezdniowych z przyczepami. Wyłączone są tylko te z podwoziem napędzanym siłą mięśni bez urządzenia podnoszącego.", "<b>Сфера дії:</b> DGUV Vorschrift 68 стосується всіх навантажувачів і їхніх причепів. Винятки — лише пристрої, які пересуваються м’язовою силою й не мають підйомного пристрою.")),
            ],
            merke: t("Ein Handhubwagen kann heben, darum fällt auch er unter die Vorschrift. Eine Sackkarre nicht.", "A hand pallet truck can lift, so it falls under the regulation too. A sack truck does not.", "Ręczny wózek paletowy może podnosić, więc też podlega przepisowi. Wózek ręczny do worków nie.", "Ручний палетний візок може піднімати, тому теж підпадає під припис. Ручний візок для мішків — ні."),
            src: { de: `SGB VII §15 und §209; ${V68} §1` },
        }),
        step("sort", {
            title: t("Gilt hier die DGUV Vorschrift 68?", "Does DGUV Regulation 68 apply here?", "Czy obowiązuje tu DGUV Vorschrift 68?", "Чи діє тут DGUV Vorschrift 68?"),
            lead: t("Entscheide für jedes Gerät.", "Decide for each device.", "Zdecyduj dla każdego urządzenia.", "Виріши для кожного пристрою."),
            labels: [t("Gilt", "Applies", "Dotyczy", "Діє"), t("Gilt nicht", "Does not apply", "Nie dotyczy", "Не діє")],
            items: [
                { t: t("Handgabelhubwagen", "Hand pallet truck", "Ręczny wózek paletowy", "Ручний палетний візок"), a: 0, why: t("Muskelkraft, aber mit Hubeinrichtung.", "Muscle power, but with a lifting device.", "Napędzany siłą mięśni, ale z urządzeniem podnoszącym.", "Рухається м’язовою силою, але має підйомний пристрій.") },
                { t: t("Sackkarre", "Sack truck", "Wózek do worków", "Візок для мішків"), a: 1, why: t("Muskelkraft und keine Hubeinrichtung.", "Muscle power and no lifting device.", "Napędzany siłą mięśni i bez urządzenia podnoszącego.", "Рухається м’язовою силою й не має підйомного пристрою.") },
                { t: t("Elektro-Mitgänger („Ameise“)", "Electric pedestrian truck (“Ameise”)", "Elektryczny wózek prowadzony („Ameise”)", "Електровізок із супроводом («Ameise»)"), a: 0, why: t("Kraftbetrieben, also Flurförderzeug.", "Powered, so an industrial truck.", "Z napędem, czyli wózek jezdniowy.", "Має привід, отже це складська техніка.") },
                { t: t("Rollcontainer ohne Antrieb", "Roll container without drive", "Kontener na kółkach bez napędu", "Контейнер на колесах без приводу"), a: 1, why: t("Geschoben, ohne Hubeinrichtung.", "Pushed, no lifting device.", "Pchany ręcznie, bez urządzenia podnoszącego.", "Його штовхають, підйомного пристрою немає.") },
                { t: t("Schlepper mit Anhängern", "Tow tractor with trailers", "Ciągnik z przyczepami", "Тягач із причепами"), a: 0, why: t("Gilt für Flurförderzeuge einschließlich ihrer Anhänger.", "Applies to industrial trucks including their trailers.", "Przepis obejmuje wózki jezdniowe łącznie z ich przyczepami.", "Припис охоплює навантажувачі разом із їхніми причепами.") },
                { t: t("Gabelstapler mit Dieselmotor", "Diesel forklift", "Wózek widłowy z silnikiem diesla", "Дизельний навантажувач"), a: 0, why: t("Klassisches Flurförderzeug.", "Classic industrial truck.", "Klasyczny wózek jezdniowy.", "Класичний навантажувач.") },
            ],
            allRight: t("Genau. Entscheidend ist die Hubeinrichtung oder der Antrieb.", "Exactly. What counts is the lifting device or the drive.", "Dokładnie. Decyduje urządzenie podnoszące albo napęd.", "Саме так. Вирішує підйомний пристрій або привід."),
            someWrong: t("Ausgenommen ist nur: Muskelkraft und keine Hubeinrichtung.", "Only excluded: muscle power and no lifting device.", "Wyłączone są tylko urządzenia napędzane siłą mięśni i bez urządzenia podnoszącego.", "Виняток лише: м’язова сила й відсутність підйомного пристрою."),
        }),
        step("learn", {
            title: t("Anweisung gegen die Sicherheit", "An instruction against safety", "Polecenie wbrew bezpieczeństwu", "Вказівка проти безпеки"),
            lead: t("Du folgst den Weisungen deines Unternehmers, aber nicht jeder.", "You follow your employer’s instructions, but not all of them.", "Wykonujesz polecenia pracodawcy, ale nie wszystkie.", "Ти виконуєш вказівки роботодавця, але не всі."),
            points: [
                pt(t("<b>Grundsatz:</b> Weisungen zur Sicherheit befolgst du, Schutzeinrichtungen benutzt du bestimmungsgemäß.", "<b>Principle:</b> you follow safety instructions and use protective devices as intended.", "<b>Zasada:</b> wykonujesz polecenia dotyczące bezpieczeństwa i używasz zabezpieczeń zgodnie z przeznaczeniem.", "<b>Принцип:</b> виконуєш вказівки з безпеки й використовуєш захисні засоби за призначенням.")),
                pt(t("<b>Grenze:</b> Weisungen, die erkennbar gegen Sicherheit und Gesundheit gerichtet sind, darfst du nicht befolgen. Auch nicht, wenn es schneller oder billiger wäre.", "<b>Limit:</b> you must not follow instructions that clearly go against safety and health. Not even if it would be faster or cheaper.", "<b>Granica:</b> nie wolno ci wykonywać poleceń wyraźnie sprzecznych z bezpieczeństwem i zdrowiem. Nawet gdyby było szybciej albo taniej.", "<b>Межа:</b> вказівки, що явно суперечать безпеці й здоров’ю, виконувати не можна. Навіть якщо так швидше чи дешевше.")),
                pt(t("<b>Mängel melden:</b> Was du an Gefahren feststellst und nicht selbst beseitigen darfst, meldest du sofort deinem Vorgesetzten.", "<b>Report defects:</b> hazards you notice and may not remove yourself, you report immediately to your supervisor.", "<b>Zgłaszaj usterki:</b> zagrożenia, których nie możesz sam usunąć, natychmiast zgłaszasz przełożonemu.", "<b>Повідомляй про несправності:</b> небезпеки, які не можеш усунути сам, одразу повідомляй керівнику.")),
                pt(t("<b>Reparieren</b> darfst du nur, wenn du dafür qualifiziert bist und den Auftrag dazu hast.", "<b>Repairs</b> are only allowed if you are qualified and have been instructed to do them.", "<b>Naprawiać</b> możesz tylko wtedy, gdy masz do tego kwalifikacje i otrzymałeś takie polecenie.", "<b>Ремонтувати</b> можна лише з кваліфікацією та дорученням.")),
            ],
            merke: t("Zeitdruck oder eine Anordnung machen einen Verstoß nicht erlaubt. Verantwortlich bleiben Unternehmer und Fahrer.", "Time pressure or an order does not make a violation allowed. Employer and driver remain responsible.", "Presja czasu czy polecenie nie czynią naruszenia dozwolonym. Odpowiedzialność nadal ponoszą pracodawca i operator.", "Поспіх чи наказ не роблять порушення дозволеним. Відповідальні роботодавець і водій."),
            src: { de: `${V1} §15 Abs. 1, §16, §17` },
        }),
        step("question", {
            title: t("„Mach schneller!“", "“Hurry up!”", "„Szybciej!”", "«Швидше!»"),
            text: t("Der Schichtleiter sagt: „Lass die Einsatzprüfung heute weg und fahr die Last zu zweit auf der Gabel hoch, dann geht das Einräumen schneller.“", "The shift leader says: “Skip the daily check today and ride up on the forks with the load, the two of you; then putting it away is faster.”", "Kierownik zmiany mówi: „Pomiń dziś kontrolę przed pracą i wjedźcie we dwóch na widłach razem z ładunkiem, to szybciej rozłożycie towar”.", "Начальник зміни каже: «Пропусти сьогодні перевірку перед роботою і підніміться вдвох на вилах разом із вантажем, так швидше розкладете»."),
            layout: "list",
            options: [
                t("Ablehnen: Die Anweisung ist erkennbar gegen die Sicherheit gerichtet", "Refuse: the instruction clearly goes against safety", "Odmówić: polecenie wyraźnie zagraża bezpieczeństwu", "Відмовитися: вказівка явно суперечить безпеці"),
                t("Ausführen, die Verantwortung trägt dann der Schichtleiter", "Do it, the shift leader then bears the responsibility", "Wykonać, odpowiedzialność ponosi wtedy kierownik zmiany", "Виконати, відповідальність тоді на начальникові"),
                t("Nur die Prüfung weglassen, aber niemanden auf der Gabel mitnehmen", "Only skip the check but take nobody on the forks", "Pominąć tylko kontrolę, ale nikogo nie wozić na widłach", "Пропустити лише перевірку, але нікого не возити на вилах"),
                t("Ausführen, wenn er es schriftlich anordnet", "Do it if he orders it in writing", "Wykonać, jeśli wyda polecenie na piśmie", "Виконати, якщо він накаже письмово"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das darfst du nicht befolgen", "No, you must not follow this", "Nie, tego nie wolno wykonać", "Ні, цього виконувати не можна") },
            body: t("Personen auf der Gabel anheben und die Einsatzprüfung auslassen sind beides Verstöße gegen die DGUV Vorschrift 68. Auch eine schriftliche Anordnung ändert daran nichts, und du bleibst mitverantwortlich.", "Lifting people on the forks and skipping the daily check are both violations of DGUV Regulation 68. A written order changes nothing, and you remain jointly responsible.", "Podnoszenie ludzi na widłach i pomijanie kontroli przed pracą to naruszenia DGUV Vorschrift 68. Polecenie na piśmie niczego nie zmienia, a ty nadal współodpowiadasz.", "Піднімання людей на вилах і пропуск перевірки — порушення DGUV Vorschrift 68. Письмовий наказ нічого не змінює, і ти лишаєшся співвідповідальним."),
            src: { de: `${V1} §15 Abs. 1; ${V68} §9, §16` },
        }),
        step("learn", {
            title: t("Geeignet zum Fahren", "Fit to drive", "Zdolny do jazdy", "Придатний до керування"),
            lead: t("Fahren darf nur, wer körperlich und geistig geeignet ist, jeden Tag aufs Neue.", "Only those who are physically and mentally fit may drive, every single day.", "Jeździć może tylko ten, kto jest zdolny fizycznie i psychicznie, każdego dnia od nowa.", "Керувати може лише фізично й психічно придатний, щодня заново."),
            points: [
                pt(t("<b>Voraussetzungen:</b> ausreichend sehen und hören, sicher reagieren, mindestens 18 Jahre alt, ausgebildet und schriftlich beauftragt.", "<b>Requirements:</b> adequate sight and hearing, safe reactions, at least 18 years old, trained and authorised in writing.", "<b>Warunki:</b> wystarczający wzrok i słuch, pewna reakcja, co najmniej 18 lat, szkolenie i pisemne upoważnienie.", "<b>Вимоги:</b> достатній зір і слух, надійна реакція, щонайменше 18 років, навчання й письмове доручення.")),
                pt(t("<b>Plötzliche Bewusstseinsstörungen</b>(etwa durch epileptische Anfälle) können am Stapler dich und andere gefährden. Ob und wann du fahren darfst, beurteilt der Betriebsarzt im Einzelfall.", "<b>Sudden loss of consciousness</b>(for example from epileptic seizures) can endanger you and others on a forklift. Whether and when you may drive is assessed by the occupational physician case by case.", "<b>Nagłe zaburzenia świadomości</b>(np. napady padaczkowe) mogą przy wózku zagrozić tobie i innym. Czy i kiedy możesz jeździć, ocenia indywidualnie lekarz zakładowy.", "<b>Раптові порушення свідомості</b>(наприклад епілептичні напади) можуть за кермом загрожувати тобі й іншим. Чи й коли можна керувати, вирішує індивідуально лікар з охорони праці.")),
                pt(t("<b>Alkohol, Drogen, Medikamente:</b> Du darfst dich nicht in einen Zustand bringen, in dem du dich oder andere gefährdest. Bei Medikamenten den Beipackzettel und den Arzt fragen.", "<b>Alcohol, drugs, medication:</b> you must not get into a state in which you endanger yourself or others. With medication, check the leaflet and ask the doctor.", "<b>Alkohol, narkotyki, leki:</b> nie wolno ci doprowadzić się do stanu zagrażającego tobie lub innym. Przy lekach czytaj ulotkę i pytaj lekarza.", "<b>Алкоголь, наркотики, ліки:</b> не можна доводити себе до стану, що загрожує тобі чи іншим. Якщо приймаєш ліки, прочитай листок-вкладиш і запитай лікаря.")),
                pt(t("<b>Eignungsuntersuchung:</b> Viele Betriebe lassen die Eignung für Fahrtätigkeiten betriebsärztlich beurteilen, früher als „G 25“ bekannt.", "<b>Fitness assessment:</b> many companies have fitness for driving tasks assessed by the occupational physician, formerly known as “G 25”.", "<b>Ocena zdolności do pracy:</b> wiele zakładów zleca lekarzowi zakładowemu ocenę zdolności do jazdy, dawniej „G 25”.", "<b>Оцінка придатності:</b> багато підприємств доручають лікарю з охорони праці оцінити придатність до керування, раніше «G 25».")),
            ],
            merke: t("Wenn du dich nicht fit fühlst, fährst du nicht und sagst es deinem Vorgesetzten.", "If you do not feel fit, you do not drive and you tell your supervisor.", "Jeśli nie czujesz się na siłach, nie jeździsz i mówisz o tym przełożonemu.", "Якщо почуваєшся непридатним, не їдеш і кажеш керівнику."),
            src: { de: `${V68} §7; ${V1} §7 Abs. 2, §15 Abs. 2 und 3; DGUV Information 250-001; DGUV Empfehlungen für arbeitsmedizinische Beratungen und Untersuchungen` },
        }),
        step("question", {
            title: t("Nach dem Anfall", "After the seizure", "Po napadzie", "Після нападу"),
            text: t("Ein Kollege hatte vor einer Woche zum ersten Mal einen Krampfanfall. Heute will er wieder Stapler fahren, er fühlt sich gut.", "A colleague had a seizure for the first time a week ago. Today he wants to drive the forklift again; he feels fine.", "Kolega tydzień temu po raz pierwszy miał napad drgawek. Dziś chce znów jeździć wózkiem, czuje się dobrze.", "Колега тиждень тому вперше мав судомний напад. Сьогодні знову хоче їздити, почувається добре."),
            layout: "list",
            options: [
                t("Nicht fahren, bis der Betriebsarzt die Eignung beurteilt hat", "Not drive until the occupational physician has assessed his fitness", "Nie jeździć, dopóki lekarz zakładowy nie oceni zdolności", "Не керувати, поки лікар з охорони праці не оцінить придатність"),
                t("Fahren, wenn er sich selbst fit fühlt", "Drive if he feels fit himself", "Jeździć, jeśli sam czuje się na siłach", "Керувати, якщо сам почувається придатним"),
                t("Fahren, aber nur ohne Last und langsam", "Drive, but only without load and slowly", "Jeździć, ale tylko bez ładunku i powoli", "Керувати, але лише без вантажу й повільно"),
                t("Fahren, wenn ein Kollege in der Nähe bleibt", "Drive if a colleague stays nearby", "Jeździć, jeśli kolega zostanie w pobliżu", "Керувати, якщо колега буде поруч"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, erst die ärztliche Beurteilung", "No, first the medical assessment", "Nie, najpierw ocena lekarska", "Ні, спершу оцінка лікаря") },
            body: t("Ein erneuter Anfall am Steuer kann ihn und andere schwer verletzen. Die DGUV Information 250-001 sieht eine individuelle Beurteilung durch den Betriebsarzt vor, bevor er wieder fährt.", "Another seizure at the wheel can seriously injure him and others. DGUV Information 250-001 provides for an individual assessment by the occupational physician before he drives again.", "Kolejny napad za kierownicą może ciężko zranić jego i innych. DGUV Information 250-001 przewiduje indywidualną ocenę lekarza zakładowego przed powrotem do jazdy.", "Повторний напад за кермом може тяжко травмувати його та інших. DGUV Information 250-001 передбачає індивідуальну оцінку лікаря перед поверненням до керування."),
            src: { de: "DGUV Information 250-001, Abschn. 2.2.3" },
        }),
        step("learn", {
            title: t("Schutzausrüstung und Kleidung", "Protective equipment and clothing", "Środki ochrony i odzież", "Засоби захисту й одяг"),
            lead: t("Bei fast der Hälfte der Unfälle mit Flurfördermitteln sind Füße und Knöchel verletzt.", "In almost half of all accidents with materials handling equipment, feet and ankles are injured.", "W prawie połowie wypadków ze sprzętem transportowym urazy dotyczą stóp i kostek.", "Майже в половині випадків із транспортним обладнанням травмовані стопи й щиколотки."),
            points: [
                pt(t("<b>Pflicht:</b> Die persönliche Schutzausrüstung, die dein Unternehmer bereitstellt, musst du bestimmungsgemäß benutzen.", "<b>Duty:</b> you must use the personal protective equipment your employer provides as intended.", "<b>Obowiązek:</b> ze środków ochrony indywidualnej zapewnionych przez pracodawcę musisz korzystać zgodnie z przeznaczeniem.", "<b>Обов’язок:</b> засоби індивідуального захисту від роботодавця ти маєш використовувати за призначенням.")),
                pt(t("<b>Typisch am Stapler:</b> Sicherheitsschuhe, Warnkleidung in gemischten Verkehrsbereichen, Handschuhe beim Umgang mit Lasten, Gehörschutz in Lärmbereichen.", "<b>Typical on a forklift:</b> safety shoes, high-visibility clothing in mixed traffic areas, gloves when handling loads, hearing protection in noisy areas.", "<b>Typowo przy wózku:</b> obuwie ochronne, odzież ostrzegawcza w strefach ruchu mieszanego, rękawice przy pracy z ładunkami, ochronniki słuchu w strefach hałasu.", "<b>Типово на навантажувачі:</b> захисне взуття, сигнальний одяг у зонах змішаного руху, рукавички під час роботи з вантажами, захист слуху в шумних зонах.")),
                pt(t("<b>Batterie und Gas:</b> Beim Nachfüllen und Laden zusätzlich Schutzbrille oder Gesichtsschutz, säurefeste Handschuhe und Schürze.", "<b>Battery and gas:</b> when topping up and charging, also goggles or face shield, acid-resistant gloves and apron.", "<b>Akumulator i gaz:</b> przy uzupełnianiu i ładowaniu dodatkowo okulary lub osłona twarzy, rękawice i fartuch kwasoodporne.", "<b>Батарея й газ:</b> під час доливання й заряджання ще окуляри чи щиток, кислотостійкі рукавички й фартух.")),
                pt(t("<b>Kleidung:</b> eng anliegend, keine losen Enden, Schals oder Ketten, die sich in Hebeln oder Mast verfangen können.", "<b>Clothing:</b> close-fitting, no loose ends, scarves or chains that can catch in levers or the mast.", "<b>Odzież:</b> przylegająca, bez luźnych końców, szali czy łańcuszków, które mogą wkręcić się w dźwignie lub maszt.", "<b>Одяг:</b> щільний, без вільних кінців, шарфів чи ланцюжків, що можуть зачепитися за важелі чи щоглу.")),
            ],
            merke: t("Sicherheitsschuhe sind am Stapler fast immer Pflicht, auch für kurze Fahrten.", "Safety shoes are almost always mandatory on a forklift, even for short trips.", "Obuwie ochronne przy wózku jest prawie zawsze obowiązkowe, także na krótkie przejazdy.", "Захисне взуття на навантажувачі майже завжди обов’язкове, навіть для коротких поїздок."),
            src: { de: `${V1} §30; ${STAT24}, Abschn. 7` },
        }),
        step("learn", {
            title: t("Ein Schein für jedes Gerät", "A licence for each type of truck", "Osobne uprawnienia na każdy typ wózka", "Окреме посвідчення для кожного типу"),
            lead: t("Was du an einem Gerät kannst, gilt nicht automatisch für ein anderes.", "What you can do on one machine does not automatically apply to another.", "To, co umiesz na jednym urządzeniu, nie przenosi się automatycznie na inne.", "Те, що вмієш на одній машині, не переноситься автоматично на іншу."),
            points: [
                pt(t("<b>Andere Scheine zählen nicht:</b> Kranführer, Pkw- oder Lkw-Führerschein ersetzen die Ausbildung zum Staplerfahrer nicht.", "<b>Other licences do not count:</b> a crane operator’s licence or a car or lorry licence does not replace forklift training.", "<b>Inne uprawnienia się nie liczą:</b> uprawnienia operatora suwnicy ani prawo jazdy kat. B czy C nie zastępują szkolenia na wózek widłowy.", "<b>Інші посвідчення не рахуються:</b> посвідчення кранівника чи водійські права категорії B або C не замінюють навчання на навантажувач.")),
                pt(t("<b>Andere Bauart:</b> Für Schubmast-, Dreiseiten- oder Teleskopstapler brauchst du eine Zusatzqualifizierung.", "<b>Different type:</b> for reach, VNA or telescopic handlers you need additional qualification.", "<b>Inny typ:</b> na wózek z wysuwanym masztem, wózek trójstronny czy ładowarkę teleskopową potrzebujesz kwalifikacji dodatkowej.", "<b>Інший тип:</b> для річтрака, трибічного чи телескопічного навантажувача потрібна додаткова кваліфікація.")),
                pt(t("<b>Anderer Betrieb:</b> Der Fahrauftrag gilt nur in der Firma, die ihn erteilt hat. Beim Wechsel beauftragt dich der neue Arbeitgeber neu.", "<b>Different company:</b> the authorisation only applies at the company that issued it. When you change jobs, the new employer authorises you again.", "<b>Inny zakład:</b> upoważnienie do jazdy obowiązuje tylko w firmie, która je wydała. Po zmianie pracy nowy pracodawca wydaje je od nowa.", "<b>Інше підприємство:</b> доручення діє лише там, де його видали. Після зміни роботи новий роботодавець видає нове доручення.")),
            ],
            merke: t("Ausbildung für die Bauart, Auftrag für den Betrieb, Einweisung für das konkrete Gerät.", "Training for the type, authorisation for the company, familiarisation for the specific truck.", "Szkolenie na typ wózka, upoważnienie dla zakładu, instruktaż na konkretny wózek.", "Навчання на тип, доручення для підприємства, інструктаж для конкретної машини."),
            src: { de: "DGUV G 308-001, Abschn. 3 und 4" },
        }),
        step("question", {
            title: t("Der erfahrene Kranführer", "The experienced crane operator", "Doświadczony operator suwnicy", "Досвідчений кранівник"),
            text: t("Ein 25-jähriger Kollege ist ausgebildeter Kranführer. Er soll ab morgen auch Gabelstapler fahren.", "A 25-year-old colleague is a trained crane operator. From tomorrow he is to drive forklifts too.", "25-letni kolega jest wyszkolonym operatorem suwnicy. Od jutra ma też jeździć wózkiem widłowym.", "25-річний колега — навчений кранівник. Із завтра він має їздити й на навантажувачі."),
            layout: "list",
            options: [
                t("Erst nach einer Ausbildung zum Staplerfahrer und schriftlichem Auftrag", "Only after forklift training and a written authorisation", "Dopiero po szkoleniu na wózek i pisemnym upoważnieniu", "Лише після навчання на навантажувач і письмового доручення"),
                t("Sofort, Kranführen ist anspruchsvoller als Staplerfahren", "Immediately, operating a crane is more demanding", "Od razu, obsługa suwnicy jest trudniejsza", "Одразу, кран складніший за навантажувач"),
                t("Sofort, wenn der Vorgesetzte es anordnet", "Immediately, if the supervisor orders it", "Od razu, jeśli przełożony tak zarządzi", "Одразу, якщо так накаже керівник"),
                t("Nach einer Probefahrt mit einem erfahrenen Kollegen", "After a test drive with an experienced colleague", "Po jeździe próbnej z doświadczonym kolegą", "Після пробної поїздки з досвідченим колегою"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, der Kranschein reicht nicht", "No, the crane licence is not enough", "Nie, uprawnienia na suwnicę nie wystarczą", "Ні, посвідчення кранівника недостатньо") },
            body: t("Für das Steuern von Flurförderzeugen braucht er eine eigene Ausbildung mit nachgewiesener Befähigung und einen schriftlichen Auftrag des Unternehmers.", "To operate industrial trucks he needs separate training with proven competence and a written authorisation from the employer.", "Do prowadzenia wózków potrzebuje osobnego szkolenia z potwierdzonymi umiejętnościami i pisemnego upoważnienia pracodawcy.", "Для керування навантажувачами потрібне окреме навчання з підтвердженою здатністю й письмове доручення роботодавця."),
            src: { de: `${V68} §7 Abs. 1` },
        }),
        step("choice", {
            title: QUIZ,
            items: [
                { q: t("Für wen gelten Unfallverhütungsvorschriften verbindlich?", "For whom are accident prevention regulations binding?", "Dla kogo przepisy BHP (UVV) są wiążące?", "Для кого обов’язкові правила запобігання нещасним випадкам?"),
                    options: [t("Für den Unternehmer und alle versicherten Beschäftigten", "For the employer and all insured employees", "Dla przedsiębiorcy i wszystkich ubezpieczonych pracowników", "Для роботодавця й усіх застрахованих працівників"), t("Nur für den Unternehmer", "Only for the employer", "Tylko dla przedsiębiorcy", "Лише для роботодавця"), t("Nur, wenn sie im Betrieb ausgehängt sind", "Only if they are posted in the company", "Tylko jeśli są wywieszone w zakładzie", "Лише якщо вивішені на підприємстві"), t("Nur für Fachkräfte für Arbeitssicherheit", "Only for safety specialists", "Tylko dla specjalistów BHP", "Лише для фахівців з охорони праці")], correct: 0,
                    why: t("SGB VII §15: Unfallverhütungsvorschriften verpflichten Unternehmer und Versicherte.", "SGB VII §15: accident prevention regulations bind employers and insured persons.", "SGB VII §15: przepisy BHP (UVV) wiążą przedsiębiorców i ubezpieczonych.", "SGB VII §15: правила зобов’язують роботодавців і застрахованих.") },
                { q: t("Welches Gerät fällt NICHT unter die DGUV Vorschrift 68?", "Which device does NOT fall under DGUV Regulation 68?", "Które urządzenie NIE podlega DGUV Vorschrift 68?", "Який пристрій НЕ підпадає під DGUV Vorschrift 68?"),
                    options: [t("Eine Sackkarre ohne Antrieb und ohne Hubeinrichtung", "A sack truck without drive or lifting device", "Wózek do worków bez napędu i bez urządzenia podnoszącego", "Візок для мішків без приводу й підйомного пристрою"), t("Ein Handgabelhubwagen", "A hand pallet truck", "Ręczny wózek paletowy", "Ручний палетний візок"), t("Der Anhänger eines Schleppers", "A tow tractor’s trailer", "Przyczepa ciągnika", "Причіп тягача"), t("Ein elektrischer Mitgänger-Hubwagen", "An electric pedestrian pallet truck", "Elektryczny wózek prowadzony („Ameise”)", "Електричний візок із супроводом")], correct: 0,
                    why: t("DGUV Vorschrift 68 §1 Abs. 2: ausgenommen sind nur Geräte mit Muskelkraft-Fahrwerk ohne Hubeinrichtung.", "DGUV Regulation 68 §1 para. 2: only muscle-powered devices without a lifting device are excluded.", "DGUV Vorschrift 68 §1 ust. 2: wyłączone są tylko urządzenia napędzane siłą mięśni i bez urządzenia podnoszącego.", "DGUV Vorschrift 68 §1 абз. 2: виняток — лише пристрої, що рухаються м’язовою силою й не мають підйомного пристрою.") },
                { q: t("Dein Vorgesetzter ordnet eine Arbeit an, die erkennbar gegen die Sicherheit verstößt. Was gilt?", "Your supervisor orders work that clearly breaches safety. What applies?", "Przełożony zleca pracę wyraźnie sprzeczną z bezpieczeństwem. Co obowiązuje?", "Керівник доручає роботу, що явно порушує безпеку. Що діє?"),
                    options: [t("Du darfst die Weisung nicht befolgen", "You must not follow the instruction", "Nie wolno ci wykonać polecenia", "Ти не маєш виконувати вказівку"), t("Du musst sie befolgen, er trägt die Verantwortung", "You must follow it, he bears the responsibility", "Musisz je wykonać, odpowiedzialność ponosi on", "Мусиш виконати, відповідає він"), t("Du darfst sie befolgen, wenn sie schriftlich vorliegt", "You may follow it if it is in writing", "Możesz wykonać, jeśli jest na piśmie", "Можеш виконати, якщо вона письмова"), t("Du befolgst sie, wenn die Arbeit sonst zu teuer wäre", "You follow it if the work would otherwise be too expensive", "Wykonujesz, jeśli inaczej byłoby za drogo", "Виконуєш, якщо інакше було б задорого")], correct: 0,
                    why: t("DGUV Vorschrift 1 §15 Abs. 1.", "DGUV Regulation 1 §15 para. 1.", "DGUV Vorschrift 1 §15 ust. 1.", "DGUV Vorschrift 1 §15 абз. 1.") },
            ],
            allRight: ALL_OK, someWrong: LOOK,
        }),
        step("video", {
            title: t("Fit für die Schicht?", "Fit for the shift?", "Gotowy na zmianę?", "Готовий до зміни?"),
            brief: t("Fahrer zieht sich um: Sicherheitsschuhe, Warnweste, Schal ab, Ring ab. Kurzer Blick in den Spiegel, dann zur Einsatzprüfung. Nur Hände und Füße im Bild.", "Driver changes: safety shoes, high-vis vest, scarf off, ring off. Quick look in the mirror, then to the daily check. Only hands and feet in shot.", "Operator się przebiera: obuwie ochronne, kamizelka ostrzegawcza, zdejmuje szal i pierścionek. Szybkie spojrzenie w lustro, potem kontrola przed pracą. W kadrze tylko dłonie i stopy.", "Водій переодягається: захисне взуття, сигнальний жилет, знімає шарф і перстень. Погляд у дзеркало, потім перевірка перед роботою. У кадрі лише руки й ноги."),
            length: t("20 bis 30 Sekunden", "20 to 30 seconds", "20 do 30 sekund", "20–30 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>UVV sind Recht</b> für Unternehmer und Beschäftigte. Die DGUV Vorschrift 68 gilt auch für den Handhubwagen.", "<b>Accident prevention regulations are law</b> for employers and employees. DGUV Regulation 68 also covers the hand pallet truck.", "<b>Przepisy BHP (UVV) to prawo</b> dla pracodawców i pracowników. DGUV Vorschrift 68 obejmuje też ręczny wózek paletowy.", "<b>Правила запобігання нещасним випадкам (UVV) — це право</b> для роботодавців і працівників. DGUV Vorschrift 68 охоплює й ручний палетний візок.")),
            pt(t("<b>Nein sagen</b> zu Weisungen gegen die Sicherheit, Mängel sofort melden.", "<b>Say no</b> to instructions against safety, report defects immediately.", "<b>Odmawiaj</b> poleceń sprzecznych z bezpieczeństwem, usterki zgłaszaj od razu.", "<b>Відмовляй</b> у вказівках проти безпеки, про несправності повідомляй одразу.")),
            pt(t("<b>Eignung</b> jeden Tag, PSA immer, ein Schein gilt nur für seine Bauart und seinen Betrieb.", "<b>Fitness</b> every day, PPE always, a licence only applies to its type and its company.", "<b>Predyspozycje</b> każdego dnia, środki ochrony indywidualnej zawsze, uprawnienie obowiązuje tylko dla danego typu wózka i zakładu.", "<b>Придатність</b> щодня, засоби індивідуального захисту завжди, посвідчення діє лише для свого типу техніки й підприємства.")),
        ] }),
    ];
}

/* ════════════════ 5.5 Sicht, Rückwärtsfahren und Mitgänger-Geräte ════════════════ */
export function lesson55(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Rückwärts heißt: umdrehen", "Reversing means turning round", "Jazda tyłem: obróć się", "Задній хід — це обернутися"),
            lead: t("Wohin du fährst, dorthin schaust du. Auch rückwärts.", "Where you drive, you look. Backwards too.", "Gdzie jedziesz, tam patrzysz. Także do tyłu.", "Куди їдеш, туди й дивишся. І назад теж."),
            points: [
                pt(t("<b>In Fahrtrichtung blicken:</b> Beim Rückwärtsfahren drehst du Kopf und Oberkörper so weit, dass du die Fahrstrecke wirklich siehst.", "<b>Look in the direction of travel:</b> when reversing, turn your head and upper body far enough to really see the path.", "<b>Patrz w kierunku jazdy:</b> jadąc tyłem obracasz głowę i tułów tak, by naprawdę widzieć drogę.", "<b>Дивись у напрямку руху:</b> їдучи назад, повертай голову й корпус так, щоб справді бачити шлях.")),
                pt(t("<b>Spiegel und Kamera</b> sind Hilfsmittel. Sie ersetzen den Blick in Fahrtrichtung nicht.", "<b>Mirrors and cameras</b> are aids. They do not replace looking in the direction of travel.", "<b>Lusterka i kamera</b> to tylko pomoc. Nie zastępują patrzenia w kierunku jazdy.", "<b>Дзеркала й камера</b> — лише допомога. Вони не замінюють погляду в напрямку руху.")),
                pt(t("<b>Vorher anhalten:</b> Vor jedem Fahrtrichtungswechsel stehst du ganz, dann schaust du dich um, dann fährst du.", "<b>Stop first:</b> before every change of direction you stop fully, then look around, then drive.", "<b>Najpierw się zatrzymaj:</b> przed każdą zmianą kierunku stajesz całkowicie, rozglądasz się, potem jedziesz.", "<b>Спершу зупинись:</b> перед кожною зміною напрямку повністю стань, озирнися, потім їдь.")),
                pt(t("<b>Warnen:</b> An unübersichtlichen Stellen, Kreuzungen und Toren gibst du rechtzeitig ein Signal.", "<b>Warn:</b> at blind spots, crossings and gates, give a signal in good time.", "<b>Ostrzegaj:</b> w miejscach bez widoczności, na skrzyżowaniach i przy bramach dawaj sygnał zawczasu.", "<b>Попереджай:</b> у місцях без огляду, на перехрестях і біля воріт вчасно подавай сигнал.")),
            ],
            merke: t("Erst stehen, dann schauen, dann fahren.", "Stop first, then look, then drive.", "Najpierw stań, potem patrz, potem jedź.", "Спершу стань, потім глянь, потім їдь."),
            src: { de: `${V68} §12 mit DA; ${G308E}, Übungen Gabelstapler („in Fahrtrichtung blicken“)` },
        }),
        step("question", {
            title: t("Der neue Rückspiegel", "The new mirror", "Nowe lusterko", "Нове дзеркало"),
            text: t("Dein Stapler hat jetzt einen großen Rückspiegel und eine Rückfahrkamera. Ein Kollege meint, Umdrehen sei damit überflüssig.", "Your forklift now has a large mirror and a reversing camera. A colleague says turning round is now unnecessary.", "Twój wózek ma teraz duże lusterko i kamerę cofania. Kolega twierdzi, że obracanie się jest już zbędne.", "У твоєму навантажувачі тепер велике дзеркало й камера заднього виду. Колега каже, що обертатися вже не треба."),
            layout: "list",
            options: [
                t("Trotzdem umdrehen und in Fahrtrichtung blicken, Spiegel und Kamera ergänzen nur", "Still turn round and look in the direction of travel; mirror and camera only add to it", "Mimo to się obrócić i patrzeć w kierunku jazdy, lusterko i kamera tylko pomagają", "Все одно обернутися й дивитися в напрямку руху, дзеркало й камера лише доповнюють"),
                t("Stimmt, mit Kamera reicht der Blick auf den Bildschirm", "True, with a camera the screen is enough", "Zgadza się, z kamerą wystarczy ekran", "Так, із камерою досить дивитися на екран"),
                t("Stimmt, aber nur, wenn die Hupe dauernd betätigt wird", "True, but only if you keep sounding the horn", "Zgadza się, ale tylko przy ciągłym trąbieniu", "Так, але лише якщо постійно сигналити"),
                t("Umdrehen nur, wenn du mit Last fährst", "Turn round only when driving with a load", "Obracać się tylko przy jeździe z ładunkiem", "Обертатися лише з вантажем"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das reicht nicht", "No, that is not enough", "Nie, to nie wystarczy", "Ні, цього недостатньо") },
            body: t("Spiegel und Kamera zeigen nur Ausschnitte und haben tote Winkel. Rückwärtsfahren ohne Umschauen ist eine der häufigsten Ursachen, wenn Fußgänger angefahren werden.", "Mirrors and cameras only show sections and have blind spots. Reversing without looking around is one of the most common causes of pedestrians being hit.", "Lusterka i kamera pokazują tylko wycinki i mają martwe pola. Jazda tyłem bez rozglądania się to jedna z najczęstszych przyczyn potrąceń pieszych.", "Дзеркала й камера показують лише частину й мають сліпі зони. Задній хід без огляду — одна з найчастіших причин наїздів на пішоходів."),
            src: { de: `DGUV G 308-001, Anhang 1 Nr. 8 (Sichthilfsmittel, Rückwärtsfahren); ${STAT24}, Tab. 59` },
        }),
        step("learn", {
            title: t("Tore, Durchfahrten und Streifenvorhänge", "Gates, passages and strip curtains", "Bramy, przejazdy i kurtyny paskowe", "Ворота, проїзди й стрічкові завіси"),
            lead: t("Hinter einem Tor oder Vorhang siehst du nicht, wer kommt. Und wer dort steht, sieht dich nicht.", "Behind a gate or curtain you cannot see who is coming. And whoever stands there cannot see you.", "Za bramą czy kurtyną nie widzisz, kto idzie. A kto tam stoi, nie widzi ciebie.", "За воротами чи завісою не видно, хто йде. І той, хто там стоїть, не бачить тебе."),
            points: [
                pt(t("<b>Schrittgeschwindigkeit</b> durch Tore, Engstellen und Streifenvorhänge, mit erhöhter Aufmerksamkeit und rechtzeitigem Signal.", "<b>Walking pace</b> through gates, narrow points and strip curtains, with extra attention and a signal in good time.", "<b>Tempo pieszego</b> przez bramy, przewężenia i kurtyny paskowe, ze wzmożoną uwagą i sygnałem zawczasu.", "<b>Швидкість пішохода</b> через ворота, звуження й стрічкові завіси, з підвищеною увагою й вчасним сигналом.")),
                pt(t("<b>Durchfahrtshöhe:</b> Mast, Schutzdach und Last müssen durchpassen. Halb geöffnete Rolltore, Rohre und Lüftungskanäle verengen die Höhe.", "<b>Clearance height:</b> mast, overhead guard and load must fit through. Half-open roller doors, pipes and ducts reduce the height.", "<b>Wysokość przejazdu:</b> maszt, daszek ochronny i ładunek muszą się zmieścić. Na wpół otwarte bramy rolowane, rury i kanały wentylacyjne zmniejszają wysokość.", "<b>Висота проїзду:</b> щогла, дах і вантаж мають пройти. Напіввідчинені рольворота, труби й вентканали зменшують висоту.")),
                pt(t("<b>Streifenvorhang:</b> Er nimmt die Sicht, ist oft verschmutzt oder beschlagen. Nicht zügig durchstoßen, sondern langsam und bremsbereit hindurch.", "<b>Strip curtain:</b> it blocks the view and is often dirty or misted. Do not push through quickly; go slowly and ready to brake.", "<b>Kurtyna paskowa:</b> zasłania widok, często jest brudna lub zaparowana. Nie przebijaj się szybko, przejeżdżaj powoli i w gotowości do hamowania.", "<b>Стрічкова завіса:</b> закриває огляд, часто брудна чи запітніла. Не пробивай її швидко, а проїжджай повільно й готовим гальмувати.")),
                pt(t("<b>Personentüren</b> neben dem Tor benutzen Fußgänger. Das Tor ist für Fahrzeuge.", "<b>Pedestrian doors</b> next to the gate are for people on foot. The gate is for vehicles.", "<b>Drzwi dla pieszych</b> obok bramy są dla pieszych. Brama jest dla pojazdów.", "<b>Двері для людей</b> поруч із воротами — для пішоходів. Ворота — для техніки.")),
            ],
            merke: t("Je weniger du siehst, desto langsamer fährst du.", "The less you see, the slower you drive.", "Im mniej widzisz, tym wolniej jedziesz.", "Що менше бачиш, то повільніше їдеш."),
            src: { de: `${I208} Abschn. 6.2; DGUV G 308-001, Anhang 1 Nr. 10 (Engpässe, Tore und Durchfahrten)` },
        }),
        step("question", {
            title: t("Der Streifenvorhang", "The strip curtain", "Kurtyna paskowa", "Стрічкова завіса"),
            text: t("Die Durchfahrt ins Kühllager hat einen dicken, beschlagenen Kunststoff-Streifenvorhang. Du kommst mit Last.", "The passage to the cold store has a thick, misted plastic strip curtain. You arrive with a load.", "Przejazd do chłodni ma grubą, zaparowaną kurtynę z pasków. Nadjeżdżasz z ładunkiem.", "Проїзд до холодильного складу має товсту запітнілу пластикову завісу. Ти під’їжджаєш із вантажем."),
            layout: "list",
            options: [
                t("Auf Schrittgeschwindigkeit verringern, Signal geben und aufmerksam hindurchfahren", "Slow to walking pace, sound the horn and pass through attentively", "Zwolnić do tempa pieszego, dać sygnał i uważnie przejechać", "Знизити до швидкості пішохода, подати сигнал і уважно проїхати"),
                t("Zügig durchfahren, damit sich der Vorhang sauber teilt", "Drive through briskly so the curtain parts cleanly", "Przejechać sprawnie, żeby kurtyna ładnie się rozsunęła", "Проїхати жваво, щоб завіса рівно розійшлася"),
                t("Normal weiterfahren und nur hupen", "Carry on as normal and just sound the horn", "Jechać normalnie i tylko zatrąbić", "Їхати як зазвичай і лише подати сигнал"),
                t("Last anheben, um über den Vorhang hinwegzusehen", "Raise the load to see over the curtain", "Podnieść ładunek, by widzieć ponad kurtyną", "Підняти вантаж, щоб бачити над завісою"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, dahinter kann jemand stehen", "No, someone may be behind it", "Nie, ktoś może za nią stać", "Ні, за нею може хтось стояти") },
            body: t("Wer hinter dem Vorhang steht, sieht dich nicht und du ihn nicht. Langsam, mit Signal und bremsbereit ist die einzige sichere Art. Mit angehobener Last fährst du nie.", "Whoever is behind the curtain cannot see you and you cannot see them. Slowly, with a signal and ready to brake is the only safe way. You never drive with a raised load.", "Kto stoi za kurtyną, nie widzi ciebie, a ty jego. Powoli, z sygnałem i gotowością do hamowania to jedyny bezpieczny sposób. Z podniesionym ładunkiem nigdy nie jeździsz.", "Хто за завісою, не бачить тебе, а ти його. Повільно, із сигналом і готовністю гальмувати — єдиний безпечний спосіб. З піднятим вантажем не їздиш ніколи."),
            src: { de: `${V68} §12 mit DA; ${I208} Abschn. 6.2` },
        }),
        step("learn", {
            title: t("Mitgänger-Geräte richtig führen", "Handling pedestrian-controlled trucks", "Prawidłowe prowadzenie wózków prowadzonych", "Правильне керування візками із супроводом"),
            lead: t("2024 gab es über 3.000 meldepflichtige Unfälle mit kraftbetriebenen Mitgänger-Geräten. Klein heißt nicht harmlos.", "In 2024 there were more than 3,000 reportable accidents with powered pedestrian-controlled trucks. Small does not mean harmless.", "W 2024 było ponad 3000 wypadków podlegających zgłoszeniu z wózkami prowadzonymi z napędem. Mały nie znaczy niegroźny.", "У 2024 було понад 3000 нещасних випадків з електричними візками із супроводом. Малий не означає безпечний."),
            points: [
                pt(t("<b>Deichsel:</b> In der oberen und unteren Endstellung bremst das Gerät. Lässt du los, schwenkt sie hoch und das Gerät hält an.", "<b>Tiller:</b> in the upper and lower end positions the truck brakes. If you let go, it swings up and the truck stops.", "<b>Dyszel:</b> w górnym i dolnym położeniu krańcowym wózek hamuje. Gdy go puścisz, unosi się i wózek staje.", "<b>Дишло:</b> у верхньому й нижньому крайньому положенні візок гальмує. Якщо відпустиш, воно піднімається й візок зупиняється.")),
                pt(t("<b>Auffahrschutz:</b> Der Sicherheitsschalter am Deichselkopf kehrt die Fahrtrichtung um, wenn du gegen ihn gedrückt wirst.", "<b>Anti-crush switch:</b> the safety switch on the tiller head reverses the direction if you are pushed against it.", "<b>Ochrona przed przygnieceniem:</b> wyłącznik na głowicy dyszla odwraca kierunek jazdy, gdy zostaniesz do niego dociśnięty.", "<b>Захист від затискання:</b> вимикач на голівці дишла змінює напрямок, якщо тебе до нього притисне.")),
                pt(t("<b>Seitlich gehen:</b> Du gehst neben der Deichsel, nicht direkt davor, und hältst die Füße weg vom Fahrwerk. Sicherheitsschuhe sind Pflicht.", "<b>Walk to the side:</b> you walk next to the tiller, not right in front of it, and keep your feet away from the chassis. Safety shoes are mandatory.", "<b>Idź z boku:</b> idziesz obok dyszla, nie bezpośrednio przed nim, i trzymasz stopy z dala od podwozia. Obuwie ochronne jest obowiązkowe.", "<b>Іди збоку:</b> ти йдеш поруч із дишлом, не прямо перед ним, і тримаєш ноги подалі від шасі. Захисне взуття обов’язкове.")),
                pt(t("<b>An Wänden und Regalen</b> besteht Quetschgefahr zwischen Deichsel und Hindernis. Dort langsam fahren, nutze die Langsamfahrt, wenn vorhanden.", "<b>Near walls and racks</b> there is a crushing hazard between tiller and obstacle. Drive slowly there; use creep speed if available.", "<b>Przy ścianach i regałach</b> grozi przygniecenie między dyszlem a przeszkodą. Jedź tam powoli, użyj trybu wolnej jazdy, jeśli jest.", "<b>Біля стін і стелажів</b> є небезпека затискання між дишлом і перешкодою. Там їдь повільно, використовуй повільний режим, якщо є.")),
            ],
            merke: t("Das Gerät hält an, wenn du loslässt. Darum nie die Deichsel festklemmen oder überbrücken.", "The truck stops when you let go. So never clamp or bypass the tiller.", "Wózek staje, gdy puścisz. Dlatego nigdy nie blokuj ani nie mostkuj dyszla.", "Візок зупиняється, коли відпускаєш. Тому ніколи не фіксуй дишло й не обходь його захист."),
            src: { de: `DIN EN ISO 3691-1; ${G308E}, Abschn. 3.2.9; ${STAT24}, Tab. 58` },
        }),
        step("sort", {
            title: t("Wofür ist das da?", "What is this for?", "Do czego to służy?", "Для чого це?"),
            lead: t("Stoppt sie das Gerät, warnt sie andere oder schützt sie dich vor dem Einklemmen?", "Does it stop the truck, warn others or protect you from being trapped?", "Zatrzymuje wózek, ostrzega innych czy chroni cię przed przygnieceniem?", "Зупиняє машину, попереджає інших чи захищає тебе від затискання?"),
            labels: [t("Stoppen", "Stop", "Zatrzymuje", "Зупиняє"), t("Warnen", "Warn", "Ostrzega", "Попереджає"), t("Schützen", "Protect", "Chroni", "Захищає")],
            items: [
                { t: t("Not-Aus-Schalter oder Batteriestecker", "Emergency stop or battery connector", "Wyłącznik awaryjny lub wtyk akumulatora", "Аварійний вимикач або роз’єм батареї"), a: 0, why: t("Trennt im Notfall alle Fahr- und Hubbewegungen.", "Cuts all travel and lift movements in an emergency.", "W nagłym wypadku odcina wszystkie ruchy jazdy i podnoszenia.", "У разі небезпеки вимикає всі рухи їзди й підйому.") },
                { t: t("Deichsel loslassen", "Letting go of the tiller", "Puszczenie dyszla", "Відпущене дишло"), a: 0, why: t("Die Deichsel geht in die Endstellung und bremst.", "The tiller goes to its end position and brakes.", "Dyszel wraca do położenia krańcowego i hamuje.", "Дишло йде в крайнє положення й гальмує.") },
                { t: t("Hupe", "Horn", "Klakson", "Звуковий сигнал"), a: 1, why: t("Akustisches Warnsignal.", "Acoustic warning signal.", "Ostrzeżenie dźwiękowe.", "Звукове попередження.") },
                { t: t("Blaues Warnlicht auf dem Boden", "Blue warning light on the floor", "Niebieskie światło ostrzegawcze na podłodze", "Синє попереджувальне світло на підлозі"), a: 1, why: t("Zeigt Fußgängern, dass ein Fahrzeug kommt.", "Shows pedestrians that a vehicle is coming.", "Pokazuje pieszym, że nadjeżdża pojazd.", "Показує пішоходам, що їде машина.") },
                { t: t("Sicherheitsschalter am Deichselkopf", "Safety switch on the tiller head", "Wyłącznik bezpieczeństwa na głowicy dyszla", "Вимикач безпеки на голівці дишла"), a: 2, why: t("Kehrt die Fahrtrichtung um, wenn du angedrückt wirst.", "Reverses direction if you are pressed against it.", "Odwraca kierunek jazdy, gdy zostaniesz dociśnięty.", "Змінює напрямок руху, якщо тебе притисне.") },
                { t: t("Seitenschutz der Fahrerplattform", "Side guards of the operator platform", "Osłony boczne platformy operatora", "Бокові захисти платформи"), a: 2, why: t("Halten Füße und Körper innerhalb der Plattform.", "Keep feet and body inside the platform.", "Utrzymują stopy i ciało wewnątrz platformy.", "Тримають ноги й тіло в межах платформи.") },
            ],
            allRight: t("Genau. Diese Einrichtungen prüfst du auch bei der Einsatzprüfung.", "Exactly. You also check these devices in the daily check.", "Dokładnie. Te urządzenia sprawdzasz też podczas kontroli przed pracą.", "Саме так. Ці пристрої ти перевіряєш і під час щоденної перевірки."),
            someWrong: t("Not-Aus und Deichsel stoppen, Hupe und Licht warnen, Schalter und Seitenschutz schützen dich.", "Emergency stop and tiller stop the truck, horn and light warn, safety switch and guards protect you.", "Wyłącznik awaryjny i dyszel zatrzymują, klakson i światło ostrzegają, wyłącznik bezpieczeństwa i osłony chronią ciebie.", "Аварійний вимикач і дишло зупиняють, сигнал і світло попереджають, вимикач безпеки й бокові захисти бережуть тебе."),
        }),
        step("learn", {
            title: t("Not-Aus: kennen, prüfen, benutzen", "Emergency stop: know it, check it, use it", "Wyłącznik awaryjny: znaj, sprawdzaj, używaj", "Аварійний вимикач: знай, перевіряй, використовуй"),
            lead: t("Jedes elektrische Flurförderzeug hat einen Not-Aus-Schalter oder einen Batteriestecker, den du im Notfall ziehst.", "Every electric industrial truck has an emergency stop switch or a battery connector you pull in an emergency.", "Każdy elektryczny wózek ma wyłącznik awaryjny albo wtyk akumulatora, który wyciągasz w nagłym wypadku.", "Кожен електричний навантажувач має аварійний вимикач або роз’єм батареї, який висмикуєш у разі небезпеки."),
            points: [
                pt(t("<b>Wann:</b> wenn der Stapler nicht mehr auf Fahrschalter oder Bremse reagiert, wenn er von selbst fährt oder hebt, bei Rauch oder Brandgeruch.", "<b>When:</b> if the truck no longer responds to the controls or brake, moves or lifts by itself, or with smoke or a burning smell.", "<b>Kiedy:</b> gdy wózek nie reaguje na sterowanie lub hamulec, sam jedzie albo podnosi, przy dymie lub zapachu spalenizny.", "<b>Коли:</b> якщо навантажувач не реагує на керування чи гальмо, сам їде чи піднімає, при диму чи запаху горілого.")),
                pt(t("<b>Täglich prüfen:</b> Not-Aus betätigen, der Stapler darf nicht mehr fahren oder heben. Zur Einsatzprüfung gehören auch Feststellbremse, Hupe, Ladezustand und Rückhaltesystem.", "<b>Check daily:</b> press the emergency stop; the truck must no longer drive or lift. The daily check also covers parking brake, horn, charge level and restraint system.", "<b>Sprawdzaj codziennie:</b> wciśnij wyłącznik, wózek nie może jechać ani podnosić. Kontrola przed pracą obejmuje też hamulec postojowy, klakson, stan naładowania i system przytrzymujący.", "<b>Перевіряй щодня:</b> натисни аварійний вимикач — навантажувач не повинен їхати чи піднімати. Щоденна перевірка включає й стоянкове гальмо, сигнал, заряд і систему утримання.")),
                pt(t("<b>Wissen, wo er ist:</b> Bei jedem neuen Gerät suchst du den Not-Aus zuerst. Im Ernstfall bleibt keine Zeit zum Suchen.", "<b>Know where it is:</b> on every new truck, find the emergency stop first. In an emergency there is no time to look.", "<b>Wiedz, gdzie jest:</b> w każdym nowym urządzeniu najpierw znajdź wyłącznik awaryjny. W nagłej sytuacji nie ma czasu na szukanie.", "<b>Знай, де він:</b> на кожній новій машині спершу знайди аварійний вимикач. У разі небезпеки на пошуки немає часу.")),
            ],
            merke: t("Not-Aus ist kein Ersatz für die Bremse im Alltag, aber deine letzte Rettung, wenn nichts anderes mehr geht.", "The emergency stop is not an everyday brake, but your last resort when nothing else works.", "Wyłącznik awaryjny to nie codzienny hamulec, ale ostatnia deska ratunku, gdy nic innego nie działa.", "Аварійний вимикач — не повсякденне гальмо, а останній порятунок, коли нічого іншого не працює."),
            src: { de: `${G308E}, Abschn. 3.2.9 (Notausschalter/Batteriestecker); ${I208} Abschn. 5` },
        }),
        step("learn", {
            title: t("Geräte mit Fahrerstand", "Trucks with an operator platform", "Wózki z platformą operatora", "Машини з платформою оператора"),
            lead: t("Viele Mitgänger-Geräte haben eine klappbare Plattform. Dann fährst du mit, und es gelten zusätzliche Regeln.", "Many pedestrian trucks have a folding platform. Then you ride along, and extra rules apply.", "Wiele wózków prowadzonych ma składaną platformę. Wtedy jedziesz na nich i obowiązują dodatkowe zasady.", "Багато візків із супроводом мають відкидну платформу. Тоді ти їдеш на ній, і діють додаткові правила."),
            points: [
                pt(t("<b>Mitfahren nur auf der Plattform:</b> Seitenschutz hochgeklappt, beide Füße innerhalb, Hände an den Bedienelementen.", "<b>Ride only on the platform:</b> side guards folded up, both feet inside, hands on the controls.", "<b>Jazda tylko na platformie:</b> osłony boczne podniesione, obie stopy w środku, ręce na sterowaniu.", "<b>Їзда лише на платформі:</b> бокові захисти підняті, обидві ноги всередині, руки на органах керування.")),
                pt(t("<b>Rückwärts erlaubt, aber umdrehen:</b> Du drehst dich vollständig so, dass du die Fahrstrecke einsiehst. Ein kurzer Blick über die Schulter reicht nicht.", "<b>Reversing is allowed, but turn round:</b> turn fully so that you can see the route. A quick glance over the shoulder is not enough.", "<b>Jazda tyłem dozwolona, ale się obróć:</b> obróć się całkowicie, żeby widzieć drogę. Krótkie spojrzenie przez ramię nie wystarczy.", "<b>Задній хід дозволений, але обернися:</b> обертаєшся повністю, щоб бачити шлях. Короткого погляду через плече недостатньо.")),
                pt(t("<b>Keine Beifahrer:</b> Die Plattform ist für eine Person. Andere fahren nicht mit.", "<b>No passengers:</b> the platform is for one person. Nobody else rides along.", "<b>Bez pasażerów:</b> platforma jest dla jednej osoby. Nikt inny nie może na niej jechać.", "<b>Без пасажирів:</b> платформа для однієї людини. Ніхто інший на ній не їде.")),
                pt(t("<b>In engen Bereichen</b> und bei viel Fußgängerverkehr klappst du die Plattform hoch und gehst.", "<b>In tight areas</b> and with many pedestrians, fold the platform up and walk.", "<b>W ciasnych miejscach</b> i przy dużym ruchu pieszych składasz platformę i idziesz.", "<b>У тісних місцях</b> і за великої кількості пішоходів склади платформу й іди пішки.")),
            ],
            merke: t("Ob du mitfährst oder gehst: Du schaust immer in Fahrtrichtung.", "Whether you ride or walk, you always look in the direction of travel.", "Czy jedziesz, czy idziesz: zawsze patrzysz w kierunku jazdy.", "Їдеш чи йдеш — завжди дивишся в напрямку руху."),
            src: { de: `${G308E}, Anhang A (Niederhub- und Hochhub-MFFZ mit klappbarer Plattform); ${V68} §12` },
        }),
        step("question", {
            title: t("Rückwärts mit Fahrerstand", "Reversing on a platform truck", "Tyłem na platformie", "Задній хід на платформі"),
            text: t("Du stehst auf der Plattform eines Mitgänger-Hubwagens und musst ein paar Meter zurück.", "You are standing on the platform of a pedestrian pallet truck and need to go back a few metres.", "Stoisz na platformie wózka prowadzonego i musisz cofnąć się kilka metrów.", "Ти стоїш на платформі візка й маєш проїхати кілька метрів назад."),
            layout: "list",
            options: [
                t("Rückwärts fahren und dich dabei vollständig umdrehen", "Reverse and turn round completely while doing so", "Jechać tyłem i obrócić się całkowicie", "Їхати назад і повністю обернутися"),
                t("Rückwärts ist auf Mitgänger-Geräten grundsätzlich verboten", "Reversing is generally forbidden on pedestrian trucks", "Na wózkach prowadzonych jazda tyłem jest całkowicie zakazana", "Задній хід на візках із супроводом заборонений"),
                t("Kurzer Blick über die Schulter, der Körper bleibt nach vorn", "A quick glance over the shoulder, body stays facing forward", "Krótkie spojrzenie przez ramię, ciało zostaje zwrócone do przodu", "Короткий погляд через плече, корпус лишається повернутим уперед"),
                t("Rückwärts nur mit eingeschalteter Hupe, ohne umzudrehen", "Reverse only with the horn on, without turning round", "Tyłem tylko z włączonym klaksonem, bez obracania", "Їхати назад лише з увімкненим сигналом, не обертаючись"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, du musst die Strecke sehen", "No, you must see the route", "Nie, musisz widzieć drogę", "Ні, ти маєш бачити шлях") },
            body: t("Rückwärtsfahren ist erlaubt. Entscheidend ist, dass du die Fahrstrecke wirklich einsiehst. Ein Schulterblick zeigt nur einen kleinen Ausschnitt.", "Reversing is allowed. What matters is that you really see the route. A glance over the shoulder only shows a small section.", "Jazda tyłem jest dozwolona. Ważne, żebyś naprawdę widział drogę. Spojrzenie przez ramię pokazuje tylko wycinek.", "Задній хід дозволений. Головне — справді бачити шлях. Погляд через плече показує лише частину."),
            src: { de: `${G308E}, Übungen („in Fahrtrichtung blicken“)` },
        }),
        step("choice", {
            title: QUIZ,
            items: [
                { q: t("Du fährst rückwärts und hast einen Rückspiegel. Was gilt?", "You are reversing and have a mirror. What applies?", "Jedziesz tyłem i masz lusterko. Co obowiązuje?", "Ти їдеш назад і маєш дзеркало. Що діє?"),
                    options: [t("Du blickst trotzdem in Fahrtrichtung", "You still look in the direction of travel", "Mimo to patrzysz w kierunku jazdy", "Ти все одно дивишся в напрямку руху"), t("Der Spiegel ersetzt das Umschauen", "The mirror replaces looking round", "Lusterko zastępuje rozglądanie się", "Дзеркало замінює огляд"), t("Umschauen nur bei Fahrten über 10 m", "Look round only for trips over 10 m", "Rozglądasz się tylko przy trasach ponad 10 m", "Озираєшся лише на відстанях понад 10 м"), t("Umschauen nur, wenn du Last trägst", "Look round only when carrying a load", "Rozglądasz się tylko z ładunkiem", "Озираєшся лише з вантажем")], correct: 0,
                    why: t("Spiegel und Kamera sind Hilfsmittel mit toten Winkeln.", "Mirrors and cameras are aids with blind spots.", "Lusterka i kamery to tylko pomoce i mają martwe pola.", "Дзеркала й камери — лише допомога, і вони мають сліпі зони.") },
                { q: t("Was passiert bei einem Mitgänger-Gerät, wenn du die Deichsel loslässt?", "What happens on a pedestrian truck when you let go of the tiller?", "Co się dzieje w wózku prowadzonym, gdy puścisz dyszel?", "Що стається з візком, коли відпускаєш дишло?"),
                    options: [t("Sie geht in die Endstellung und das Gerät bremst", "It goes to its end position and the truck brakes", "Wraca do położenia krańcowego i wózek hamuje", "Воно йде в крайнє положення й візок гальмує"), t("Das Gerät rollt im Leerlauf weiter", "The truck coasts on in neutral", "Wózek toczy się dalej na luzie", "Візок котиться далі накатом"), t("Das Gerät fährt mit halber Geschwindigkeit weiter", "The truck continues at half speed", "Wózek jedzie dalej z połową prędkości", "Візок їде далі на половині швидкості"), t("Nur die Hubbewegung stoppt", "Only the lifting stops", "Zatrzymuje się tylko podnoszenie", "Зупиняється лише підйом")], correct: 0,
                    why: t("DIN EN ISO 3691-1: Die Deichsel bremst in den Endstellungen.", "DIN EN ISO 3691-1: the tiller brakes in its end positions.", "DIN EN ISO 3691-1: dyszel hamuje w położeniach krańcowych.", "DIN EN ISO 3691-1: дишло гальмує в крайніх положеннях.") },
                { q: t("Was gehört bei einem Elektrostapler zur täglichen Einsatzprüfung?", "What is part of the daily check on an electric forklift?", "Co należy do codziennej kontroli wózka elektrycznego?", "Що входить до щоденної перевірки електронавантажувача?"),
                    options: [t("Feststellbremse, Not-Aus, Ladezustand und Rückhaltesystem", "Parking brake, emergency stop, charge level and restraint", "Hamulec postojowy, wyłącznik awaryjny, naładowanie i system przytrzymujący", "Стоянкове гальмо, аварійний вимикач, заряд і система утримання"), t("Hydrauliköl wechseln", "Changing the hydraulic oil", "Wymiana oleju hydraulicznego", "Заміна гідравлічної оливи"), t("Nur der Ladezustand der Batterie", "Only the battery charge", "Tylko naładowanie akumulatora", "Лише заряд батареї"), t("Nur eine Sichtkontrolle der Reifen", "Only a visual check of the tyres", "Tylko oględziny opon", "Лише огляд шин")], correct: 0,
                    why: t("Funktionsprüfung der Sicherheitseinrichtungen vor Schichtbeginn. Wartungsarbeiten wie Ölwechsel gehören nicht dazu.", "Function check of safety devices before the shift. Maintenance like oil changes is not part of it.", "Sprawdzenie działania urządzeń zabezpieczających przed zmianą. Prace serwisowe, jak wymiana oleju, nie należą do niej.", "Перевірка захисних пристроїв перед зміною. Обслуговування, як-от заміна оливи, сюди не входить.") },
            ],
            allRight: ALL_OK, someWrong: LOOK,
        }),
        step("video", {
            title: t("Rückwärts und durch den Vorhang", "Reversing and through the curtain", "Tyłem i przez kurtynę", "Назад і крізь завісу"),
            brief: t("Fahrer hält an, dreht sich vollständig um und fährt rückwärts. Dann Schrittgeschwindigkeit durch einen Streifenvorhang mit Signal. Danach ein Mitgänger: Deichsel loslassen, Gerät stoppt; Not-Aus zeigen.", "Driver stops, turns round fully and reverses. Then walking pace through a strip curtain with a signal. Then a pedestrian truck: let go of the tiller, it stops; show the emergency stop.", "Operator zatrzymuje się, obraca całkowicie i jedzie tyłem. Potem tempo pieszego przez kurtynę z sygnałem. Następnie wózek prowadzony: puszczenie dyszla, wózek staje; pokazanie wyłącznika awaryjnego.", "Водій зупиняється, повністю обертається і їде назад. Потім крізь завісу зі швидкістю пішохода й сигналом. Далі візок: відпустити дишло — зупинка; показати аварійний вимикач."),
            length: t("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Rückwärts:</b> erst anhalten, dann vollständig umdrehen. Spiegel und Kamera helfen nur.", "<b>Reversing:</b> stop first, then turn round fully. Mirror and camera only help.", "<b>Tyłem:</b> najpierw stań, potem obróć się całkowicie. Lusterko i kamera tylko pomagają.", "<b>Назад:</b> спершу зупинись, потім повністю обернися. Дзеркало й камера лише допомагають.")),
            pt(t("<b>Tore und Vorhänge:</b> Schrittgeschwindigkeit, Signal, Durchfahrtshöhe beachten.", "<b>Gates and curtains:</b> walking pace, signal, mind the clearance height.", "<b>Bramy i kurtyny:</b> tempo pieszego, sygnał, uwaga na wysokość przejazdu.", "<b>Ворота й завіси:</b> швидкість пішохода, сигнал, зважай на висоту проїзду.")),
            pt(t("<b>Mitgänger:</b> seitlich gehen, Deichsel bremst, Not-Aus kennen und täglich prüfen.", "<b>Pedestrian trucks:</b> walk to the side, tiller brakes, know the emergency stop and check it daily.", "<b>Wózki prowadzone:</b> idź z boku, dyszel hamuje, znaj wyłącznik awaryjny i sprawdzaj go codziennie.", "<b>Візки із супроводом:</b> іди збоку, дишло гальмує, знай аварійний вимикач і перевіряй щодня.")),
        ] }),
    ];
}

/* ════════════════ 7.4 Stapeln im Blocklager ════════════════ */
export function lesson74(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Regeln für Stapel", "Rules for stacks", "Zasady piętrowania", "Правила штабелювання"),
            lead: t("Ein Stapel ohne Regal hält nur, wenn er gerade, nicht zu schlank und richtig belastet ist.", "A stack without a rack only holds if it is straight, not too slender and correctly loaded.", "Stos bez regału trzyma się tylko wtedy, gdy jest prosty, nie za smukły i prawidłowo obciążony.", "Штабель без стелажа тримається, лише якщо він рівний, не надто стрункий і правильно навантажений."),
            points: [
                pt(t("<b>Lotrecht errichten.</b> Neigt sich ein Stapel um mehr als 2 %, muss er gefahrlos abgebaut werden, sofort.", "<b>Build plumb.</b> If a stack leans by more than 2 %, it must be dismantled safely, at once.", "<b>Buduj pionowo.</b> Gdy stos przechyla się o więcej niż 2 %, trzeba go natychmiast bezpiecznie rozebrać.", "<b>Будуй вертикально.</b> Якщо штабель нахилився понад 2 %, його треба одразу безпечно розібрати.")),
                pt(t("<b>Schlankheit höchstens 6 : 1:</b> Die Höhe darf höchstens das Sechsfache der schmalsten Seite der Grundfläche betragen.", "<b>Slenderness at most 6 : 1:</b> the height may be at most six times the narrowest side of the base.", "<b>Smukłość najwyżej 6 : 1:</b> wysokość może wynosić najwyżej sześciokrotność najkrótszego boku podstawy.", "<b>Стрункість не більше 6 : 1:</b> висота може бути щонайбільше вшестеро більшою за найвужчу сторону основи.")),
                pt(t("<b>Schwer nach unten:</b> Bei unterschiedlichen Lasten nimmt das Gewicht nach oben ab.", "<b>Heavy at the bottom:</b> with different loads, weight decreases towards the top.", "<b>Ciężkie na dole:</b> przy różnych ładunkach masa maleje ku górze.", "<b>Важке внизу:</b> при різних вантажах маса зменшується догори.")),
                pt(t("<b>Nichts anlehnen:</b> Leitern oder andere Gegenstände nicht an Stapel lehnen, wenn das die Standsicherheit beeinträchtigen kann.", "<b>Lean nothing against it:</b> do not lean ladders or other objects against stacks if this could affect their stability.", "<b>Nic nie opieraj:</b> nie opieraj drabin ani przedmiotów o stos, jeśli może to osłabić jego stateczność.", "<b>Нічого не притуляй:</b> не спирай драбини чи інші предмети на штабель, якщо це може порушити стійкість.")),
                pt(t("<b>Grenzen deines Betriebs:</b> zulässige Stapelhöhen, Nutzlasten und Bodenbelastung nie überschreiten. Verkehrswege bleiben frei.", "<b>Your company’s limits:</b> never exceed permitted stack heights, payloads and floor loads. Traffic routes stay clear.", "<b>Limity obowiązujące w zakładzie:</b> nigdy nie przekraczaj dopuszczalnej wysokości stosów, obciążeń i nacisku na posadzkę. Drogi komunikacyjne pozostają wolne.", "<b>Межі підприємства:</b> ніколи не перевищуй допустиму висоту штабелів, навантаження й тиск на підлогу. Шляхи руху вільні.")),
            ],
            merke: t("Schief, zu schlank oder oben schwer: Dieser Stapel kann auf Menschen fallen.", "Leaning, too slender or top-heavy: this stack can fall on people.", "Krzywy, za smukły albo ciężki u góry: taki stos może spaść na ludzi.", "Похилий, надто стрункий чи важкий згори: такий штабель може впасти на людей."),
            src: { de: `${I061} Abschn. 5.1.4, 5.4.1 bis 5.4.5, 5.4.7` },
        }),
        step("gap", {
            title: t("Wie hoch darf der Stapel werden?", "How high may the stack be?", "Jak wysoki może być stos?", "Наскільки високим може бути штабель?"),
            sentence: t("Gitterboxen mit 0,8 m × 1,2 m Grundfläche: Die schmalste Seite ist {1} m. Bei einer Schlankheit von 6 : 1 darf der Stapel höchstens {2} m hoch sein. Neigt er sich um mehr als {3} %, wird er abgebaut.",
                "Mesh boxes with a 0.8 m × 1.2 m base: the narrowest side is {1} m. With a slenderness of 6 : 1 the stack may be at most {2} m high. If it leans by more than {3} %, it is dismantled.",
                "Palety siatkowe o podstawie 0,8 m × 1,2 m: najkrótszy bok to {1} m. Przy smukłości 6 : 1 stos może mieć najwyżej {2} m. Gdy przechyli się o więcej niż {3} %, rozbiera się go.",
                "Сітчасті бокси з основою 0,8 м × 1,2 м: найвужча сторона — {1} м. За стрункості 6 : 1 штабель може бути щонайбільше {2} м. Якщо нахилиться понад {3} %, його розбирають."),
            chips: ["0,8", "4,8", "2", "1,2", "7,2", "5"].map(num),
            answer: ["0,8", "4,8", "2"],
            success: { title: t("Genau", "Exactly", "Dokładnie", "Саме так"), body: t("6 × 0,8 m = 4,8 m. Gibt dein Betrieb eine niedrigere Stapelhöhe vor, gilt die niedrigere.", "6 × 0.8 m = 4.8 m. If your company sets a lower stack height, the lower one applies.", "6 × 0,8 m = 4,8 m. Jeśli zakład ustala niższą wysokość, obowiązuje niższa.", "6 × 0,8 м = 4,8 м. Якщо на підприємстві встановлено нижчу висоту, діє нижча."), src: { de: `${I061} Abschn. 5.4.2 und 5.4.7` } },
        }),
        step("learn", {
            title: t("Paletten und Gitterboxen stapeln", "Stacking pallets and mesh boxes", "Piętrowanie palet i palet siatkowych", "Штабелювання палет і сітчастих боксів"),
            lead: t("Nicht jede Ladeeinheit ist stapelbar, und auch stapelbare haben Grenzen.", "Not every load unit is stackable, and even stackable ones have limits.", "Nie każda jednostka ładunkowa nadaje się do piętrowania, a te, które się nadają, mają limity.", "Не кожна вантажна одиниця штабелюється, і навіть ті, що штабелюються, мають межі."),
            points: [
                pt(t("<b>Europaletten:</b> Bei vollflächiger, ebener Auflage darf die unterste Palette höchstens das Vierfache ihrer zulässigen Einzellast tragen.", "<b>Euro pallets:</b> with full-surface, level support, the bottom pallet may carry at most four times its permitted single load.", "<b>Europalety:</b> przy pełnym, równym podparciu dolna paleta może przenieść najwyżej czterokrotność dopuszczalnego obciążenia pojedynczej palety.", "<b>Європалети:</b> при повній рівній опорі нижня палета може нести щонайбільше вчетверо більше за допустиме навантаження однієї палети.")),
                pt(t("<b>Gitterboxen:</b> nur unbeschädigte stapeln, Füße müssen in die Aufnahmen der unteren Box greifen. Die Stapellast steht am Schild der Box.", "<b>Mesh boxes:</b> only stack undamaged ones; the feet must sit in the receptacles of the box below. The stacking load is on the box’s plate.", "<b>Palety siatkowe:</b> piętruj tylko nieuszkodzone, stopki muszą wejść w gniazda palety poniżej. Dopuszczalne obciążenie piętrowania jest podane na tabliczce palety.", "<b>Сітчасті бокси:</b> штабелюй лише неушкоджені, ніжки мають заходити в гнізда нижнього боксу. Допустиме навантаження штабелювання вказано на табличці боксу.")),
                pt(t("<b>Direkt auf Ware</b> nur stapeln, wenn deren Stapel- und Tragfähigkeit nachgewiesen ist, etwa durch Kartonaufdruck oder Betriebsanweisung.", "<b>Directly on goods</b> only if their stacking and load capacity is proven, for example by a carton print or operating instructions.", "<b>Bezpośrednio na towarze</b> piętruj tylko wtedy, gdy jego wytrzymałość na nacisk i nośność są potwierdzone, np. nadrukiem na kartonie lub w instrukcji stanowiskowej.", "<b>Прямо на товар</b> штабелюй лише тоді, коли його міцність підтверджено, наприклад написом на коробці чи в робочій інструкції.")),
                pt(t("<b>Abtragen</b> immer von oben, Stück für Stück. Niemand steht dabei im Bereich, in den der Stapel fallen könnte.", "<b>Dismantle</b> always from the top, piece by piece. Nobody stands where the stack could fall.", "<b>Rozbieraj</b> zawsze od góry, sztuka po sztuce. Nikt nie stoi tam, gdzie stos mógłby upaść.", "<b>Розбирай</b> завжди згори, по одному. Ніхто не стоїть там, куди штабель може впасти.")),
            ],
            merke: t("Beschädigte Paletten oder Boxen kommen nie in einen Stapel.", "Damaged pallets or boxes never go into a stack.", "Uszkodzone palety i palety siatkowe nigdy nie trafiają do stosu.", "Пошкоджені палети чи бокси ніколи не йдуть у штабель."),
            src: { de: `${I061} Abschn. 5.4.3, 5.4.6, 5.4.9; ${I208} Abschn. 6.3` },
        }),
        step("question", {
            title: t("Der schiefe Stapel", "The leaning stack", "Krzywy stos", "Похилий штабель"),
            text: t("Im Blocklager fällt dir ein Stapel Gitterboxen auf, der sichtbar zur Seite hängt. Er steht neben einem Gang, durch den Kollegen gehen.", "In the block store you notice a stack of mesh boxes visibly leaning to one side. It stands next to an aisle colleagues walk through.", "W magazynie blokowym zauważasz stos palet siatkowych wyraźnie przechylony na bok. Stoi przy przejściu, którym chodzą koledzy.", "На блоковому складі бачиш штабель боксів, що помітно нахилився вбік. Він стоїть біля проходу, де ходять колеги."),
            layout: "list",
            options: [
                t("Bereich absichern lassen und den Stapel von oben gefahrlos abtragen", "Have the area secured and dismantle the stack safely from the top", "Zlecić zabezpieczenie strefy i bezpiecznie rozebrać stos od góry", "Огородити зону й безпечно розібрати штабель згори"),
                t("Mit den Gabeln von der Seite gerade drücken", "Push it straight from the side with the forks", "Wyprostować go widłami z boku", "Вирівняти вилами збоку"),
                t("Eine schwere Box oben auflegen, damit er sich setzt", "Put a heavy box on top so it settles", "Położyć ciężką paletę siatkową na górze, żeby osiadł", "Покласти важкий бокс зверху, щоб осів"),
                t("Stehen lassen, solange er nicht weiter kippt", "Leave it as long as it does not tip further", "Zostawić, dopóki nie przechyla się dalej", "Залишити, поки не нахиляється далі"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, der Stapel muss weg", "No, the stack must come down", "Nie, stos trzeba rozebrać", "Ні, штабель треба розібрати") },
            body: t("Bei mehr als 2 % Neigung ist der Stapel gefahrlos abzubauen. Schieben belastet ihn seitlich, zusätzliches Gewicht oben macht ihn kopflastig. Beides kann ihn zum Einsturz bringen.", "With more than 2 % lean the stack must be dismantled safely. Pushing loads it sideways; extra weight on top makes it top-heavy. Both can bring it down.", "Przy przechyle ponad 2 % stos trzeba bezpiecznie rozebrać. Pchanie obciąża go z boku, dodatkowa masa na górze czyni go ciężkim u góry. Jedno i drugie może go zawalić.", "При нахилі понад 2 % штабель треба безпечно розібрати. Штовхання навантажує його збоку, додаткова вага згори робить його важким угорі. І те, і інше може його обвалити."),
            src: { de: `${I061} Abschn. 5.4.2 und 5.4.4` },
        }),
        step("choice", {
            title: QUIZ,
            items: [
                { q: t("Ab welcher Neigung muss ein Stapel abgebaut werden?", "From what lean must a stack be dismantled?", "Od jakiego przechyłu stos trzeba rozebrać?", "З якого нахилу штабель треба розібрати?"),
                    options: [t("Ab mehr als 2 %", "More than 2 %", "Powyżej 2 %", "Понад 2 %"), t("Ab mehr als 5 %", "More than 5 %", "Powyżej 5 %", "Понад 5 %"), t("Ab mehr als 10 %", "More than 10 %", "Powyżej 10 %", "Понад 10 %"), t("Erst, wenn er sichtbar kippt", "Only when it is visibly tipping", "Dopiero gdy widocznie się przewraca", "Лише коли помітно перекидається")], correct: 0,
                    why: t("DGUV Information 208-061, Abschn. 5.4.2.", "DGUV Information 208-061, sec. 5.4.2.", "DGUV Information 208-061, pkt 5.4.2.", "DGUV Information 208-061, розд. 5.4.2.") },
                { q: t("Wie hoch darf ein Stapel mit 1,0 m schmalster Grundseite höchstens sein (Schlankheit 6 : 1)?", "How high may a stack with a 1.0 m narrowest base side be at most (slenderness 6 : 1)?", "Jak wysoki może być najwyżej stos o najkrótszym boku podstawy 1,0 m (smukłość 6 : 1)?", "Яка найбільша висота штабеля з найвужчою стороною основи 1,0 м (стрункість 6 : 1)?"),
                    options: [t("6 m", "6 m", "6 m", "6 м"), t("4 m", "4 m", "4 m", "4 м"), t("5 m", "5 m", "5 m", "5 м"), t("So hoch, wie der Stapler heben kann", "As high as the forklift can lift", "Tak wysoko, jak wózek jest w stanie podnieść", "Так високо, як підніме навантажувач")], correct: 0,
                    why: t("6 × 1,0 m = 6 m, sofern der Betrieb keine niedrigere Höhe vorgibt.", "6 × 1.0 m = 6 m, unless the company sets a lower height.", "6 × 1,0 m = 6 m, chyba że zakład ustala niższą wysokość.", "6 × 1,0 м = 6 м, якщо підприємство не встановило нижчу висоту.") },
                { q: t("Unterschiedlich schwere Lasten im Stapel. Wie ordnest du sie?", "Loads of different weights in a stack. How do you arrange them?", "Ładunki o różnej masie w stosie. Jak je układasz?", "Вантажі різної маси в штабелі. Як їх розташуєш?"),
                    options: [t("Schwere unten, leichte oben", "Heavy at the bottom, light on top", "Ciężkie na dole, lekkie na górze", "Важкі внизу, легкі вгорі"), t("Leichte unten, schwere oben", "Light at the bottom, heavy on top", "Lekkie na dole, ciężkie na górze", "Легкі внизу, важкі вгорі"), t("Abwechselnd schwer und leicht", "Alternating heavy and light", "Na przemian ciężkie i lekkie", "Почергово важкі й легкі"), t("Egal, Hauptsache gerade", "It does not matter as long as it is straight", "Obojętne, byle prosto", "Байдуже, аби рівно")], correct: 0,
                    why: t("DGUV Information 208-061, Abschn. 5.4.4: Lasten nehmen nach oben ab.", "DGUV Information 208-061, sec. 5.4.4: loads decrease towards the top.", "DGUV Information 208-061, pkt 5.4.4: obciążenie maleje ku górze.", "DGUV Information 208-061, розд. 5.4.4: навантаження зменшується догори.") },
            ],
            allRight: ALL_OK, someWrong: LOOK,
        }),
        step("video", {
            title: t("Stapeln im Blocklager", "Stacking in the block store", "Piętrowanie w magazynie blokowym", "Штабелювання на блоковому складі"),
            brief: t("Fahrer stapelt drei Gitterboxen: Mast senkrecht, Füße der Box in die Aufnahmen, langsam absenken. Dann ein schiefer Stapel mit Wasserwaage, Bereich absperren, von oben abtragen.", "Driver stacks three mesh boxes: mast vertical, box feet into the receptacles, lower slowly. Then a leaning stack with a spirit level, area cordoned off, dismantled from the top.", "Operator piętruje trzy palety siatkowe: maszt pionowo, stopki w gniazda, powolne opuszczanie. Potem krzywy stos z poziomicą, odgrodzenie strefy, rozbieranie od góry.", "Водій штабелює три бокси: щогла вертикально, ніжки в гнізда, повільне опускання. Потім похилий штабель із рівнем, зону огороджено, розбирання згори."),
            length: t("40 bis 60 Sekunden", "40 to 60 seconds", "40 do 60 sekund", "40–60 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Lotrecht,</b> bei mehr als 2 % Neigung abbauen.", "<b>Plumb;</b> dismantle if it leans more than 2 %.", "<b>Pionowo,</b> przy przechyle ponad 2 % rozebrać.", "<b>Вертикально,</b> при нахилі понад 2 % розібрати.")),
            pt(t("<b>Höchstens 6 : 1</b> zur schmalsten Seite, schwer nach unten, nichts anlehnen.", "<b>At most 6 : 1</b> to the narrowest side, heavy at the bottom, lean nothing against it.", "<b>Najwyżej 6 : 1</b> do najkrótszego boku, ciężkie na dole, nic nie opierać.", "<b>Не більше 6 : 1</b> до найвужчої сторони, важке внизу, нічого не притуляти.")),
            pt(t("<b>Nur Unbeschädigtes</b> stapeln, von oben abtragen, Wege frei.", "<b>Only stack undamaged</b> units, dismantle from the top, keep routes clear.", "<b>Piętruj tylko nieuszkodzone ładunki,</b> rozbieraj od góry, drogi zostają wolne.", "<b>Штабелюй лише неушкоджене,</b> розбирай згори, шляхи вільні.")),
        ] }),
    ];
}

/* ════════════════ 8.4 Freileitungen und Strom ════════════════ */
export function lesson84(step: Mk): Step[] {
    return [
        step("learn", {
            title: t("Abstand zu Freileitungen", "Distance from overhead lines", "Odległość od linii napowietrznych", "Відстань до повітряних ліній"),
            lead: t("Strom springt über. Du musst eine Leitung nicht berühren, damit es gefährlich wird.", "Electricity jumps across. You do not have to touch a line for it to be dangerous.", "Prąd przeskakuje. Nie musisz dotknąć linii, żeby było niebezpiecznie.", "Струм перескакує. Не обов’язково торкатися лінії, щоб було небезпечно."),
            points: [
                pt(t("<b>Wo es passiert:</b> beim Arbeiten im Freien, auf Baustellen und Höfen, mit hohem Mast, Teleskoparm oder Arbeitsbühne.", "<b>Where it happens:</b> outdoors, on building sites and yards, with a high mast, telescopic boom or work platform.", "<b>Gdzie to się zdarza:</b> na zewnątrz, na budowach i placach, z wysokim masztem, wysięgnikiem teleskopowym lub podestem.", "<b>Де це трапляється:</b> надворі, на будмайданчиках і дворах, із високою щоглою, телескопічною стрілою чи платформою.")),
                pt(t("<b>Schutzabstände:</b> bis 1 kV mindestens 1 m, über 1 kV bis 110 kV 3 m, bis 220 kV 4 m, bis 380 kV und bei unbekannter Spannung 5 m.", "<b>Safety distances:</b> up to 1 kV at least 1 m, above 1 kV to 110 kV 3 m, up to 220 kV 4 m, up to 380 kV and with unknown voltage 5 m.", "<b>Odległości bezpieczne:</b> do 1 kV co najmniej 1 m, powyżej 1 kV do 110 kV 3 m, do 220 kV 4 m, do 380 kV i przy nieznanym napięciu 5 m.", "<b>Безпечні відстані:</b> до 1 кВ щонайменше 1 м, понад 1 кВ до 110 кВ 3 м, до 220 кВ 4 м, до 380 кВ і за невідомої напруги 5 м.")),
                pt(t("<b>Leitungen schwingen:</b> Wind und Wärme bewegen die Seile, hängende Lasten pendeln. Rechne das zum Abstand dazu.", "<b>Lines swing:</b> wind and heat move the cables, suspended loads swing. Add that to the distance.", "<b>Przewody się kołyszą:</b> wiatr i ciepło poruszają liny, ładunki podwieszone się wahają. Doliczaj to do odległości.", "<b>Дроти гойдаються:</b> вітер і тепло рухають дроти, підвішені вантажі розгойдуються. Додавай це до відстані.")),
                pt(t("<b>Unsicher?</b> Dann nicht fahren, sondern Vorgesetzten fragen. Der Netzbetreiber kann Spannung nennen oder abschalten.", "<b>Unsure?</b> Then do not drive; ask your supervisor. The network operator can state the voltage or switch it off.", "<b>Nie jesteś pewien?</b> Nie jedź, zapytaj przełożonego. Operator sieci poda napięcie lub wyłączy linię.", "<b>Не впевнений?</b> Не їдь, запитай керівника. Оператор мережі назве напругу чи вимкне лінію.")),
            ],
            merke: t("Kennst du die Spannung nicht, hältst du mindestens 5 m Abstand.", "If you do not know the voltage, keep at least 5 m away.", "Jeśli nie znasz napięcia, trzymaj co najmniej 5 m odstępu.", "Якщо не знаєш напруги, тримай відстань щонайменше 5 м."),
            src: { de: "BG BAU, Baustein C 441; DIN VDE 0105-100" },
        }),
        step("learn", {
            title: t("Wenn der Mast eine Leitung berührt", "If the mast touches a line", "Gdy maszt dotknie linii", "Якщо щогла торкнулася лінії"),
            lead: t("Das Fahrzeug steht dann unter Spannung. Wer gleichzeitig Fahrzeug und Boden berührt, wird durchströmt.", "The vehicle is then live. Anyone touching vehicle and ground at the same time gets a current through the body.", "Pojazd jest wtedy pod napięciem. Kto dotknie jednocześnie pojazdu i ziemi, zostanie porażony.", "Машина тоді під напругою. Хто торкнеться машини й землі водночас, отримає удар струмом."),
            points: [
                pt(t("<b>Im Fahrzeug bleiben</b> und Ruhe bewahren. In der Kabine bist du am sichersten.", "<b>Stay in the vehicle</b> and keep calm. You are safest in the cab.", "<b>Zostań w pojeździe</b> i zachowaj spokój. W kabinie jesteś najbezpieczniejszy.", "<b>Залишайся в машині</b> й зберігай спокій. У кабіні найбезпечніше.")),
                pt(t("<b>Kontakt lösen,</b> wenn möglich: Mast absenken oder vorsichtig wegfahren.", "<b>Break the contact</b> if possible: lower the mast or drive away carefully.", "<b>Przerwij kontakt,</b> jeśli to możliwe: opuść maszt albo ostrożnie odjedź.", "<b>Розірви контакт,</b> якщо можливо: опусти щоглу або обережно від’їдь.")),
                pt(t("<b>Andere warnen:</b> Niemand darf sich nähern oder das Fahrzeug berühren, auch nicht, um dir die Tür zu öffnen. Netzbetreiber abschalten lassen, Notruf.", "<b>Warn others:</b> nobody may approach or touch the vehicle, not even to open the door for you. Have the network operator switch off, call emergency services.", "<b>Ostrzeż innych:</b> nikt nie może podchodzić ani dotykać pojazdu, nawet żeby otworzyć ci drzwi. Niech operator wyłączy linię, wezwij pomoc.", "<b>Попередь інших:</b> ніхто не має підходити чи торкатися машини, навіть щоб відчинити тобі двері. Нехай оператор вимкне лінію, виклич допомогу.")),
                pt(t("<b>Nur bei Brand aussteigen:</b> mit geschlossenen Füßen weit abspringen, nie Fahrzeug und Boden zugleich berühren, dann mit kleinen Schritten oder Hüpfen weg.", "<b>Only get out if there is a fire:</b> jump well clear with feet together, never touch vehicle and ground at the same time, then move away with small steps or hops.", "<b>Wysiadaj tylko przy pożarze:</b> zeskocz daleko ze złączonymi stopami, nigdy nie dotykaj jednocześnie pojazdu i ziemi, potem oddal się małymi krokami lub podskokami.", "<b>Виходь лише при пожежі:</b> стрибни далеко зі зведеними ногами, ніколи не торкайся машини й землі водночас, потім відходь дрібними кроками чи стрибками.")),
            ],
            merke: t("Im Boden rund um das Fahrzeug liegt Spannung. Große Schritte können tödlich sein.", "There is voltage in the ground around the vehicle. Big steps can be fatal.", "W ziemi wokół pojazdu jest napięcie. Duże kroki mogą być śmiertelne.", "У землі навколо машини є напруга. Великі кроки можуть бути смертельними."),
            src: { de: "Merkblätter der Netzbetreiber zu Arbeiten in der Nähe von Freileitungen; BG BAU, Baustein C 441" },
        }),
        step("question", {
            title: t("Funken am Mast", "Sparks at the mast", "Iskry przy maszcie", "Іскри біля щогли"),
            text: t("Auf dem Hof berührt der ausgefahrene Mast eines Kollegen eine Leitung. Ein Lagerarbeiter läuft hin, um die Tür zu öffnen und den Fahrer herauszuholen.", "In the yard a colleague’s extended mast touches a line. A warehouse worker runs over to open the door and get the driver out.", "Na placu wysunięty maszt kolegi dotyka linii. Magazynier biegnie, żeby otworzyć drzwi i wyciągnąć operatora.", "На дворі висунута щогла колеги торкається лінії. Комірник біжить відчинити двері й витягти водія."),
            layout: "list",
            options: [
                t("Ihn sofort stoppen: Niemand darf das Fahrzeug berühren", "Stop him at once: nobody may touch the vehicle", "Natychmiast go zatrzymać: nikt nie może dotykać pojazdu", "Негайно його зупинити: ніхто не має торкатися машини"),
                t("Ihm helfen, den Fahrer schnell herauszuziehen", "Help him pull the driver out quickly", "Pomóc mu szybko wyciągnąć operatora", "Допомогти йому швидко витягти водія"),
                t("Den Fahrer auffordern, sofort herauszuspringen und wegzurennen", "Tell the driver to jump out at once and run away", "Krzyknąć do operatora, żeby wyskoczył i uciekał", "Крикнути водієві вистрибнути й тікати"),
                t("Mit einer Holzlatte den Mast von der Leitung drücken", "Push the mast off the line with a wooden slat", "Odepchnąć maszt od linii drewnianą listwą", "Відштовхнути щоглу від лінії дерев’яною рейкою"),
            ],
            correct: 0,
            resultTitle: { right: RIGHT_T, wrong: t("Nein, das ist lebensgefährlich", "No, that is life-threatening", "Nie, to zagraża życiu", "Ні, це смертельно небезпечно") },
            body: t("Wer das Fahrzeug von außen berührt, wird durchströmt. Weglaufen mit großen Schritten ist wegen der Schrittspannung gefährlich. Der Fahrer bleibt drin, bis abgeschaltet ist, außer es brennt.", "Anyone touching the vehicle from outside gets a current through the body. Running with big steps is dangerous because of step voltage. The driver stays inside until it is switched off, unless there is a fire.", "Kto dotknie pojazdu z zewnątrz, zostanie porażony. Ucieczka dużymi krokami jest groźna przez napięcie krokowe. Operator zostaje w środku do wyłączenia, chyba że jest pożar.", "Хто торкнеться машини ззовні, отримає удар. Біг великими кроками небезпечний через крокову напругу. Водій лишається всередині до вимкнення, якщо немає пожежі."),
            src: { de: "Merkblätter der Netzbetreiber zu Arbeiten in der Nähe von Freileitungen" },
        }),
        step("choice", {
            title: QUIZ,
            items: [
                { q: t("Du kennst die Spannung einer Freileitung nicht. Welchen Abstand hältst du mindestens?", "You do not know the voltage of an overhead line. What distance do you keep at least?", "Nie znasz napięcia linii napowietrznej. Jaki odstęp zachowujesz co najmniej?", "Ти не знаєш напруги повітряної лінії. Яку відстань тримаєш щонайменше?"),
                    options: [t("5 m", "5 m", "5 m", "5 м"), t("1 m", "1 m", "1 m", "1 м"), t("3 m", "3 m", "3 m", "3 м"), t("Kein Abstand nötig, solange nichts berührt wird", "None, as long as nothing touches the line", "Żaden, dopóki nic nie dotyka linii", "Жодної, поки ніщо не торкається лінії")], correct: 0,
                    why: t("Bei unbekannter Spannung gilt der größte Schutzabstand von 5 m.", "With unknown voltage the largest safety distance of 5 m applies.", "Przy nieznanym napięciu obowiązuje największy odstęp 5 m.", "За невідомої напруги діє найбільша відстань 5 м.") },
                { q: t("Der Mast deines Staplers berührt eine Stromleitung, es brennt nicht. Was tust du?", "Your forklift’s mast touches a power line; there is no fire. What do you do?", "Maszt twojego wózka dotyka linii, nie ma pożaru. Co robisz?", "Щогла твого навантажувача торкається лінії, пожежі немає. Що робиш?"),
                    options: [t("Im Fahrzeug bleiben, andere warnen, abschalten lassen", "Stay in the vehicle, warn others, have it switched off", "Zostać w pojeździe, ostrzec innych, doprowadzić do wyłączenia linii", "Лишитися в машині, попередити інших, домогтися вимкнення"), t("Sofort aussteigen und weglaufen", "Get out at once and run away", "Natychmiast wysiąść i uciekać", "Негайно вийти й тікати"), t("Aussteigen und den Mast von Hand wegdrücken", "Get out and push the mast away by hand", "Wysiąść i odepchnąć maszt ręką", "Вийти й відштовхнути щоглу руками"), t("Einen Kollegen bitten, dir beim Aussteigen die Hand zu geben", "Ask a colleague to give you a hand getting out", "Poprosić kolegę, żeby podał ci rękę przy wysiadaniu", "Попросити колегу подати руку, щоб вийти")], correct: 0,
                    why: t("Im Fahrzeug bist du geschützt. Jeder Kontakt zwischen Fahrzeug und Boden über einen Menschen ist lebensgefährlich.", "Inside the vehicle you are protected. Any contact between vehicle and ground through a person is life-threatening.", "W pojeździe jesteś chroniony. Gdy człowiek połączy sobą pojazd z ziemią, grozi mu śmierć.", "У машині ти захищений. Будь-який контакт машини із землею через людину смертельно небезпечний.") },
            ],
            allRight: ALL_OK, someWrong: LOOK,
        }),
        step("video", {
            title: t("Freileitung auf dem Hof", "Overhead line in the yard", "Linia napowietrzna na placu", "Повітряна лінія на дворі"),
            brief: t("Animation, kein Realdreh: Stapler mit hohem Mast nähert sich einer Freileitung, Abstandszonen 1, 3, 5 m werden eingeblendet. Dann Kontakt: Fahrer bleibt sitzen, Kollege wird gestoppt, Schrittspannung als Farbverlauf am Boden.", "Animation, not live action: forklift with a high mast approaches an overhead line, 1, 3, 5 m distance zones appear. Then contact: driver stays seated, colleague is stopped, step voltage shown as a colour gradient on the ground.", "Animacja, nie nagranie: wózek z wysokim masztem zbliża się do linii napowietrznej, pojawiają się strefy 1, 3, 5 m. Potem kontakt: operator zostaje w fotelu, kolega zostaje zatrzymany, napięcie krokowe jako gradient na ziemi.", "Анімація, не зйомка: навантажувач із високою щоглою наближається до лінії, з’являються зони 1, 3, 5 м. Потім контакт: водій сидить, колегу зупиняють, крокова напруга — градієнтом на землі."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Abstand:</b> 1 m bis 1 kV, 3 m bis 110 kV, 4 m bis 220 kV, 5 m bis 380 kV oder unbekannt.", "<b>Distance:</b> 1 m up to 1 kV, 3 m up to 110 kV, 4 m up to 220 kV, 5 m up to 380 kV or with unknown voltage.", "<b>Odstęp:</b> 1 m do 1 kV, 3 m do 110 kV, 4 m do 220 kV, 5 m do 380 kV albo przy nieznanym napięciu.", "<b>Відстань:</b> 1 м до 1 кВ, 3 м до 110 кВ, 4 м до 220 кВ, 5 м до 380 кВ або за невідомої напруги.")),
            pt(t("<b>Bei Kontakt:</b> drinbleiben, niemand berührt das Fahrzeug, abschalten lassen.", "<b>On contact:</b> stay inside, nobody touches the vehicle, have it switched off.", "<b>Przy kontakcie:</b> zostań w środku, nikt nie dotyka pojazdu, doprowadź do wyłączenia linii.", "<b>При контакті:</b> лишайся всередині, ніхто не торкається машини, домагайся вимкнення.")),
            pt(t("<b>Nur bei Brand:</b> mit geschlossenen Füßen abspringen und mit kleinen Schritten weg.", "<b>Only if there is a fire:</b> jump with feet together and move away with small steps.", "<b>Tylko przy pożarze:</b> zeskocz ze złączonymi stopami i odchodź małymi krokami.", "<b>Лише при пожежі:</b> стрибай зі зведеними ногами й відходь дрібними кроками.")),
        ] }),
    ];
}
