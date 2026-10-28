/**
 * Stapler-Quiz (Staplerschein-Test) — jedno źródło prawdy dla:
 *  - strony /staplerschein-test (pełny quiz, 20 pytań),
 *  - teasera na stronie głównej (wybrane pytania, patrz TEASER_IDS),
 *  - komponentu <Seo /> i pluginu Vite, który przy buildzie generuje statyczny HTML z meta.
 *
 * Treść pytań pochodzi od klienta (Staplero-Stapler-Quiz.html) i jest wyłącznie po niemiecku.
 * Plik nie może importować niczego przez alias "@/..." (używa go też vite.config.ts).
 */

export const SITE_URL = "https://staplero.de";
export const PAGE_PATH = "/staplerschein-test";
export const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const CONTACT = {
  email: "info@staplero.com",
  phones: [
    { display: "+49 160 92490070", href: "+4916092490070" },
    { display: "+49 176 22067783", href: "+4917622067783" },
  ],
};

export const SEO = {
  // ≤ 60 Zeichen
  title: "Staplerschein Test: 20 Fragen mit Lösungen | STAPLERO",
  // ≤ 160 Zeichen
  description:
    "Kostenloser Gabelstapler-Test: 20 Fragen nach DGUV Vorschrift 68 mit Erklärung. Ohne Anmeldung, ca. 5 Minuten. Danach Staplerschein bei Staplero buchen.",
};

/** Abbildung zur Frage: Fotos und Zeichnungen rendert die Seite (StaplerQuiz.tsx). */
export type QuizFigure = "plakette" | "rampe" | "rampe-leer" | "diagramm";

export interface QuizAnswer {
  text: string;
  correct: boolean;
  why: string;
}

