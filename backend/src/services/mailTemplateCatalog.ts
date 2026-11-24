/**
 * Katalog szablonów maili edytowanych w panelu (Admin → E-Mail-Vorlagen).
 *
 * Wygląd maili jest w kodzie (email.service.ts), tu są tylko TEKSTY: pola do edycji, zmienne
 * i domyślne treści w językach. Panel zapisuje zmienione teksty w kolekcji EmailTemplate
 * (per język); brakujące pola biorą się z domyślnych.
 *
 * Formatowanie w tekstach: **pogrubienie**, [tekst](https://link), nowa linia = <br>,
 * zmienne w nawiasach klamrowych, np. {name}.
 */

export type MailLang = "de" | "en" | "uk" | "pl";
export const MAIL_LANGS: MailLang[] = ["de", "en", "uk", "pl"];
export const MAIL_LOCALES: Record<MailLang, string> = { de: "de-DE", en: "en-GB", uk: "uk-UA", pl: "pl-PL" };

export type TemplateKind = "booking" | "online-access" | "online-purchase" | "common";
export type Content = Record<string, any>;

export interface ItemField { key: string; label: string; type: "text" | "textarea" | "bool" | "number" }
export interface FieldDef {
    key: string;
    label: string;
    type: "text" | "textarea" | "list";
    hint?: string;
    optional?: boolean; // puste = sekcja nie pojawia się w mailu
    langs?: MailLang[]; // pole tylko w tych językach (np. temat maila dwujęzycznego)
    item?: ItemField[];
}

export interface TemplateDef {
    key: string;
    name: string;
    kind: TemplateKind;
    description: string;
    languages: MailLang[];
    defaults: Partial<Record<MailLang, Content>>;
}

// ─── Pola do edycji ──────────────────────────────────────────────────────────

export const FIELDS: Record<TemplateKind, FieldDef[]> = {
    booking: [
        { key: "courseName", label: "Kursname", type: "text", hint: "Für {course} und den Kalendereintrag" },
        { key: "subject", label: "Betreff", type: "text" },
        { key: "preheader", label: "Vorschautext (Posteingang)", type: "text" },
        { key: "headline", label: "Überschrift", type: "text" },
        { key: "intro", label: "Einleitung", type: "textarea" },
        { key: "ticket", label: "Ticket: Spalten", type: "list", hint: "Tag = Kurstag (1, 2, 3 …); Datum und Uhrzeit kommen aus dem Termin", item: [
            { key: "day", label: "Tag", type: "number" },
            { key: "label", label: "Beschriftung", type: "text" },
        ] },
        { key: "requirement", label: "Wichtiger Hinweis / Voraussetzung", type: "textarea", optional: true, hint: "Leer = kein Hinweiskasten" },
        { key: "bring", label: "Bitte mitbringen", type: "list", item: [
            { key: "title", label: "Was", type: "text" },
            { key: "note", label: "Hinweis", type: "text" },
            { key: "required", label: "Pflicht", type: "bool" },
        ] },
        { key: "scheduleTitle", label: "Ablauf: Überschrift", type: "text" },
        { key: "scheduleLead", label: "Ablauf: Untertitel", type: "text", optional: true },
        { key: "schedule", label: "Ablauf: Punkte", type: "list", hint: "Meta leer = „Datum · Uhrzeit“. Variablen: {date}, {from}, {to}", item: [
            { key: "day", label: "Tag", type: "number" },
            { key: "title", label: "Titel", type: "text" },
            { key: "meta", label: "Meta (optional)", type: "text" },
            { key: "text", label: "Beschreibung", type: "textarea" },
            { key: "exam", label: "Prüfung (optional)", type: "text" },
            { key: "highlight", label: "Orange hervorheben", type: "bool" },
        ] },
        { key: "afterSchedule", label: "Text nach dem Ablauf", type: "textarea", optional: true },
        { key: "onlineNote", label: "Hinweis Online-Theorie (nur bei Paket)", type: "textarea", optional: true, hint: "Variablen: {days}, {expires}" },
        { key: "cancellation", label: "Stornierung", type: "textarea", optional: true, hint: "Leer = kein Storno-Kasten. Variable: {cancelUntil}" },
        { key: "closing", label: "Abschluss", type: "textarea" },
    ],
    "online-access": [
        { key: "subject", label: "Betreff", type: "text" },
        { key: "preheader", label: "Vorschautext (Posteingang)", type: "text" },
        { key: "eyebrow", label: "Kennzeichnung oben", type: "text" },
        { key: "headline", label: "Überschrift", type: "text" },
        { key: "intro", label: "Einleitung", type: "textarea" },
        { key: "accessLabel", label: "Ticket: Zugang", type: "text" },
        { key: "daysValue", label: "Ticket: Dauer", type: "text" },
        { key: "validUntil", label: "Ticket: gültig bis", type: "text" },
        { key: "courseLabel", label: "Ticket: Kursbeginn", type: "text" },
        { key: "device", label: "Ticket: Geräte", type: "text" },
        { key: "cta", label: "Button", type: "text" },
        { key: "startTitle", label: "Schritte: Überschrift", type: "text" },
        { key: "steps", label: "Schritte", type: "list", item: [
            { key: "title", label: "Titel", type: "text" },
            { key: "text", label: "Text", type: "textarea" },
        ] },
        { key: "forgot", label: "Passwort vergessen", type: "text" },
        { key: "pathTitle", label: "Weg: Überschrift", type: "text" },
        { key: "pathLead", label: "Weg: Untertitel", type: "text" },
        { key: "nowTitle", label: "Weg: Online lernen (Titel)", type: "text" },
        { key: "nowMeta", label: "Weg: Online lernen (Meta)", type: "text" },
        { key: "nowText", label: "Weg: Online lernen (Text)", type: "textarea" },
        { key: "courseTitle", label: "Weg: Kurs vor Ort (Titel)", type: "text" },
        { key: "courseText", label: "Weg: Kurs vor Ort (Text)", type: "textarea" },
        { key: "examText", label: "Weg: Prüfung", type: "text" },
        { key: "endsBefore", label: "Hinweis: Zugang endet vor dem Kurs", type: "textarea" },
        { key: "goodToKnowTitle", label: "Gut zu wissen: Überschrift", type: "text" },
        { key: "notes", label: "Gut zu wissen: Text", type: "textarea" },
        { key: "notesMulti", label: "Gut zu wissen: mehrere Teilnehmer", type: "text" },
        { key: "helpTitle", label: "Hilfe: Überschrift", type: "text" },
        { key: "closing", label: "Abschluss", type: "textarea" },
    ],
    "online-purchase": [
        { key: "subject", label: "Betreff (beide Sprachen)", type: "text", langs: ["de"] },
        { key: "preheader", label: "Vorschautext (beide Sprachen)", type: "text", langs: ["de"] },
        { key: "eyebrow", label: "Kennzeichnung oben", type: "text", langs: ["de"] },
        { key: "headline", label: "Überschrift (beide Sprachen)", type: "text", langs: ["de"] },
        { key: "sectionLabel", label: "Sprach-Überschrift", type: "text" },
        { key: "intro", label: "Einleitung", type: "textarea" },
        { key: "courseLabel", label: "Tabelle: Kurs", type: "text" },
        { key: "orderLabel", label: "Tabelle: Bestellnummer", type: "text" },
        { key: "validLabel", label: "Tabelle: gültig bis", type: "text" },
        { key: "button", label: "Button", type: "text" },
        { key: "closing", label: "Abschluss", type: "textarea" },
    ],
    common: [
        { key: "docTitle", label: "Titel (Browser/Vorschau)", type: "text" },
        { key: "eyebrow", label: "Kennzeichnung oben", type: "text" },
        { key: "ticketFooter", label: "Ticket: Teilnehmerzeile", type: "text", hint: "Variable: {count}" },
        { key: "hours", label: "Uhrzeit-Format", type: "text", hint: "Variablen: {from}, {to}" },
        { key: "calendarButton", label: "Button Kalender", type: "text" },
        { key: "routeButton", label: "Button Route", type: "text" },
        { key: "bringTitle", label: "Überschrift „Bitte mitbringen“", type: "text" },
        { key: "required", label: "Kennzeichnung Pflicht", type: "text" },
        { key: "findUsTitle", label: "Anfahrt Berlin: Überschrift", type: "text" },
        { key: "findUsText", label: "Anfahrt Berlin: Text", type: "text" },
        { key: "stepLabel", label: "Anfahrt Berlin: „Schritt“", type: "text" },
        { key: "arrivalSteps", label: "Anfahrt Berlin: Schritte (4 Fotos)", type: "list", item: [
            { key: "title", label: "Titel", type: "text" },
            { key: "text", label: "Text", type: "textarea" },
        ] },
        { key: "berlinMeetAgain", label: "Berlin: Hinweis an Folgetagen", type: "text" },
        { key: "arrivalTitle", label: "Anfahrt (andere Orte): Überschrift", type: "text" },
        { key: "arrivalText", label: "Anfahrt (andere Orte): Text", type: "textarea" },
        { key: "participantsTitle", label: "Teilnehmer: Überschrift", type: "text" },
        { key: "buyer", label: "Teilnehmer: „Besteller“", type: "text" },
        { key: "forwardNote", label: "Teilnehmer: Hinweis", type: "textarea" },
        { key: "examLabel", label: "Kennzeichnung Prüfung", type: "text" },
        { key: "cancellationTitle", label: "Storno: Überschrift", type: "text" },
        { key: "onlineTitle", label: "Online-Theorie: Überschrift", type: "text" },
        { key: "helpTitle", label: "Hilfe: Überschrift", type: "text" },
        { key: "whatsapp", label: "Hilfe: WhatsApp-Link", type: "text" },
    ],
};

