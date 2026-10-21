/**
 * Kapitel 1, tematy 1.3–1.6 (nowe, nie ma ich w demo), od razu w czterech językach.
 * Źródła: DGUV G 308-001 (Dez. 2022), DGUV V68 z DA; ArbSchG, BetrSichV, DGUV V1, SGB VII, StGB, FeV opisane ogólnie.
 * Wzorzec: pytanie startowe → karta z wiedzą → ćwiczenie → wideo → krótki test → podsumowanie.
 */
import { LText } from "../../models/LearningCourse";

type Step = { id: string; type: string; data: Record<string, unknown> };
type Mk = (type: string, data: Record<string, unknown>) => Step;

const t = (de: string, en: string, pl: string, uk: string): LText => ({ de, en, pl, uk });
/** "<b>Stichwort</b> Rest" w każdym języku → { k, v } */
const pt = (l: LText) => {
    const k: LText = {}, v: LText = {};
    for (const [lang, s] of Object.entries(l) as [keyof LText, string][]) {
        const m = s.match(/^<b>(.*?)<\/b>\s*(.*)$/s);
        k[lang] = m ? m[1] : ""; v[lang] = m ? m[2] : s;
    }
    return { k, v };
};
const BTN_GO = t("Los geht’s", "Let’s go", "Zaczynamy", "Почнімо");
const OPENER = t("Bevor wir starten: Was meinst du?", "Before we start: what do you think?", "Zanim zaczniemy: jak myślisz?", "Перш ніж почати: як ти думаєш?");
const WRONG_T = t("Nicht ganz", "Not quite", "Nie do końca", "Не зовсім");
const RIGHT_T = t("Richtig", "Correct", "Dobrze", "Правильно");
const SUM = t("Das nimmst du mit", "Key takeaways", "Najważniejsze", "Головне");
const QUICK = t("Kurztest", "Quick test", "Krótki test", "Короткий тест");

