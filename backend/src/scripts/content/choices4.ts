/**
 * Cztery odpowiedzi do każdego pytania wyboru (testy modułów, rozdział 1, egzamin).
 * Klucz = niemiecka treść pytania. `d` = trzy błędne, ale wiarygodne odpowiedzi (zastępują dotychczasowe),
 * opcjonalnie `correct`/`q`/`why` nadpisują tekst. Kolejność odpowiedzi losuje odtwarzacz.
 * `noExam` = pytanie zostaje w lekcji, ale nie trafia do egzaminu (duplikat, ciekawostka albo zależne od wersji G 308-001).
 */
import { LText } from "../../models/LearningCourse";

const t = (de: string, en: string, pl: string, uk: string): LText => ({ de, en, pl, uk });
export type Fix = { d: [LText, LText, LText]; correct?: LText; q?: LText; why?: LText; noExam?: boolean };

export const CHOICES4: Record<string, Fix> = {
    /* ───── rozdział 1 ───── */
    "Warum schwenkt das Heck eines Gabelstaplers beim Abbiegen aus?": { d: [
        t("Weil das Gegengewicht die Vorderachse entlastet", "Because the counterweight relieves the front axle", "Bo przeciwwaga odciąża przednią oś", "Бо противага розвантажує передню вісь"),
        t("Weil er mit allen vier Rädern lenkt", "Because it steers with all four wheels", "Bo skręca wszystkimi czterema kołami", "Бо він кермує всіма чотирма колесами"),
        t("Weil die Last ihn in der Kurve nach außen zieht", "Because the load pulls it outwards in the bend", "Bo ładunek ciągnie go na zewnątrz zakrętu", "Бо вантаж тягне його назовні в повороті")] },
    "Eine Palette ist leichter als die Nennlast. Darfst du sie immer heben?": { d: [
        t("Ja, solange sie unter der Nennlast liegt", "Yes, as long as it is below the rated capacity", "Tak, dopóki jest lżejsza niż udźwig nominalny", "Так, доки вона легша за номінальну вантажопідйомність"),
        t("Ja, wenn der Hubmast nach hinten geneigt ist", "Yes, if the mast is tilted back", "Tak, jeśli maszt jest odchylony do tyłu", "Так, якщо щогла нахилена назад"),
        t("Nein, höchstens bis zur halben Nennlast", "No, only up to half the rated capacity", "Nie, najwyżej do połowy udźwigu nominalnego", "Ні, щонайбільше до половини номінальної вантажопідйомності")] },
    "Was brauchst du zusätzlich, um mit dem Stapler auf öffentlichen Straßen zu fahren?": { d: [
        t("Eine Warnweste und eingeschaltetes Rundumlicht", "A high-visibility vest and the beacon switched on", "Kamizelkę ostrzegawczą i włączoną lampę błyskową", "Сигнальний жилет і ввімкнений проблисковий маячок"),
        t("Eine Bescheinigung der Berufsgenossenschaft", "A certificate from the employers’ liability insurance", "Zaświadczenie z Berufsgenossenschaft", "Довідку від страхової спілки"),
        t("Einen Vermerk „Straße“ im Staplerschein", "A “road” entry in the forklift licence", "Wpis „droga” w Staplerschein", "Позначку «дорога» в Staplerschein")] },
    "Was brauchst du zusätzlich für die öffentliche Straße?": { noExam: true, d: [
        t("Nur eine gelbe Rundumleuchte am Stapler", "Only a yellow beacon on the forklift", "Tylko żółtą lampę błyskową na wózku", "Лише жовтий маячок на навантажувачі"),
        t("Einen Staplerschein mit Zusatz „Straße“", "A forklift licence with a “road” endorsement", "Staplerschein z dopiskiem „droga”", "Staplerschein з позначкою «дорога»"),
        t("Die Erlaubnis des Schichtleiters", "The shift leader’s permission", "Zgodę kierownika zmiany", "Дозвіл начальника зміни")] },
    "Wer erstellt die Betriebsanweisung?": { d: [
        t("Der Hersteller des Staplers", "The forklift manufacturer", "Producent wózka", "Виробник навантажувача"),
        t("Die Berufsgenossenschaft", "The employers’ liability insurance association", "Berufsgenossenschaft", "Страхова спілка"),
        t("Die Fachkraft für Arbeitssicherheit", "The occupational safety specialist", "Specjalista BHP", "Фахівець з охорони праці")] },
    "Wie oft muss ein Sachkundiger den Stapler prüfen?": { noExam: true, d: [
        t("Alle zwei Jahre", "Every two years", "Co dwa lata", "Кожні два роки"),
        t("Alle drei Jahre", "Every three years", "Co trzy lata", "Кожні три роки"),
        t("Bei jedem Fahrerwechsel", "At every change of driver", "Przy każdej zmianie operatora", "При кожній зміні водія")] },
    "Du fährst mit Last eine Rampe hinunter. Wie?": { d: [
        t("Vorwärts, die Last talseitig", "Forwards, load on the downhill side", "Przodem, ładunek od strony spadku", "Передом, вантаж з боку спуску"),
        t("Vorwärts mit leicht angehobener Last", "Forwards with the load slightly raised", "Przodem z lekko uniesionym ładunkiem", "Передом із трохи піднятим вантажем"),
        t("Rückwärts mit nach vorn geneigtem Mast", "Backwards with the mast tilted forwards", "Tyłem z masztem pochylonym do przodu", "Заднім ходом зі щоглою, нахиленою вперед")] },
    "Bei der Einsatzprüfung tropft Öl aus einem Hydraulikschlauch. Was tust du?": { d: [
        t("Fahren und am Schichtende melden", "Drive and report it at the end of the shift", "Jeździć i zgłosić na koniec zmiany", "Їздити й повідомити в кінці зміни"),
        t("Schlauch nachziehen und weiterfahren", "Tighten the hose and carry on driving", "Dokręcić wąż i jeździć dalej", "Підтягнути шланг і їздити далі"),
        t("Hydrauliköl auffüllen und losfahren", "Top up the hydraulic oil and drive off", "Dolać oleju hydraulicznego i ruszyć", "Долити гідравлічну оливу й рушити")] },
    "Was ist DGUV Vorschrift 68?": { d: [
        t("Ein Gesetz des Bundestages", "A law passed by the Bundestag", "Ustawa uchwalona przez Bundestag", "Закон Бундестагу"),
        t("Eine unverbindliche Empfehlung der BG", "A non-binding recommendation of the employers’ liability insurance association (BG)", "Niewiążąca rekomendacja Berufsgenossenschaft (BG)", "Необов’язкова рекомендація страхової спілки (BG)"),
        t("Eine DIN-Norm für den Bau von Staplern", "A DIN standard for building forklifts", "Norma DIN dotycząca budowy wózków", "Норма DIN для конструкції навантажувачів")] },
    "Wie oft muss dich der Arbeitgeber mindestens unterweisen?": { d: [
        t("Nur vor dem ersten Arbeitstag", "Only before the first working day", "Tylko przed pierwszym dniem pracy", "Лише перед першим робочим днем"),
        t("Alle zwei Jahre", "Every two years", "Co dwa lata", "Кожні два роки"),
        t("Nur nach einem Unfall im Betrieb", "Only after an accident at work", "Tylko po wypadku w zakładzie", "Лише після нещасного випадку на підприємстві")] },
    "Der Sitzschalter nervt. Darfst du ihn überbrücken?": {
        correct: t("Nein, Schutzeinrichtungen nie unwirksam machen", "No, never disable safety devices", "Nie, nigdy nie wyłączaj zabezpieczeń", "Ні, ніколи не вимикай захисні пристрої"), d: [
        t("Ja, mit Zustimmung des Vorgesetzten", "Yes, with the supervisor’s consent", "Tak, za zgodą przełożonego", "Так, за згодою керівника"),
        t("Ja, wenn du immer angeschnallt fährst", "Yes, if you always drive belted", "Tak, jeśli zawsze jeździsz zapięty", "Так, якщо завжди їздиш пристебнутим"),
        t("Nur für kurze Fahrten im Lager", "Only for short trips in the warehouse", "Tylko na krótkie przejazdy w magazynie", "Лише для коротких поїздок на складі")] },
    "Wer zahlt die Behandlung nach einem Arbeitsunfall?": { d: [
        t("Die Krankenkasse des Verletzten", "The injured person’s health insurance", "Kasa chorych poszkodowanego", "Лікарняна каса постраждалого"),
        t("Der Unternehmer aus eigener Tasche", "The employer out of their own pocket", "Pracodawca z własnej kieszeni", "Роботодавець із власної кишені"),
        t("Die Haftpflichtversicherung des Fahrers", "The driver’s liability insurance", "Ubezpieczenie OC operatora", "Страхування відповідальності водія")] },
    "Wann kann die Berufsgenossenschaft Geld von dir zurückfordern?": { d: [
        t("Bei jedem selbst verschuldeten Unfall", "After every accident you caused", "Przy każdym wypadku z twojej winy", "Після кожного випадку з твоєї вини"),
        t("Nur bei Unfällen mit Todesfolge", "Only for fatal accidents", "Tylko przy wypadkach śmiertelnych", "Лише при смертельних випадках"),
        t("Schon bei leichter Fahrlässigkeit", "Even for slight negligence", "Już przy lekkim niedbalstwie", "Уже при легкій необережності")] },
    "Was gilt als grob fahrlässig?": { d: [
        t("Ein kurzer Moment der Unaufmerksamkeit", "A brief moment of inattention", "Chwilowa nieuwaga", "Мить неуважності"),
        t("Ein Karton fällt trotz Sicherung herunter", "A carton falls despite being secured", "Karton spada mimo zabezpieczenia", "Коробка падає, попри закріплення"),
        t("Ein Reifen platzt während der Fahrt", "A tyre bursts while driving", "Opona pęka w czasie jazdy", "Шина лопається під час їзди")] },
    "Der Stapler kippt. Was ist richtig?": { noExam: true, d: [
        t("Zur Kippseite hin abspringen", "Jump off towards the tipping side", "Wyskoczyć w stronę, w którą wózek się przewraca", "Вистрибнути в бік перекидання"),
        t("Entgegen der Kipprichtung abspringen", "Jump off against the tipping direction", "Wyskoczyć przeciwnie do kierunku przewracania", "Вистрибнути проти напрямку перекидання"),
        t("Motor abstellen und schnell aussteigen", "Switch off the engine and get out quickly", "Wyłączyć silnik i szybko wysiąść", "Вимкнути двигун і швидко вийти")] },
    "Was steht auf dem Fahrausweis über die Ausbildung?": { noExam: true, d: [
        t("Die Note jeder einzelnen Prüfungsfrage", "The mark for every single exam question", "Ocena za każde pojedyncze pytanie egzaminacyjne", "Оцінка за кожне окреме питання"),
        t("Die Führerscheinklasse des Fahrers", "The driver’s licence class", "Kategoria prawa jazdy operatora", "Категорія прав водія"),
        t("Die Zahl der gefahrenen Übungsstunden", "The number of practice hours driven", "Liczba godzin jazd ćwiczebnych", "Кількість годин практики")] },
    "Ersetzt der Staplerschein den Fahrauftrag?": { d: [
        t("Ja, der Staplerschein gilt als Auftrag", "Yes, the forklift licence counts as the authorisation", "Tak, Staplerschein jest upoważnieniem", "Так, Staplerschein вважається дорученням"),
        t("Ja, wenn er nicht älter als ein Jahr ist", "Yes, if it is not older than one year", "Tak, jeśli ma mniej niż rok", "Так, якщо йому менше року"),
        t("Nein, den Auftrag erteilt die Berufsgenossenschaft", "No, the Berufsgenossenschaft issues the authorisation", "Nie, upoważnienie wydaje Berufsgenossenschaft", "Ні, доручення видає страхова спілка")] },
    "Wie prüft ein Arbeitgeber die Echtheit bei Staplero?": { noExam: true, d: [
        t("Gar nicht, die Karte genügt", "Not at all, the card is enough", "Wcale, karta wystarczy", "Ніяк, картки достатньо"),
        t("Per Fax an die Berufsgenossenschaft", "By fax to the Berufsgenossenschaft", "Faksem do Berufsgenossenschaft", "Факсом до страхової спілки"),
        t("Durch einen Anruf beim Fahrer", "By calling the driver", "Dzwoniąc do operatora", "Зателефонувавши водієві")] },
    "Was ist Voraussetzung für Stufe 2?": { noExam: true, d: [
        t("Ein Führerschein Klasse C", "A class C driving licence", "Prawo jazdy kat. C", "Посвідчення водія категорії C"),
        t("Zwei Jahre Fahrpraxis", "Two years of driving practice", "Dwa lata praktyki w jeździe", "Два роки практики"),
        t("Ein schriftlicher Fahrauftrag", "A written driving authorisation", "Pisemne upoważnienie do jazdy", "Письмове доручення")] },
    "Wo findet Stufe 3 statt?": { noExam: true, d: [
        t("In der Fahrschule", "At the driving school", "W szkole jazdy", "В автошколі"),
        t("Online im Kurs", "Online in the course", "Online w kursie", "Онлайн у курсі"),
        t("Bei der Berufsgenossenschaft", "At the Berufsgenossenschaft", "W Berufsgenossenschaft", "У страховій спілці")] },
    "Ab wie viel Prozent ist die Theorieprüfung bestanden?": { noExam: true, d: [
        t("50 %", "50 %", "50 %", "50 %"), t("60 %", "60 %", "60 %", "60 %"), t("90 %", "90 %", "90 %", "90 %")] },
    "Brauchst du für einen Mitgänger-Hubwagen Stufe 1?": { noExam: true, d: [
        t("Ja, immer die volle Ausbildung", "Yes, always the full training", "Tak, zawsze pełne szkolenie", "Так, завжди повне навчання"),
        t("Nur mit Führerschein Klasse B", "Only with a class B licence", "Tylko z prawem jazdy kat. B", "Лише з правами категорії B"),
        t("Ja, aber ohne Prüfung", "Yes, but without an exam", "Tak, ale bez egzaminu", "Так, але без іспиту")] },

    /* ───── moduł 2 ───── */
    "Wann darfst du den Hubmast nach vorn neigen?": { d: [
        t("Beim Fahren mit Last", "When driving with a load", "Podczas jazdy z ładunkiem", "Під час їзди з вантажем"),
        t("Beim Fahren bergab", "When driving downhill", "Przy zjeździe w dół", "Під час їзди вниз"),
        t("Immer, wenn die Sicht schlecht ist", "Whenever the view is poor", "Zawsze, gdy widoczność jest słaba", "Щоразу, коли огляд поганий")] },
    "Was bedeutet Freihub?": { d: [
        t("Heben ohne Last auf den Gabeln", "Lifting without a load on the forks", "Podnoszenie bez ładunku na widłach", "Підйом без вантажу на вилах"),
        t("Heben ohne Einsatz der Hydraulik", "Lifting without using hydraulics", "Podnoszenie bez użycia hydrauliki", "Підйом без гідравліки"),
        t("Heben über die Nennhubhöhe hinaus", "Lifting beyond the rated lift height", "Podnoszenie ponad nominalną wysokość podnoszenia", "Підйом понад номінальну висоту підйому")] },
    "Wofür ist das Lastschutzgitter Pflicht?": { d: [
        t("Nur für Fahrten im Freien bei Wind und Regen", "Only for driving outdoors in wind and rain", "Tylko do jazdy na zewnątrz w wietrze i deszczu", "Лише для їзди надворі під час вітру й дощу"),
        t("Nur für Lasten mit mehr als 1.000 kg Gewicht", "Only for loads weighing more than 1,000 kg", "Tylko dla ładunków cięższych niż 1000 kg", "Лише для вантажів важчих за 1000 кг"),
        t("Für das Fahren mit leeren, gestapelten Paletten", "For driving with empty stacked pallets", "Do jazdy ze stosem pustych palet", "Для їзди зі стосом порожніх палет")] },
    "Mit Anbaugerät gilt welches Lastschwerpunktdiagramm?": { d: [
        t("Das Diagramm auf dem Stapler", "The diagram on the forklift", "Wykres na wózku", "Діаграма на навантажувачі"),
        t("Keines, das Anbaugerät ändert nichts", "None, the attachment changes nothing", "Żaden, osprzęt nic nie zmienia", "Жодна, обладнання нічого не змінює"),
        t("Das des Staplers mit 10 % Abzug", "The forklift’s, minus 10 %", "Wykres wózka minus 10 %", "Діаграма навантажувача мінус 10 %")] },
    "Du hast den Staplerschein auf dem Frontstapler. Darfst du damit einen Dreiseitenstapler fahren?": { d: [
        t("Ja, der Staplerschein gilt für alle Stapler", "Yes, the licence covers all forklifts", "Tak, Staplerschein obejmuje wszystkie wózki", "Так, Staplerschein діє для всіх навантажувачів"),
        t("Ja, nach einer kurzen Probefahrt", "Yes, after a short test drive", "Tak, po krótkiej jeździe próbnej", "Так, після короткої пробної поїздки"),
        t("Nein, dafür brauchst du einen Führerschein", "No, you need a driving licence for that", "Nie, do tego potrzebne jest prawo jazdy", "Ні, для цього потрібне посвідчення водія")] },

    /* ───── moduł 3 ───── */
    "Warum ist Rauchen in der Ladestation verboten?": { d: [
        t("Säuredämpfe können sich entzünden", "Acid fumes can ignite", "Opary kwasu mogą się zapalić", "Пари кислоти можуть загорітися"),
        t("Asche kann die Batterie kurzschließen", "Ash can short-circuit the battery", "Popiół może zewrzeć akumulator", "Попіл може спричинити коротке замикання батареї"),
        t("Wegen der Rauchmelder in der Halle", "Because of the smoke detectors in the hall", "Z powodu czujek dymu w hali", "Через димові датчики в цеху")] },
    "Wie weit muss Brennbares mindestens vom Ladeplatz entfernt sein?": { d: [
        t("0,5 m", "0.5 m", "0,5 m", "0,5 м"), t("1 m", "1 m", "1 m", "1 м"), t("5 m", "5 m", "5 m", "5 м")] },
    "Was tust du zuerst, bevor du das Ladegerät anschließt?": { d: [
        t("Destilliertes Wasser auffüllen", "Top up distilled water", "Dolać wody destylowanej", "Долити дистильовану воду"),
        t("Das Ladegerät einschalten", "Switch on the charger", "Włączyć ładowarkę", "Увімкнути зарядний пристрій"),
        t("Den Ladestecker in die Batterie stecken", "Plug the charging plug into the battery", "Włożyć wtyczkę ładowarki do akumulatora", "Вставити штекер зарядного пристрою в батарею")] },
    "Wo darf ein Gasstapler nicht abgestellt werden?": { d: [
        t("Auf einem belüfteten Platz über Erdgleiche", "In a ventilated place above ground level", "Na dobrze wietrzonym miejscu na poziomie terenu", "У провітрюваному місці над рівнем землі"),
        t("Im Freien, mehr als 3 m vom nächsten Gully", "Outdoors, more than 3 m from the nearest drain", "Na zewnątrz, ponad 3 m od najbliższego wpustu kanalizacyjnego", "Надворі, далі ніж 3 м від найближчого водостоку"),
        t("Auf dem gekennzeichneten Platz im Hof", "In the marked place in the yard", "Na oznaczonym miejscu na placu", "На позначеному місці у дворі")] },
    "Warum trägst du beim Flaschenwechsel Lederhandschuhe?": { d: [
        t("Gegen Säurespritzer", "Against acid splashes", "Przeciw bryzgom kwasu", "Від бризок кислоти"),
        t("Gegen elektrische Schläge", "Against electric shocks", "Przeciw porażeniu prądem", "Від ураження струмом"),
        t("Damit die Flasche nicht verschmutzt", "So the cylinder does not get dirty", "Żeby butla się nie zabrudziła", "Щоб балон не забруднився")] },
    "Welcher Antrieb ist in Hallen die erste Wahl?": { d: [
        t("Diesel", "Diesel", "Diesel", "Дизель"), t("Treibgas", "LPG", "Gaz LPG", "Зріджений газ"), t("Erdgas", "Natural gas", "Gaz ziemny", "Природний газ")] },

    /* ───── moduł 4 ───── */
    "Was zeigt das Lastschwerpunktdiagramm?": { d: [
        t("Die zulässige Last je Fahrgeschwindigkeit", "The permitted load per driving speed", "Dopuszczalny ładunek dla danej prędkości", "Допустимий вантаж залежно від швидкості"),
        t("Die maximale Hubhöhe je Mastart", "The maximum lift height per mast type", "Maksymalną wysokość podnoszenia dla danego rodzaju masztu", "Максимальну висоту підйому для типу щогли"),
        t("Den Schwerpunkt des leeren Staplers", "The centre of gravity of the empty forklift", "Środek ciężkości pustego wózka", "Центр ваги порожнього навантажувача")] },
    "Was passiert mit dem Gesamtschwerpunkt, wenn du die Last hebst?": { d: [
        t("Er bleibt gleich", "It stays the same", "Pozostaje bez zmian", "Лишається тим самим"),
        t("Er wandert nach unten", "It moves down", "Przesuwa się w dół", "Зміщується вниз"),
        t("Er wandert nach hinten zum Gegengewicht", "It moves back towards the counterweight", "Przesuwa się do tyłu, ku przeciwwadze", "Зміщується назад до противаги")] },
    "Welcher Stapler kippt in einer zu schnellen Kurve leichter?": {
        correct: t("Der leere Stapler", "The empty forklift", "Pusty wózek", "Порожній навантажувач"), d: [
        t("Der beladene mit gesenkter Last", "The loaded one with the load lowered", "Załadowany z opuszczonym ładunkiem", "Навантажений з опущеним вантажем"),
        t("Beide gleich, es zählt nur das Tempo", "Both the same, only speed matters", "Oba tak samo, liczy się tylko prędkość", "Обидва однаково, має значення лише швидкість"),
        t("Der mit dem schwersten Gegengewicht", "The one with the heaviest counterweight", "Ten z najcięższą przeciwwagą", "Той, що має найважчу противагу")] },
    "Was senkt die Fliehkraft am stärksten?": {
        q: t("Du halbierst in der Kurve deine Geschwindigkeit. Was passiert mit der Fliehkraft?", "You halve your speed in the bend. What happens to the centrifugal force?", "Na zakręcie zmniejszasz prędkość o połowę. Co dzieje się z siłą odśrodkową?", "Ти вдвічі зменшуєш швидкість у повороті. Що стається з відцентровою силою?"),
        correct: t("Sie sinkt auf ein Viertel", "It drops to a quarter", "Spada do jednej czwartej", "Зменшується до чверті"),
        why: t("Die Fliehkraft wächst mit dem Quadrat der Geschwindigkeit: halbe Geschwindigkeit, ein Viertel der Kraft.", "Centrifugal force grows with the square of the speed: half the speed, a quarter of the force.", "Siła odśrodkowa rośnie z kwadratem prędkości: połowa prędkości to jedna czwarta siły.", "Відцентрова сила зростає з квадратом швидкості: половина швидкості — чверть сили."), d: [
        t("Sie sinkt auf die Hälfte", "It drops to half", "Spada do połowy", "Зменшується вдвічі"),
        t("Sie sinkt auf ein Drittel", "It drops to a third", "Spada do jednej trzeciej", "Зменшується до третини"),
        t("Sie bleibt gleich, es zählt nur der Radius", "It stays the same, only the radius matters", "Pozostaje bez zmian, liczy się tylko promień", "Не змінюється, має значення лише радіус")] },
    "Du fährst mit Last eine Rampe hinunter. Wie?__m4": { noExam: true, d: [
        t("Vorwärts", "Forwards", "Przodem", "Передом"), t("Quer zur Rampe", "Across the ramp", "W poprzek rampy", "Поперек рампи"), t("Vorwärts im Schritttempo", "Forwards at walking pace", "Przodem w tempie pieszego", "Передом зі швидкістю пішохода")] },
    "Der Stapler kippt. Was tust du?": { d: [
        t("Zur Kippseite hin abspringen", "Jump off towards the tipping side", "Wyskoczyć w stronę, w którą wózek się przewraca", "Вистрибнути в бік перекидання"),
        t("Entgegen der Kipprichtung abspringen", "Jump off against the tipping direction", "Wyskoczyć przeciwnie do kierunku przewracania", "Вистрибнути проти напрямку перекидання"),
        t("Bremse treten und Last schnell absenken", "Brake and lower the load quickly", "Hamować i szybko opuścić ładunek", "Гальмувати й швидко опустити вантаж")] },

    /* ───── moduł 5 ───── */
    "Was gehört zur bestimmungsgemäßen Verwendung?": { d: [
        t("Lasten mit den Gabelzinken schieben", "Pushing loads with the fork arms", "Przesuwanie ładunków widłami", "Штовхання вантажів вилами"),
        t("Kollegen auf der Palette mitnehmen", "Carrying colleagues on the pallet", "Wożenie kolegów na palecie", "Перевезення колег на палеті"),
        t("Hebel von außen neben dem Stapler bedienen", "Operating the levers from outside next to the truck", "Obsługa dźwigni z zewnątrz, obok wózka", "Керування важелями ззовні, стоячи поруч")] },
    "Wie verlässt du den Stapler zum Feierabend?": { d: [
        t("Bremse, Gabeln auf Kniehöhe, Antrieb aus, Schlüssel stecken lassen", "Brake, forks at knee height, drive switched off, leave the key in", "Hamulec, widły na wysokości kolan, napęd wyłączony, kluczyk w stacyjce", "Гальмо, вила на рівні колін, привід вимкнено, ключ лишити в замку"),
        t("Gabeln ab, Mast nach hinten, Antrieb aus, Schlüssel stecken lassen", "Forks down, mast back, drive switched off, leave the key in", "Widły w dół, maszt do tyłu, napęd wyłączony, kluczyk w stacyjce", "Вила вниз, щогла назад, привід вимкнено, ключ лишити в замку"),
        t("Bremse, Gabeln ab, Spitzen nach oben, Antrieb läuft für die nächste Schicht", "Brake, forks down, tips up, drive left running for the next shift", "Hamulec, widły w dół, końce w górę, napęd pracuje dla następnej zmiany", "Гальмо, вила вниз, кінці вгору, привід працює для наступної зміни")] },
    "Wo darfst du den Stapler nicht abstellen?": { d: [
        t("Auf dem markierten Abstellplatz", "On the marked parking place", "Na oznaczonym miejscu postoju", "На позначеному місці стоянки"),
        t("Am Ladeplatz zum Laden", "At the charging spot to charge", "Na stanowisku ładowania, żeby naładować", "На місці зарядки"),
        t("In der vorgesehenen Abstellbucht", "In the designated parking bay", "W wyznaczonej zatoce postojowej", "У визначеній ніші для стоянки")] },
    "Ein Kollege will auf dem Trittblech mitfahren. Dein Stapler hat keinen Beifahrerplatz.": {
        correct: t("Ablehnen, mitfahren nur auf eigenem Sitz", "Refuse, riding along only on a dedicated seat", "Odmówić: przewóz osób tylko na osobnym siedzeniu", "Відмовити: возити людей можна лише на окремому сидінні"), d: [
        t("Langsam fahren und mitnehmen", "Drive slowly and take them along", "Jechać powoli i go zabrać", "Їхати повільно й узяти його"),
        t("Mitnehmen, wenn er sich gut festhält", "Take them along if they hold on tight", "Zabrać go, jeśli mocno się trzyma", "Узяти, якщо він міцно тримається"),
        t("Mitnehmen, wenn er eine Warnweste trägt", "Take them along if they wear a hi-vis vest", "Zabrać, jeśli ma kamizelkę ostrzegawczą", "Узяти, якщо він у сигнальному жилеті")] },
    "Eine große Last versperrt dir die Sicht nach vorn. Was tust du?": { d: [
        t("Last höher heben und darunter durchschauen", "Raise the load higher and look underneath", "Podnieść ładunek wyżej i patrzeć pod nim", "Підняти вантаж вище й дивитися під ним"),
        t("Langsam vorwärts fahren und dauernd hupen", "Drive forwards slowly and keep sounding the horn", "Jechać powoli przodem i ciągle trąbić", "Повільно їхати передом і весь час сигналити"),
        t("Seitlich aus dem Fahrerplatz lehnen", "Lean out sideways from the driver’s seat", "Wychylić się na bok z miejsca operatora", "Висунутися вбік із місця водія")] },

    /* ───── moduł 6 ───── */
    "Wann prüfst du den Stapler auf Mängel?": { d: [
        t("Einmal pro Woche vor Schichtbeginn", "Once a week before the shift", "Raz w tygodniu przed zmianą", "Раз на тиждень перед зміною"),
        t("Nur nach einer Reparatur durch den Service", "Only after a repair by the service", "Tylko po naprawie przez serwis", "Лише після ремонту сервісом"),
        t("Einmal jährlich bei der Prüfung durch die befähigte Person", "Once a year at the inspection by the competent person", "Raz w roku przy przeglądzie przez osobę uprawnioną", "Раз на рік під час перевірки компетентною особою")] },
    "Wann muss das Bremspedal im Stand spürbaren Widerstand haben?": { d: [
        t("Erst kurz vor dem Bodenblech", "Only just before the floor plate", "Dopiero tuż przy podłodze", "Лише біля самої підлоги"),
        t("Sofort, ganz ohne Leerweg", "Immediately, with no free travel at all", "Od razu, bez żadnego luzu", "Одразу, без вільного ходу"),
        t("Nach etwa zwei Dritteln des Weges", "After about two thirds of the travel", "Po około dwóch trzecich skoku", "Приблизно після двох третин ходу")] },
    "Wie viel Spiel darf das Lenkrad höchstens haben?": { d: [
        t("Eine Handbreit", "A hand’s width", "Szerokość dłoni", "На ширину долоні"),
        t("Eine Vierteldrehung", "A quarter turn", "Ćwierć obrotu", "Чверть оберту"),
        t("Gar keines", "None at all", "Żadnego", "Жодного")] },
    "Du entdeckst einen Riss im Gabelträger. Was tust du?": { d: [
        t("Vorsichtig weiterfahren und abends melden", "Carry on carefully and report it in the evening", "Ostrożnie jeździć i zgłosić wieczorem", "Обережно їздити й повідомити ввечері"),
        t("Nur noch leichte Lasten fahren und melden", "Only move light loads and report it", "Wozić już tylko lekkie ładunki i zgłosić", "Возити лише легкі вантажі й повідомити"),
        t("Riss markieren und beim nächsten Service zeigen", "Mark the crack and show it at the next service", "Oznaczyć pęknięcie i pokazać przy następnym serwisie", "Позначити тріщину й показати на сервісі")] },
    "In welchen Abständen wird der Stapler durch eine befähigte Person geprüft?": { d: [
        t("Höchstens alle drei Jahre", "At most every three years", "Najwyżej co trzy lata", "Щонайбільше раз на три роки"),
        t("Alle zwei Jahre", "Every two years", "Co dwa lata", "Кожні два роки"),
        t("Nur wenn ein Mangel gemeldet wurde", "Only when a defect has been reported", "Tylko po zgłoszeniu usterki", "Лише після повідомлення про дефект")] },
    "Was gehört in den Prüfnachweis?": { d: [
        t("Datum der Prüfung und nächster Termin, sonst nichts", "Date of the inspection and next date, nothing else", "Data przeglądu i następny termin, nic więcej", "Дата перевірки й наступна, більше нічого"),
        t("Name des Fahrers und seine tägliche Checkliste", "The driver’s name and daily checklist", "Nazwisko operatora i jego codzienna lista kontrolna", "Ім’я водія та його щоденний чек-лист"),
        t("Betriebsstunden und Kosten der letzten Reparatur", "Operating hours and the cost of the last repair", "Motogodziny i koszt ostatniej naprawy", "Мотогодини й вартість останнього ремонту")] },

    /* ───── moduł 7 ───── */
    "Wie weit fährst du die Gabeln unter die Last?": { d: [
        t("Bis zur Mitte der Last, das reicht", "To the middle of the load, that is enough", "Do połowy ładunku, to wystarczy", "До середини вантажу, цього досить"),
        t("Bis zwei Drittel der Gabel darunter sind", "Until two thirds of the forks are underneath", "Aż dwie trzecie wideł będą pod spodem", "Доки дві третини вил під вантажем"),
        t("Bis die Spitzen hinten weit herausragen", "Until the tips stick out far at the back", "Aż końce wideł mocno wystają z tyłu", "Доки кінці вил далеко не виступлять")] },
    "Wie hoch fährst du mit der Last?": { d: [
        t("Auf Augenhöhe, dann siehst du sie", "At eye level so you can see it", "Na wysokości oczu, żeby go widzieć", "На рівні очей, щоб бачити"),
        t("Etwa 50 bis 80 cm über dem Boden", "About 50 to 80 cm above the floor", "Ok. 50–80 cm nad podłogą", "Приблизно 50–80 см над підлогою"),
        t("So tief, dass die Palette leicht schleift", "So low that the pallet scrapes slightly", "Tak nisko, że paleta lekko szoruje", "Так низько, що палета трохи шкрябає")] },
    "Wann darf der Hubmast nach vorn geneigt werden?": { noExam: true, d: [
        t("Bei jeder Fahrt bergab", "On every downhill drive", "Przy każdym zjeździe w dół", "При кожному спуску"),
        t("Beim Fahren mit leerer Gabel", "When driving with empty forks", "Przy jeździe z pustymi widłami", "Під час їзди з порожніми вилами"),
        t("Immer, wenn die Last die Sicht nimmt", "Whenever the load blocks the view", "Zawsze, gdy ładunek zasłania widok", "Щоразу, коли вантаж закриває огляд")] },
    "Was gibt die Fachlast an?": { d: [
        t("Das Höchstgewicht für eine einzelne Palette", "The maximum weight for a single pallet", "Największą masę jednej palety", "Максимальну масу однієї палети"),
        t("Das Höchstgewicht für das ganze Regalfeld", "The maximum weight for the whole rack bay", "Największą masę całego pola regału", "Максимальну масу всієї секції"),
        t("Die Tragfähigkeit des Hallenbodens", "The load capacity of the hall floor", "Nośność posadzki hali", "Несучу здатність підлоги цеху")] },
    "Was prüfst du, bevor du einen Lkw befährst?": { d: [
        t("Ob der Motor läuft und die Plane offen ist", "Whether the engine is running and the tarpaulin is open", "Czy silnik pracuje i plandeka jest odsłonięta", "Чи працює двигун і чи відкритий тент"),
        t("Ob der Lkw-Fahrer die Papiere unterschrieben hat", "Whether the lorry driver has signed the papers", "Czy kierowca ciężarówki podpisał dokumenty", "Чи водій підписав документи"),
        t("Ob die Ladefläche sauber und trocken ist", "Whether the loading area is clean and dry", "Czy skrzynia ładunkowa jest czysta i sucha", "Чи кузов чистий і сухий")] },
    "Eine große Last versperrt die Sicht und ragt seitlich über. Was tust du?": { d: [
        t("Rückwärts fahren, dann ist die Sicht wieder frei", "Drive backwards, then the view is clear again", "Jechać tyłem, wtedy widok jest wolny", "Їхати задом, тоді огляд вільний"),
        t("Last anheben und unter ihr hindurchschauen", "Raise the load and look underneath it", "Podnieść ładunek i patrzeć pod nim", "Підняти вантаж і дивитися під ним"),
        t("Vorwärts fahren und das Warnblinklicht einschalten", "Drive forwards and switch on the hazard lights", "Jechać przodem z włączonymi światłami awaryjnymi", "Їхати передом з увімкненою аварійною сигналізацією")] },

    /* ───── moduł 8 ───── */
    "Womit darf eine Person mit dem Hubgerüst nach oben fahren?": { d: [
        t("Auf einer Palette, wenn sie sich gut festhält", "On a pallet if they hold on well", "Na palecie, jeśli dobrze się trzyma", "На палеті, якщо вона добре тримається"),
        t("Auf den Gabeln mit angelegtem Gurt", "On the forks with a harness on", "Na widłach w szelkach bezpieczeństwa", "На вилах у страхувальному поясі"),
        t("In einer Gitterbox auf den Gabeln", "In a mesh box on the forks", "W palecie siatkowej na widłach", "У сітчастому боксі на вилах")] },
    "Die Bühne ist oben. Was gilt für dich als Fahrer?": { d: [
        t("Kurz Material holen ist erlaubt", "Briefly fetching material is allowed", "Wolno na chwilę przynieść materiał", "Можна ненадовго принести матеріал"),
        t("Langsam zur nächsten Arbeitsstelle fahren", "Drive slowly to the next work spot", "Powoli podjechać do następnego miejsca", "Повільно переїхати до наступного місця"),
        t("Absteigen und von unten sichern", "Get off and secure from below", "Wysiąść i asekurować z dołu", "Зійти й страхувати знизу")] },
    "Bis zu welcher Geschwindigkeit braucht ein Stapler auf öffentlichen Straßen keinen Führerschein?": { d: [
        t("16 km/h", "16 km/h", "16 km/h", "16 км/год"), t("20 km/h", "20 km/h", "20 km/h", "20 км/год"), t("25 km/h", "25 km/h", "25 km/h", "25 км/год")] },
    "Wo kuppelst du einen Anhänger an?": { d: [
        t("An jedem stabilen Teil des Rahmens", "At any solid part of the frame", "Na dowolnej mocnej części ramy", "На будь-якій міцній частині рами"),
        t("Mit einem Seil oben am Fahrerschutzdach", "With a rope at the top of the overhead guard", "Liną do górnej części daszka ochronnego", "Тросом за верх захисного даху"),
        t("Mit einer Kette direkt an den Gabelzinken", "With a chain directly on the fork arms", "Łańcuchem bezpośrednio do ramion wideł", "Ланцюгом прямо за вила")] },
    "Welche Stapler dürfen in Ex-Bereichen fahren?": { d: [
        t("Jeder Elektrostapler", "Any electric forklift", "Każdy wózek elektryczny", "Будь-який електронавантажувач"),
        t("Jeder Stapler mit Funkenschutz am Auspuff", "Any forklift with a spark arrester on the exhaust", "Każdy wózek z odiskiernikiem na wydechu", "Будь-який навантажувач з іскрогасником на вихлопі"),
        t("Gasstapler, weil sie sauber verbrennen", "LPG forklifts, because they burn cleanly", "Wózki gazowe, bo czysto spalają paliwo", "Газові навантажувачі, бо газ чисто згоряє")] },
    "Wie schnell fährst du mit einer gefüllten Pfanne?": { d: [
        t("Normales Hallentempo", "Normal hall speed", "Zwykłe tempo w hali", "Звичайна швидкість у цеху"),
        t("Höchstens 12 km/h", "At most 12 km/h", "Najwyżej 12 km/h", "Щонайбільше 12 км/год"),
        t("Zügig, damit das Metall nicht abkühlt", "Briskly, so the metal does not cool down", "Szybko, żeby metal nie ostygł", "Швидко, щоб метал не охолов")] },

    /* ───── moduł 9 ───── */
    "Welche Wege darfst du mit dem Stapler befahren?": { d: [
        t("Alle, die breit genug für den Stapler sind", "All that are wide enough for the forklift", "Wszystkie, które są wystarczająco szerokie dla wózka", "Усі, достатньо широкі для навантажувача"),
        t("Alle Wege außer markierten Gehwegen", "All routes except marked walkways", "Wszystkie oprócz oznaczonych ciągów pieszych", "Усі, крім позначених пішохідних доріжок"),
        t("Alle, an denen kein Verbotsschild steht", "All without a prohibition sign", "Wszystkie, przy których nie ma znaku zakazu", "Усі, де немає знака заборони")] },
    "Keine Schilder an der Kreuzung. Wer hat Vorfahrt?": { d: [
        t("Wer von links kommt", "Whoever comes from the left", "Ten, kto nadjeżdża z lewej", "Хто їде зліва"),
        t("Wer zuerst an der Kreuzung ist", "Whoever reaches the crossing first", "Ten, kto pierwszy dojechał do skrzyżowania", "Хто першим під’їхав до перехрестя"),
        t("Wer eine Last transportiert", "Whoever is carrying a load", "Ten, kto wiezie ładunek", "Хто везе вантаж")] },
    "Wie viel Sicherheitsabstand brauchst du seitlich auf dem Verkehrsweg?": { d: [
        t("Mindestens 0,2 m auf jeder Seite", "At least 0.2 m on each side", "Co najmniej 0,2 m z każdej strony", "Щонайменше 0,2 м з кожного боку"),
        t("Mindestens 0,5 m auf einer Seite", "At least 0.5 m on one side", "Co najmniej 0,5 m z jednej strony", "Щонайменше 0,5 м з одного боку"),
        t("Mindestens 1,5 m auf jeder Seite", "At least 1.5 m on each side", "Co najmniej 1,5 m z każdej strony", "Щонайменше 1,5 м з кожного боку")] },
    "Wie fährst du auf einen dunklen Hof?": { d: [
        t("Ohne Licht, aber langsam", "Without lights but slowly", "Bez świateł, ale powoli", "Без світла, але повільно"),
        t("Nur mit eingeschalteter Rundumleuchte", "Only with the beacon switched on", "Tylko z włączoną obrotową lampą ostrzegawczą", "Лише з увімкненим проблисковим маячком"),
        t("Mit Warnblinklicht statt Scheinwerfer", "With hazard lights instead of headlights", "Ze światłami awaryjnymi zamiast reflektorów", "З аварійною сигналізацією замість фар")] },
    "Was gilt beim Einfahren in einen Lastenaufzug?": { d: [
        t("Ein Kollege hält die Tür von innen", "A colleague holds the door from inside", "Kolega trzyma drzwi od środka", "Колега тримає двері зсередини"),
        t("Ein Kollege sichert die Last im Fahrkorb", "A colleague secures the load in the car", "Kolega przytrzymuje ładunek w kabinie", "Колега утримує вантаж у кабіні"),
        t("Erlaubt, wenn der Fahrkorb halb leer ist", "Allowed if the car is half empty", "Dozwolone, gdy kabina jest w połowie pusta", "Дозволено, якщо кабіна наполовину порожня")] },
    "Wann darf ein Kollege einen Schmalgang zum Kommissionieren betreten?": { d: [
        t("Jederzeit, wenn er eine Warnweste trägt", "Any time if wearing a hi-vis vest", "W każdej chwili, jeśli ma na sobie kamizelkę ostrzegawczą", "Будь-коли, якщо він у сигнальному жилеті"),
        t("Wenn der Stapler höchstens 6 km/h fährt", "If the truck drives at most 6 km/h", "Gdy wózek jedzie najwyżej 6 km/h", "Якщо навантажувач їде не швидше 6 км/год"),
        t("Wenn er sich vorher per Funk anmeldet", "If they announce themselves by radio first", "Gdy wcześniej zgłosi się przez radio", "Якщо заздалегідь повідомить по рації")] },
    /* ───── quizy w lekcjach ───── */
    "Ab welcher Hubhöhe braucht ein Gabelstapler ein Fahrerschutzdach?": { d: [
        t("Ab mehr als 1,00 m", "From more than 1.00 m", "Od ponad 1,00 m", "Понад 1,00 м"), t("Ab mehr als 2,50 m", "From more than 2.50 m", "Od ponad 2,50 m", "Понад 2,50 м"), t("Ab mehr als 3,30 m", "From more than 3.30 m", "Od ponad 3,30 m", "Понад 3,30 м")] },
    "Dein Stapler hat Bügeltüren. Wann schließt du sie?": { d: [
        t("Nur bei Fahrten im Freien", "Only when driving outdoors", "Tylko przy jeździe na zewnątrz", "Лише під час їзди надворі"),
        t("Nur beim Fahren mit Last", "Only when driving with a load", "Tylko przy jeździe z ładunkiem", "Лише під час їзди з вантажем"),
        t("Nur bei mehr als 10 km/h", "Only above 10 km/h", "Tylko powyżej 10 km/h", "Лише понад 10 км/год")] },
    "Der Stapler beginnt zur Seite zu kippen. Was tust du?": { d: [
        t("Schnell zur Kippseite abspringen", "Jump off quickly towards the tipping side", "Szybko wyskoczyć w stronę, w którą wózek się przewraca", "Швидко вистрибнути в бік перекидання"),
        t("Gegen die Kipprichtung abspringen", "Jump off against the tipping direction", "Wyskoczyć przeciwnie do kierunku przewracania", "Вистрибнути проти напрямку перекидання"),
        t("Kräftig gegenlenken und Gas geben", "Steer hard the other way and accelerate", "Mocno skręcić w przeciwną stronę i dodać gazu", "Різко кермувати навпаки й додати газу")] },
    "Welcher Grundsatz gilt für geländegängige Teleskopstapler?": {
        correct: t("DGUV G 308-009", "DGUV G 308-009", "DGUV G 308-009", "DGUV G 308-009"), d: [
        t("DGUV G 308-001", "DGUV G 308-001", "DGUV G 308-001", "DGUV G 308-001"), t("DGUV G 308-002", "DGUV G 308-002", "DGUV G 308-002", "DGUV G 308-002"), t("DGUV V68 §2", "DGUV V68 §2", "DGUV V68 §2", "DGUV V68 §2")] },
    "Was brauchst du für einen Hochhubwagen mit Deichsel, den du zu Fuß steuerst?": { d: [
        t("Einen Führerschein Klasse L", "A class L driving licence", "Prawo jazdy kat. L", "Посвідчення водія категорії L"),
        t("Den vollen Staplerschein mit Prüfung", "The full forklift licence with exam", "Pełny Staplerschein z egzaminem", "Повний Staplerschein з іспитом"),
        t("Nichts, Mitgänger sind ungefährlich", "Nothing, pedestrian trucks are harmless", "Nic, wózki prowadzone są niegroźne", "Нічого, візки із супроводом безпечні")] },
    "Du willst durch einen Schmalgang laufen. Ein Regalstapler arbeitet darin. Was gilt?": { d: [
        t("Zügig durchgehen und Blickkontakt suchen", "Walk through briskly and seek eye contact", "Szybko przejść, szukając kontaktu wzrokowego", "Швидко пройти, шукаючи зорового контакту"),
        t("Durchgehen, wenn du eine Warnweste trägst", "Walk through if you wear a hi-vis vest", "Przejść, jeśli masz kamizelkę ostrzegawczą", "Пройти, якщо ти в сигнальному жилеті"),
        t("Rufen, damit der Fahrer kurz anhält", "Shout so the driver stops briefly", "Zawołać, żeby operator się zatrzymał", "Гукнути, щоб водій зупинився")] },
    "Welche Batterie setzt beim Laden Wasserstoff frei?": {
        correct: t("Blei-Säure-Batterie mit flüssigem Elektrolyt", "Lead-acid battery with liquid electrolyte", "Akumulator ołowiowo-kwasowy z ciekłym elektrolitem", "Свинцево-кислотна батарея з рідким електролітом"), d: [
        t("Lithium-Ionen-Batterie", "Lithium-ion battery", "Akumulator litowo-jonowy", "Літій-іонна батарея"),
        t("Jede Batterie gleich stark", "Every battery equally", "Każdy akumulator w tym samym stopniu", "Кожна батарея однаково"),
        t("Keine, Wasserstoff entsteht nur beim Tanken", "None, hydrogen only forms when refuelling", "Żaden, wodór powstaje tylko przy tankowaniu", "Жодна, водень утворюється лише під час заправки")] },
    "Wann füllst du destilliertes Wasser in eine Blei-Säure-Batterie?": { d: [
        t("Vor dem Laden", "Before charging", "Przed ładowaniem", "Перед зарядкою"), t("Während des Ladens", "During charging", "W trakcie ładowania", "Під час зарядки"), t("Nur bei der Jahresprüfung", "Only at the annual inspection", "Tylko przy przeglądzie rocznym", "Лише під час щорічної перевірки")] },
    "Warum darfst du keine beliebige Batterie einbauen?": { d: [
        t("Weil sonst die Garantie des Ladegeräts erlischt", "Because the charger warranty would expire", "Bo wygaśnie gwarancja ładowarki", "Бо втратиться гарантія на зарядний пристрій"),
        t("Weil nur neue Batterien zugelassen sind", "Because only new batteries are permitted", "Bo dopuszczone są tylko nowe akumulatory", "Бо дозволені лише нові батареї"),
        t("Weil jede Batterie eine eigene Prüfplakette braucht", "Because every battery needs its own inspection sticker", "Bo każdy akumulator potrzebuje własnej plakietki przeglądu", "Бо кожна батарея потребує власної наклейки про перевірку")] },
    "Wo liegt der Schwerpunkt einer gleichmäßig gepackten Kiste?": { d: [
        t("Am Gabelrücken", "At the fork back", "Przy grzbiecie wideł", "Біля спинки вил"), t("An der Gabelspitze", "At the fork tip", "Na końcu wideł", "На кінці вил"), t("Bei einem Drittel der Lasttiefe", "At a third of the load depth", "Na jednej trzeciej głębokości ładunku", "На третині глибини вантажу")] },
    "Welcher Stapler ist in Fahrtrichtung standfester?": {
        correct: t("Der leere Stapler", "The empty forklift", "Pusty wózek", "Порожній навантажувач"), d: [
        t("Der beladene Stapler", "The loaded forklift", "Załadowany wózek", "Навантажений навантажувач"),
        t("Der beladene mit angehobener Last", "The loaded one with the load raised", "Załadowany z uniesionym ładunkiem", "Навантажений із піднятим вантажем"),
        t("Beide sind gleich standfest", "Both are equally stable", "Oba są tak samo stateczne", "Обидва однаково стійкі")] },
    "Wann darfst du den Mast mit hoher Last nach vorn neigen?": {
        correct: t("Nur direkt über der Stapelfläche", "Only directly above the stacking surface", "Tylko bezpośrednio nad miejscem odłożenia", "Лише безпосередньо над місцем укладання"), d: [
        t("Beim Fahren, für bessere Sicht", "When driving, for a better view", "Podczas jazdy, dla lepszej widoczności", "Під час їзди, для кращого огляду"),
        t("Beim Anfahren an das Regal", "When approaching the rack", "Przy podjeżdżaniu do regału", "Під час під’їзду до стелажа"),
        t("Immer, wenn die Last rutscht", "Whenever the load slides", "Zawsze, gdy ładunek się zsuwa", "Щоразу, коли вантаж зсувається")] },
    "Du fährst eine Kurve halb so schnell. Wie groß ist die Fliehkraft?": { d: [
        t("Halb so groß", "Half as large", "O połowę mniejsza", "Удвічі менша"), t("Ein Drittel", "A third", "Jedna trzecia", "Третина"), t("Gleich groß", "The same", "Taka sama", "Така сама")] },
    "Welche drei Punkte bilden beim Vierrad-Stapler das Kippdreieck?": { d: [
        t("Beide Hinterräder und die Gabelspitze", "Both rear wheels and the fork tip", "Oba tylne koła i koniec wideł", "Обидва задні колеса й кінець вил"),
        t("Beide Vorderräder und das Gegengewicht", "Both front wheels and the counterweight", "Oba przednie koła i przeciwwaga", "Обидва передні колеса й противага"),
        t("Ein Vorderrad und beide Hinterräder", "One front wheel and both rear wheels", "Jedno przednie koło i oba tylne", "Одне переднє й обидва задні колеса")] },
    "In welcher Höhe fährst du die Last?": { d: [
        t("Auf Augenhöhe, damit sie nicht rutscht", "At eye level so it does not slide", "Na wysokości oczu, żeby się nie zsunął", "На рівні очей, щоб не зсунувся"),
        t("Ca. 15 cm über dem Boden, Mast nach vorn", "About 15 cm above the floor, mast forwards", "Ok. 15 cm nad podłogą, maszt do przodu", "Близько 15 см над підлогою, щогла вперед"),
        t("Ca. 60 cm über dem Boden, Mast zurück", "About 60 cm above the floor, mast back", "Ok. 60 cm nad podłogą, maszt do tyłu", "Близько 60 см над підлогою, щогла назад")] },
};