export const PLACEHOLDERS: Record<TemplateKind, Array<{ key: string; label: string }>> = {
    booking: [
        { key: "name", label: "Name des Bestellers" },
        { key: "course", label: "Kursname" },
        { key: "city", label: "Ort (z. B. Berlin)" },
        { key: "location", label: "Standort, wie im Termin" },
        { key: "address", label: "Adresse" },
        { key: "dateRange", label: "Termin kurz, z. B. 12.–13.11." },
        { key: "startDate", label: "Erster Tag, lang" },
        { key: "endDate", label: "Letzter Tag, lang" },
        { key: "from", label: "Beginn, z. B. 09:00" },
        { key: "to", label: "Ende, z. B. 17:00" },
        { key: "orderNumber", label: "Bestellnummer" },
        { key: "cancelUntil", label: "Kostenfrei storniebar bis" },
        { key: "days", label: "Tage Online-Zugang (Paket)" },
        { key: "expires", label: "Online-Zugang gültig bis (Paket)" },
    ],
    "online-access": [
        { key: "name", label: "Name" },
        { key: "email", label: "E-Mail-Adresse" },
        { key: "course", label: "Online-Kurs" },
        { key: "days", label: "Tage Zugang" },
        { key: "expires", label: "gültig bis, lang" },
        { key: "expiresShort", label: "gültig bis, kurz" },
        { key: "start", label: "Kursbeginn, lang" },
        { key: "startShort", label: "Kursbeginn, kurz" },
        { key: "date", label: "Kursbeginn für den Betreff" },
        { key: "city", label: "Ort" },
        { key: "resetUrl", label: "Link „Passwort vergessen“" },
    ],
    "online-purchase": [
        { key: "name", label: "Name" },
        { key: "course", label: "Online-Kurs" },
        { key: "orderNumber", label: "Bestellnummer" },
        { key: "expires", label: "gültig bis" },
    ],
    common: [{ key: "count", label: "Anzahl Teilnehmer" }, { key: "from", label: "Beginn" }, { key: "to", label: "Ende" }],
};

// ─── Wspólne teksty maili z rezerwacją ──────────────────────────────────────