/* ════════════════ 1.3 Rechtliche Grundlagen ════════════════ */
export function lesson13(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Welche Regeln gelten für dich am Stapler?", "Which rules apply to you on a forklift?", "Jakie zasady obowiązują cię na wózku?", "Які правила діють для тебе на навантажувачі?"),
            options: [t("Nur die Regeln im Betrieb", "Only the company rules", "Tylko zasady w zakładzie", "Лише правила підприємства"), t("Nur das Straßenverkehrsrecht", "Only road traffic law", "Tylko prawo drogowe", "Лише правила дорожнього руху"), t("Mehrere Ebenen gleichzeitig", "Several levels at once", "Kilka poziomów naraz", "Кілька рівнів одночасно")],
            correct: 2, layout: "list",
            resultTitle: { right: RIGHT_T, wrong: WRONG_T },
            body: t("Für dich gelten gleichzeitig Gesetze des Staates, Unfallverhütungsvorschriften der Berufsgenossenschaft und die Regeln deines Betriebs. In diesem Thema ordnest du sie ein.",
                "Laws of the state, accident prevention regulations of the employers’ liability insurance association and your company’s rules all apply to you at the same time. In this topic you will sort them out.",
                "Obowiązują cię jednocześnie ustawy państwowe, przepisy BHP ubezpieczyciela wypadkowego (Berufsgenossenschaft) i zasady twojego zakładu. W tym temacie je uporządkujesz.",
                "Для тебе одночасно діють державні закони, правила запобігання нещасним випадкам страхової спілки (Berufsgenossenschaft) і правила твого підприємства. У цій темі ти їх упорядкуєш."),
            src: { de: "DGUV G 308-001, Anhang 1 Nr. 1" }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Drei Ebenen von Regeln", "Three levels of rules", "Trzy poziomy zasad", "Три рівні правил"),
            lead: t("Damit du Vorschriften richtig einordnest, hilft ein einfaches Bild: Der Staat setzt den Rahmen, die Unfallversicherung konkretisiert ihn, der Betrieb regelt die Arbeit vor Ort.",
                "A simple picture helps you place regulations correctly: the state sets the framework, the accident insurance makes it concrete, the company regulates the work on site.",
                "Proste porównanie pomaga uporządkować przepisy: państwo wyznacza ramy, ubezpieczyciel wypadkowy je doprecyzowuje, a zakład reguluje pracę na miejscu.",
                "Просте порівняння допомагає впорядкувати правила: держава задає рамки, страхування від нещасних випадків їх конкретизує, підприємство регулює роботу на місці."),
            points: [
                pt(t("<b>Gesetze und Verordnungen</b> des Staates, zum Beispiel Arbeitsschutzgesetz, Betriebssicherheitsverordnung, StVO. Sie gelten für alle.",
                    "<b>Laws and ordinances</b> of the state, for example the Occupational Safety and Health Act, the Industrial Safety Regulation, the road traffic regulations. They apply to everyone.",
                    "<b>Ustawy i rozporządzenia</b> państwa, na przykład ustawa o BHP (ArbSchG), rozporządzenie o bezpieczeństwie pracy (BetrSichV), StVO. Obowiązują wszystkich.",
                    "<b>Закони і постанови</b> держави, наприклад закон про охорону праці (ArbSchG), постанова про безпеку виробництва (BetrSichV), StVO. Вони діють для всіх.")),
                pt(t("<b>DGUV Vorschriften</b> der Berufsgenossenschaften, zum Beispiel DGUV Vorschrift 1 und 68. Sie sind für Unternehmer und Beschäftigte verbindlich.",
                    "<b>DGUV regulations</b> of the employers’ liability insurance associations, for example DGUV Regulations 1 and 68. They are binding for employers and employees.",
                    "<b>Przepisy DGUV</b> ubezpieczycieli wypadkowych, na przykład DGUV Vorschrift 1 i 68. Są wiążące dla pracodawców i pracowników.",
                    "<b>Приписи DGUV</b> страхових спілок, наприклад DGUV Vorschrift 1 і 68. Вони обов’язкові для роботодавців і працівників.")),
                pt(t("<b>DGUV Regeln und Grundsätze,</b> zum Beispiel DGUV Grundsatz 308-001. Sie zeigen, wie man die Vorschriften sicher erfüllt.",
                    "<b>DGUV rules and principles,</b> for example DGUV Principle 308-001. They show how to meet the regulations safely.",
                    "<b>Reguły i zasady DGUV,</b> na przykład DGUV Grundsatz 308-001. Pokazują, jak bezpiecznie spełnić przepisy.",
                    "<b>Правила і принципи DGUV,</b> наприклад DGUV Grundsatz 308-001. Вони показують, як безпечно виконати приписи.")),
                pt(t("<b>Regeln im Betrieb:</b> Betriebsanweisung, Unterweisung und Weisungen deiner Vorgesetzten.",
                    "<b>Company rules:</b> operating instructions, instruction sessions and directions from your supervisors.",
                    "<b>Zasady w zakładzie:</b> instrukcja zakładowa, instruktaż i polecenia przełożonych.",
                    "<b>Правила підприємства:</b> робоча інструкція, інструктаж і вказівки керівників.")),
            ],
            merke: t("Vorschrift heißt Pflicht. Regeln und Grundsätze zeigen den bewährten Weg, die Pflicht zu erfüllen.",
                "A regulation means a duty. Rules and principles show the proven way to fulfil that duty.",
                "Przepis oznacza obowiązek. Reguły i zasady pokazują sprawdzony sposób, jak go spełnić.",
                "Припис означає обов’язок. Правила і принципи показують перевірений спосіб його виконати."),
            src: { de: "DGUV G 308-001, Anhang 1 Nr. 1" },
        }),
        step("sort", {
            title: t("Welche Ebene ist das?", "Which level is it?", "Który to poziom?", "Який це рівень?"),
            lead: t("Ordne jede Regel ihrer Ebene zu.", "Assign each rule to its level.", "Przyporządkuj każdą zasadę do poziomu.", "Віднеси кожне правило до його рівня."),
            labels: [t("Staat", "State", "Państwo", "Держава"), t("DGUV", "DGUV", "DGUV", "DGUV"), t("Betrieb", "Company", "Zakład", "Підприємство")],
            items: [
                { t: t("Arbeitsschutzgesetz", "Occupational Safety and Health Act", "Ustawa o BHP (ArbSchG)", "Закон про охорону праці (ArbSchG)"), a: 0, why: t("Ein Gesetz des Bundes, es gilt in allen Betrieben.", "A federal law, it applies in all companies.", "Ustawa federalna, obowiązuje we wszystkich zakładach.", "Федеральний закон, діє на всіх підприємствах.") },
                { t: t("DGUV Vorschrift 68 „Flurförderzeuge“", "DGUV Regulation 68 “Industrial trucks”", "DGUV Vorschrift 68 „Wózki jezdniowe”", "DGUV Vorschrift 68 «Складська техніка»"), a: 1, why: t("Eine Unfallverhütungsvorschrift der Berufsgenossenschaften.", "An accident prevention regulation of the insurance associations.", "Przepis BHP ubezpieczycieli wypadkowych.", "Правило запобігання нещасним випадкам страхових спілок.") },
                { t: t("Betriebsanweisung für eure Halle", "Operating instructions for your hall", "Instrukcja zakładowa dla waszej hali", "Робоча інструкція для вашого цеху"), a: 2, why: t("Schreibt der Unternehmer für seinen Betrieb.", "Written by the employer for the company.", "Pisze ją pracodawca dla swojego zakładu.", "Її складає роботодавець для свого підприємства.") },
                { t: t("Betriebssicherheitsverordnung", "Industrial Safety Regulation", "Rozporządzenie o bezpieczeństwie pracy (BetrSichV)", "Постанова про безпеку виробництва (BetrSichV)"), a: 0, why: t("Eine Verordnung des Bundes zu Arbeitsmitteln.", "A federal ordinance on work equipment.", "Federalne rozporządzenie o środkach pracy.", "Федеральна постанова про робоче обладнання.") },
                { t: t("DGUV Vorschrift 1 „Grundsätze der Prävention“", "DGUV Regulation 1 “Principles of prevention”", "DGUV Vorschrift 1 „Zasady prewencji”", "DGUV Vorschrift 1 «Принципи профілактики»"), a: 1, why: t("Die Grundvorschrift der Unfallversicherung für alle Betriebe.", "The basic regulation of the accident insurance for all companies.", "Podstawowy przepis ubezpieczenia wypadkowego dla wszystkich zakładów.", "Основне правило страхування від нещасних випадків для всіх підприємств.") },
                { t: t("Anweisung des Schichtleiters, Tor 3 heute nicht zu befahren", "Shift supervisor’s instruction not to use gate 3 today", "Polecenie kierownika zmiany, by dziś nie wjeżdżać do bramy 3", "Вказівка начальника зміни сьогодні не заїжджати до воріт 3"), a: 2, why: t("Eine Weisung im Betrieb, die du befolgen musst.", "A direction within the company that you must follow.", "Polecenie w zakładzie, którego musisz przestrzegać.", "Вказівка на підприємстві, яку ти маєш виконати.") },
            ],
            allRight: t("Richtig. Du kannst die Regeln einordnen.", "Correct. You can place the rules.", "Dobrze. Potrafisz uporządkować zasady.", "Правильно. Ти вмієш упорядкувати правила."),
            someWrong: t("Merke: Gesetze kommen vom Staat, Vorschriften von der DGUV, Anweisungen aus dem Betrieb.", "Remember: laws come from the state, regulations from the DGUV, instructions from the company.", "Zapamiętaj: ustawy są od państwa, przepisy od DGUV, polecenia z zakładu.", "Запам’ятай: закони від держави, приписи від DGUV, вказівки від підприємства."),
        }),
        step("learn", {
            title: t("Arbeitsschutzgesetz und DGUV Vorschrift 1", "Occupational Safety and Health Act and DGUV Regulation 1", "Ustawa o BHP i DGUV Vorschrift 1", "Закон про охорону праці та DGUV Vorschrift 1"),
            lead: t("Diese beiden Regelwerke gelten in jedem Betrieb, nicht nur am Stapler.", "These two sets of rules apply in every company, not just on the forklift.", "Te dwa zbiory zasad obowiązują w każdym zakładzie, nie tylko na wózku.", "Ці два зводи правил діють на кожному підприємстві, не лише на навантажувачі."),
            points: [
                pt(t("<b>Der Arbeitgeber</b> beurteilt die Gefährdungen und unterweist dich vor der Arbeit und danach regelmäßig, mindestens einmal im Jahr.",
                    "<b>The employer</b> assesses the hazards and instructs you before you start work and regularly afterwards, at least once a year.",
                    "<b>Pracodawca</b> ocenia zagrożenia i przeprowadza instruktaż przed pracą, a potem regularnie, co najmniej raz w roku.",
                    "<b>Роботодавець</b> оцінює небезпеки та проводить інструктаж перед роботою і потім регулярно, щонайменше раз на рік.")),
                pt(t("<b>Du sorgst</b> nach deinen Möglichkeiten für deine Sicherheit und für die der Menschen, die von deiner Arbeit betroffen sind.",
                    "<b>You take care,</b> as far as you can, of your own safety and of the people affected by your work.",
                    "<b>Dbasz</b> w miarę swoich możliwości o swoje bezpieczeństwo i o ludzi, których dotyczy twoja praca.",
                    "<b>Ти дбаєш</b> у міру своїх можливостей про свою безпеку і про людей, яких стосується твоя робота.")),
                pt(t("<b>Gefahren und Mängel melden</b> musst du sofort deinem Vorgesetzten.",
                    "<b>Hazards and defects</b> must be reported to your supervisor immediately.",
                    "<b>Zagrożenia i usterki</b> musisz od razu zgłaszać przełożonemu.",
                    "<b>Про небезпеки і несправності</b> треба одразу повідомляти керівника.")),
                pt(t("<b>Keine Rauschmittel:</b> Du darfst dich nicht durch Alkohol, Drogen oder Medikamente in einen Zustand bringen, in dem du dich oder andere gefährdest.",
                    "<b>No intoxicants:</b> you must not get into a state through alcohol, drugs or medication in which you endanger yourself or others.",
                    "<b>Bez używek:</b> nie wolno ci doprowadzić się alkoholem, narkotykami ani lekami do stanu, w którym zagrażasz sobie lub innym.",
                    "<b>Без дурманних засобів:</b> не можна доводити себе алкоголем, наркотиками чи ліками до стану, в якому ти загрожуєш собі або іншим.")),
                pt(t("<b>Schutzausrüstung</b>, die dein Arbeitgeber bereitstellt, zum Beispiel Sicherheitsschuhe, musst du benutzen.",
                    "<b>Protective equipment</b> provided by your employer, for example safety shoes, must be used.",
                    "<b>Środki ochrony</b> zapewnione przez pracodawcę, na przykład obuwie ochronne, musisz używać.",
                    "<b>Засоби захисту</b>, які надає роботодавець, наприклад захисне взуття, треба використовувати.")),
            ],
            merke: t("Du bist nicht nur für dich verantwortlich, sondern auch für alle, die von deiner Arbeit betroffen sind.",
                "You are responsible not only for yourself but also for everyone affected by your work.",
                "Odpowiadasz nie tylko za siebie, ale też za wszystkich, których dotyczy twoja praca.",
                "Ти відповідаєш не лише за себе, а й за всіх, кого стосується твоя робота."),
            src: { de: "ArbSchG §§ 5, 12, 15, 16; DGUV V1 §§ 4, 15, 30" },
        }),
        step("learn", {
            title: t("Betriebssicherheitsverordnung", "Industrial Safety Regulation", "Rozporządzenie o bezpieczeństwie pracy", "Постанова про безпеку виробництва"),
            lead: t("Die Betriebssicherheitsverordnung regelt, wie Arbeitsmittel wie der Stapler bereitgestellt und benutzt werden.",
                "The Industrial Safety Regulation governs how work equipment such as the forklift is provided and used.",
                "Rozporządzenie o bezpieczeństwie pracy (BetrSichV) reguluje, jak udostępnia się i używa środków pracy, takich jak wózek.",
                "Постанова про безпеку виробництва (BetrSichV) регулює, як надається і використовується робоче обладнання, наприклад навантажувач."),
            points: [
                pt(t("<b>Sichere Arbeitsmittel:</b> Der Arbeitgeber stellt nur geeignete Geräte bereit, die regelmäßig von einer zur Prüfung befähigten Person geprüft werden.",
                    "<b>Safe work equipment:</b> the employer only provides suitable equipment that is inspected regularly by a person qualified to inspect it.",
                    "<b>Bezpieczne środki pracy:</b> pracodawca udostępnia tylko odpowiedni sprzęt, regularnie sprawdzany przez osobę uprawnioną do przeglądów.",
                    "<b>Безпечне обладнання:</b> роботодавець надає лише придатну техніку, яку регулярно перевіряє особа, уповноважена на перевірки.")),
                pt(t("<b>Selbstfahrende Arbeitsmittel</b> dürfen nur Beschäftigte führen, die dafür geeignet sind und eine angemessene Unterweisung erhalten haben.",
                    "<b>Self-propelled work equipment</b> may only be driven by employees who are suitable and have received appropriate instruction.",
                    "<b>Samojezdne środki pracy</b> mogą prowadzić tylko pracownicy, którzy mają predyspozycje i przeszli odpowiedni instruktaż.",
                    "<b>Самохідне обладнання</b> можуть водити лише працівники, які придатні до цього та пройшли належний інструктаж.")),
                pt(t("<b>Bestimmungsgemäß verwenden:</b> Du benutzt den Stapler nur so, wie Hersteller und Betrieb es vorsehen.",
                    "<b>Use as intended:</b> you only use the forklift as the manufacturer and the company intend.",
                    "<b>Używać zgodnie z przeznaczeniem:</b> korzystasz z wózka tylko tak, jak przewiduje producent i zakład.",
                    "<b>Використовувати за призначенням:</b> ти користуєшся навантажувачем лише так, як передбачає виробник і підприємство.")),
                pt(t("<b>Schutzeinrichtungen</b> wie Sitzschalter, Gurt oder Fahrerschutzdach dürfen nicht überbrückt oder entfernt werden.",
                    "<b>Safety devices</b> such as the seat switch, seat belt or overhead guard must not be bypassed or removed.",
                    "<b>Urządzeń ochronnych</b> jak czujnik siedzenia, pas czy daszek ochronny nie wolno mostkować ani usuwać.",
                    "<b>Захисні пристрої</b>, як датчик сидіння, пасок чи захисний дах, не можна обходити чи знімати.")),
            ],
            merke: t("Sicherheitseinrichtungen nie überbrücken, auch nicht „nur kurz“.", "Never bypass safety devices, not even “just for a moment”.", "Nigdy nie mostkuj zabezpieczeń, nawet „tylko na chwilę”.", "Ніколи не обходь захисні пристрої, навіть «лише на хвилинку»."),
            src: { de: "BetrSichV §§ 3, 5, 12, 14, Anhang 1; DGUV G 308-001, Anhang 1 Nr. 1" },
        }),
        step("learn", {
            title: t("CE-Zeichen und Maschinenrecht", "CE marking and machinery law", "Znak CE i prawo maszynowe", "Знак CE і машинне право"),
            lead: t("Bevor ein Stapler in den Betrieb kommt, muss der Hersteller nachweisen, dass er sicher gebaut ist.",
                "Before a forklift arrives at the company, the manufacturer must prove that it is built safely.",
                "Zanim wózek trafi do zakładu, producent musi wykazać, że jest bezpiecznie zbudowany.",
                "Перш ніж навантажувач потрапить на підприємство, виробник має довести, що він безпечно збудований."),
            points: [
                pt(t("<b>CE-Kennzeichnung</b> am Typenschild und eine EG-Konformitätserklärung zeigen, dass der Stapler den Anforderungen des Maschinenrechts entspricht.",
                    "<b>CE marking</b> on the type plate and an EC declaration of conformity show that the forklift meets the requirements of machinery law.",
                    "<b>Oznakowanie CE</b> na tabliczce znamionowej i deklaracja zgodności WE pokazują, że wózek spełnia wymagania prawa maszynowego.",
                    "<b>Маркування CE</b> на табличці та декларація відповідності ЄС показують, що навантажувач відповідає вимогам машинного права.")),
                pt(t("<b>Betriebsanleitung</b> in deutscher Sprache gehört zur Lieferung.", "<b>An operating manual</b> in German is part of the delivery.", "<b>Instrukcja obsługi</b> po niemiecku jest częścią dostawy.", "<b>Інструкція з експлуатації</b> німецькою мовою входить у поставку.")),
                pt(t("<b>Umbauten</b> wie selbst gebaute Anbaugeräte oder ein geändertes Gegengewicht können die Sicherheit und die Konformität aufheben.",
                    "<b>Modifications</b> such as home-made attachments or a changed counterweight can cancel out safety and conformity.",
                    "<b>Przeróbki,</b> jak samodzielnie zrobiony osprzęt czy zmieniona przeciwwaga, mogą znieść bezpieczeństwo i zgodność.",
                    "<b>Переробки,</b> як саморобне навісне обладнання чи змінена противага, можуть скасувати безпеку і відповідність.")),
            ],
            merke: t("Nichts am Stapler selbst umbauen. Änderungen nur mit Freigabe von Hersteller und Unternehmer.",
                "Do not modify anything on the forklift yourself. Changes only with approval from the manufacturer and the employer.",
                "Niczego nie przerabiaj samodzielnie. Zmiany tylko za zgodą producenta i pracodawcy.",
                "Нічого не переробляй сам. Зміни лише за погодженням виробника і роботодавця."),
            src: { de: "DGUV G 308-001, Anhang 1 Nr. 1 (Maschinenverordnung, CE-Zeichen)" },
        }),
        step("video", {
            title: t("Typenschild und CE-Zeichen", "Type plate and CE marking", "Tabliczka znamionowa i znak CE", "Табличка і знак CE"),
            brief: t("Nahaufnahme des Typenschilds am eigenen Stapler: Hersteller, Typ, Baujahr, Tragfähigkeit, Lastschwerpunkt und CE-Zeichen. Der Sprecher zeigt, wo jede Angabe steht.",
                "Close-up of the type plate on your own forklift: manufacturer, type, year of manufacture, capacity, load centre and CE marking. The speaker shows where each item is.",
                "Zbliżenie tabliczki znamionowej na waszym wózku: producent, typ, rok produkcji, udźwig, środek ciężkości i znak CE. Lektor pokazuje, gdzie jest każda informacja.",
                "Великий план таблички на вашому навантажувачі: виробник, тип, рік випуску, вантажопідйомність, центр ваги і знак CE. Диктор показує, де кожен пункт."),
            length: t("30 bis 45 Sekunden", "30 to 45 seconds", "30 do 45 sekund", "30–45 секунд"),
        }),
        step("learn", {
            title: t("Auf öffentlichen Straßen", "On public roads", "Na drogach publicznych", "На дорогах загального користування"),
            lead: t("Sobald der Stapler das Betriebsgelände verlässt, kommt das Straßenverkehrsrecht dazu.",
                "As soon as the forklift leaves the company premises, road traffic law applies as well.",
                "Gdy wózek opuszcza teren zakładu, dochodzi prawo drogowe.",
                "Щойно навантажувач залишає територію підприємства, додається дорожнє право."),
            points: [
                pt(t("<b>StVO:</b> Es gelten die normalen Verkehrsregeln, wie für jedes andere Fahrzeug.", "<b>StVO:</b> normal traffic rules apply, as for any other vehicle.", "<b>StVO:</b> obowiązują zwykłe przepisy ruchu, jak dla każdego pojazdu.", "<b>StVO:</b> діють звичайні правила дорожнього руху, як для будь-якого транспорту.")),
                pt(t("<b>StVZO:</b> Der Stapler braucht die vorgeschriebene Ausrüstung, zum Beispiel Beleuchtung und Spiegel.", "<b>StVZO:</b> the forklift needs the required equipment, for example lights and mirrors.", "<b>StVZO:</b> wózek musi mieć wymagane wyposażenie, na przykład oświetlenie i lusterka.", "<b>StVZO:</b> навантажувач потребує обов’язкового обладнання, наприклад освітлення і дзеркал.")),
                pt(t("<b>FZV:</b> Je nach Bauart und Geschwindigkeit braucht der Stapler eine Zulassung oder Betriebserlaubnis, ein Kennzeichen und eine Versicherung.", "<b>FZV:</b> depending on design and speed, the forklift needs registration or an operating permit, a number plate and insurance.", "<b>FZV:</b> zależnie od konstrukcji i prędkości wózek potrzebuje rejestracji albo dopuszczenia, tablicy rejestracyjnej i ubezpieczenia.", "<b>FZV:</b> залежно від конструкції та швидкості навантажувачу потрібна реєстрація або дозвіл на експлуатацію, номерний знак і страховка.")),
                pt(t("<b>FeV:</b> Du brauchst die passende Fahrerlaubnis. Für Stapler bis 25 km/h ist das in der Regel die Klasse L.", "<b>FeV:</b> you need the right driving licence. For forklifts up to 25 km/h this is usually class L.", "<b>FeV:</b> potrzebujesz odpowiedniego prawa jazdy. Dla wózków do 25 km/h jest to zwykle kategoria L.", "<b>FeV:</b> потрібне відповідне посвідчення водія. Для навантажувачів до 25 км/год це зазвичай категорія L.")),
            ],
            merke: t("Auf die Straße erst mit Staplerschein, Führerschein, Auftrag und einem für die Straße zugelassenen Stapler.", "Onto the road only with a forklift licence, a driving licence, an authorisation and a forklift approved for the road.", "Na drogę tylko ze Staplerschein, prawem jazdy, upoważnieniem i wózkiem dopuszczonym do ruchu.", "На дорогу лише зі Staplerschein, посвідченням водія, дорученням і навантажувачем, допущеним до руху."),
            src: { de: "DGUV G 308-001, Abschn. 2.2 und Anhang 1 Nr. 1; FeV § 6" },
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: t("Was ist DGUV Vorschrift 68?", "What is DGUV Regulation 68?", "Czym jest DGUV Vorschrift 68?", "Що таке DGUV Vorschrift 68?"), options: [t("Ein Gesetz des Bundestages", "A law passed by parliament", "Ustawa Bundestagu", "Закон Бундестагу"), t("Eine verbindliche Unfallverhütungsvorschrift", "A binding accident prevention regulation", "Wiążący przepis BHP", "Обов’язкове правило запобігання нещасним випадкам"), t("Eine Empfehlung ohne Pflicht", "A recommendation without obligation", "Zalecenie bez obowiązku", "Рекомендація без обов’язку")], correct: 1, why: t("DGUV Vorschriften sind für Unternehmer und Beschäftigte verbindlich.", "DGUV regulations are binding for employers and employees.", "Przepisy DGUV są wiążące dla pracodawców i pracowników.", "Приписи DGUV обов’язкові для роботодавців і працівників.") },
                { q: t("Wie oft muss dich der Arbeitgeber mindestens unterweisen?", "How often must the employer instruct you at least?", "Jak często pracodawca musi co najmniej przeprowadzać instruktaż?", "Як часто роботодавець має щонайменше проводити інструктаж?"), options: [t("Einmal im Jahr", "Once a year", "Raz w roku", "Раз на рік"), t("Nur bei Arbeitsbeginn", "Only when you start", "Tylko na początku pracy", "Лише на початку роботи"), t("Alle fünf Jahre", "Every five years", "Co pięć lat", "Раз на п’ять років")], correct: 0, why: t("Die Unterweisung wird mindestens jährlich wiederholt (DGUV V1 §4).", "Instruction is repeated at least once a year (DGUV V1 §4).", "Instruktaż powtarza się co najmniej raz w roku (DGUV V1 §4).", "Інструктаж повторюють щонайменше раз на рік (DGUV V1 §4).") },
                { q: t("Der Sitzschalter nervt. Darfst du ihn überbrücken?", "The seat switch is annoying. May you bypass it?", "Czujnik siedzenia przeszkadza. Możesz go zmostkować?", "Датчик сидіння заважає. Можна його обійти?"), options: [t("Ja, wenn ich vorsichtig fahre", "Yes, if I drive carefully", "Tak, jeśli jeżdżę ostrożnie", "Так, якщо їжджу обережно"), t("Nein, niemals", "No, never", "Nie, nigdy", "Ні, ніколи"), t("Nur mit Erlaubnis eines Kollegen", "Only with a colleague’s permission", "Tylko za zgodą kolegi", "Лише з дозволу колеги")], correct: 1, why: t("Schutzeinrichtungen dürfen nicht unwirksam gemacht werden (BetrSichV).", "Safety devices must not be made ineffective (BetrSichV).", "Zabezpieczeń nie wolno wyłączać (BetrSichV).", "Захисні пристрої не можна вимикати (BetrSichV).") },
                { q: t("Was brauchst du zusätzlich für die öffentliche Straße?", "What else do you need for the public road?", "Czego jeszcze potrzebujesz na drogę publiczną?", "Що ще потрібно для дороги загального користування?"), options: [t("Nur eine Warnweste", "Only a hi-vis vest", "Tylko kamizelki", "Лише світловідбивного жилета"), t("Passende Fahrerlaubnis und zugelassenen Stapler", "The right driving licence and an approved forklift", "Odpowiedniego prawa jazdy i dopuszczonego wózka", "Відповідного посвідчення і допущеного навантажувача"), t("Nichts, der Staplerschein reicht", "Nothing, the forklift licence is enough", "Niczego, Staplerschein wystarczy", "Нічого, Staplerschein достатньо")], correct: 1, why: t("Auf der Straße gelten zusätzlich StVO, StVZO, FZV und FeV.", "On the road, StVO, StVZO, FZV and FeV apply in addition.", "Na drodze dodatkowo obowiązują StVO, StVZO, FZV i FeV.", "На дорозі додатково діють StVO, StVZO, FZV і FeV.") },
            ],
            allRight: t("Alles richtig. Thema 1.3 sitzt.", "All correct. Topic 1.3 is done.", "Wszystko dobrze. Temat 1.3 opanowany.", "Усе правильно. Тему 1.3 засвоєно."),
            someWrong: t("Fast. Geh bei Bedarf zurück zu den Karten.", "Almost. If needed, go back to the cards.", "Prawie. W razie potrzeby wróć do kart.", "Майже. За потреби повернися до карток."),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Drei Ebenen:</b> Gesetze des Staates, Vorschriften der DGUV und Regeln im Betrieb gelten gleichzeitig.", "<b>Three levels:</b> state laws, DGUV regulations and company rules apply at the same time.", "<b>Trzy poziomy:</b> ustawy państwa, przepisy DGUV i zasady zakładu obowiązują jednocześnie.", "<b>Три рівні:</b> закони держави, приписи DGUV і правила підприємства діють одночасно.")),
            pt(t("<b>Deine Pflichten:</b> für Sicherheit sorgen, Mängel melden, nüchtern fahren, Schutzausrüstung tragen.", "<b>Your duties:</b> look after safety, report defects, drive sober, wear protective equipment.", "<b>Twoje obowiązki:</b> dbać o bezpieczeństwo, zgłaszać usterki, jeździć trzeźwo, nosić środki ochrony.", "<b>Твої обов’язки:</b> дбати про безпеку, повідомляти про несправності, керувати тверезим, носити засоби захисту.")),
            pt(t("<b>Am Gerät:</b> CE-Zeichen und Betriebsanleitung, keine eigenen Umbauten, Schutzeinrichtungen nie überbrücken.", "<b>On the truck:</b> CE marking and operating manual, no own modifications, never bypass safety devices.", "<b>Na wózku:</b> znak CE i instrukcja obsługi, żadnych własnych przeróbek, nigdy nie mostkuj zabezpieczeń.", "<b>На техніці:</b> знак CE та інструкція, жодних власних переробок, ніколи не обходь захисні пристрої.")),
            pt(t("<b>Straße:</b> zusätzlich Führerschein, Ausrüstung und Zulassung nach Straßenverkehrsrecht.", "<b>Road:</b> additionally driving licence, equipment and registration under road traffic law.", "<b>Droga:</b> dodatkowo prawo jazdy, wyposażenie i rejestracja według prawa drogowego.", "<b>Дорога:</b> додатково посвідчення водія, обладнання і реєстрація за дорожнім правом.")),
        ] }),
    ];
}