export interface QuizQuestion {
  id: string;
  /** grund = 15 Grundfragen, profi = 5 Profi-Fragen */
  round: "grund" | "profi";
  figure?: QuizFigure;
  q: string;
  answers: QuizAnswer[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "L01",
    round: "grund",
    q: "Was gilt für den Fahrer eines Gabelstaplers mit Fahrersitz oder Fahrerstand?",
    answers: [
      { text: "Er braucht einen Pkw-Führerschein Klasse B.", correct: false, why: "Für den Betrieb auf dem Firmengelände nicht nötig. Erst im öffentlichen Straßenverkehr gilt das Fahrerlaubnisrecht." },
      { text: "Er muss vom Unternehmer schriftlich beauftragt sein.", correct: true, why: "Ohne schriftliche Beauftragung darf niemand fahren, auch nicht mit Staplerschein. Dazu kommen Ausbildung und Befähigungsnachweis." },
      { text: "Er muss seit mindestens zwei Jahren im Betrieb sein.", correct: false, why: "Eine Mindestbetriebszugehörigkeit gibt es nicht." },
      { text: "Er muss mindestens 18 Jahre alt sein.", correct: true, why: "DGUV Vorschrift 68 § 7: Mindestalter 18 Jahre. Ausnahme: Auszubildende unter Aufsicht." },
    ],
  },
  {
    id: "L02",
    round: "grund",
    q: "Wann prüft der Fahrer den Stapler auf sichtbare Mängel und Funktion?",
    answers: [
      { text: "Einmal pro Woche.", correct: false, why: "Zu selten. Ein Mangel kann jederzeit entstehen." },
      { text: "Gar nicht, das macht der Sachkundige bei der UVV-Prüfung.", correct: false, why: "Die jährliche Prüfung ersetzt die Prüfung vor Schichtbeginn nicht." },
      { text: "Vor Beginn jeder Arbeitsschicht.", correct: true, why: "Bremsen, Lenkung, Hubgerüst, Hupe, Reifen: Der Fahrer prüft vor jeder Schicht (Betriebsanleitung, DGUV G 308-001)." },
      { text: "Nur nach einer Reparatur.", correct: false, why: "Die Einsatzprüfung ist tägliche Routine." },
    ],
  },
  {
    id: "L03",
    round: "grund",
    figure: "plakette",
    q: "Diese Prüfplakette klebt an einem Elektrostapler. Bis wann muss er spätestens wieder geprüft werden?",
    answers: [
      { text: "Bis Oktober 2027.", correct: true, why: "Die Jahreszahl in der Mitte zeigt das Jahr, der Mittelstrich zeigt auf den Monat: 10 = Oktober. Bis dahin muss die nächste regelmäßige Prüfung durch einen Sachkundigen erfolgt sein (DGUV V 68 § 37, Prüfung nach FEM 4.004)." },
      { text: "Bis Oktober 2026, das ist der Tag der letzten Prüfung.", correct: false, why: "Die Plakette zeigt den nächsten Prüftermin. Ist er überschritten: Stapler nicht benutzen und melden." },
      { text: "Die Plakette zeigt, wann der Stapler gebaut wurde.", correct: false, why: "Das Baujahr steht auf dem Typenschild. Die Plakette dokumentiert die Prüfung." },
      { text: "Bis Juli 2027.", correct: false, why: "Die 07 steht zwar groß auf der Plakette, entscheidend ist aber die Zahl, auf die der Mittelstrich zeigt." },
    ],
  },
  {
    id: "L04",
    round: "grund",
    q: "Wie oft muss ein Gabelstapler von einem Sachkundigen geprüft werden?",
    answers: [
      { text: "Nur wenn ein Mangel auffällt.", correct: false, why: "Die Prüfung ist Pflicht, auch ohne Mangel." },
      { text: "Mindestens einmal innerhalb von 12 Monaten.", correct: true, why: "DGUV V 68 § 37. Bei hartem Einsatz kann der Betrieb kürzere Fristen festlegen." },
      { text: "Alle 24 Monate.", correct: false, why: "Zu lang." },
      { text: "Einmal pro Kalenderjahr.", correct: false, why: "Klingt ähnlich, ist es aber nicht: Januar dieses Jahres und Dezember nächsten Jahres wären fast 23 Monate Abstand." },
    ],
  },
  {
    id: "L05",
    round: "grund",
    figure: "rampe",
    q: "Sie fahren mit einer Palette diese Rampe hoch und später wieder runter. Wie fahren Sie richtig?",
    answers: [
      { text: "Bergauf vorwärts.", correct: true, why: "Mit Last zeigt die Last immer bergauf. So rutscht sie nicht von der Gabel und der Stapler bleibt standsicher." },
      { text: "Bergab vorwärts, Last etwas anheben.", correct: false, why: "Die Last zeigt nach unten. Sie kann abrutschen, der Stapler kann nach vorn kippen." },
      { text: "Auf der Rampe wenden, wenn es eng wird.", correct: false, why: "Wenden und Querfahren auf Steigungen ist verboten: seitliche Kippgefahr." },
      { text: "Bergab rückwärts.", correct: true, why: "Gleiche Regel: Last bergseitig, also bergab rückwärts." },
    ],
  },
  {
    id: "L06",
    round: "grund",
    figure: "rampe-leer",
    q: "Und ohne Last? Wie fahren Sie über die Rampe?",
    answers: [
      { text: "Quer zur Steigung, das spart Zeit.", correct: false, why: "Querfahren auf Steigungen ist verboten." },
      { text: "Bergauf rückwärts.", correct: true, why: "Ohne Last ist das Gegengewicht der schwerste Teil. Es zeigt bergauf, die Gabel bergab." },
      { text: "Bergauf vorwärts.", correct: false, why: "Das Gegengewicht zeigt dann bergab. Der leere Stapler kann nach hinten kippen." },
      { text: "Bergab vorwärts.", correct: true, why: "Gabel bergab, Gegengewicht bergauf: richtig." },
    ],
  },
  {
    id: "L07",
    round: "grund",
    q: "In welcher Stellung transportieren Sie eine Last?",
    answers: [
      { text: "Hubgerüst nach hinten geneigt.", correct: true, why: "Die Last liegt am Gabelrücken an und rutscht beim Bremsen nicht ab." },
      { text: "So tief wie möglich, nur mit nötiger Bodenfreiheit.", correct: true, why: "Tiefer Schwerpunkt bedeutet hohe Standsicherheit." },
      { text: "Hoch angehoben, damit man darunter durchsieht.", correct: false, why: "Hoher Schwerpunkt: Kippgefahr. Bei schlechter Sicht rückwärts fahren." },
      { text: "Hubgerüst nach vorne geneigt.", correct: false, why: "Die Last kann abrutschen." },
    ],
  },
  {
    id: "L08",
    round: "grund",
    q: "Ein Kollege will auf der Gabel stehend kurz etwas aus dem Regal holen. Was tun Sie?",
    answers: [
      { text: "In Ordnung, wenn es schnell geht.", correct: false, why: "Ein Sturz aus 3 m Höhe dauert keine Sekunde." },
      { text: "Ablehnen. Personen dürfen nicht auf der Gabel oder der Last gehoben werden.", correct: true, why: "Personen heben nur mit dafür zugelassenen Einrichtungen, z. B. einer geprüften Arbeitsbühne." },
      { text: "In Ordnung, wenn er sich am Hubgerüst festhält.", correct: false, why: "Am Hubgerüst drohen schwere Quetschungen." },
      { text: "In Ordnung, wenn er auf einer Palette steht.", correct: false, why: "Eine Palette ist keine Arbeitsbühne." },
    ],
  },
  {
    id: "L09",
    round: "grund",
    q: "Was gehört zum sicheren Abstellen des Staplers?",
    answers: [
      { text: "Vor dem Notausgang abstellen, dort ist Platz.", correct: false, why: "Notausgänge, Rettungswege und Feuerlöscher bleiben immer frei." },
      { text: "Bei kurzer Pause den Motor laufen lassen.", correct: false, why: "Wer absteigt, stellt den Motor ab, auch für kurze Zeit." },
      { text: "Gabel ganz absenken, Spitzen auf den Boden neigen.", correct: true, why: "So stolpert niemand über die Gabel." },
      { text: "Feststellbremse anziehen und Schlüssel abziehen.", correct: true, why: "Der Stapler rollt nicht weg und Unbefugte können nicht losfahren." },
    ],
  },
  {
    id: "L10",
    round: "grund",
    q: "Eine hohe Last versperrt Ihnen die Sicht nach vorn. Was tun Sie?",
    answers: [
      { text: "Last höher heben und darunter durchschauen.", correct: false, why: "Höherer Schwerpunkt, höhere Kippgefahr." },
      { text: "Langsam weiterfahren und hupen.", correct: false, why: "Hupen ersetzt keine Sicht." },
      { text: "Rückwärts fahren oder einen Einweiser einsetzen.", correct: true, why: "Sie müssen den Fahrweg sehen. Ist Rückwärtsfahren nicht möglich, hilft ein Einweiser." },
      { text: "Den Oberkörper zur Seite hinauslehnen.", correct: false, why: "Außerhalb des Fahrerschutzdachs drohen Quetschungen." },
    ],
  },
  {
    id: "L11",
    round: "grund",
    q: "Wozu dient der Sicherheitsgurt auf dem Stapler?",
    answers: [
      { text: "Er ist freiwillig.", correct: false, why: "Die Benutzung ist Pflicht." },
      { text: "Er ist nur im Straßenverkehr Pflicht.", correct: false, why: "Ist ein Rückhaltesystem vorhanden, wird es immer benutzt." },
      { text: "Er verhindert, dass der Stapler umkippt.", correct: false, why: "Der Gurt schützt den Fahrer, nicht das Fahrzeug." },
      { text: "Er verhindert, dass der Fahrer beim Umkippen herausfällt und eingeklemmt wird.", correct: true, why: "Viele tödliche Kippunfälle passieren, weil der Fahrer herausfällt oder abspringt." },
    ],
  },
  {
    id: "L12",
    round: "grund",
    q: "Der Stapler beginnt seitlich zu kippen. Was ist richtig?",
    answers: [
      { text: "Abspringen.", correct: false, why: "Lebensgefahr: Wer abspringt, gerät oft unter das Schutzdach." },
      { text: "Lenkrad festhalten, Füße kräftig abstützen.", correct: true, why: "So bleiben Sie unter dem Fahrerschutzdach." },
      { text: "Gas geben und gegenlenken.", correct: false, why: "Verstärkt meist die Kippbewegung." },
      { text: "Oberkörper gegen die Kipprichtung lehnen.", correct: true, why: "Genau das zeigt das Piktogramm am Stapler." },
    ],
  },
  {
    id: "L13",
    round: "grund",
    q: "Bei der Prüfung vor Schichtbeginn greift die Bremse schlecht. Was tun Sie?",
    answers: [
      { text: "Stapler stehen lassen und den Mangel sofort melden.", correct: true, why: "Mit einem sicherheitsrelevanten Mangel wird nicht gefahren (ArbSchG § 16: Mängel melden)." },
      { text: "Die Bremse selbst nachstellen.", correct: false, why: "Reparaturen nur durch Fachpersonal." },
      { text: "Einem Kollegen den Stapler überlassen.", correct: false, why: "Damit wird die Gefahr nur weitergereicht." },
      { text: "Vorsichtig bis Schichtende weiterfahren.", correct: false, why: "Mit schlechter Bremse gibt es kein vorsichtiges Fahren." },
    ],
  },
  {
    id: "L14",
    round: "grund",
    q: "In Ihrem Fahrbereich sind Fußgänger unterwegs. Was ist richtig?",
    answers: [
      { text: "Langsamer fahren, Blickkontakt suchen, Abstand halten und notfalls anhalten.", correct: true, why: "Fußgänger hören einen Elektrostapler oft nicht. Der Fahrer ist verantwortlich." },
      { text: "Die Last einfach über die Personen hinweg heben.", correct: false, why: "Lasten nie über Personen bewegen." },
      { text: "Hupen, dann müssen alle ausweichen.", correct: false, why: "Hupen ersetzt keine Rücksicht." },
      { text: "Fußgänger haben im Lager keinen Vorrang.", correct: false, why: "Niemand darf gefährdet werden, egal wer Vorrang hat." },
    ],
  },
  {
    id: "L15",
    round: "grund",
    q: "Was ist beim Laden der Batterie eines Elektrostaplers wichtig?",
    answers: [
      { text: "Am besten in einem kleinen geschlossenen Raum laden.", correct: false, why: "Dort sammelt sich das Gas. Laden nur in gut belüfteten Bereichen." },
      { text: "Laden ist ungefährlich, nur der Stecker muss passen.", correct: false, why: "Explosionsgefahr und ätzende Säure: Schutzbrille und Handschuhe tragen." },
      { text: "Batteriehaube beim Laden geschlossen halten.", correct: false, why: "Die Haube bleibt offen, damit die Gase abziehen." },
      { text: "Gut lüften und keine Zündquellen: kein Rauchen, kein Feuer, keine Funken.", correct: true, why: "Beim Laden entsteht Wasserstoff. Mit Luft bildet er explosives Knallgas." },
    ],
  },
  {
    id: "S01",
    round: "profi",
    figure: "diagramm",
    q: "Eine Kiste wiegt 1.500 kg und ist 1.200 mm lang, das Gewicht ist gleichmäßig verteilt. Was stimmt laut Diagramm?",
    answers: [
      { text: "Bei leichter Überlast reicht es, langsam zu fahren.", correct: false, why: "Überlast ist verboten. Langsames Fahren verhindert das Kippen nicht." },
      { text: "Liegt die Kiste 200 mm vor dem Gabelrücken (Schwerpunkt bei 800 mm), ist der Stapler überlastet.", correct: true, why: "Bei 800 mm sind nur 1.250 kg erlaubt. Deshalb Lasten immer bis an den Gabelrücken aufnehmen." },
      { text: "Liegt die Kiste am Gabelrücken an (Schwerpunkt bei 600 mm), dürfen Sie sie transportieren.", correct: true, why: "Bei 600 mm erlaubt das Diagramm 1.700 kg. 1.500 kg liegen darunter." },
      { text: "Es gelten immer 2.000 kg, egal wo die Last liegt.", correct: false, why: "2.000 kg gelten nur beim Nenn-Lastschwerpunkt von 500 mm." },
    ],
  },
  {
    id: "S02",
    round: "profi",
    q: "An den Stapler wird ein Anbaugerät montiert, z. B. eine Klammer. Welche Tragfähigkeit gilt?",
    answers: [
      { text: "Die Angabe auf dem Zusatz-Tragfähigkeitsschild für Stapler mit diesem Anbaugerät.", correct: true, why: "Das Anbaugerät wiegt selbst und schiebt den Lastschwerpunkt nach vorn. Die Resttragfähigkeit sinkt." },
      { text: "Das entscheidet der Fahrer nach Gefühl.", correct: false, why: "Gefühl ersetzt kein Tragfähigkeitsschild." },
      { text: "Weiterhin die Angabe auf dem Typenschild des Staplers.", correct: false, why: "Mit Anbaugerät gelten die Werte des Grundgeräts nicht mehr." },
      { text: "Eine höhere Tragfähigkeit, weil das Anbaugerät zusätzliches Gewicht bringt.", correct: false, why: "Das Gewicht sitzt vorn auf der Lastseite. Es senkt die Tragfähigkeit." },
    ],
  },
  {
    id: "S03",
    round: "profi",
    q: "Warum kann ein Stapler in der Kurve seitlich kippen?",
    answers: [
      { text: "Die Fliehkraft verschiebt den Schwerpunkt. Verlässt er das Stabilitätsdreieck, kippt der Stapler.", correct: true, why: "Wegen der pendelnden Lenkachse steht der Stapler praktisch nur auf drei Punkten." },
      { text: "Das Gegengewicht verhindert seitliches Kippen.", correct: false, why: "Das Gegengewicht wirkt gegen Kippen nach vorn, nicht zur Seite." },
      { text: "Auch ohne Last kippt er bei zu schneller Kurvenfahrt.", correct: true, why: "Unbeladen liegt der Schwerpunkt nahe an der schmalen Spitze des Dreiecks, an der Hinterachse." },
      { text: "Mit angelegtem Gurt kann er nicht kippen.", correct: false, why: "Der Gurt schützt den Fahrer, nicht die Standsicherheit." },
    ],
  },
  {
    id: "S04",
    round: "profi",
    q: "Sie sollen in einen Lkw hineinfahren. Was muss vorher sicher sein?",
    answers: [
      { text: "Der Lkw ist gegen Wegrollen und vorzeitiges Abfahren gesichert.", correct: true, why: "Feststellbremse, Unterlegkeile und klare Absprache mit dem Lkw-Fahrer. Fährt der Lkw ab, stürzt der Stapler." },
      { text: "Es reicht, das Gewicht der Last mit der Ladebrücke zu vergleichen.", correct: false, why: "Das Gewicht des Staplers muss mitgerechnet werden." },
      { text: "Ladebrücke und Ladefläche tragen Stapler, Fahrer und Last zusammen, und die Brücke liegt fest auf.", correct: true, why: "Der Stapler selbst wiegt oft mehrere Tonnen. Eine verrutschte Brücke wird zur Absturzkante." },
      { text: "Der Lkw darf losfahren, sobald der Stapler auf der Ladefläche steht.", correct: false, why: "Abfahrt erst, wenn der Stapler den Lkw verlassen hat." },
    ],
  },
  {
    id: "S05",
    round: "profi",
    q: "Sie wechseln die Gasflasche an einem Treibgasstapler. Was ist richtig?",
    answers: [
      { text: "Am besten neben einem Kellerabgang oder Gully wechseln.", correct: false, why: "Flüssiggas ist schwerer als Luft und sammelt sich in Vertiefungen. Explosionsgefahr." },
      { text: "Schutzhandschuhe tragen.", correct: true, why: "Austretendes Flüssiggas verdampft eiskalt. Es drohen Kälteverbrennungen." },
      { text: "Im Freien ohne Zündquellen wechseln, vorher das Flaschenventil schließen und den Motor leer laufen lassen.", correct: true, why: "Flüssiggas ist hochentzündlich (DGUV Vorschrift 79). Ist die Leitung leer, tritt beim Abschrauben kaum Gas aus." },
      { text: "Die Dichtheit mit einem Feuerzeug prüfen.", correct: false, why: "Lebensgefahr. Dichtheit nur mit Lecksuchspray prüfen." },
    ],
  },
];

/** Pytania pokazywane na stronie głównej: bez ilustracji (sekcja ma trzymać wysokość), wybrane tak, żeby zaskakiwały. */
export const TEASER_IDS = ["L04", "L12", "L08"];

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "STAPLERO",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/staplero_logo.jpeg`,
  email: CONTACT.email,
  telephone: CONTACT.phones[0].href,
};

/** Strukturierte Daten: Quiz (mit allen Fragen und richtigen Antworten) + BreadcrumbList. */
export const buildJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "@id": `${PAGE_URL}#quiz`,
    name: "Gabelstapler-Quiz nach DGUV Vorschrift 68",
    description: SEO.description,
    url: PAGE_URL,
    inLanguage: "de-DE",
    educationalLevel: "Beginner",
    isAccessibleForFree: true,
    provider: organization,
    hasPart: QUESTIONS.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: q.answers
        .filter((a) => a.correct)
        .map((a) => ({ "@type": "Answer", text: `${a.text} ${a.why}` })),
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Startseite", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Staplerschein Test", item: PAGE_URL },
    ],
  },
];