const commonDe: Content = {
    docTitle: "Anmeldebestätigung",
    eyebrow: "Anmeldung bestätigt",
    ticketFooter: "{count} Teilnehmer · Bitte 10 bis 15 Minuten vor Kursbeginn da sein",
    hours: "{from} – ca. {to} Uhr",
    calendarButton: "In den Kalender eintragen",
    routeButton: "Route planen",
    bringTitle: "Bitte mitbringen",
    required: "Pflicht",
    findUsTitle: "So finden Sie uns",
    findUsText: "Bitte betreten Sie das Betriebsgelände nicht selbstständig. Ein STAPLERO-Ausbilder holt Sie am Eingang ab.",
    stepLabel: "Schritt",
    arrivalSteps: [
        { title: "Über die Neuköllnische Allee", text: "Fahren Sie bis zur Hausnummer 80." },
        { title: "Zum Haupteingang NLND Berlin", text: "Das Gebäude mit dem NLND-Schriftzug." },
        { title: "An der Wache melden", text: "Am Tor mit der Nummer 80 bzw. am Empfang." },
        { title: "Im Eingangsbereich warten", text: "Ein Ausbilder holt Sie ab. Verspätet? Rufen Sie uns an: [+49 160 92490070](tel:+4916092490070) oder [+49 176 22067783](tel:+4917622067783)" },
    ],
    berlinMeetAgain: "Treffpunkt wie am ersten Tag, bitte erneut an der Wache melden.",
    arrivalTitle: "Anreise & Treffpunkt",
    arrivalText: "Bitte erscheinen Sie **10 bis 15 Minuten vor Kursbeginn** am Schulungsort. Ein STAPLERO-Ausbilder empfängt Sie dort und begleitet Sie zum Schulungsraum.",
    participantsTitle: "Angemeldete Teilnehmer",
    buyer: "Besteller",
    forwardNote: "Bitte leiten Sie diese E-Mail an alle Teilnehmer weiter. Jede Person braucht einen eigenen Ausweis und Sicherheitsschuhe.",
    examLabel: "Prüfung",
    cancellationTitle: "Stornierung",
    onlineTitle: "Online-Theorie inklusive",
    helpTitle: "Fragen? Wir helfen",
    whatsapp: "Per WhatsApp schreiben",
};
const commonEn: Content = {
    docTitle: "Booking confirmation",
    eyebrow: "Booking confirmed",
    ticketFooter: "{count} participant(s) · Please arrive 10 to 15 minutes before the start",
    hours: "{from} – approx. {to}",
    calendarButton: "Add to calendar",
    routeButton: "Plan route",
    bringTitle: "Please bring",
    required: "Required",
    findUsTitle: "How to find us",
    findUsText: "Please do not enter the company premises on your own. A STAPLERO instructor will pick you up at the entrance.",
    stepLabel: "Step",
    arrivalSteps: [
        { title: "Via Neuköllnische Allee", text: "Go to house number 80." },
        { title: "To the main entrance of NLND Berlin", text: "The building with the NLND sign." },
        { title: "Report to the security gate", text: "At the gate with number 80 or at the reception." },
        { title: "Wait in the entrance area", text: "An instructor will pick you up. Running late? Call us: [+49 160 92490070](tel:+4916092490070) or [+49 176 22067783](tel:+4917622067783)" },
    ],
    berlinMeetAgain: "Same meeting point as on the first day, please report to the security gate again.",
    arrivalTitle: "Arrival & meeting point",
    arrivalText: "Please arrive at the training location **10 to 15 minutes before the start**. A STAPLERO instructor will welcome you and take you to the training room.",
    participantsTitle: "Registered participants",
    buyer: "Booked by",
    forwardNote: "Please forward this email to all participants. Each person needs their own ID and safety shoes.",
    examLabel: "Exam",
    cancellationTitle: "Cancellation",
    onlineTitle: "Online theory included",
    helpTitle: "Questions? We are here to help",
    whatsapp: "Message us on WhatsApp",
};
const commonUk: Content = {
    docTitle: "Підтвердження бронювання",
    eyebrow: "Бронювання підтверджено",
    ticketFooter: "Учасників: {count} · Будь ласка, прийдіть за 10–15 хвилин до початку",
    hours: "{from} – прибл. {to}",
    calendarButton: "Додати в календар",
    routeButton: "Прокласти маршрут",
    bringTitle: "Візьміть із собою",
    required: "Обов’язково",
    findUsTitle: "Як нас знайти",
    findUsText: "Будь ласка, не заходьте на територію підприємства самостійно. Інструктор STAPLERO зустріне вас біля входу.",
    stepLabel: "Крок",
    arrivalSteps: [
        { title: "Вулицею Neuköllnische Allee", text: "Їдьте до будинку № 80." },
        { title: "До головного входу NLND Berlin", text: "Будівля з написом NLND." },
        { title: "Зверніться на прохідну", text: "Біля воріт з номером 80 або на рецепції." },
        { title: "Зачекайте біля входу", text: "Інструктор забере вас. Запізнюєтеся? Зателефонуйте нам: [+49 160 92490070](tel:+4916092490070) або [+49 176 22067783](tel:+4917622067783)" },
    ],
    berlinMeetAgain: "Місце зустрічі те саме, що й першого дня. Будь ласка, знову зверніться на прохідну.",
    arrivalTitle: "Як дістатися та місце зустрічі",
    arrivalText: "Будь ласка, прийдіть до місця навчання **за 10–15 хвилин до початку**. Інструктор STAPLERO зустріне вас і проведе до навчального класу.",
    participantsTitle: "Зареєстровані учасники",
    buyer: "Замовник",
    forwardNote: "Будь ласка, перешліть цей лист усім учасникам. Кожному потрібні власний документ, що посвідчує особу, і захисне взуття.",
    examLabel: "Іспит",
    cancellationTitle: "Скасування",
    onlineTitle: "Онлайн-теорія включена",
    helpTitle: "Є питання? Ми допоможемо",
    whatsapp: "Написати у WhatsApp",
};
const commonPl: Content = {
    docTitle: "Potwierdzenie rezerwacji",
    eyebrow: "Rezerwacja potwierdzona",
    ticketFooter: "Uczestnicy: {count} · Prosimy przyjść 10–15 minut przed rozpoczęciem",
    hours: "{from} – ok. {to}",
    calendarButton: "Dodaj do kalendarza",
    routeButton: "Wyznacz trasę",
    bringTitle: "Zabierz ze sobą",
    required: "Obowiązkowo",
    findUsTitle: "Jak do nas trafić",
    findUsText: "Prosimy nie wchodzić samodzielnie na teren zakładu. Instruktor STAPLERO odbierze Cię przy wejściu.",
    stepLabel: "Krok",
    arrivalSteps: [
        { title: "Ulicą Neuköllnische Allee", text: "Jedź do numeru 80." },
        { title: "Do głównego wejścia NLND Berlin", text: "Budynek z napisem NLND." },
        { title: "Zgłoś się na portierni", text: "Przy bramie z numerem 80 lub w recepcji." },
        { title: "Zaczekaj przy wejściu", text: "Instruktor po Ciebie przyjdzie. Spóźnisz się? Zadzwoń: [+49 160 92490070](tel:+4916092490070) lub [+49 176 22067783](tel:+4917622067783)" },
    ],
    berlinMeetAgain: "Miejsce spotkania jak pierwszego dnia, prosimy ponownie zgłosić się na portierni.",
    arrivalTitle: "Dojazd i miejsce spotkania",
    arrivalText: "Prosimy przyjść na miejsce szkolenia **10–15 minut przed rozpoczęciem**. Instruktor STAPLERO przywita Cię i zaprowadzi do sali szkoleniowej.",
    participantsTitle: "Zapisani uczestnicy",
    buyer: "Zamawiający",
    forwardNote: "Prosimy przekazać tę wiadomość wszystkim uczestnikom. Każda osoba potrzebuje własnego dokumentu tożsamości i butów ochronnych.",
    examLabel: "Egzamin",
    cancellationTitle: "Rezygnacja",
    onlineTitle: "Teoria online w cenie",
    helpTitle: "Pytania? Pomożemy",
    whatsapp: "Napisz na WhatsApp",
};

// ─── Fragmenty powtarzane w szablonach rezerwacji ─────────────────────────────