/* ════════════════ 1.4 Folgen von Fehlverhalten ════════════════ */
export function lesson14(step: Mk): Step[] {
    return [
        step("question", {
            title: t("Dein Stapler verletzt einen Kollegen. Wer zahlt die Behandlung?", "Your forklift injures a colleague. Who pays for the treatment?", "Twój wózek rani kolegę. Kto płaci za leczenie?", "Твій навантажувач травмує колегу. Хто платить за лікування?"),
            layout: "list",
            options: [t("Ich persönlich", "Me personally", "Ja osobiście", "Я особисто"), t("Die gesetzliche Unfallversicherung (Berufsgenossenschaft)", "The statutory accident insurance (Berufsgenossenschaft)", "Ustawowe ubezpieczenie wypadkowe (Berufsgenossenschaft)", "Обов’язкове страхування від нещасних випадків (Berufsgenossenschaft)"), t("Niemand", "Nobody", "Nikt", "Ніхто")],
            correct: 1, resultTitle: { right: RIGHT_T, wrong: WRONG_T },
            body: t("Arbeitsunfälle sind über die Berufsgenossenschaft versichert. Bei Vorsatz oder grober Fahrlässigkeit kann sie sich die Kosten aber zurückholen, und strafrechtlich bleibt die Verantwortung bei dir.",
                "Work accidents are insured through the Berufsgenossenschaft. With intent or gross negligence, however, it can claim the costs back, and criminal responsibility remains with you.",
                "Wypadki przy pracy są ubezpieczone w Berufsgenossenschaft. Przy umyślności lub rażącym niedbalstwie może ona jednak odzyskać koszty, a odpowiedzialność karna zostaje przy tobie.",
                "Нещасні випадки на роботі застраховані через Berufsgenossenschaft. Але при умислі чи грубій необережності вона може стягнути витрати назад, а кримінальна відповідальність лишається на тобі."),
            src: { de: "SGB VII §§ 105, 110" }, button: BTN_GO,
        }),
        step("learn", {
            title: t("Vier Arten von Folgen", "Four kinds of consequences", "Cztery rodzaje skutków", "Чотири види наслідків"),
            lead: t("Ein Fehler am Stapler kann gleichzeitig mehrere Verfahren nach sich ziehen.", "A mistake on the forklift can lead to several proceedings at the same time.", "Błąd na wózku może jednocześnie pociągnąć za sobą kilka postępowań.", "Помилка на навантажувачі може одночасно потягнути кілька процедур."),
            points: [
                pt(t("<b>Arbeitsrecht:</b> Abmahnung, Entzug des Fahrauftrags, im schweren Fall Kündigung.", "<b>Employment law:</b> warning, withdrawal of the driving authorisation, in serious cases dismissal.", "<b>Prawo pracy:</b> upomnienie, cofnięcie upoważnienia do jazdy, w poważnych przypadkach zwolnienie.", "<b>Трудове право:</b> попередження, відкликання доручення на керування, у тяжких випадках звільнення.")),
                pt(t("<b>Haftung:</b> Schadensersatz für Sachschäden und Rückforderung der Kosten durch die Unfallversicherung.", "<b>Liability:</b> compensation for property damage and recovery of costs by the accident insurance.", "<b>Odpowiedzialność cywilna:</b> odszkodowanie za szkody w mieniu i zwrot kosztów na rzecz ubezpieczyciela wypadkowego.", "<b>Відповідальність:</b> відшкодування майнової шкоди і повернення витрат страхуванню.")),
                pt(t("<b>Ordnungswidrigkeit:</b> Verstöße gegen DGUV Vorschrift 68 können mit einem Bußgeld geahndet werden.", "<b>Administrative offence:</b> breaches of DGUV Regulation 68 can be punished with a fine.", "<b>Wykroczenie:</b> naruszenie DGUV Vorschrift 68 może skończyć się grzywną.", "<b>Адміністративне правопорушення:</b> порушення DGUV Vorschrift 68 можуть каратися штрафом.")),
                pt(t("<b>Strafrecht:</b> Wird ein Mensch verletzt oder getötet, drohen Verfahren wegen fahrlässiger Körperverletzung oder fahrlässiger Tötung.", "<b>Criminal law:</b> if a person is injured or killed, proceedings for negligent bodily harm or negligent homicide may follow.", "<b>Prawo karne:</b> jeśli ktoś zostanie ranny lub zginie, grozi postępowanie o nieumyślne uszkodzenie ciała lub nieumyślne spowodowanie śmierci.", "<b>Кримінальне право:</b> якщо людину травмовано чи вбито, загрожує провадження за необережне тілесне ушкодження чи необережне вбивство.")),
            ],
            merke: t("Verantwortlich ist der Mensch am Steuer, nicht das Gerät.", "The person at the wheel is responsible, not the machine.", "Odpowiada człowiek za kierownicą, nie maszyna.", "Відповідає людина за кермом, а не техніка."),
            src: { de: "DGUV V68 §40; SGB VII §§ 110, 209; StGB §§ 222, 229" },
        }),
        step("learn", {
            title: t("Wer haftet für Schäden?", "Who is liable for damage?", "Kto odpowiada za szkody?", "Хто відповідає за шкоду?"),
            lead: t("Im Betrieb entscheidet vor allem, wie schwer dein Fehler war.", "At work, what matters most is how serious your mistake was.", "W zakładzie decyduje przede wszystkim, jak poważny był twój błąd.", "На підприємстві головне, наскільки серйозною була твоя помилка."),
            points: [
                pt(t("<b>Leichte Fahrlässigkeit,</b> ein kleines Versehen: In der Regel trägt der Arbeitgeber den Schaden.", "<b>Slight negligence,</b> a small oversight: as a rule the employer bears the damage.", "<b>Lekkie niedbalstwo,</b> drobne przeoczenie: zwykle szkodę ponosi pracodawca.", "<b>Легка необережність,</b> дрібний недогляд: зазвичай шкоду несе роботодавець.")),
                pt(t("<b>Mittlere Fahrlässigkeit:</b> Der Schaden wird je nach Fall zwischen dir und dem Arbeitgeber geteilt.", "<b>Moderate negligence:</b> the damage is shared between you and the employer depending on the case.", "<b>Średnie niedbalstwo:</b> szkodę dzieli się zależnie od przypadku między ciebie i pracodawcę.", "<b>Середня необережність:</b> шкоду ділять між тобою і роботодавцем залежно від випадку.")),
                pt(t("<b>Grobe Fahrlässigkeit oder Vorsatz:</b> Du haftest in der Regel selbst, und die Unfallversicherung kann Kosten von dir zurückfordern.", "<b>Gross negligence or intent:</b> you are usually liable yourself, and the accident insurance can claim costs back from you.", "<b>Rażące niedbalstwo lub umyślność:</b> zwykle odpowiadasz sam, a ubezpieczyciel wypadkowy może żądać od ciebie zwrotu kosztów.", "<b>Груба необережність чи умисел:</b> зазвичай відповідаєш сам, а страхування може вимагати від тебе відшкодування витрат.")),
            ],
            merke: t("Grob fahrlässig ist zum Beispiel Fahren unter Alkohol, ohne Auftrag oder mit bekanntem Mangel.", "Gross negligence is, for example, driving under the influence of alcohol, without authorisation or with a known defect.", "Rażącym niedbalstwem jest na przykład jazda po alkoholu, bez upoważnienia albo ze znaną usterką.", "Груба необережність, наприклад, керування під алкоголем, без доручення чи з відомою несправністю."),
            src: { de: "SGB VII §§ 105, 110; Grundsätze der Arbeitnehmerhaftung (BAG)" },
        }),
        step("sort", {
            title: t("Wie schwer ist der Fehler?", "How serious is the mistake?", "Jak poważny jest błąd?", "Наскільки серйозна помилка?"),
            lead: t("Typische Beispiele. Im Einzelfall entscheidet ein Gericht.", "Typical examples. In individual cases a court decides.", "Typowe przykłady. W konkretnym przypadku decyduje sąd.", "Типові приклади. В окремому випадку вирішує суд."),
            labels: [t("leicht", "slight", "lekki", "легка"), t("grob", "gross", "rażący", "груба")],
            items: [
                { t: t("Beim Rangieren kurz unaufmerksam, die Kante eines Regals gestreift", "Briefly distracted while manoeuvring, grazed the edge of a rack", "Chwila nieuwagi przy manewrowaniu, otarcie krawędzi regału", "На мить відволікся під час маневру, зачепив край стелажа"), a: 0, why: t("Ein kleines Versehen, wie es auch sorgfältigen Fahrern passieren kann.", "A small oversight that can happen even to careful drivers.", "Drobne przeoczenie, które może się zdarzyć także ostrożnemu kierowcy.", "Дрібний недогляд, який може статися і з уважним водієм.") },
                { t: t("In der Pause zwei Bier getrunken und danach Stapler gefahren", "Had two beers during the break and drove the forklift afterwards", "Dwa piwa w przerwie, a potem jazda wózkiem", "Випив два пива на перерві, а потім керував навантажувачем"), a: 1, why: t("Alkohol am Steuer gilt als grob fahrlässig (DGUV V1 §15).", "Alcohol at the wheel counts as gross negligence (DGUV V1 §15).", "Alkohol za kierownicą uznaje się za rażące niedbalstwo (DGUV V1 §15).", "Алкоголь за кермом вважається грубою необережністю (DGUV V1 §15).") },
                { t: t("Mit hoch angehobener Last schnell quer durch die Halle gefahren", "Drove fast across the hall with the load lifted high", "Szybka jazda przez halę z wysoko podniesionym ładunkiem", "Швидко проїхав цехом з високо піднятим вантажем"), a: 1, why: t("Bewusster Verstoß gegen §12 der DGUV Vorschrift 68.", "Deliberate breach of §12 of DGUV Regulation 68.", "Świadome naruszenie §12 DGUV Vorschrift 68.", "Свідоме порушення §12 DGUV Vorschrift 68.") },
                { t: t("Defekte Bremse gemeldet bekommen und trotzdem gefahren", "Was told the brake is defective and drove anyway", "Usłyszał, że hamulec jest uszkodzony, i mimo to pojechał", "Знав про несправне гальмо і все одно поїхав"), a: 1, why: t("Mit bekanntem Sicherheitsmangel zu fahren ist grob fahrlässig (DGUV V68 §9).", "Driving with a known safety defect is gross negligence (DGUV V68 §9).", "Jazda ze znaną usterką bezpieczeństwa to rażące niedbalstwo (DGUV V68 §9).", "Керувати з відомою несправністю безпеки — груба необережність (DGUV V68 §9).") },
                { t: t("Palette leicht schräg aufgenommen, ein Karton fällt herunter", "Picked up the pallet slightly askew, one carton falls off", "Paleta podjęta lekko krzywo, spada jeden karton", "Палету підхопив трохи криво, падає одна коробка"), a: 0, why: t("Ein Fehler beim Arbeiten, aber kein bewusster Regelverstoß.", "A mistake while working, but no deliberate breach of the rules.", "Błąd w pracy, ale nie świadome łamanie zasad.", "Помилка в роботі, але не свідоме порушення правил.") },
            ],
            allRight: t("Richtig eingeschätzt.", "Assessed correctly.", "Trafnie ocenione.", "Оцінено правильно."),
            someWrong: t("Faustregel: Wer Regeln bewusst missachtet, handelt grob fahrlässig.", "Rule of thumb: anyone who deliberately ignores the rules acts with gross negligence.", "Zasada: kto świadomie łamie zasady, działa rażąco niedbale.", "Правило: хто свідомо порушує правила, діє з грубою необережністю."),
        }),
        step("learn", {
            title: t("Bußgeld und Strafe", "Fines and penalties", "Grzywna i kara", "Штраф і покарання"),
            lead: t("Neben der Haftung können Behörden und Gerichte Strafen verhängen.", "In addition to liability, authorities and courts can impose penalties.", "Oprócz odpowiedzialności cywilnej urzędy i sądy mogą nałożyć kary.", "Крім відповідальності, органи влади і суди можуть призначити покарання."),
            points: [
                pt(t("<b>Bußgeld:</b> Wer gegen die DGUV Vorschrift 68 verstößt, handelt ordnungswidrig. Die Geldbuße kann bis zu 10.000 Euro betragen.", "<b>Fine:</b> anyone who breaches DGUV Regulation 68 commits an administrative offence. The fine can be up to 10,000 euros.", "<b>Grzywna:</b> kto narusza DGUV Vorschrift 68, popełnia wykroczenie. Grzywna może wynieść do 10 000 euro.", "<b>Штраф:</b> хто порушує DGUV Vorschrift 68, чинить адміністративне правопорушення. Штраф може сягати 10 000 євро.")),
                pt(t("<b>Fahrlässige Körperverletzung:</b> Freiheitsstrafe bis zu drei Jahren oder Geldstrafe.", "<b>Negligent bodily harm:</b> imprisonment of up to three years or a fine.", "<b>Nieumyślne uszkodzenie ciała:</b> kara pozbawienia wolności do trzech lat albo grzywna.", "<b>Необережне тілесне ушкодження:</b> позбавлення волі до трьох років або штраф.")),
                pt(t("<b>Fahrlässige Tötung:</b> Freiheitsstrafe bis zu fünf Jahren oder Geldstrafe.", "<b>Negligent homicide:</b> imprisonment of up to five years or a fine.", "<b>Nieumyślne spowodowanie śmierci:</b> kara pozbawienia wolności do pięciu lat albo grzywna.", "<b>Необережне вбивство:</b> позбавлення волі до п’яти років або штраф.")),
                pt(t("<b>Auch der Unternehmer</b> haftet, wenn er Unbefugte fahren lässt oder Mängel nicht beheben lässt.", "<b>The employer is also liable</b> if he lets unauthorised persons drive or does not have defects repaired.", "<b>Pracodawca też odpowiada,</b> jeśli pozwala jeździć osobom bez uprawnień albo nie usuwa usterek.", "<b>Роботодавець теж відповідає,</b> якщо дозволяє керувати особам без права чи не усуває несправності.")),
            ],
            merke: t("Ein Unfall ist schnell passiert, ein Verfahren dauert oft Jahre.", "An accident happens quickly, proceedings often take years.", "Wypadek zdarza się szybko, postępowanie trwa często latami.", "Нещасний випадок стається швидко, процес часто триває роками."),
            src: { de: "DGUV V68 §40; SGB VII §209; StGB §§ 222, 229" },
        }),
        step("learn", {
            title: t("Wenn der Stapler kippt", "If the forklift tips over", "Gdy wózek się przewraca", "Якщо навантажувач перекидається"),
            lead: t("Die schwersten Verletzungen entstehen, wenn Fahrer beim Umkippen abspringen und vom Fahrerschutzdach getroffen werden.", "The most serious injuries happen when drivers jump off during a tip-over and are hit by the overhead guard.", "Najcięższe obrażenia powstają, gdy kierowca przy przewracaniu wyskakuje i zostaje przygnieciony daszkiem ochronnym.", "Найтяжчі травми бувають, коли водій при перекиданні вистрибує і його вдаряє захисний дах."),
            ordered: true,
            points: [
                pt(t("<b>Sitzen bleiben,</b> nicht abspringen.", "<b>Stay seated,</b> do not jump off.", "<b>Zostań na siedzeniu,</b> nie wyskakuj.", "<b>Залишайся на сидінні,</b> не вистрибуй.")),
                pt(t("<b>Festhalten:</b> beide Hände ans Lenkrad, Füße fest in den Fußraum.", "<b>Hold on:</b> both hands on the steering wheel, feet firmly in the footwell.", "<b>Trzymaj się:</b> obie ręce na kierownicy, stopy mocno w podłodze.", "<b>Тримайся:</b> обидві руки на кермі, ноги міцно в ніші.")),
                pt(t("<b>Gegen die Kipprichtung lehnen,</b> der Gurt hält dich im Fahrerschutzdach.", "<b>Lean away from the tipping direction,</b> the belt keeps you inside the overhead guard.", "<b>Odchyl się przeciwnie do kierunku przewracania,</b> pas utrzyma cię pod daszkiem.", "<b>Відхилися проти напрямку перекидання,</b> пасок втримає тебе під дахом.")),
            ],
            merke: t("Den Gurt oder die Rückhalteeinrichtung immer benutzen. Er schützt dich genau in diesem Moment.", "Always use the belt or the restraint system. It protects you exactly at this moment.", "Zawsze używaj pasa lub systemu przytrzymującego. Chroni cię właśnie w tej chwili.", "Завжди використовуй пасок або утримувальну систему. Він захищає саме в цю мить."),
            src: { de: "DGUV V68 DA zu §6; DGUV G 308-001, Anhang 1 Nr. 2 und 5" },
        }),
        step("video", {
            title: t("Nachgestellt: Stapler kippt in der Kurve", "Re-enacted: forklift tips in a curve", "Inscenizacja: wózek przewraca się na zakręcie", "Відтворення: навантажувач перекидається в повороті"),
            brief: t("Nachgestellte Szene mit Dummy oder als Animation: Ein Stapler fährt zu schnell in die Kurve und kippt. Einmal mit angelegtem Gurt, einmal mit abspringendem Fahrer. Keine echten Personen in Gefahr bringen.",
                "Re-enacted scene with a dummy or as an animation: a forklift takes a curve too fast and tips over. Once with the belt fastened, once with the driver jumping off. Do not put real people at risk.",
                "Scena z manekinem albo animacja: wózek wjeżdża za szybko w zakręt i się przewraca. Raz z zapiętym pasem, raz z wyskakującym kierowcą. Nie narażać prawdziwych osób.",
                "Відтворена сцена з манекеном або анімація: навантажувач занадто швидко входить у поворот і перекидається. Раз із пристебнутим паском, раз із водієм, що вистрибує. Не наражати реальних людей."),
            length: t("20 bis 40 Sekunden", "20 to 40 seconds", "20 do 40 sekund", "20–40 секунд"),
        }),
        step("question", {
            title: t("Der Stapler beginnt zur Seite zu kippen. Was tust du?", "The forklift starts to tip sideways. What do you do?", "Wózek zaczyna przewracać się na bok. Co robisz?", "Навантажувач починає перекидатися набік. Що робиш?"),
            layout: "list",
            options: [t("Schnell abspringen", "Jump off quickly", "Szybko wyskakuję", "Швидко вистрибую"), t("Sitzen bleiben, festhalten, gegen die Kipprichtung lehnen", "Stay seated, hold on, lean away from the tipping direction", "Zostaję, trzymam się, odchylam się przeciwnie", "Сиджу, тримаюся, відхиляюся проти перекидання"), t("Aufstehen und das Fahrerschutzdach festhalten", "Stand up and hold on to the overhead guard", "Wstaję i trzymam się daszka", "Встаю і тримаюся за дах")],
            correct: 1, resultTitle: { right: RIGHT_T, wrong: t("Nein, das ist gefährlich", "No, that is dangerous", "Nie, to niebezpieczne", "Ні, це небезпечно") },
            body: t("Wer abspringt, wird oft vom kippenden Stapler getroffen. Im Fahrerschutzdach mit Gurt bist du am sichersten.", "Anyone who jumps off is often hit by the tipping forklift. Inside the overhead guard with the belt fastened you are safest.", "Kto wyskakuje, często zostaje przygnieciony przez przewracający się wózek. Pod daszkiem, z zapiętym pasem, jesteś najbezpieczniejszy.", "Хто вистрибує, часто потрапляє під навантажувач. Під захисним дахом із паском ти в найбільшій безпеці."),
            src: { de: "DGUV V68 DA zu §6" },
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: t("Wer zahlt die Behandlung nach einem Arbeitsunfall?", "Who pays for treatment after a work accident?", "Kto płaci za leczenie po wypadku przy pracy?", "Хто платить за лікування після нещасного випадку на роботі?"), options: [t("Die Berufsgenossenschaft", "The Berufsgenossenschaft", "Berufsgenossenschaft", "Berufsgenossenschaft"), t("Die Krankenkasse des Fahrers", "The driver’s health insurer", "Kasa chorych kierowcy", "Лікарняна каса водія"), t("Der verletzte Kollege selbst", "The injured colleague himself", "Sam ranny kolega", "Сам травмований колега")], correct: 0, why: t("Arbeitsunfälle deckt die gesetzliche Unfallversicherung.", "Work accidents are covered by the statutory accident insurance.", "Wypadki przy pracy pokrywa ustawowe ubezpieczenie wypadkowe.", "Нещасні випадки на роботі покриває обов’язкове страхування.") },
                { q: t("Wann kann die Berufsgenossenschaft Geld von dir zurückfordern?", "When can the Berufsgenossenschaft claim money back from you?", "Kiedy Berufsgenossenschaft może żądać od ciebie zwrotu?", "Коли Berufsgenossenschaft може вимагати від тебе гроші?"), options: [t("Bei jedem Unfall", "After every accident", "Przy każdym wypadku", "При кожному нещасному випадку"), t("Bei Vorsatz oder grober Fahrlässigkeit", "With intent or gross negligence", "Przy umyślności lub rażącym niedbalstwie", "При умислі чи грубій необережності"), t("Nie", "Never", "Nigdy", "Ніколи")], correct: 1, why: t("Der Rückgriff ist bei Vorsatz und grober Fahrlässigkeit möglich (SGB VII §110).", "Recourse is possible for intent and gross negligence (SGB VII §110).", "Regres jest możliwy przy umyślności i rażącym niedbalstwie (SGB VII §110).", "Регрес можливий при умислі та грубій необережності (SGB VII §110).") },
                { q: t("Was gilt als grob fahrlässig?", "What counts as gross negligence?", "Co uznaje się za rażące niedbalstwo?", "Що вважається грубою необережністю?"), options: [t("Ein kurzer Moment der Unaufmerksamkeit", "A brief moment of inattention", "Chwila nieuwagi", "Мить неуважності"), t("Fahren unter Alkohol", "Driving under the influence of alcohol", "Jazda po alkoholu", "Керування під алкоголем"), t("Ein Karton fällt von der Palette", "A carton falls off the pallet", "Karton spada z palety", "Коробка падає з палети")], correct: 1, why: t("Wer Regeln bewusst missachtet, handelt grob fahrlässig.", "Anyone who deliberately ignores rules acts with gross negligence.", "Kto świadomie łamie zasady, działa rażąco niedbale.", "Хто свідомо порушує правила, діє з грубою необережністю.") },
                { q: t("Der Stapler kippt. Was ist richtig?", "The forklift tips over. What is right?", "Wózek się przewraca. Co jest prawidłowe?", "Навантажувач перекидається. Що правильно?"), options: [t("Abspringen", "Jump off", "Wyskoczyć", "Вистрибнути"), t("Sitzen bleiben und festhalten", "Stay seated and hold on", "Zostać i się trzymać", "Залишатися і триматися"), t("Motor abstellen und aussteigen", "Switch off the engine and get out", "Wyłączyć silnik i wysiąść", "Вимкнути двигун і вийти")], correct: 1, why: t("Mit Gurt im Fahrerschutzdach bleiben ist am sichersten.", "Staying inside the overhead guard with the belt is safest.", "Najbezpieczniej zostać pod daszkiem z zapiętym pasem.", "Найбезпечніше лишатися під дахом із паском.") },
            ],
            allRight: t("Alles richtig. Thema 1.4 sitzt.", "All correct. Topic 1.4 is done.", "Wszystko dobrze. Temat 1.4 opanowany.", "Усе правильно. Тему 1.4 засвоєно."),
            someWrong: t("Fast. Geh bei Bedarf zurück zu den Karten.", "Almost. If needed, go back to the cards.", "Prawie. W razie potrzeby wróć do kart.", "Майже. За потреби повернися до карток."),
        }),
        step("summary", { title: SUM, points: [
            pt(t("<b>Versichert, aber nicht frei:</b> Die Berufsgenossenschaft zahlt, kann bei grober Fahrlässigkeit aber zurückfordern.", "<b>Insured, but not off the hook:</b> the Berufsgenossenschaft pays, but can claim back in cases of gross negligence.", "<b>Ubezpieczony, ale nie bezkarny:</b> Berufsgenossenschaft płaci, ale przy rażącym niedbalstwie może żądać zwrotu.", "<b>Застрахований, але не звільнений:</b> Berufsgenossenschaft платить, але при грубій необережності може вимагати повернення.")),
            pt(t("<b>Vier Folgen:</b> Arbeitsrecht, Haftung, Bußgeld und Strafrecht, oft gleichzeitig.", "<b>Four consequences:</b> employment law, liability, fines and criminal law, often at once.", "<b>Cztery skutki:</b> prawo pracy, odpowiedzialność, grzywna i prawo karne, często naraz.", "<b>Чотири наслідки:</b> трудове право, відповідальність, штраф і кримінальне право, часто одночасно.")),
            pt(t("<b>Grob fahrlässig</b> sind bewusste Regelverstöße wie Alkohol, fehlender Auftrag oder bekannter Mangel.", "<b>Gross negligence</b> means deliberate rule breaches such as alcohol, missing authorisation or a known defect.", "<b>Rażące niedbalstwo</b> to świadome łamanie zasad: alkohol, brak upoważnienia, znana usterka.", "<b>Груба необережність</b> — свідомі порушення: алкоголь, відсутність доручення, відома несправність.")),
            pt(t("<b>Beim Kippen:</b> sitzen bleiben, festhalten, Gurt anlegen.", "<b>When tipping:</b> stay seated, hold on, wear the belt.", "<b>Przy przewracaniu:</b> zostań, trzymaj się, zapnij pas.", "<b>При перекиданні:</b> сиди, тримайся, пристебнися.")),
        ] }),
    ];
}

