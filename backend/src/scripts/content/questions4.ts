/**
 * Cztery odpowiedzi do pytań-sytuacji w lekcjach (krok „question”). Klucz = niemiecki tytuł pytania.
 * `d` = trzy wiarygodne błędne odpowiedzi, `correct` opcjonalnie nadpisuje treść prawidłowej. Kolejność losuje odtwarzacz.
 */
import { LText } from "../../models/LearningCourse";

const t = (de: string, en: string, pl: string, uk: string): LText => ({ de, en, pl, uk });
export type QFix = { d: [LText, LText, LText]; correct?: LText };

export const QUESTIONS4: Record<string, QFix> = {
    "Was lief schief?": { d: [
        t("Der Stapler war überladen und fuhr zu schnell", "The forklift was overloaded and too fast", "Wózek był przeciążony i jechał za szybko", "Навантажувач був перевантажений і їхав зашвидко"),
        t("Der Lkw war nicht gegen Wegrollen gesichert", "The lorry was not secured against rolling away", "Ciężarówka nie była zabezpieczona przed odtoczeniem", "Вантажівка не була захищена від скочування"),
        t("Der Staplerfahrer hatte keinen Fahrauftrag", "The forklift driver had no driving authorisation", "Operator nie miał upoważnienia do jazdy", "Водій навантажувача не мав доручення на керування")] },
    "Du fährst seit Jahren Auto. Reicht das für den Stapler?": {
        correct: t("Nein, für den Stapler brauche ich eine eigene Ausbildung", "No, a forklift requires its own training", "Nie, na wózek potrzebne jest osobne szkolenie", "Ні, для навантажувача потрібне окреме навчання"), d: [
        t("Ja, wer Auto fährt, kann auch Stapler fahren", "Yes, anyone who drives a car can drive a forklift", "Tak, kto jeździ autem, poradzi sobie z wózkiem", "Так, хто водить авто, впорається й з навантажувачем"),
        t("Ja, mit Führerschein Klasse C auf jeden Fall", "Yes, certainly with a class C licence", "Tak, z prawem jazdy kat. C na pewno", "Так, з правами категорії C точно"),
        t("Ja, nach zehn Minuten Einweisung durch Kollegen", "Yes, after ten minutes of instruction from colleagues", "Tak, po dziesięciu minutach instruktażu od kolegi", "Так, після десяти хвилин інструктажу від колеги")] },
    "Wer sorgt dafür, dass im Lager sicher Stapler gefahren wird?": {
        correct: t("Unternehmer und Fahrer gemeinsam", "Employer and driver together", "Pracodawca i operator razem", "Роботодавець і водій разом"), d: [
        t("Nur der Unternehmer", "Only the employer", "Tylko pracodawca", "Лише роботодавець"),
        t("Nur der Fahrer", "Only the driver", "Tylko operator", "Лише водій"),
        t("Nur die Berufsgenossenschaft", "Only the employers’ liability insurance", "Tylko Berufsgenossenschaft", "Лише страхова спілка")] },
    "Riss an der Gabelzinke. Was tust du?": { d: [
        t("Vorsichtig fahren, nur mit leichten Lasten", "Drive carefully, only with light loads", "Jeździć ostrożnie, tylko z lekkimi ładunkami", "Їздити обережно, лише з легкими вантажами"),
        t("Die Zinken tauschen: links nach rechts", "Swap the fork arms: left to right", "Zamienić widły: lewą na prawą", "Поміняти вила місцями: ліву на праву"),
        t("Den Riss markieren und bei der Jahresprüfung zeigen", "Mark the crack and show it at the annual inspection", "Oznaczyć pęknięcie i pokazać przy przeglądzie rocznym", "Позначити тріщину й показати на щорічній перевірці")] },
    "Welche Regeln gelten für dich am Stapler?": {
        correct: t("Gesetze, Unfallverhütungsvorschriften und Betriebsregeln zugleich", "Laws, accident prevention regulations and company rules at once", "Jednocześnie ustawy, przepisy BHP i zasady zakładu", "Одночасно закони, правила охорони праці й правила підприємства"), d: [
        t("Nur die Regeln, die im Betrieb aushängen", "Only the rules posted at work", "Tylko zasady wywieszone w zakładzie", "Лише правила, вивішені на підприємстві"),
        t("Nur das Straßenverkehrsrecht, wie beim Auto", "Only road traffic law, like with a car", "Tylko prawo drogowe, jak przy aucie", "Лише правила дорожнього руху, як для авто"),
        t("Nur die Betriebsanleitung des Herstellers", "Only the manufacturer’s operating manual", "Tylko instrukcja obsługi producenta", "Лише інструкція з експлуатації виробника")] },
    "Dein Stapler verletzt einen Kollegen. Wer zahlt die Behandlung?": { d: [
        t("Ich persönlich als Fahrer", "Me personally, as the driver", "Ja osobiście jako operator", "Я особисто як водій"),
        t("Die Krankenkasse des Kollegen", "The colleague’s health insurance", "Kasa chorych kolegi", "Лікарняна каса колеги"),
        t("Meine private Haftpflichtversicherung", "My private liability insurance", "Moje prywatne ubezpieczenie OC", "Моє приватне страхування відповідальності")] },
    "Der Stapler beginnt zur Seite zu kippen. Was tust du?": { d: [
        t("Schnell abspringen, weg vom Stapler", "Jump off quickly, away from the truck", "Szybko wyskoczyć, z dala od wózka", "Швидко вистрибнути подалі від навантажувача"),
        t("Aufstehen und das Fahrerschutzdach festhalten", "Stand up and hold the overhead guard", "Wstać i trzymać się daszka ochronnego", "Встати й триматися за захисний дах"),
        t("Gegenlenken und Vollgas geben", "Steer the other way and accelerate hard", "Skręcić w przeciwną stronę i dodać gazu", "Кермувати навпаки й дати повний газ")] },
    "Ist der Staplerschein ein Führerschein?": {
        correct: t("Nein, er weist nur die Staplerausbildung nach", "No, it only proves forklift training", "Nie, potwierdza tylko szkolenie na wózek", "Ні, він лише підтверджує навчання на навантажувач"), d: [
        t("Ja, er gilt wie Klasse L", "Yes, it counts like class L", "Tak, ma moc prawa jazdy kat. L", "Так, має силу посвідчення категорії L"),
        t("Ja, aber nur auf dem Werksgelände", "Yes, but only on company premises", "Tak, ale tylko na terenie zakładu", "Так, але лише на території підприємства"),
        t("Ja, zusammen mit einem Pkw-Führerschein", "Yes, together with a car licence", "Tak, razem z prawem jazdy na samochód osobowy", "Так, разом із правами на легковий автомобіль")] },
    "Dein Staplerschein ist vom Gabelstapler. Darfst du damit jeden Stapler fahren?": {
        correct: t("Nein, für andere Bauarten brauche ich eine Zusatzqualifizierung", "No, other types need additional qualification", "Nie, inne typy wymagają dodatkowych kwalifikacji", "Ні, для інших типів потрібна додаткова кваліфікація"), d: [
        t("Ja, Staplerschein ist Staplerschein", "Yes, a forklift licence is a forklift licence", "Tak, Staplerschein to Staplerschein", "Так, Staplerschein — це Staplerschein"),
        t("Ja, wenn die Tragfähigkeit kleiner ist", "Yes, if the capacity is smaller", "Tak, jeśli udźwig jest mniejszy", "Так, якщо вантажопідйомність менша"),
        t("Ja, nach einer kurzen Probefahrt", "Yes, after a short test drive", "Tak, po krótkiej jeździe próbnej", "Так, після короткої пробної поїздки")] },
    "Welche Räder lenken beim Gabelstapler?": {
        correct: t("Die Hinterräder", "The rear wheels", "Tylne koła", "Задні колеса"), d: [
        t("Die Vorderräder", "The front wheels", "Przednie koła", "Передні колеса"),
        t("Alle vier Räder", "All four wheels", "Wszystkie cztery koła", "Усі чотири колеса"),
        t("Vorne beim Fahren, hinten beim Heben", "Front when driving, rear when lifting", "Przednie w jeździe, tylne przy podnoszeniu", "Передні в русі, задні під час підйому")] },
    "Mit deinem Staplerschein auf den Schubmaststapler?": { d: [
        t("Ja, Stapler ist Stapler", "Yes, a forklift is a forklift", "Tak, wózek to wózek", "Так, навантажувач — це навантажувач"),
        t("Ja, wenn ein Kollege kurz zeigt, wie es geht", "Yes, if a colleague briefly shows how", "Tak, jeśli kolega krótko pokaże, jak to działa", "Так, якщо колега коротко покаже"),
        t("Nein, dafür brauche ich einen Führerschein", "No, I need a driving licence for that", "Nie, potrzebne jest prawo jazdy", "Ні, для цього потрібне посвідчення водія")] },
    "Du baust eine Klammer an. Was passiert mit der Tragfähigkeit?": {
        correct: t("Sie sinkt durch Gewicht und Lage des Geräts", "It drops due to the device’s weight and position", "Spada z powodu masy i położenia osprzętu", "Зменшується через масу й положення обладнання"), d: [
        t("Sie bleibt gleich", "It stays the same", "Pozostaje bez zmian", "Лишається такою ж"),
        t("Sie steigt, die Klammer hält ja fest", "It rises, the clamp holds firmly", "Rośnie, bo chwytak mocno trzyma", "Зростає, бо захват міцно тримає"),
        t("Sie sinkt nur beim Fahren, nicht beim Heben", "It drops only when driving, not when lifting", "Spada tylko w jeździe, nie przy podnoszeniu", "Зменшується лише в русі, не під час підйому")] },
    "Gabelverlängerung ohne Sicherung": { d: [
        t("Vorsichtig fahren, die Last hält sie ja", "Drive carefully, the load holds them in place", "Jechać ostrożnie, ładunek je przytrzyma", "Їхати обережно, вантаж їх утримає"),
        t("Ohne Last fahren, das reicht", "Drive without a load, that is enough", "Jechać bez ładunku, to wystarczy", "Їхати без вантажу, цього досить"),
        t("Mast nach hinten neigen, dann rutscht nichts", "Tilt the mast back, then nothing slides", "Odchylić maszt do tyłu, wtedy nic się nie zsunie", "Нахилити щоглу назад, тоді нічого не зсунеться")] },
    "Kann es beim Laden eines Elektrostaplers zu einer Explosion kommen?": {
        correct: t("Ja, bei Batterien mit flüssigem Elektrolyt entsteht Wasserstoff", "Yes, batteries with liquid electrolyte produce hydrogen", "Tak, akumulatory z ciekłym elektrolitem wydzielają wodór", "Так, батареї з рідким електролітом виділяють водень"), d: [
        t("Nein, da ist ja kein Kraftstoff", "No, there is no fuel", "Nie, przecież nie ma paliwa", "Ні, там же немає пального"),
        t("Nein, Strom kann nicht explodieren", "No, electricity cannot explode", "Nie, prąd nie może wybuchnąć", "Ні, струм не може вибухнути"),
        t("Ja, aber nur bei Lithium-Ionen-Batterien", "Yes, but only with lithium-ion batteries", "Tak, ale tylko przy akumulatorach litowo-jonowych", "Так, але лише з літій-іонними батареями")] },
    "Die Batterie vom Nachbarstapler": { d: [
        t("Passt, also einbauen", "It fits, so install it", "Pasuje, więc montować", "Підходить, отже встановлювати"),
        t("Einbauen, wenn sie voll geladen ist", "Install it if it is fully charged", "Montować, jeśli jest naładowany", "Встановлювати, якщо заряджена"),
        t("Einbauen und das Gewicht mit Ballast ausgleichen", "Install it and make up the weight with ballast", "Montować i wyrównać masę balastem", "Встановити й компенсувати вагу баластом")] },
    "Treibgas tritt aus. Wohin zieht es?": { d: [
        t("Nach oben, wie Rauch", "Upwards, like smoke", "W górę, jak dym", "Вгору, як дим"),
        t("Es verteilt sich sofort gleichmäßig", "It spreads evenly at once", "Od razu rozchodzi się równomiernie", "Одразу рівномірно розходиться"),
        t("Es bleibt in Hüfthöhe stehen", "It stays at hip height", "Zostaje na wysokości bioder", "Лишається на рівні стегон")] },
    "Gasgeruch in der Halle": { d: [
        t("Schnell mit dem Stapler ins Freie fahren", "Quickly drive the forklift outside", "Szybko wyjechać wózkiem na zewnątrz", "Швидко виїхати навантажувачем надвір"),
        t("Licht einschalten und das Leck suchen", "Switch on the light and look for the leak", "Włączyć światło i szukać wycieku", "Увімкнути світло й шукати витік"),
        t("Flasche abschrauben und nach draußen tragen", "Unscrew the cylinder and carry it outside", "Odkręcić butlę i wynieść na zewnątrz", "Відкрутити балон і винести надвір")] },
    "Kiste mit 1.300 kg, Stapler mit 1.500 kg Tragfähigkeit. Darfst du sie aufnehmen?": {
        correct: t("Kommt auf den Lastschwerpunkt an, also wie du sie aufnimmst", "Depends on the load centre, i.e. how you pick it up", "Zależy od środka ciężkości, czyli od tego, jak ją podejmiesz", "Залежить від центру ваги, тобто від того, як ти його береш"), d: [
        t("Ja, 1.300 kg sind weniger als 1.500 kg", "Yes, 1,300 kg is less than 1,500 kg", "Tak, 1300 kg to mniej niż 1500 kg", "Так, 1300 кг менше за 1500 кг"),
        t("Nein, es müssen 20 % Reserve bleiben", "No, a 20 % reserve must remain", "Nie, musi zostać 20 % zapasu", "Ні, має лишатися 20 % запасу"),
        t("Ja, wenn der Mast nach hinten geneigt ist", "Yes, if the mast is tilted back", "Tak, jeśli maszt jest odchylony do tyłu", "Так, якщо щогла нахилена назад")] },
    "Welcher Stapler kippt in einer schnellen Kurve leichter zur Seite?": {
        correct: t("Der leere Stapler", "The empty forklift", "Pusty wózek", "Порожній навантажувач"), d: [
        t("Der beladene Stapler", "The loaded forklift", "Załadowany wózek", "Навантажений навантажувач"),
        t("Beide gleich, nur das Tempo zählt", "Both the same, only speed counts", "Oba tak samo, liczy się tylko prędkość", "Обидва однаково, має значення лише швидкість"),
        t("Der beladene mit gesenkter Last", "The loaded one with the load lowered", "Załadowany z opuszczonym ładunkiem", "Навантажений з опущеним вантажем")] },
    "Der Stapler kippt zur Seite. Was tust du?": { d: [
        t("Zur tieferen Seite abspringen", "Jump off to the lower side", "Wyskoczyć na niższą stronę", "Вистрибнути на нижчий бік"),
        t("Zur höheren Seite abspringen", "Jump off to the higher side", "Wyskoczyć na wyższą stronę", "Вистрибнути на вищий бік"),
        t("Last schnell ganz hochfahren als Gegengewicht", "Raise the load fully as a counterweight", "Szybko podnieść ładunek jako przeciwwagę", "Швидко підняти вантаж як противагу")] },
    "Mitten auf der Rampe": { d: [
        t("Langsam auf der Rampe wenden", "Turn slowly on the ramp", "Powoli zawrócić na rampie", "Повільно розвернутися на рампі"),
        t("Vorwärts hinunterfahren, ist ja kurz", "Drive down forwards, it is short", "Zjechać przodem, przecież to krótki odcinek", "З’їхати передом, це ж недалеко"),
        t("Last anheben und vorwärts hinunterrollen", "Raise the load and roll down forwards", "Podnieść ładunek i zjechać przodem", "Підняти вантаж і з’їхати передом")] },
    "Nur mal kurz": { d: [
        t("Kurz anschieben, ist ja nur ein Stück", "Push it briefly, it is only a short way", "Lekko pchnąć, to tylko kawałek", "Трохи підштовхнути, це недалеко"),
        t("Mit dem Gegengewicht vorsichtig wegdrücken", "Push it away carefully with the counterweight", "Ostrożnie odepchnąć przeciwwagą", "Обережно відштовхнути противагою"),
        t("Mit angehobenen Gabeln seitlich anstoßen", "Nudge it sideways with raised forks", "Trącić z boku uniesionymi widłami", "Штовхнути збоку піднятими вилами")] },
    "Der Kollege ohne Schein": { d: [
        t("Schlüssel geben und aufpassen", "Give the key and keep watch", "Dać kluczyk i pilnować", "Дати ключ і наглядати"),
        t("Schlüssel geben, wenn er einen Pkw-Führerschein hat", "Give the key if the colleague has a car licence", "Dać kluczyk, jeśli ma prawo jazdy", "Дати ключ, якщо в колеги є посвідчення водія"),
        t("Mitfahren lassen und selbst lenken", "Let the colleague ride along while you steer", "Wziąć go ze sobą i samemu kierować", "Узяти з собою, а самому кермувати")] },
    "Kaffeepause": { d: [
        t("Schlüssel stecken lassen, ich bin ja gleich zurück", "Leave the key in, I will be right back", "Zostawić kluczyk w stacyjce, przecież zaraz wracam", "Залишити ключ у замку, я ж скоро повернуся"),
        t("Antrieb laufen lassen, damit er warm bleibt", "Leave the drive running so it stays warm", "Zostawić napęd włączony, żeby był ciepły", "Залишити привід увімкненим, щоб не охолов"),
        t("Schlüssel abziehen und an den Stapler hängen", "Remove the key and hang it on the forklift", "Wyjąć kluczyk i powiesić na wózku", "Вийняти ключ і повісити на навантажувач")] },
    "Die Kamera piept nicht": { d: [
        t("Losfahren, die Technik hätte gewarnt", "Drive off, the system would have warned", "Ruszyć, przecież system by ostrzegł", "Рушати, система ж попередила б"),
        t("Zügig zurücksetzen, solange der Monitor frei ist", "Reverse briskly while the monitor is clear", "Szybko cofnąć, póki na monitorze nikogo nie widać", "Швидко здати назад, доки на моніторі нікого немає"),
        t("Nur hupen und dann rückwärts fahren", "Just sound the horn and reverse", "Tylko zatrąbić i cofnąć", "Лише посигналити й їхати назад")] },
    "Plötzlich weich": { d: [
        t("Bis Schichtende vorsichtig weiterfahren, dann melden", "Keep driving carefully until the end of the shift, then report", "Ostrożnie jeździć do końca zmiany, potem zgłosić", "Обережно їздити до кінця зміни, потім повідомити"),
        t("Mit der Feststellbremse weiterarbeiten", "Carry on working using the parking brake", "Pracować dalej, hamując hamulcem postojowym", "Працювати далі зі стоянковим гальмом"),
        t("Bremsflüssigkeit nachfüllen und weiterfahren", "Top up brake fluid and keep driving", "Dolać płynu hamulcowego i jeździć dalej", "Долити гальмівну рідину й їздити далі")] },
    "Fahr doch noch die Schicht": { d: [
        t("Weiterfahren, der Vorgesetzte hat entschieden", "Keep driving, the supervisor has decided", "Jeździć dalej, przełożony zdecydował", "Їздити далі, керівник вирішив"),
        t("Weiterfahren, aber nur ohne Last", "Keep driving, but only without a load", "Jeździć dalej, ale bez ładunku", "Їздити далі, але без вантажу"),
        t("Weiterfahren und den Reifen stündlich prüfen", "Keep driving and check the tyre every hour", "Jeździć dalej i co godzinę sprawdzać oponę", "Їздити далі й щогодини перевіряти шину")] },
    "Wann kommt die neue Plakette?": { d: [
        t("Gleich nach der Prüfung", "Right after the inspection", "Od razu po przeglądzie", "Одразу після перевірки"),
        t("Wenn die Ersatzteile bestellt sind", "When the spare parts are ordered", "Gdy części zostaną zamówione", "Коли запчастини замовлено"),
        t("Bei der nächsten Jahresprüfung", "At the next annual inspection", "Przy następnym przeglądzie rocznym", "На наступній щорічній перевірці")] },
    "Verrutschte Kartons": { d: [
        t("Langsam hochheben, dann hält es schon", "Lift slowly, it will hold", "Podnieść powoli, jakoś się utrzyma", "Підняти повільно, якось втримається"),
        t("Einlagern, aber nur in die unterste Ebene über 1 m", "Store it, but only on the lowest level above 1 m", "Składować, ale tylko na najniższym poziomie powyżej 1 m", "Складувати, але лише на нижньому ярусі понад 1 м"),
        t("Mast stark nach hinten neigen und einlagern", "Tilt the mast far back and store it", "Mocno odchylić maszt do tyłu i składować", "Сильно нахилити щоглу назад і складувати")] },
    "Nur kurz weg": { d: [
        t("Kurz absteigen, die Last bleibt ja oben stehen", "Get off briefly, the load stays up anyway", "Wysiąść na chwilę, ładunek i tak zostaje w górze", "Ненадовго зійти, вантаж і так угорі"),
        t("Feststellbremse ziehen und kurz absteigen", "Apply the parking brake and get off briefly", "Zaciągnąć hamulec postojowy i wysiąść na chwilę", "Затягнути стоянкове гальмо й ненадовго зійти"),
        t("Einen Kollegen bitten, unter der Last zu warten", "Ask a colleague to wait under the load", "Poprosić kolegę, by czekał pod ładunkiem", "Попросити колегу почекати під вантажем")] },
    "Der Big Bag schwingt": { d: [
        t("Weiterfahren, der Kollege hält die Last ja ruhig", "Keep driving, the colleague is steadying the load", "Jechać dalej, kolega przecież przytrzymuje ładunek", "Їхати далі, колега тримає вантаж"),
        t("Schneller fahren, damit die Last weniger pendelt", "Drive faster so the load swings less", "Jechać szybciej, żeby ładunek mniej się kołysał", "Їхати швидше, щоб вантаж менше розгойдувався"),
        t("Last höher heben, damit sie über den Kollegen schwingt", "Raise the load higher so it swings over the colleague", "Podnieść ładunek wyżej, żeby kołysał się nad kolegą", "Підняти вантаж вище, щоб він розгойдувався над колегою")] },
    "Reicht die Tragfähigkeit?": { d: [
        t("Ja, 1200 kg sind viel mehr als 270 kg", "Yes, 1200 kg is far more than 270 kg", "Tak, 1200 kg to dużo więcej niż 270 kg", "Так, 1200 кг значно більше за 270 кг"),
        t("Ja, nötig sind 2 × 270 kg = 540 kg", "Yes, 2 × 270 kg = 540 kg are needed", "Tak, potrzeba 2 × 270 kg = 540 kg", "Так, потрібно 2 × 270 кг = 540 кг"),
        t("Ja, nötig sind 3 × 270 kg = 810 kg", "Yes, 3 × 270 kg = 810 kg are needed", "Tak, potrzeba 3 × 270 kg = 810 kg", "Так, потрібно 3 × 270 кг = 810 кг")] },
    "Nur ein paar Meter": { d: [
        t("Langsam ziehen, dann passiert nichts", "Pull slowly, then nothing will happen", "Ciągnąć powoli, nic się nie stanie", "Тягнути повільно, нічого не станеться"),
        t("Mit den Gabeln von hinten schieben statt ziehen", "Push from behind with the forks instead of pulling", "Pchać widłami od tyłu zamiast ciągnąć", "Штовхати вилами ззаду замість тягнути"),
        t("Ziehen, wenn ein Kollege die Handbremse bedient", "Pull if a colleague operates the handbrake", "Ciągnąć, jeśli kolega obsługuje hamulec ręczny wagonu", "Тягнути, якщо колега керує ручним гальмом вагона")] },
    "Der Weg zur Gießmaschine": { d: [
        t("Zügig vorbeifahren, solange Platz ist", "Drive past briskly while there is room", "Szybko przejechać, póki jest miejsce", "Швидко проїхати, доки є місце"),
        t("Hupen, damit der Kollege schneller geht", "Sound the horn so the colleague walks faster", "Zatrąbić, żeby kolega szybciej przeszedł", "Посигналити, щоб колега пішов швидше"),
        t("Vollbremsung, damit der Kollege sicher ist", "Brake hard so the colleague is safe", "Gwałtownie hamować, żeby kolega był bezpieczny", "Різко гальмувати, щоб колега був у безпеці")] },
    "Die blinde Ecke": { d: [
        t("Im normalen Tempo weiter, der Spiegel ist leer", "Carry on at normal speed, the mirror is empty", "Jechać dalej normalnie, lustro jest puste", "Їхати далі як завжди, дзеркало порожнє"),
        t("Etwas schneller, um die Ecke rasch zu räumen", "A bit faster, to clear the corner quickly", "Trochę szybciej, żeby szybko minąć róg", "Трохи швидше, щоб швидко проїхати ріг"),
        t("Weit ausholen und auf der Gegenseite fahren", "Swing wide and drive on the opposite side", "Wziąć zakręt szeroko i jechać przeciwną stroną", "Широко взяти поворот і їхати зустрічною стороною")] },
    "Passt die Last durch?": { d: [
        t("Ja, es sind 80 cm Platz übrig", "Yes, there are 80 cm to spare", "Tak, zostaje 80 cm zapasu", "Так, лишається 80 см запасу"),
        t("Ja, nötig sind 1,20 + 0,5 = 1,70 m", "Yes, 1.20 + 0.5 = 1.70 m is needed", "Tak, potrzeba 1,20 + 0,5 = 1,70 m", "Так, потрібно 1,20 + 0,5 = 1,70 м"),
        t("Ja, wenn du in Schrittgeschwindigkeit fährst", "Yes, if you drive at walking pace", "Tak, jeśli jedziesz w tempie pieszego", "Так, якщо їдеш зі швидкістю пішохода")] },
    "Jemand im Schmalgang": {
        correct: t("Warten, bis der Kollege den Gang verlassen hat", "Wait until the colleague has left the aisle", "Poczekać, aż kolega opuści alejkę", "Чекати, доки колега вийде з проходу"), d: [
        t("Langsam einfahren und hupen", "Drive in slowly and sound the horn", "Wjechać powoli i zatrąbić", "Заїхати повільно й посигналити"),
        t("Einfahren, wenn er eine Warnweste trägt", "Drive in if the colleague wears a hi-vis vest", "Wjechać, jeśli kolega ma na sobie kamizelkę ostrzegawczą", "Заїхати, якщо колега в сигнальному жилеті"),
        t("Von der anderen Gangseite einfahren", "Drive in from the other end of the aisle", "Wjechać z drugiego końca alejki", "Заїхати з іншого кінця проходу")] },
};