const T1 = {
    de: "Rechtliche Grundlagen, Rechte und Pflichten, Aufbau des Staplers, Standsicherheit und Tragfähigkeit, Lastdiagramme, tägliche Kontrolle, Verkehrsregeln im Betrieb, Verhalten in Gefahrensituationen.",
    en: "Legal basics, rights and duties, design of the forklift, stability and load capacity, load charts, daily inspection, traffic rules on site, behaviour in dangerous situations.",
    uk: "Правові основи, права та обов’язки, будова навантажувача, стійкість і вантажопідйомність, діаграми навантаження, щоденний огляд, правила руху на підприємстві, поведінка в небезпечних ситуаціях.",
    pl: "Podstawy prawne, prawa i obowiązki, budowa wózka, stateczność i udźwig, diagramy udźwigu, codzienna kontrola, zasady ruchu w zakładzie, zachowanie w sytuacjach zagrożenia.",
};
const T2 = {
    de: "Fahrzeugkontrolle, Einweisung am Gabelstapler, Anfahren, Lenken und Bremsen, Lasten aufnehmen und transportieren, Rangieren auf engem Raum, Stapeln und Einlagern.",
    en: "Vehicle inspection, introduction to the forklift, starting, steering and braking, picking up and transporting loads, manoeuvring in tight spaces, stacking and storing.",
    uk: "Огляд транспортного засобу, інструктаж на навантажувачі, рушання, кермування та гальмування, підйом і транспортування вантажів, маневрування в тісному просторі, штабелювання та складування.",
    pl: "Kontrola pojazdu, instruktaż na wózku, ruszanie, kierowanie i hamowanie, podnoszenie i transport ładunków, manewrowanie w ciasnej przestrzeni, piętrowanie i składowanie.",
};
const SCHUB = {
    de: "Ca. 2 Stunden Theorie zum Schubmaststapler: Aufbau, Bedienung und Besonderheiten im Vergleich zum Frontstapler. Anschließend praktische Fahrübungen am Schubmaststapler: Ein- und Auslagern im Regal, Rangieren in engen Gängen.",
    en: "Approx. 2 hours of theory on the reach truck: design, operation and differences from the counterbalance forklift. Then practical driving exercises on the reach truck: storing and retrieving in racks, manoeuvring in narrow aisles.",
    uk: "Близько 2 годин теорії про рич-трак (Schubmaststapler): будова, керування та відмінності від фронтального навантажувача. Потім практичні вправи на рич-траку: розміщення та зняття вантажів зі стелажів, маневрування у вузьких проходах.",
    pl: "Ok. 2 godziny teorii o wózku z wysuwnym masztem (Schubmaststapler): budowa, obsługa i różnice w porównaniu z wózkiem czołowym. Następnie ćwiczenia praktyczne: składowanie i pobieranie z regałów, manewrowanie w wąskich alejkach.",
};
const ONLINE_NOTE = {
    de: "Ihr Online-Kurs ist bereits freigeschaltet ({days} Tage, bis **{expires}**). Den Zugang und alle Schritte zum Start haben wir Ihnen in einer **separaten E-Mail** geschickt.",
    en: "Your online course is already unlocked ({days} days, until **{expires}**). We have sent you the access details and all steps to get started in a **separate email**.",
    uk: "Ваш онлайн-курс уже відкрито ({days} днів, до **{expires}**). Доступ і всі кроки для початку ми надіслали вам **окремим листом**.",
    pl: "Twój kurs online jest już odblokowany ({days} dni, do **{expires}**). Dostęp i wszystkie kroki na start wysłaliśmy Ci w **osobnej wiadomości**.",
};
const CANCEL = {
    de: "Kostenfrei bis\n**{cancelUntil}**\nDanach fällt eine Stornogebühr von 100 % an.",
    en: "Free of charge until\n**{cancelUntil}**\nAfter that, a cancellation fee of 100 % applies.",
    uk: "Безкоштовно до\n**{cancelUntil}**\nПісля цього стягується плата за скасування в розмірі 100 %.",
    pl: "Bezpłatnie do\n**{cancelUntil}**\nPóźniej obowiązuje opłata za rezygnację w wysokości 100 %.",
};
const CLOSING = {
    de: "Bis bald in {city}!\n**Ihr STAPLERO Team**",
    en: "See you soon in {city}!\n**Your STAPLERO Team**",
    uk: "До зустрічі на навчанні!\n**Ваша команда STAPLERO**",
    pl: "Do zobaczenia na szkoleniu!\n**Twój zespół STAPLERO**",
};
const SUBJECT = {
    de: "Platz reserviert: Staplerschein {dateRange} in {city}",
    en: "Place reserved: forklift training {dateRange} in {city}",
    uk: "Місце заброньовано: навчання {dateRange}, {city}",
    pl: "Miejsce zarezerwowane: szkolenie {dateRange}, {city}",
};
const PREHEADER = {
    de: "Ihr Platz ist reserviert: {startDate} bis {endDate}, {city}. Bitte Ausweis und Sicherheitsschuhe mitbringen.",
    en: "Your place is reserved: {startDate} to {endDate}, {city}. Please bring your ID and safety shoes.",
    uk: "Ваше місце заброньовано: {startDate} – {endDate}, {city}. Візьміть документ і захисне взуття.",
    pl: "Twoje miejsce jest zarezerwowane: {startDate} – {endDate}, {city}. Zabierz dokument tożsamości i buty ochronne.",
};
const HEADLINE = { de: "Ihr Platz ist reserviert", en: "Your place is reserved", uk: "Ваше місце заброньовано", pl: "Twoje miejsce jest zarezerwowane" };
const INTRO = {
    de: "Hallo {name}, wir freuen uns auf Sie. Hier finden Sie alles, was Sie für die **{course}** brauchen.",
    en: "Hello {name}, we look forward to seeing you. Here is everything you need for the **{course}**.",
    uk: "Вітаємо, {name}! Ми чекаємо на вас. Тут усе, що потрібно для курсу **{course}**.",
    pl: "Cześć {name}, cieszymy się na spotkanie. Tutaj znajdziesz wszystko, czego potrzebujesz na szkolenie: **{course}**.",
};
const SCHEDULE_TITLE = { de: "Ablauf der Ausbildung", en: "Course schedule", uk: "Програма навчання", pl: "Przebieg szkolenia" };
const DGUV = {
    de: "Nach DGUV Grundsatz 308-001 und DGUV Vorschrift 68.",
    en: "According to DGUV Principle 308-001 and DGUV Regulation 68.",
    uk: "Згідно з DGUV Grundsatz 308-001 та DGUV Vorschrift 68.",
    pl: "Zgodnie z DGUV Grundsatz 308-001 i DGUV Vorschrift 68.",
};
const ID = { de: "Personalausweis oder Reisepass", en: "ID card or passport", uk: "Посвідчення особи або паспорт", pl: "Dowód osobisty lub paszport" };
const SHOES = { de: "Arbeitssicherheitsschuhe", en: "Safety shoes", uk: "Захисне робоче взуття", pl: "Obuwie ochronne" };
const CLOTHES = { de: "Geeignete Arbeitskleidung", en: "Suitable work clothes", uk: "Відповідний робочий одяг", pl: "Odpowiednia odzież robocza" };
const HALL = {
    de: "lange Hose empfohlen. Hallentemperatur ca. 18 bis 22 °C",
    en: "long trousers recommended. Hall temperature approx. 18 to 22 °C",
    uk: "рекомендуються довгі штани. Температура в цеху прибл. 18–22 °C",
    pl: "zalecane długie spodnie. Temperatura w hali ok. 18–22 °C",
};
const WRITTEN = { de: "Schriftlicher Test am Ende des Tages", en: "Written test at the end of the day", uk: "Письмовий тест наприкінці дня", pl: "Test pisemny na koniec dnia" };
const DRIVING = { de: "Fahrprüfung, danach Ihr Staplerschein", en: "Driving test, then your forklift licence", uk: "Практичний іспит з водіння, після нього ваше посвідчення", pl: "Egzamin praktyczny, potem Twoje uprawnienia" };

const LANGS4 = MAIL_LANGS;
const byLang = (fn: (l: MailLang) => Content) => Object.fromEntries(LANGS4.map((l) => [l, fn(l)])) as Record<MailLang, Content>;

// ─── Stufe 1 (2 dni) ─────────────────────────────────────────────────────────

const stufe1 = byLang((l) => ({
    courseName: { de: "Gabelstaplerausbildung Stufe 1", en: "Forklift Training Level 1", uk: "Навчання водія навантажувача, рівень 1", pl: "Szkolenie na wózek widłowy Stufe 1" }[l],
    subject: SUBJECT[l],
    preheader: PREHEADER[l],
    headline: HEADLINE[l],
    intro: INTRO[l],
    ticket: [
        { day: 1, label: { de: "Tag 1 · Theorie", en: "Day 1 · Theory", uk: "День 1 · Теорія", pl: "Dzień 1 · Teoria" }[l] },
        { day: 2, label: { de: "Tag 2 · Praxis & Prüfung", en: "Day 2 · Practice & exam", uk: "День 2 · Практика та іспит", pl: "Dzień 2 · Praktyka i egzamin" }[l] },
    ],
    requirement: "",
    bring: [
        { title: ID[l], note: { de: "an beiden Tagen", en: "on both days", uk: "в обидва дні", pl: "w oba dni" }[l], required: true },
        { title: SHOES[l], note: { de: "an beiden Tagen, am Praxistag Pflicht", en: "on both days, required on the practical day", uk: "в обидва дні, у день практики обов’язково", pl: "w oba dni, w dniu praktyki obowiązkowo" }[l], required: true },
        { title: CLOTHES[l], note: { de: "am Praxistag, ", en: "on the practical day, ", uk: "у день практики, ", pl: "w dniu praktyki, " }[l] + HALL[l], required: false },
    ],
    scheduleTitle: SCHEDULE_TITLE[l],
    scheduleLead: DGUV[l],
    schedule: [
        { day: 1, title: { de: "Tag 1 · Theorie", en: "Day 1 · Theory", uk: "День 1 · Теорія", pl: "Dzień 1 · Teoria" }[l], meta: "", text: T1[l], exam: WRITTEN[l], highlight: false },
        { day: 2, title: { de: "Tag 2 · Praxis", en: "Day 2 · Practice", uk: "День 2 · Практика", pl: "Dzień 2 · Praktyka" }[l], meta: "", text: T2[l], exam: DRIVING[l], highlight: true },
    ],
    afterSchedule: "",
    onlineNote: ONLINE_NOTE[l],
    cancellation: CANCEL[l],
    closing: CLOSING[l],
}));