/* ════════════════ 1.5 Aufbau des Staplerscheins ════════════════ */
export function lesson15(step: Mk): Step[] {
    const L = (de: string, en: string, pl: string, uk: string) => t(de, en, pl, uk);
    return [
        step("question", {
            title: L("Ist der Staplerschein ein Führerschein?", "Is the forklift licence a driving licence?", "Czy Staplerschein to prawo jazdy?", "Чи є Staplerschein водійським посвідченням?"),
            text: OPENER, options: [L("Ja", "Yes", "Tak", "Так"), L("Nein", "No", "Nie", "Ні")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: L("Nein, ist er nicht", "No, it isn’t", "Nie, nie jest", "Ні, не є") },
            body: L("Der Staplerschein weist deine Ausbildung nach. Er ist keine Fahrerlaubnis für die Straße und auch kein Fahrauftrag. Den Auftrag erteilt dein Arbeitgeber.",
                "The forklift licence proves your training. It is not a driving licence for the road, nor is it a driving authorisation. Your employer issues the authorisation.",
                "Staplerschein potwierdza twoje szkolenie. Nie jest prawem jazdy na drogę ani upoważnieniem do jazdy. Upoważnienie wydaje pracodawca.",
                "Staplerschein підтверджує твоє навчання. Це не посвідчення водія для дороги і не доручення на керування. Доручення видає роботодавець."),
            src: { de: "DGUV G 308-001, Abschn. 3.6 und 4" }, button: BTN_GO,
        }),
        step("learn", {
            title: L("Was du nach Stufe 1 bekommst", "What you receive after level 1", "Co dostajesz po stopniu 1", "Що ти отримуєш після ступеня 1"),
            lead: L("Wer die Prüfungen in Theorie und Praxis besteht, bekommt zwei Nachweise.", "Anyone who passes the theory and practical exams receives two documents.", "Kto zda egzamin z teorii i praktyki, dostaje dwa dokumenty.", "Хто складає іспити з теорії та практики, отримує два документи."),
            points: [
                pt(L("<b>Qualifikationszertifikat:</b> bestätigt die erfolgreich abgeschlossene Ausbildung.", "<b>Certificate of qualification:</b> confirms the successfully completed training.", "<b>Certyfikat kwalifikacji:</b> potwierdza ukończone szkolenie.", "<b>Сертифікат кваліфікації:</b> підтверджує успішне навчання.")),
                pt(L("<b>Fahrausweis (Staplerschein)</b> mit deinen persönlichen Daten und einem Lichtbild.", "<b>Driver’s card (forklift licence)</b> with your personal details and a photo.", "<b>Fahrausweis (Staplerschein)</b> z twoimi danymi i zdjęciem.", "<b>Fahrausweis (Staplerschein)</b> з твоїми даними і фото.")),
                pt(L("<b>Ausbildungsgerät:</b> Die Ausbildungsstelle trägt Typ und Tragfähigkeit des Staplers ein, auf dem du gelernt hast.", "<b>Training truck:</b> the training provider enters the type and capacity of the forklift you trained on.", "<b>Wózek szkoleniowy:</b> ośrodek wpisuje typ i udźwig wózka, na którym się uczyłeś.", "<b>Навчальна техніка:</b> навчальний заклад вписує тип і вантажопідйомність навантажувача, на якому ти вчився.")),
                pt(L("<b>Felder für Stufe 2 und 3:</b> Weitere Ausbildungen und die Einweisung im Betrieb werden mit Stempel oder Unterschrift eingetragen.", "<b>Fields for levels 2 and 3:</b> further training and on-site familiarisation are entered with a stamp or signature.", "<b>Pola na stopień 2 i 3:</b> kolejne szkolenia i instruktaż w zakładzie wpisuje się pieczątką lub podpisem.", "<b>Поля для ступенів 2 і 3:</b> подальше навчання та інструктаж на підприємстві вписують печаткою чи підписом.")),
            ],
            merke: L("Der Staplerschein zeigt, was du gelernt hast und auf welchem Gerät.", "The forklift licence shows what you learned and on which truck.", "Staplerschein pokazuje, czego się nauczyłeś i na jakim wózku.", "Staplerschein показує, чого ти навчився і на якій техніці."),
            src: { de: "DGUV G 308-001, Abschn. 3.6" },
        }),
        step("sim", {
            sim: "licence", title: L("So ist der Staplerschein aufgebaut", "How the forklift licence is structured", "Jak zbudowany jest Staplerschein", "Як побудований Staplerschein"),
            texts: {
                "Aufgabe: Tippe alle Felder an. Angesehen: {n} von {m}": L("Aufgabe: Tippe alle Felder an. Angesehen: {n} von {m}", "Task: tap all fields. Viewed: {n} of {m}", "Zadanie: dotknij wszystkich pól. Obejrzane: {n} z {m}", "Завдання: торкнися всіх полів. Переглянуто: {n} з {m}"),
                "Alle Felder angesehen.": L("Alle Felder angesehen.", "All fields viewed.", "Wszystkie pola obejrzane.", "Усі поля переглянуто."),
                "Staplerschein mit Feldern": L("Staplerschein mit Feldern", "Forklift licence with fields", "Staplerschein z polami", "Staplerschein з полями"),
                "noch nicht angesehen": L("noch nicht angesehen", "not viewed yet", "jeszcze nie obejrzane", "ще не переглянуто"),
            },
            points: [
                { id: "photo", label: L("Lichtbild", "Photo", "Zdjęcie", "Фото"), finding: L("Zeigt, dass der Ausweis zu dir gehört. Bei Staplero machen wir das Foto am Praxistag.", "Shows that the card belongs to you. At Staplero we take the photo on the practical day.", "Pokazuje, że dokument należy do ciebie. W Staplero robimy zdjęcie w dniu praktycznym.", "Показує, що посвідчення належить тобі. У Staplero фото роблять у практичний день.") },
                { id: "person", label: L("Name und Geburtsdatum", "Name and date of birth", "Imię, nazwisko i data urodzenia", "Ім’я та дата народження"), finding: L("Genau wie im Personalausweis. Danach wird der Nachweis bei einer Prüfung zugeordnet.", "Exactly as in your ID card. This is how the document is matched during a check.", "Dokładnie jak w dowodzie. Po tym przypisuje się dokument przy kontroli.", "Точно як у паспорті. За цим документ звіряють під час перевірки.") },
                { id: "issuer", label: L("Ausbildungsstelle und Ausbilder", "Training provider and instructor", "Ośrodek i instruktor", "Навчальний заклад і інструктор"), finding: L("Wer die Ausbildung nach DGUV Grundsatz 308-001 durchgeführt und die Prüfung abgenommen hat.", "Who carried out the training under DGUV Principle 308-001 and held the exam.", "Kto przeprowadził szkolenie według DGUV Grundsatz 308-001 i egzamin.", "Хто провів навчання за DGUV Grundsatz 308-001 та іспит.") },
                { id: "truck", label: L("Gerät und Tragfähigkeit", "Truck and capacity", "Wózek i udźwig", "Техніка і вантажопідйомність"), finding: L("Typ und Tragfähigkeit des Staplers, auf dem du in Stufe 1 ausgebildet wurdest, zum Beispiel Gegengewichtsstapler 2,5 t.", "Type and capacity of the forklift you trained on in level 1, for example counterbalance forklift 2.5 t.", "Typ i udźwig wózka, na którym szkoliłeś się w stopniu 1, na przykład wózek czołowy 2,5 t.", "Тип і вантажопідйомність навантажувача ступеня 1, наприклад вилковий з противагою 2,5 т.") },
                { id: "levels", label: L("Stufen 1, 2 und 3", "Levels 1, 2 and 3", "Stopnie 1, 2 i 3", "Ступені 1, 2 і 3"), finding: L("Stufe 1 ist bestätigt. Stufe 2 für weitere Geräte und Stufe 3 für deinen Betrieb werden später eingetragen.", "Level 1 is confirmed. Level 2 for further trucks and level 3 for your company are entered later.", "Stopień 1 jest potwierdzony. Stopień 2 na inne wózki i stopień 3 dla zakładu wpisuje się później.", "Ступінь 1 підтверджено. Ступінь 2 для іншої техніки і ступінь 3 для підприємства вписують пізніше.") },
                { id: "code", label: L("Prüfcode und QR-Code", "Verification code and QR code", "Kod weryfikacji i kod QR", "Код перевірки і QR-код"), finding: L("Damit kann ein Arbeitgeber die Echtheit online prüfen. Das bietet Staplero zusätzlich zur Karte an.", "An employer can use it to check authenticity online. Staplero offers this in addition to the card.", "Pracodawca może nim sprawdzić autentyczność online. Staplero oferuje to oprócz karty.", "З ним роботодавець може перевірити справжність онлайн. Staplero пропонує це на додачу до картки.") },
            ],
        }),
        step("learn", {
            title: L("Karte, PDF und Wallet", "Card, PDF and wallet", "Karta, PDF i portfel", "Картка, PDF і гаманець"),
            lead: L("Bei Staplero bekommst du den Staplerschein in drei Formen.", "At Staplero you receive your forklift licence in three forms.", "W Staplero dostajesz Staplerschein w trzech formach.", "У Staplero ти отримуєш Staplerschein у трьох формах."),
            points: [
                pt(L("<b>Karte</b> im Scheckkartenformat für die Tasche.", "<b>Card</b> in credit card format for your pocket.", "<b>Karta</b> w formacie karty płatniczej do kieszeni.", "<b>Картка</b> у форматі банківської для кишені.")),
                pt(L("<b>PDF</b> zum Ausdrucken oder Weiterleiten an den Arbeitgeber.", "<b>PDF</b> for printing or forwarding to your employer.", "<b>PDF</b> do wydruku albo przesłania pracodawcy.", "<b>PDF</b> для друку чи пересилання роботодавцю.")),
                pt(L("<b>Apple Wallet und Google Wallet</b> auf dem Handy, immer dabei.", "<b>Apple Wallet and Google Wallet</b> on your phone, always with you.", "<b>Apple Wallet i Google Wallet</b> w telefonie, zawsze przy sobie.", "<b>Apple Wallet і Google Wallet</b> у телефоні, завжди з тобою.")),
                pt(L("<b>Online prüfbar:</b> Über den Code sieht der Arbeitgeber, ob der Nachweis echt und gültig ist.", "<b>Verifiable online:</b> using the code, the employer sees whether the document is genuine and valid.", "<b>Do sprawdzenia online:</b> po kodzie pracodawca widzi, czy dokument jest prawdziwy i ważny.", "<b>Перевірка онлайн:</b> за кодом роботодавець бачить, чи документ справжній і дійсний.")),
            ],
            merke: L("Alle Formen sind gleichwertig. Wichtig ist, dass du den Nachweis bei Kontrollen vorzeigen kannst.", "All forms are equivalent. What matters is that you can show the document during checks.", "Wszystkie formy są równoważne. Ważne, żebyś mógł pokazać dokument przy kontroli.", "Усі форми рівноцінні. Головне, щоб ти міг показати документ під час перевірки."),
            src: { de: "Staplero" },
        }),
        step("learn", {
            title: L("Was der Staplerschein nicht ist", "What the forklift licence is not", "Czym Staplerschein nie jest", "Чим Staplerschein не є"),
            lead: L("Drei Missverständnisse hören wir oft.", "We often hear three misunderstandings.", "Często słyszymy trzy nieporozumienia.", "Ми часто чуємо три непорозуміння."),
            points: [
                pt(L("<b>Kein Fahrauftrag:</b> Fahren darfst du erst mit dem schriftlichen Auftrag deines jetzigen Arbeitgebers.", "<b>Not a driving authorisation:</b> you may only drive with the written authorisation of your current employer.", "<b>To nie upoważnienie:</b> jeździć możesz dopiero z pisemnym upoważnieniem obecnego pracodawcy.", "<b>Не доручення:</b> керувати можна лише з письмовим дорученням теперішнього роботодавця.")),
                pt(L("<b>Nicht für jedes Gerät:</b> Für Schubmaststapler und andere Bauarten brauchst du Stufe 2, im Betrieb immer Stufe 3.", "<b>Not for every truck:</b> for reach trucks and other types you need level 2, and level 3 is always needed on site.", "<b>Nie na każdy wózek:</b> na reach truck i inne typy potrzebny jest stopień 2, a w zakładzie zawsze stopień 3.", "<b>Не для всієї техніки:</b> для річтраків та інших типів потрібен ступінь 2, на підприємстві завжди ступінь 3.")),
                pt(L("<b>Kein Freibrief für immer:</b> Ein festes Ablaufdatum gibt es nicht. Ohne regelmäßige Fahrpraxis über ein Jahr sollte der Fahrauftrag aber zurückgenommen werden, und die Unterweisung wiederholt sich jährlich.", "<b>Not a licence forever:</b> there is no fixed expiry date. But without regular driving practice for a year the authorisation should be withdrawn, and instruction is repeated every year.", "<b>Nie na zawsze:</b> nie ma stałej daty ważności. Ale bez regularnej praktyki przez rok upoważnienie powinno zostać cofnięte, a instruktaż powtarza się co roku.", "<b>Не назавжди:</b> фіксованого строку немає. Але без регулярної практики протягом року доручення слід відкликати, а інструктаж повторюють щороку.")),
            ],
            merke: L("Staplerschein plus Auftrag plus Einweisung: erst dann darfst du fahren.", "Forklift licence plus authorisation plus familiarisation: only then may you drive.", "Staplerschein plus upoważnienie plus instruktaż: dopiero wtedy możesz jeździć.", "Staplerschein плюс доручення плюс інструктаж: лише тоді можна керувати."),
            src: { de: "DGUV V68 §7 mit DA; DGUV G 308-001, Abschn. 3.3, 3.4 und 4; DGUV V1 §4" },
        }),
        step("sort", {
            title: L("Darf er damit fahren?", "May he drive with that?", "Czy może z tym jeździć?", "Чи може він з цим керувати?"),
            lead: L("Prüfe jede Situation im Betrieb.", "Check each situation on site.", "Sprawdź każdą sytuację w zakładzie.", "Перевір кожну ситуацію на підприємстві."),
            labels: [L("reicht nicht", "not enough", "nie wystarczy", "недостатньо"), L("reicht", "enough", "wystarczy", "достатньо")],
            items: [
                { t: L("Staplerschein, schriftlicher Auftrag des jetzigen Arbeitgebers und Einweisung, Gegengewichtsstapler", "Forklift licence, written authorisation from current employer and familiarisation, counterbalance forklift", "Staplerschein, pisemne upoważnienie obecnego pracodawcy i instruktaż, wózek czołowy", "Staplerschein, письмове доручення теперішнього роботодавця й інструктаж, навантажувач із противагою"), a: 1, why: L("Alles vorhanden: Nachweis, Auftrag und Einweisung.", "Everything is there: proof, authorisation and familiarisation.", "Jest wszystko: dokument, upoważnienie i instruktaż.", "Є все: документ, доручення й інструктаж.") },
                { t: L("Nur der Staplerschein, kein Auftrag", "Only the forklift licence, no authorisation", "Tylko Staplerschein, bez upoważnienia", "Лише Staplerschein, без доручення"), a: 0, why: L("Ohne schriftlichen Auftrag darf niemand fahren (§7).", "Nobody may drive without written authorisation (§7).", "Bez pisemnego upoważnienia nikt nie może jeździć (§7).", "Без письмового доручення ніхто не може керувати (§7).") },
                { t: L("Staplerschein Stufe 1, er soll einen Schubmaststapler fahren", "Level 1 forklift licence, he is supposed to drive a reach truck", "Staplerschein stopień 1, ma jeździć reach truckiem", "Staplerschein ступінь 1, має керувати річтраком"), a: 0, why: L("Für den Schubmaststapler braucht er zusätzlich Stufe 2.", "For the reach truck he also needs level 2.", "Na reach truck potrzebuje dodatkowo stopnia 2.", "Для річтрака потрібен ще ступінь 2.") },
                { t: L("Foto vom Staplerschein eines Kollegen", "Photo of a colleague’s forklift licence", "Zdjęcie Staplerschein kolegi", "Фото Staplerschein колеги"), a: 0, why: L("Der Nachweis gilt nur für die Person, die die Prüfung bestanden hat.", "The document is only valid for the person who passed the exam.", "Dokument jest ważny tylko dla osoby, która zdała egzamin.", "Документ дійсний лише для людини, яка склала іспит.") },
                { t: L("Staplerschein im Wallet, Code online geprüft, Auftrag und Einweisung vorhanden", "Forklift licence in the wallet, code checked online, authorisation and familiarisation present", "Staplerschein w portfelu, kod sprawdzony online, jest upoważnienie i instruktaż", "Staplerschein у гаманці, код перевірено онлайн, є доручення й інструктаж"), a: 1, why: L("Die digitale Form ist gleichwertig.", "The digital form is equivalent.", "Forma cyfrowa jest równoważna.", "Цифрова форма рівноцінна.") },
            ],
            allRight: L("Richtig erkannt.", "Well spotted.", "Dobrze rozpoznane.", "Правильно визначено."),
            someWrong: L("Merke: Nachweis, Auftrag und Einweisung gehören zusammen.", "Remember: proof, authorisation and familiarisation belong together.", "Zapamiętaj: dokument, upoważnienie i instruktaż idą w parze.", "Запам’ятай: документ, доручення й інструктаж — разом."),
        }),
        step("video", {
            title: L("Der Staplerschein in der Hand", "The forklift licence in your hand", "Staplerschein w ręce", "Staplerschein у руці"),
            brief: L("Karte in der Hand, danach das Handy mit dem Staplerschein im Wallet. Ein Schichtleiter scannt den QR-Code und sieht die Bestätigung auf der Prüfseite.", "The card in your hand, then the phone with the forklift licence in the wallet. A shift supervisor scans the QR code and sees the confirmation on the verification page.", "Karta w ręce, potem telefon ze Staplerschein w portfelu. Kierownik zmiany skanuje kod QR i widzi potwierdzenie na stronie weryfikacji.", "Картка в руці, потім телефон зі Staplerschein у гаманці. Начальник зміни сканує QR-код і бачить підтвердження на сторінці перевірки."),
            length: L("20 bis 30 Sekunden", "20 to 30 seconds", "20 do 30 sekund", "20–30 секунд"),
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: L("Was steht auf dem Fahrausweis über die Ausbildung?", "What does the card say about the training?", "Co jest na Fahrausweis o szkoleniu?", "Що зазначено на посвідченні про навчання?"), options: [L("Typ und Tragfähigkeit des Ausbildungsgeräts", "Type and capacity of the training truck", "Typ i udźwig wózka szkoleniowego", "Тип і вантажопідйомність навчальної техніки"), L("Die Note jeder Frage", "The grade for each question", "Ocena każdego pytania", "Оцінка кожного питання"), L("Die Führerscheinklasse", "The driving licence class", "Kategoria prawa jazdy", "Категорія посвідчення водія")], correct: 0, why: L("Die Ausbildungsstelle trägt Typ und Tragfähigkeit ein (G 308-001, 3.6).", "The training provider enters type and capacity (G 308-001, 3.6).", "Ośrodek wpisuje typ i udźwig (G 308-001, 3.6).", "Навчальний заклад вписує тип і вантажопідйомність (G 308-001, 3.6).") },
                { q: L("Ersetzt der Staplerschein den Fahrauftrag?", "Does the forklift licence replace the driving authorisation?", "Czy Staplerschein zastępuje upoważnienie?", "Чи замінює Staplerschein доручення?"), options: [L("Ja", "Yes", "Tak", "Так"), L("Nein, den Auftrag erteilt der Arbeitgeber schriftlich", "No, the employer issues the authorisation in writing", "Nie, upoważnienie wydaje pracodawca na piśmie", "Ні, доручення роботодавець дає письмово"), L("Nur im Wallet", "Only in the wallet", "Tylko w portfelu", "Лише в гаманці")], correct: 1, why: L("Nachweis und Auftrag sind zwei verschiedene Dinge.", "Proof and authorisation are two different things.", "Dokument i upoważnienie to dwie różne rzeczy.", "Документ і доручення — різні речі.") },
                { q: L("Wie prüft ein Arbeitgeber die Echtheit bei Staplero?", "How does an employer check authenticity at Staplero?", "Jak pracodawca sprawdza autentyczność w Staplero?", "Як роботодавець перевіряє справжність у Staplero?"), options: [L("Gar nicht", "Not at all", "Wcale", "Ніяк"), L("Über den Code oder QR-Code online", "Online using the code or QR code", "Online przez kod lub kod QR", "Онлайн за кодом чи QR-кодом"), L("Per Fax an die Berufsgenossenschaft", "By fax to the Berufsgenossenschaft", "Faksem do Berufsgenossenschaft", "Факсом до Berufsgenossenschaft")], correct: 1, why: L("Der Code führt auf die Prüfseite mit dem Status des Nachweises.", "The code leads to the verification page with the status of the document.", "Kod prowadzi do strony weryfikacji ze statusem dokumentu.", "Код веде на сторінку перевірки зі статусом документа.") },
            ],
            allRight: L("Alles richtig. Thema 1.5 sitzt.", "All correct. Topic 1.5 is done.", "Wszystko dobrze. Temat 1.5 opanowany.", "Усе правильно. Тему 1.5 засвоєно."),
            someWrong: L("Fast. Geh bei Bedarf zurück zu den Karten.", "Almost. If needed, go back to the cards.", "Prawie. W razie potrzeby wróć do kart.", "Майже. За потреби повернися до карток."),
        }),
        step("summary", { title: SUM, points: [
            pt(L("<b>Nachweis, kein Führerschein:</b> Der Staplerschein belegt deine Ausbildung nach DGUV Grundsatz 308-001.", "<b>Proof, not a driving licence:</b> the forklift licence documents your training under DGUV Principle 308-001.", "<b>Dokument, nie prawo jazdy:</b> Staplerschein potwierdza szkolenie według DGUV Grundsatz 308-001.", "<b>Документ, не посвідчення водія:</b> Staplerschein підтверджує навчання за DGUV Grundsatz 308-001.")),
            pt(L("<b>Inhalt:</b> Daten, Lichtbild, Ausbildungsgerät mit Tragfähigkeit und Felder für Stufe 2 und 3.", "<b>Contents:</b> details, photo, training truck with capacity and fields for levels 2 and 3.", "<b>Zawartość:</b> dane, zdjęcie, wózek szkoleniowy z udźwigiem i pola na stopnie 2 i 3.", "<b>Зміст:</b> дані, фото, навчальна техніка з вантажопідйомністю і поля для ступенів 2 і 3.")),
            pt(L("<b>Bei Staplero:</b> als Karte, PDF und im Wallet, online prüfbar.", "<b>At Staplero:</b> as a card, PDF and in the wallet, verifiable online.", "<b>W Staplero:</b> jako karta, PDF i w portfelu, do sprawdzenia online.", "<b>У Staplero:</b> як картка, PDF і в гаманці, з перевіркою онлайн.")),
            pt(L("<b>Fahren darfst du erst</b> mit Auftrag und Einweisung im Betrieb.", "<b>You may only drive</b> with an authorisation and on-site familiarisation.", "<b>Jeździć możesz dopiero</b> z upoważnieniem i instruktażem w zakładzie.", "<b>Керувати можна лише</b> з дорученням та інструктажем на підприємстві.")),
        ] }),
    ];
}