// ─── KombiPro: 3 dni, Frontstapler + Schubmaststapler ────────────────────────

const kombi = byLang((l) => ({
    courseName: { de: "3-Tage-Intensivausbildung Frontstapler & Schubmaststapler", en: "3-day intensive training: counterbalance forklift & reach truck", uk: "3-денне інтенсивне навчання: фронтальний навантажувач і рич-трак", pl: "3-dniowe szkolenie intensywne: wózek czołowy i wysuwny maszt" }[l],
    subject: SUBJECT[l],
    preheader: PREHEADER[l],
    headline: HEADLINE[l],
    intro: INTRO[l],
    ticket: [
        { day: 1, label: { de: "Tag 1 · Theorie", en: "Day 1 · Theory", uk: "День 1 · Теорія", pl: "Dzień 1 · Teoria" }[l] },
        { day: 2, label: { de: "Tag 2 · Praxis", en: "Day 2 · Practice", uk: "День 2 · Практика", pl: "Dzień 2 · Praktyka" }[l] },
        { day: 3, label: { de: "Tag 3 · Schubmast", en: "Day 3 · Reach truck", uk: "День 3 · Рич-трак", pl: "Dzień 3 · Wysuwny maszt" }[l] },
    ],
    requirement: "",
    bring: [
        { title: ID[l], note: { de: "an allen drei Tagen", en: "on all three days", uk: "в усі три дні", pl: "we wszystkie trzy dni" }[l], required: true },
        { title: SHOES[l], note: { de: "an allen drei Tagen, an den Praxistagen Pflicht", en: "on all three days, required on the practical days", uk: "в усі три дні, у дні практики обов’язково", pl: "we wszystkie trzy dni, w dni praktyki obowiązkowo" }[l], required: true },
        { title: CLOTHES[l], note: { de: "an den Praxistagen, ", en: "on the practical days, ", uk: "у дні практики, ", pl: "w dni praktyki, " }[l] + HALL[l], required: false },
    ],
    scheduleTitle: SCHEDULE_TITLE[l],
    scheduleLead: DGUV[l],
    schedule: [
        { day: 1, title: { de: "Tag 1 · Theorie", en: "Day 1 · Theory", uk: "День 1 · Теорія", pl: "Dzień 1 · Teoria" }[l], meta: "", text: T1[l], exam: WRITTEN[l], highlight: false },
        { day: 2, title: { de: "Tag 2 · Praxis Frontstapler", en: "Day 2 · Practice: counterbalance forklift", uk: "День 2 · Практика: фронтальний навантажувач", pl: "Dzień 2 · Praktyka: wózek czołowy" }[l], meta: "", text: T2[l], exam: DRIVING[l], highlight: true },
        { day: 3, title: { de: "Tag 3 · Schubmaststapler", en: "Day 3 · Reach truck", uk: "День 3 · Рич-трак", pl: "Dzień 3 · Wózek z wysuwnym masztem" }[l], meta: "", text: SCHUB[l], exam: "", highlight: true },
    ],
    afterSchedule: "",
    onlineNote: ONLINE_NOTE[l],
    cancellation: CANCEL[l],
    closing: CLOSING[l],
}));

// ─── Anfänger: 3 dni, tylko Frontstapler ─────────────────────────────────────

const anfaenger = byLang((l) => ({
    courseName: { de: "Anfänger-Staplerausbildung Stufe 1 (3 Tage)", en: "Beginner forklift training Level 1 (3 days)", uk: "Навчання для початківців, рівень 1 (3 дні)", pl: "Szkolenie dla początkujących Stufe 1 (3 dni)" }[l],
    subject: SUBJECT[l],
    preheader: PREHEADER[l],
    headline: HEADLINE[l],
    intro: INTRO[l],
    ticket: [
        { day: 1, label: { de: "Tag 1 · Theorie", en: "Day 1 · Theory", uk: "День 1 · Теорія", pl: "Dzień 1 · Teoria" }[l] },
        { day: 2, label: { de: "Tag 2 · Erste Fahrübungen", en: "Day 2 · First driving", uk: "День 2 · Перші вправи", pl: "Dzień 2 · Pierwsza jazda" }[l] },
        { day: 3, label: { de: "Tag 3 · Praxis & Prüfung", en: "Day 3 · Practice & exam", uk: "День 3 · Практика та іспит", pl: "Dzień 3 · Praktyka i egzamin" }[l] },
    ],
    requirement: "",
    bring: [
        { title: ID[l], note: { de: "an allen drei Tagen", en: "on all three days", uk: "в усі три дні", pl: "we wszystkie trzy dni" }[l], required: true },
        { title: SHOES[l], note: { de: "an allen drei Tagen, an den Praxistagen Pflicht", en: "on all three days, required on the practical days", uk: "в усі три дні, у дні практики обов’язково", pl: "we wszystkie trzy dni, w dni praktyki obowiązkowo" }[l], required: true },
        { title: CLOTHES[l], note: { de: "an den Praxistagen, ", en: "on the practical days, ", uk: "у дні практики, ", pl: "w dni praktyki, " }[l] + HALL[l], required: false },
    ],
    scheduleTitle: SCHEDULE_TITLE[l],
    scheduleLead: DGUV[l],
    schedule: [
        { day: 1, title: { de: "Tag 1 · Theorie", en: "Day 1 · Theory", uk: "День 1 · Теорія", pl: "Dzień 1 · Teoria" }[l], meta: "", text: T1[l], exam: WRITTEN[l], highlight: false },
        { day: 2, title: { de: "Tag 2 · Erste Fahrübungen", en: "Day 2 · First driving exercises", uk: "День 2 · Перші вправи з водіння", pl: "Dzień 2 · Pierwsze ćwiczenia z jazdy" }[l], meta: "", text: {
            de: "Bedienelemente kennenlernen, richtige Sitzposition, Starten und sicheres Abstellen, langsames Anfahren und kontrolliertes Bremsen, Lenken und Kurvenfahren, Vorwärts- und Rückwärtsfahren, erste Rangier- und Palettenübungen. Wir nehmen uns Zeit, Schritt für Schritt.",
            en: "Getting to know the controls, correct seating position, starting and parking safely, slow starting and controlled braking, steering and cornering, driving forwards and backwards, first manoeuvring and pallet exercises. We take our time, step by step.",
            uk: "Знайомство з органами керування, правильна посадка, запуск і безпечне паркування, плавне рушання та контрольоване гальмування, кермування та повороти, рух уперед і назад, перші вправи з маневрування та палетами. Ми не поспішаємо, крок за кроком.",
            pl: "Poznanie elementów sterowania, prawidłowa pozycja, uruchamianie i bezpieczne parkowanie, powolne ruszanie i kontrolowane hamowanie, kierowanie i jazda po łuku, jazda do przodu i do tyłu, pierwsze ćwiczenia z manewrowania i paletami. Nie spieszymy się, krok po kroku.",
        }[l], exam: "", highlight: false },
        { day: 3, title: { de: "Tag 3 · Fahrtraining & Prüfung", en: "Day 3 · Driving training & exam", uk: "День 3 · Тренування та іспит", pl: "Dzień 3 · Trening jazdy i egzamin" }[l], meta: "", text: {
            de: "Rangieren auf engem Raum, Fahren mit Last, Paletten aufnehmen und absetzen, Stapeln und Transportieren, präzises Positionieren, gezielte Vorbereitung auf die Fahrprüfung.",
            en: "Manoeuvring in tight spaces, driving with a load, picking up and setting down pallets, stacking and transporting, precise positioning, targeted preparation for the driving test.",
            uk: "Маневрування в тісному просторі, рух із вантажем, підйом і встановлення палет, штабелювання та транспортування, точне позиціонування, цілеспрямована підготовка до іспиту.",
            pl: "Manewrowanie w ciasnej przestrzeni, jazda z ładunkiem, podnoszenie i odstawianie palet, piętrowanie i transport, precyzyjne ustawianie wózka, przygotowanie do egzaminu z jazdy.",
        }[l], exam: DRIVING[l], highlight: true },
    ],
    afterSchedule: "",
    onlineNote: ONLINE_NOTE[l],
    cancellation: CANCEL[l],
    closing: CLOSING[l],
}));

// ─── Stufe 2: Schubmaststapler, 1 dzień (bez storno) ─────────────────────────

const stufe2 = byLang((l) => ({
    courseName: { de: "Schubmaststapler-Ausbildung (Stufe 2)", en: "Reach Truck Training (Level 2)", uk: "Навчання на рич-траку (рівень 2)", pl: "Szkolenie na wózek z wysuwnym masztem (Stufe 2)" }[l],
    subject: {
        de: "Platz reserviert: Schubmaststapler (Stufe 2) am {dateRange} in {city}",
        en: "Place reserved: Reach Truck Training (Level 2) on {dateRange} in {city}",
        uk: "Місце заброньовано: рич-трак (рівень 2), {dateRange}, {city}",
        pl: "Miejsce zarezerwowane: wysuwny maszt (Stufe 2), {dateRange}, {city}",
    }[l],
    preheader: {
        de: "Ihr Platz ist reserviert: {startDate}, {city}. Bitte Ausweis, Staplerschein Stufe 1 und Sicherheitsschuhe mitbringen.",
        en: "Your place is reserved: {startDate}, {city}. Please bring your ID, Level 1 forklift licence and safety shoes.",
        uk: "Ваше місце заброньовано: {startDate}, {city}. Візьміть документ, посвідчення рівня 1 і захисне взуття.",
        pl: "Twoje miejsce jest zarezerwowane: {startDate}, {city}. Zabierz dokument, uprawnienia Stufe 1 i buty ochronne.",
    }[l],
    headline: HEADLINE[l],
    intro: INTRO[l],
    ticket: [
        { day: 1, label: { de: "Schulungstag · Stufe 2", en: "Training day · Level 2", uk: "День навчання · рівень 2", pl: "Dzień szkolenia · Stufe 2" }[l] },
    ],
    requirement: {
        de: "**Wichtig: Voraussetzung**\nDie Ausbildung zum Schubmaststapler ist eine **Zusatzqualifikation**. Teilnehmen kann nur, wer bereits einen **deutschen Staplerschein der Stufe 1** (Frontstapler) besitzt. Bitte bringen Sie den Nachweis unbedingt mit. Ohne Nachweis ist eine Teilnahme leider nicht möglich.",
        en: "**Important: requirement**\nThe reach truck training is an **additional qualification**. You can only take part if you already hold a **German forklift licence (Staplerschein) Level 1** (counterbalance forklift). Please make sure to bring proof of it. Without proof, participation is unfortunately not possible.",
        uk: "**Важливо: передумова**\nНавчання на рич-траку є **додатковою кваліфікацією**. Взяти участь може лише той, хто вже має **німецьке посвідчення водія навантажувача (Staplerschein) рівня 1** (фронтальний навантажувач). Обов’язково візьміть із собою підтвердження. Без нього участь, на жаль, неможлива.",
        pl: "**Ważne: warunek udziału**\nSzkolenie na wózek z wysuwnym masztem to **kwalifikacja dodatkowa**. Udział może wziąć tylko osoba, która ma już **niemieckie uprawnienia na wózek widłowy (Staplerschein) Stufe 1** (wózek czołowy). Koniecznie zabierz ze sobą potwierdzenie. Bez niego udział niestety nie jest możliwy.",
    }[l],
    bring: [
        { title: ID[l], note: "", required: true },
        { title: { de: "Deutscher Staplerschein Stufe 1", en: "German forklift licence Level 1", uk: "Німецьке посвідчення водія навантажувача, рівень 1", pl: "Niemieckie uprawnienia Stufe 1" }[l], note: { de: "Original, Fahrausweis oder Zertifikat (auch digital)", en: "original licence card or certificate (digital is fine)", uk: "оригінал, посвідчення або сертифікат (можна в електронному вигляді)", pl: "oryginał, legitymacja lub certyfikat (może być w wersji cyfrowej)" }[l], required: true },
        { title: SHOES[l], note: { de: "für den Praxisteil Pflicht", en: "required for the practical part", uk: "обов’язково для практичної частини", pl: "obowiązkowo na część praktyczną" }[l], required: true },
        { title: CLOTHES[l], note: HALL[l], required: false },
    ],
    scheduleTitle: { de: "Ablauf des Schulungstages", en: "Schedule of the training day", uk: "Програма дня навчання", pl: "Przebieg dnia szkolenia" }[l],
    scheduleLead: DGUV[l],
    schedule: [
        { day: 1, title: { de: "Vormittag · Theorie", en: "Morning · Theory", uk: "Перша половина дня · Теорія", pl: "Przed południem · Teoria" }[l], meta: { de: "{date} · ab {from}", en: "{date} · from {from}", uk: "{date} · з {from}", pl: "{date} · od {from}" }[l], text: {
            de: "Aufbau und Funktion des Schubmaststaplers, Unterschiede zum Frontstapler, Tragfähigkeit und Lastschwerpunkt, Standsicherheit beim Arbeiten in der Höhe, Sicherheitsvorschriften und Unfallverhütung.",
            en: "Design and function of the reach truck, differences from the counterbalance forklift, load capacity and load centre, stability when working at height, safety regulations and accident prevention.",
            uk: "Будова та принцип роботи рич-трака, відмінності від фронтального навантажувача, вантажопідйомність і центр ваги вантажу, стійкість під час роботи на висоті, правила безпеки та запобігання нещасним випадкам.",
            pl: "Budowa i działanie wózka z wysuwnym masztem, różnice w porównaniu z wózkiem czołowym, udźwig i środek ciężkości ładunku, stateczność przy pracy na wysokości, przepisy BHP i zapobieganie wypadkom.",
        }[l], exam: { de: "Schriftlicher Test", en: "Written test", uk: "Письмовий тест", pl: "Test pisemny" }[l], highlight: false },
        { day: 1, title: { de: "Nachmittag · Praxis", en: "Afternoon · Practice", uk: "Друга половина дня · Практика", pl: "Po południu · Praktyka" }[l], meta: { de: "bis ca. {to}", en: "until approx. {to}", uk: "до прибл. {to}", pl: "do ok. {to}" }[l], text: {
            de: "Tägliche Sichtprüfung, Bedienung des Schubmasts, sicheres Fahren und Rangieren in engen Gängen, Lastaufnahme und Lastabsetzung, Ein- und Auslagern im Regal.",
            en: "Daily visual inspection, operating the reach mast, safe driving and manoeuvring in narrow aisles, picking up and setting down loads, storing and retrieving in racks.",
            uk: "Щоденний візуальний огляд, керування висувною щоглою, безпечний рух і маневрування у вузьких проходах, підйом і встановлення вантажу, розміщення та зняття зі стелажів.",
            pl: "Codzienna kontrola wzrokowa, obsługa wysuwnego masztu, bezpieczna jazda i manewrowanie w wąskich alejkach, podnoszenie i odstawianie ładunku, składowanie i pobieranie z regałów.",
        }[l], exam: { de: "Praktische Prüfung, danach Ihre Stufe-2-Qualifikation", en: "Practical exam, then your Level 2 qualification", uk: "Практичний іспит, після нього ваша кваліфікація рівня 2", pl: "Egzamin praktyczny, potem Twoja kwalifikacja Stufe 2" }[l], highlight: true },
    ],
    afterSchedule: {
        de: "Nach bestandener Prüfung erhalten Sie Ihr **Zertifikat für die Stufe-2-Qualifikation** und die **Staplero ProCard**.",
        en: "After passing the exam you receive your **Level 2 qualification certificate** and the **Staplero ProCard**.",
        uk: "Після успішного іспиту ви отримаєте **сертифікат кваліфікації рівня 2** та **Staplero ProCard**.",
        pl: "Po zdanym egzaminie otrzymasz **certyfikat kwalifikacji Stufe 2** oraz **Staplero ProCard**.",
    }[l],
    onlineNote: "",
    cancellation: "",
    closing: CLOSING[l],
}));