/* ════════════════ 1.6 Stufensystem ════════════════ */
export function lesson16(step: Mk): Step[] {
    const L = t;
    return [
        step("question", {
            title: L("Dein Staplerschein ist vom Gabelstapler. Darfst du damit jeden Stapler fahren?", "Your licence is from a counterbalance forklift. May you drive any truck with it?", "Twój Staplerschein jest z wózka czołowego. Możesz nim jeździć każdym wózkiem?", "Твій Staplerschein з вилкового навантажувача. Чи можна з ним керувати будь-якою технікою?"),
            text: OPENER, options: [L("Ja", "Yes", "Tak", "Так"), L("Nein", "No", "Nie", "Ні")], correct: 1,
            resultTitle: { right: RIGHT_T, wrong: L("Leider nein", "Unfortunately not", "Niestety nie", "На жаль, ні") },
            body: L("Die Ausbildung ist in drei Stufen aufgebaut. Für andere Bauarten und für deinen Betrieb kommen weitere Stufen dazu.", "Training is built in three levels. Further levels are added for other types and for your company.", "Szkolenie ma trzy stopnie. Na inne typy wózków i dla zakładu dochodzą kolejne stopnie.", "Навчання має три ступені. Для інших типів і для підприємства додаються наступні."),
            src: { de: "DGUV G 308-001, Abschn. 3.1" }, button: BTN_GO,
        }),
        step("learn", {
            title: L("Die drei Stufen", "The three levels", "Trzy stopnie", "Три ступені"),
            lead: L("Die Stufen bauen aufeinander auf. Stufe 2 setzt eine bestandene Stufe 1 voraus.", "The levels build on each other. Level 2 requires a passed level 1.", "Stopnie budują się na sobie. Stopień 2 wymaga zdanego stopnia 1.", "Ступені побудовані один на одному. Ступінь 2 вимагає складеного ступеня 1."),
            ordered: true,
            points: [
                pt(L("<b>Stufe 1, allgemeine Qualifizierung:</b> Theorie und Praxis, meist auf dem Gabelstapler, mit Abschlussprüfung. Diesen Kurs machst du gerade.", "<b>Level 1, general qualification:</b> theory and practice, usually on a counterbalance forklift, with a final exam. This is the course you are doing now.", "<b>Stopień 1, kwalifikacja ogólna:</b> teoria i praktyka, zwykle na wózku czołowym, z egzaminem końcowym. To ten kurs.", "<b>Ступінь 1, загальна кваліфікація:</b> теорія і практика, зазвичай на вилковому навантажувачі, з підсумковим іспитом. Це твій курс.")),
                pt(L("<b>Stufe 2, Zusatzqualifizierung:</b> für spezielle Geräte wie Schubmaststapler, Seiten- und Dreiseitenstapler, Portalhubwagen, Reachstacker oder Klammern über 1 t, wieder mit Prüfung.", "<b>Level 2, additional qualification:</b> for special trucks such as reach trucks, side loaders and three-way trucks, straddle carriers, reach stackers or clamps over 1 t, again with an exam.", "<b>Stopień 2, kwalifikacja dodatkowa:</b> na specjalne wózki jak reach truck, wózki boczne i trójstronne, przewoźniki bramowe, reachstackery czy chwytaki powyżej 1 t, znów z egzaminem.", "<b>Ступінь 2, додаткова кваліфікація:</b> для спеціальної техніки, як річтраки, бокові й тристоронні навантажувачі, портальні, річстакери чи захвати понад 1 т, знову з іспитом.")),
                pt(L("<b>Stufe 3, betriebliche Qualifizierung:</b> im eigenen Betrieb. Einweisung auf die vorhandenen Geräte und Unterweisung nach der Betriebsanweisung, schriftlich dokumentiert.", "<b>Level 3, company qualification:</b> at your own company. Familiarisation with the trucks there and instruction according to the operating instructions, documented in writing.", "<b>Stopień 3, kwalifikacja zakładowa:</b> we własnym zakładzie. Zapoznanie z wózkami i instruktaż według instrukcji zakładowej, udokumentowane na piśmie.", "<b>Ступінь 3, кваліфікація на підприємстві:</b> на власному підприємстві. Ознайомлення з наявною технікою та інструктаж за робочою інструкцією, письмово задокументовано.")),
            ],
            merke: L("Stufe 1 öffnet die Tür. Welche Geräte du fahren darfst, entscheiden Stufe 2 und 3.", "Level 1 opens the door. Levels 2 and 3 decide which trucks you may drive.", "Stopień 1 otwiera drzwi. Jakimi wózkami możesz jeździć, decydują stopnie 2 i 3.", "Ступінь 1 відкриває двері. Якою технікою можна керувати, вирішують ступені 2 і 3."),
            src: { de: "DGUV G 308-001, Abschn. 3.1 bis 3.4" },
        }),
        step("sort", {
            title: L("Welche Stufe ist das?", "Which level is it?", "Który to stopień?", "Який це ступінь?"),
            lead: L("Ordne jede Situation einer Stufe zu.", "Assign each situation to a level.", "Przyporządkuj każdą sytuację do stopnia.", "Віднеси кожну ситуацію до ступеня."),
            labels: [L("Stufe 1", "Level 1", "Stopień 1", "Ступінь 1"), L("Stufe 2", "Level 2", "Stopień 2", "Ступінь 2"), L("Stufe 3", "Level 3", "Stopień 3", "Ступінь 3")],
            items: [
                { t: L("Theorieunterricht zur Standsicherheit mit Abschlussprüfung", "Theory lessons on stability with a final exam", "Teoria o stateczności z egzaminem końcowym", "Теорія про стійкість із підсумковим іспитом"), a: 0, why: L("Gehört zur allgemeinen Qualifizierung.", "Part of the general qualification.", "Należy do kwalifikacji ogólnej.", "Належить до загальної кваліфікації.") },
                { t: L("Ausbildung auf dem Schubmaststapler", "Training on the reach truck", "Szkolenie na reach trucku", "Навчання на річтраку"), a: 1, why: L("Spezielle Bauart: Zusatzqualifizierung.", "Special type: additional qualification.", "Specjalny typ: kwalifikacja dodatkowa.", "Спеціальний тип: додаткова кваліфікація.") },
                { t: L("Einweisung in die freigegebenen Fahrwege eurer Halle", "Instruction on the approved routes in your hall", "Instruktaż o dozwolonych drogach w waszej hali", "Інструктаж щодо дозволених маршрутів у вашому цеху"), a: 2, why: L("Verhaltensbezogener Teil der betrieblichen Qualifizierung.", "Behavioural part of the company qualification.", "Część zachowań kwalifikacji zakładowej.", "Поведінкова частина кваліфікації на підприємстві.") },
                { t: L("Klammer-Anbaugerät für Lasten über 1 t", "Clamp attachment for loads over 1 t", "Chwytak do ładunków powyżej 1 t", "Захват для вантажів понад 1 т"), a: 1, why: L("Besondere Anbaugeräte gehören zu Stufe 2.", "Special attachments belong to level 2.", "Specjalny osprzęt to stopień 2.", "Спеціальне навісне обладнання — ступінь 2.") },
                { t: L("Einweisung auf das neue Staplermodell im Betrieb", "Familiarisation with the new forklift model at the company", "Zapoznanie z nowym modelem wózka w zakładzie", "Ознайомлення з новою моделлю на підприємстві"), a: 2, why: L("Gerätebezogener Teil der betrieblichen Qualifizierung.", "Truck-related part of the company qualification.", "Część sprzętowa kwalifikacji zakładowej.", "Технічна частина кваліфікації на підприємстві.") },
                { t: L("Prüfungsfahrt mit Aufnehmen und Stapeln von Ladegut", "Driving test with picking up and stacking loads", "Jazda egzaminacyjna z podejmowaniem i piętrowaniem ładunku", "Практичний іспит із підхопленням і штабелюванням вантажу"), a: 0, why: L("Praktische Abschlussprüfung der Stufe 1.", "Practical final exam of level 1.", "Praktyczny egzamin stopnia 1.", "Практичний підсумковий іспит ступеня 1.") },
            ],
            allRight: L("Perfekt. Du kennst das Stufensystem.", "Perfect. You know the level system.", "Świetnie. Znasz system stopni.", "Чудово. Ти знаєш систему ступенів."),
            someWrong: L("Faustregel: Stufe 1 Grundlagen, Stufe 2 Spezialgeräte, Stufe 3 dein Betrieb.", "Rule of thumb: level 1 basics, level 2 special trucks, level 3 your company.", "Zasada: stopień 1 podstawy, stopień 2 sprzęt specjalny, stopień 3 twój zakład.", "Правило: ступінь 1 основи, ступінь 2 спецтехніка, ступінь 3 твоє підприємство."),
        }),
        step("learn", {
            title: L("Wie Stufe 1 abläuft", "How level 1 works", "Jak przebiega stopień 1", "Як проходить ступінь 1"),
            lead: L("Der DGUV Grundsatz 308-001 legt Umfang und Prüfung fest.", "DGUV Principle 308-001 sets out the scope and the exam.", "DGUV Grundsatz 308-001 określa zakres i egzamin.", "DGUV Grundsatz 308-001 визначає обсяг та іспит."),
            points: [
                pt(L("<b>Dauer:</b> drei bis fünf Tage bzw. 20 bis 32 Lehreinheiten zu je 45 Minuten, davon mindestens 10 Lehreinheiten Theorie.", "<b>Duration:</b> three to five days or 20 to 32 teaching units of 45 minutes each, of which at least 10 units are theory.", "<b>Czas:</b> trzy do pięciu dni albo 20 do 32 jednostek po 45 minut, z czego co najmniej 10 to teoria.", "<b>Тривалість:</b> від трьох до п’яти днів або 20–32 навчальні одиниці по 45 хвилин, з них щонайменше 10 — теорія.")),
                pt(L("<b>Theorieprüfung:</b> schriftlich, ca. 50 Fragen mit vorgegebenen Antworten, bestanden ab 70 %.", "<b>Theory exam:</b> written, about 50 multiple-choice questions, pass mark 70 %.", "<b>Egzamin teoretyczny:</b> pisemny, ok. 50 pytań wyboru, zaliczenie od 70 %.", "<b>Теоретичний іспит:</b> письмовий, близько 50 питань із варіантами, складено від 70 %.")),
                pt(L("<b>Prüfungsfahrt:</b> 15 bis 20 Minuten, Ladegut aufnehmen und sauber absetzen oder stapeln. Die Fehlerpunkte stehen vorher fest.", "<b>Driving test:</b> 15 to 20 minutes, pick up the load and set it down or stack it cleanly. The penalty points are fixed in advance.", "<b>Jazda egzaminacyjna:</b> 15 do 20 minut, podjąć ładunek i czysto odstawić lub spiętrować. Punkty karne ustala się wcześniej.", "<b>Практичний іспит:</b> 15–20 хвилин, підхопити вантаж і акуратно поставити чи заштабелювати. Штрафні бали визначають заздалегідь.")),
                pt(L("<b>Nicht bestanden?</b> Beide Prüfungen dürfen wiederholt werden.", "<b>Not passed?</b> Both exams may be repeated.", "<b>Niezdane?</b> Oba egzaminy można powtórzyć.", "<b>Не склав?</b> Обидва іспити можна повторити.")),
            ],
            merke: L("Bestanden ist Stufe 1 erst, wenn Theorie und Praxis bestanden sind.", "Level 1 is only passed when both theory and practice are passed.", "Stopień 1 jest zdany dopiero po zdaniu teorii i praktyki.", "Ступінь 1 складено лише тоді, коли складено і теорію, і практику."),
            src: { de: "DGUV G 308-001, Abschn. 3.5 und 8" },
        }),
        step("learn", {
            title: L("Ausnahmen: Mitgänger und Teleskopstapler", "Exceptions: pedestrian trucks and telehandlers", "Wyjątki: wózki prowadzone i ładowarki teleskopowe", "Винятки: техніка з керуванням пішки та телескопічні навантажувачі"),
            lead: L("Nicht jedes Gerät fällt unter diesen Grundsatz.", "Not every truck falls under this principle.", "Nie każdy wózek podlega tej zasadzie.", "Не вся техніка підпадає під цей принцип."),
            points: [
                pt(L("<b>Mitgänger-Geräte:</b> Eine Unterweisung in Theorie und Praxis genügt, der Auftrag muss nicht schriftlich sein.", "<b>Pedestrian-controlled trucks:</b> instruction in theory and practice is enough, the authorisation need not be in writing.", "<b>Wózki prowadzone:</b> wystarczy instruktaż z teorii i praktyki, upoważnienie nie musi być pisemne.", "<b>Техніка з керуванням пішки:</b> достатньо інструктажу з теорії та практики, доручення не обов’язково письмове.")),
                pt(L("<b>Geräte ohne Hubgerüst</b> wie Schlepper oder Kommissionierer: Ausbildung angepasst an das Gerät, Nachweis und Auftrag gelten nur dafür.", "<b>Trucks without a mast</b> such as tow tractors or order pickers: training adapted to the truck, proof and authorisation only apply to it.", "<b>Wózki bez masztu</b> jak ciągniki czy kompletacyjne: szkolenie dopasowane do wózka, dokument i upoważnienie dotyczą tylko jego.", "<b>Техніка без щогли,</b> як тягачі чи комплектувальники: навчання під техніку, документ і доручення лише для неї.")),
                pt(L("<b>Geländegängige Teleskopstapler:</b> Hier gilt ein eigener Grundsatz, DGUV Grundsatz 308-009.", "<b>Rough-terrain telehandlers:</b> a separate principle applies here, DGUV Principle 308-009.", "<b>Terenowe ładowarki teleskopowe:</b> obowiązuje osobna zasada, DGUV Grundsatz 308-009.", "<b>Позашляхові телескопічні навантажувачі:</b> діє окремий принцип, DGUV Grundsatz 308-009.")),
            ],
            src: { de: "DGUV G 308-001, Abschn. 1.1 bis 1.3" },
        }),
        step("video", {
            title: L("Stufe 3 im Betrieb", "Level 3 at the company", "Stopień 3 w zakładzie", "Ступінь 3 на підприємстві"),
            brief: L("Ein neuer Fahrer wird im Betrieb eingewiesen: erst am eigenen Stapler (Bedienelemente, Besonderheiten), dann Rundgang über die freigegebenen Fahrwege, Lagerflächen und Tore. Am Ende unterschreibt er die Unterweisung.", "A new driver is familiarised at the company: first on the company’s own forklift (controls, special features), then a walk along the approved routes, storage areas and gates. At the end he signs the instruction record.", "Nowy kierowca przechodzi instruktaż w zakładzie: najpierw na wózku firmy (elementy sterowania, szczególne cechy), potem obchód dróg, miejsc składowania i bram. Na końcu podpisuje instruktaż.", "Нового водія інструктують на підприємстві: спершу на власному навантажувачі (органи керування, особливості), потім обхід маршрутів, складів і воріт. Наприкінці він підписує інструктаж."),
            length: L("45 bis 60 Sekunden", "45 to 60 seconds", "45 do 60 sekund", "45–60 секунд"),
        }),
        step("choice", {
            title: QUICK,
            items: [
                { q: L("Was ist Voraussetzung für Stufe 2?", "What is required for level 2?", "Co jest warunkiem stopnia 2?", "Що потрібно для ступеня 2?"), options: [L("Eine bestandene Stufe 1", "A passed level 1", "Zdany stopień 1", "Складений ступінь 1"), L("Ein Führerschein Klasse C", "A class C driving licence", "Prawo jazdy kategorii C", "Посвідчення категорії C"), L("Zwei Jahre Praxis", "Two years of practice", "Dwa lata praktyki", "Два роки практики")], correct: 0, why: L("Stufe 2 baut auf Stufe 1 auf (G 308-001, 3.1).", "Level 2 builds on level 1 (G 308-001, 3.1).", "Stopień 2 opiera się na stopniu 1 (G 308-001, 3.1).", "Ступінь 2 спирається на ступінь 1 (G 308-001, 3.1).") },
                { q: L("Wo findet Stufe 3 statt?", "Where does level 3 take place?", "Gdzie odbywa się stopień 3?", "Де проходить ступінь 3?"), options: [L("In der Fahrschule", "At the driving school", "W szkole jazdy", "В автошколі"), L("Im eigenen Betrieb", "At your own company", "We własnym zakładzie", "На власному підприємстві"), L("Online", "Online", "Online", "Онлайн")], correct: 1, why: L("Sie bezieht sich auf die Gegebenheiten deines Betriebs.", "It relates to the conditions at your company.", "Dotyczy warunków w twoim zakładzie.", "Стосується умов твого підприємства.") },
                { q: L("Ab wie viel Prozent ist die Theorieprüfung bestanden?", "From what percentage is the theory exam passed?", "Od ilu procent zalicza się egzamin teoretyczny?", "Від скількох відсотків складено теоретичний іспит?"), options: [L("50 %", "50 %", "50 %", "50 %"), L("70 %", "70 %", "70 %", "70 %"), L("90 %", "90 %", "90 %", "90 %")], correct: 1, why: L("Mindestens 70 % der Fragen oder Punkte (G 308-001, 8).", "At least 70 % of the questions or points (G 308-001, 8).", "Co najmniej 70 % pytań lub punktów (G 308-001, 8).", "Щонайменше 70 % питань чи балів (G 308-001, 8).") },
                { q: L("Brauchst du für einen Mitgänger-Hubwagen Stufe 1?", "Do you need level 1 for a pedestrian pallet truck?", "Czy na prowadzony wózek paletowy potrzebny jest stopień 1?", "Чи потрібен ступінь 1 для палетного візка з керуванням пішки?"), options: [L("Ja, immer", "Yes, always", "Tak, zawsze", "Так, завжди"), L("Nein, eine Unterweisung genügt", "No, an instruction is enough", "Nie, wystarczy instruktaż", "Ні, достатньо інструктажу"), L("Nur mit Führerschein", "Only with a driving licence", "Tylko z prawem jazdy", "Лише з посвідченням водія")], correct: 1, why: L("Für Mitgänger genügt die Unterweisung (V68 §7 Abs. 2).", "For pedestrian trucks instruction is enough (V68 §7 para. 2).", "Dla wózków prowadzonych wystarczy instruktaż (V68 §7 ust. 2).", "Для техніки з керуванням пішки достатньо інструктажу (V68 §7 абз. 2).") },
            ],
            allRight: L("Alles richtig. Kapitel 1 ist geschafft.", "All correct. Chapter 1 is done.", "Wszystko dobrze. Rozdział 1 zaliczony.", "Усе правильно. Розділ 1 пройдено."),
            someWrong: L("Fast. Geh bei Bedarf zurück zu den Karten.", "Almost. If needed, go back to the cards.", "Prawie. W razie potrzeby wróć do kart.", "Майже. За потреби повернися до карток."),
        }),
        step("summary", { title: SUM, ordered: true, points: [
            pt(L("<b>Stufe 1:</b> allgemeine Qualifizierung in Theorie und Praxis, Prüfung ab 70 % und Prüfungsfahrt.", "<b>Level 1:</b> general qualification in theory and practice, exam pass mark 70 % and driving test.", "<b>Stopień 1:</b> kwalifikacja ogólna z teorii i praktyki, egzamin od 70 % i jazda egzaminacyjna.", "<b>Ступінь 1:</b> загальна кваліфікація з теорії та практики, іспит від 70 % і практичний іспит.")),
            pt(L("<b>Stufe 2:</b> Zusatzqualifizierung für spezielle Geräte und Anbaugeräte, wieder mit Prüfung.", "<b>Level 2:</b> additional qualification for special trucks and attachments, again with an exam.", "<b>Stopień 2:</b> kwalifikacja dodatkowa na sprzęt specjalny i osprzęt, znów z egzaminem.", "<b>Ступінь 2:</b> додаткова кваліфікація для спецтехніки та навісного обладнання, знову з іспитом.")),
            pt(L("<b>Stufe 3:</b> Einweisung und Unterweisung im eigenen Betrieb, dokumentiert.", "<b>Level 3:</b> familiarisation and instruction at your own company, documented.", "<b>Stopień 3:</b> zapoznanie i instruktaż we własnym zakładzie, udokumentowane.", "<b>Ступінь 3:</b> ознайомлення та інструктаж на власному підприємстві, задокументовано.")),
        ] }),
    ];
}