// ─── Pakiet: dostęp do teorii online (osobny mail) ───────────────────────────

const onlineAccess: Record<MailLang, Content> = {
    de: {
        subject: "Online-Theorie freigeschaltet: Jetzt vor Ihrem Kurs am {date} lernen",
        preheader: "{days} Tage Zugang, gültig bis {expires}. So gehen Sie gut vorbereitet in Theorie und Prüfung.",
        eyebrow: "Online-Zugang freigeschaltet",
        headline: "Lernen Sie die Theorie schon vor dem Kurs",
        intro: "Hallo {name}, in Ihrer Buchung ist der Online-Theoriekurs enthalten. Er ist ab sofort freigeschaltet. Nutzen Sie die Zeit bis zum Kurs, um die Grundlagen in Ruhe zu lernen.",
        accessLabel: "Ihr Online-Zugang",
        daysValue: "{days} Tage",
        validUntil: "gültig bis {expiresShort}",
        courseLabel: "Ihr Kurs beginnt",
        device: "Am Handy, Tablet oder Computer",
        cta: "Jetzt mit dem Lernen starten",
        startTitle: "So starten Sie",
        steps: [
            { title: "Anmelden", text: "Mit Ihrer E-Mail-Adresse **{email}** und dem Passwort, das Sie bei der Bestellung gewählt haben." },
            { title: "Kurs öffnen", text: "Im Kundenbereich ist Ihr Online-Kurs bereits freigeschaltet. Ein Klick genügt." },
            { title: "In Ihrem Tempo lernen", text: "Arbeiten Sie die Module nacheinander durch und prüfen Sie Ihr Wissen mit den Übungstests. Ihr Fortschritt wird gespeichert." },
        ],
        forgot: "Passwort vergessen? [Hier neues Passwort festlegen]({resetUrl})",
        pathTitle: "Ihr Weg zum Staplerschein",
        pathLead: "Die Online-Theorie bereitet Sie gezielt auf den Kurs vor Ort vor.",
        nowTitle: "Ab heute · Online lernen",
        nowMeta: "bis {expiresShort}",
        nowText: "Rechtliche Grundlagen, Aufbau des Staplers, Standsicherheit und Tragfähigkeit, Lastdiagramme und Verkehrsregeln im Betrieb: in kurzen Lektionen, so oft Sie möchten.",
        courseTitle: "Kurs vor Ort",
        courseText: "Theorie und Praxis mit Ihrem Ausbilder. Mit Vorwissen folgen Sie dem Unterricht leichter und gehen sicherer in die Prüfung.",
        examText: "Schriftlicher Test und Fahrprüfung",
        endsBefore: "**Hinweis:** Ihr Online-Zugang endet am **{expires}**, also vor Ihrem Kurs am **{start}**. Planen Sie Ihre Lernzeit am besten gleich ein.",
        goodToKnowTitle: "Gut zu wissen",
        notes: "Der Zugang endet automatisch am **{expires}**. Es entstehen keine weiteren Kosten.\nTreffpunkt, Uhrzeiten und Checkliste stehen in Ihrer separaten Buchungsbestätigung.",
        notesMulti: "Der Online-Zugang gilt für das Konto des Bestellers.",
        helpTitle: "Fragen zum Online-Kurs?",
        closing: "Viel Erfolg beim Lernen!\n**Ihr STAPLERO Team**",
    },
    en: {
        subject: "Online theory unlocked: start learning before your course on {date}",
        preheader: "{days} days of access, valid until {expires}. Go into the theory day and exam well prepared.",
        eyebrow: "Online access unlocked",
        headline: "Learn the theory before your course",
        intro: "Hello {name}, your booking includes the online theory course. It is unlocked now. Use the time before your course to learn the basics at your own pace.",
        accessLabel: "Your online access",
        daysValue: "{days} days",
        validUntil: "valid until {expiresShort}",
        courseLabel: "Your course starts",
        device: "On your phone, tablet or computer",
        cta: "Start learning now",
        startTitle: "How to start",
        steps: [
            { title: "Log in", text: "With your email address **{email}** and the password you chose when ordering." },
            { title: "Open the course", text: "Your online course is already unlocked in your customer area. One click is all it takes." },
            { title: "Learn at your own pace", text: "Work through the modules one by one and check your knowledge with the practice tests. Your progress is saved." },
        ],
        forgot: "Forgot your password? [Set a new password here]({resetUrl})",
        pathTitle: "Your way to the forklift licence",
        pathLead: "The online theory prepares you for the course on site.",
        nowTitle: "From today · Learn online",
        nowMeta: "until {expiresShort}",
        nowText: "Legal basics, design of the forklift, stability and load capacity, load charts and traffic rules on site: in short lessons, as often as you like.",
        courseTitle: "Course on site",
        courseText: "Theory and practice with your instructor. With prior knowledge you follow the lessons more easily and go into the exam with more confidence.",
        examText: "Written test and driving test",
        endsBefore: "**Please note:** your online access ends on **{expires}**, before your course on **{start}**. Plan your learning time now.",
        goodToKnowTitle: "Good to know",
        notes: "Access ends automatically on **{expires}**. There are no further costs.\nMeeting point, times and checklist are in your separate booking confirmation.",
        notesMulti: "The online access applies to the account of the person who booked.",
        helpTitle: "Questions about the online course?",
        closing: "Good luck with your studies!\n**Your STAPLERO Team**",
    },
    uk: {
        subject: "Онлайн-теорію відкрито: почніть навчання до курсу {date}",
        preheader: "Доступ на {days} днів, до {expires}. Приходьте на теорію та іспит добре підготовленими.",
        eyebrow: "Онлайн-доступ відкрито",
        headline: "Вивчайте теорію ще до курсу",
        intro: "Вітаємо, {name}! Ваше бронювання включає онлайн-курс теорії. Його вже відкрито. Використайте час до курсу, щоб спокійно вивчити основи.",
        accessLabel: "Ваш онлайн-доступ",
        daysValue: "{days} днів",
        validUntil: "діє до {expiresShort}",
        courseLabel: "Ваш курс починається",
        device: "На телефоні, планшеті або комп’ютері",
        cta: "Почати навчання",
        startTitle: "Як почати",
        steps: [
            { title: "Увійдіть", text: "З вашою електронною адресою **{email}** і паролем, який ви вибрали під час замовлення." },
            { title: "Відкрийте курс", text: "У вашому особистому кабінеті онлайн-курс уже відкрито. Достатньо одного кліку." },
            { title: "Навчайтеся у своєму темпі", text: "Проходьте модулі по черзі та перевіряйте знання тренувальними тестами. Ваш прогрес зберігається." },
        ],
        forgot: "Забули пароль? [Встановіть новий пароль тут]({resetUrl})",
        pathTitle: "Ваш шлях до посвідчення",
        pathLead: "Онлайн-теорія цілеспрямовано готує вас до курсу на місці.",
        nowTitle: "Від сьогодні · Навчання онлайн",
        nowMeta: "до {expiresShort}",
        nowText: "Правові основи, будова навантажувача, стійкість і вантажопідйомність, діаграми навантаження та правила руху на підприємстві: короткими уроками, скільки завгодно разів.",
        courseTitle: "Курс на місці",
        courseText: "Теорія та практика з інструктором. Маючи базові знання, ви легше засвоїте матеріал і впевненіше складете іспит.",
        examText: "Письмовий тест та іспит з водіння",
        endsBefore: "**Зверніть увагу:** ваш онлайн-доступ закінчується **{expires}**, тобто до початку курсу **{start}**. Сплануйте час навчання вже зараз.",
        goodToKnowTitle: "Корисно знати",
        notes: "Доступ автоматично закінчується **{expires}**. Додаткових витрат немає.\nМісце зустрічі, час і список речей ви знайдете в окремому підтвердженні бронювання.",
        notesMulti: "Онлайн-доступ діє для облікового запису замовника.",
        helpTitle: "Питання щодо онлайн-курсу?",
        closing: "Успіхів у навчанні!\n**Ваша команда STAPLERO**",
    },
    pl: {
        subject: "Teoria online odblokowana: zacznij naukę przed kursem {date}",
        preheader: "{days} dni dostępu, do {expires}. Przyjdź na teorię i egzamin dobrze przygotowany.",
        eyebrow: "Dostęp online odblokowany",
        headline: "Naucz się teorii jeszcze przed kursem",
        intro: "Cześć {name}, Twoja rezerwacja obejmuje kurs teorii online. Jest już odblokowany. Wykorzystaj czas do kursu, aby spokojnie poznać podstawy.",
        accessLabel: "Twój dostęp online",
        daysValue: "{days} dni",
        validUntil: "ważny do {expiresShort}",
        courseLabel: "Twój kurs zaczyna się",
        device: "Na telefonie, tablecie lub komputerze",
        cta: "Zacznij naukę teraz",
        startTitle: "Jak zacząć",
        steps: [
            { title: "Zaloguj się", text: "Adresem e-mail **{email}** i hasłem wybranym przy zamówieniu." },
            { title: "Otwórz kurs", text: "W panelu klienta Twój kurs online jest już odblokowany. Wystarczy jedno kliknięcie." },
            { title: "Ucz się we własnym tempie", text: "Przechodź kolejne moduły i sprawdzaj wiedzę w testach ćwiczeniowych. Twoje postępy są zapisywane." },
        ],
        forgot: "Nie pamiętasz hasła? [Ustaw nowe hasło tutaj]({resetUrl})",
        pathTitle: "Twoja droga do uprawnień",
        pathLead: "Teoria online przygotowuje Cię do kursu na miejscu.",
        nowTitle: "Od dziś · Nauka online",
        nowMeta: "do {expiresShort}",
        nowText: "Podstawy prawne, budowa wózka, stateczność i udźwig, diagramy udźwigu i zasady ruchu w zakładzie: w krótkich lekcjach, tyle razy, ile chcesz.",
        courseTitle: "Kurs na miejscu",
        courseText: "Teoria i praktyka z instruktorem. Z wiedzą z kursu online łatwiej nadążysz na zajęciach i pewniej podejdziesz do egzaminu.",
        examText: "Test pisemny i egzamin z jazdy",
        endsBefore: "**Uwaga:** Twój dostęp online kończy się **{expires}**, czyli przed kursem **{start}**. Zaplanuj czas na naukę już teraz.",
        goodToKnowTitle: "Warto wiedzieć",
        notes: "Dostęp kończy się automatycznie **{expires}**. Nie ma żadnych dodatkowych kosztów.\nMiejsce spotkania, godziny i listę rzeczy znajdziesz w osobnym potwierdzeniu rezerwacji.",
        notesMulti: "Dostęp online obowiązuje na koncie osoby zamawiającej.",
        helpTitle: "Pytania o kurs online?",
        closing: "Powodzenia w nauce!\n**Twój zespół STAPLERO**",
    },
};

// ─── Zakup kursu online: niemiecki i angielski w jednym mailu ─────────────────

const onlinePurchase: Partial<Record<MailLang, Content>> = {
    de: {
        subject: "Ihr Online-Kurs ist freigeschaltet / Your online course is unlocked: {course}",
        preheader: "Ihr Zugang zu „{course}“ ist freigeschaltet. Your access to “{course}” is unlocked.",
        eyebrow: "Bestellung bestätigt · Order confirmed",
        headline: "Zahlung erfolgreich! Payment successful!",
        sectionLabel: "Deutsch",
        intro: "Hallo **{name}**,\nvielen Dank für Ihren Kauf! Sie haben nun Zugang zu:",
        courseLabel: "Kurs",
        orderLabel: "Bestellnummer",
        validLabel: "Zugang gültig bis",
        button: "Zum Kurs",
        closing: "**Viel Erfolg!**\nIhr STAPLERO Team",
    },
    en: {
        sectionLabel: "English",
        intro: "Hello **{name}**,\nthank you for your purchase! You now have access to:",
        courseLabel: "Course",
        orderLabel: "Order number",
        validLabel: "Access valid until",
        button: "Go to the course",
        closing: "**Good luck!**\nYour STAPLERO Team",
    },
};

// ─── Lista szablonów ─────────────────────────────────────────────────────────

export const BUILTIN_TEMPLATES: TemplateDef[] = [
    { key: "booking-stufe1", name: "Buchung: Stufe 1 (2 Tage)", kind: "booking", description: "Anmeldebestätigung für den 2-tägigen Staplerschein Stufe 1.", languages: LANGS4, defaults: stufe1 },
    { key: "booking-kombi", name: "Buchung: KombiPro (3 Tage, Front + Schubmast)", kind: "booking", description: "Anmeldebestätigung für die 3-Tage-Intensivausbildung Frontstapler und Schubmaststapler.", languages: LANGS4, defaults: kombi },
    { key: "booking-anfaenger3", name: "Buchung: Anfänger Stufe 1 (3 Tage)", kind: "booking", description: "Anmeldebestätigung für die 3-tägige Anfänger-Ausbildung am Frontgabelstapler.", languages: LANGS4, defaults: anfaenger },
    { key: "booking-stufe2", name: "Buchung: Stufe 2 Schubmaststapler (1 Tag)", kind: "booking", description: "Anmeldebestätigung für die eintägige Zusatzqualifikation. Voraussetzung: Staplerschein Stufe 1.", languages: LANGS4, defaults: stufe2 },
    { key: "online-access", name: "Paket: Zugang zur Online-Theorie", kind: "online-access", description: "Separate E-Mail nach der Buchung eines Pakets mit Online-Theorie (z. B. Stufe 1, KombiPro).", languages: LANGS4, defaults: onlineAccess },
    { key: "online-purchase", name: "Kauf: Online-Kurs (Deutsch + Englisch)", kind: "online-purchase", description: "Nach dem Kauf eines Online-Kurses. Deutsch und Englisch in einer E-Mail.", languages: ["de", "en"], defaults: onlinePurchase },
    { key: "booking-common", name: "Buchung: gemeinsame Texte", kind: "common", description: "Texte, die alle Buchungsbestätigungen teilen: Buttons, Anfahrt Berlin, Teilnehmer, Hilfe.", languages: LANGS4, defaults: { de: commonDe, en: commonEn, uk: commonUk, pl: commonPl } },
];

export const BOOKING_FALLBACK_BY_DAYS = (days: number) => (days <= 1 ? "booking-stufe2" : days >= 3 ? "booking-kombi" : "booking-stufe1");
