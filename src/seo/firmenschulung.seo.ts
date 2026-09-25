/**
 * Dane SEO strony "Firmenschulung Berlin" — jedno źródło prawdy dla:
 *  - komponentu <Seo /> (title, description, canonical, Open Graph, JSON-LD),
 *  - widocznego FAQ na stronie (JSON-LD FAQPage musi zgadzać się z tym, co widzi użytkownik),
 *  - pluginu Vite, który przy buildzie generuje statyczny HTML z tymi samymi meta.
 *
 * Plik nie może importować niczego przez alias "@/..." (używa go też vite.config.ts).
 * Strona jest wyłącznie po niemiecku.
 */

export const SITE_URL = "https://staplero.de";
export const PAGE_PATH = "/firmenschulung-berlin";
export const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const CONTACT = {
  email: "info@staplero.com",
  phones: [
    { display: "+49 176 22067783", href: "+4917622067783" },
    { display: "+49 160 92490070", href: "+4916092490070" },
  ],
  hours: "Mo bis Fr: 9:00 bis 17:00 Uhr",
  locations: ["Berlin", "Görlitz/Zgorzelec", "München"],
};

export const SOCIALS = [
  "https://www.facebook.com/Staplero",
  "https://www.instagram.com/staplero.ig/",
  "https://www.linkedin.com/company/staplero/",
];

export const SEO = {
  // ≤ 60 Zeichen
  title: "Staplerschein Firmenschulung Berlin | STAPLERO",
  // ≤ 160 Zeichen
  description:
    "Staplerschein-Firmenschulung in Berlin: bei Ihnen im Betrieb oder in unserer Schulungshalle. Nach DGUV 68, mehrsprachig, anerkannt. Jetzt Angebot anfordern.",
  h1: "Staplerschein Firmenschulung in Berlin",
};

export interface FaqItem {
  q: string;
  a: string;
  bullets?: string[];
}

export const FAQ: FaqItem[] = [
  {
    q: "Bieten Sie Staplerschein-Schulungen für Firmen in Berlin an?",
    a: "Ja. Wir schulen Ihre Mitarbeitenden in Berlin, auf Wunsch auch deutschlandweit, entweder direkt bei Ihnen im Betrieb oder in unserer eigenen Schulungshalle in Berlin. Die Ausbildung erfolgt nach DGUV Vorschrift 68 und DGUV Grundsatz 308-001. Sie besteht aus einem Theorieteil mit schriftlicher Prüfung sowie einem Praxisteil mit Fahrprüfung. Unsere Trainer bringen alle erforderlichen Schulungsunterlagen mit.",
  },
  {
    q: "Schulen Sie im Betrieb oder in einer eigenen Halle?",
    a: "Beides ist möglich. Wir kommen zu Ihnen in den Betrieb, oder Ihre Mitarbeitenden trainieren in unserer eigenen Schulungshalle in Berlin, an klassischen Frontstaplern und Schubmaststaplern (Hochregalstaplern). Welche Variante passt, hängt von Teilnehmerzahl, Terminwunsch und Ihren Räumlichkeiten ab. Wir beraten Sie gern.",
  },
  {
    q: "Wie hoch sind die Kosten für eine Firmenschulung?",
    a: "Da jede Schulung individuell geplant wird, erstellen wir Ihnen ein Angebot auf Basis folgender Angaben:",
    bullets: [
      "Anzahl der Mitarbeitenden",
      "Ort der Schulung",
      "Geräteart (z. B. Frontstapler, Schubmaststapler, Elektro-Ameise)",
      "Vorerfahrung der Teilnehmenden",
    ],
  },
  {
    q: "In welchen Sprachen bieten Sie die Schulung an?",
    a: "Wir führen die Schulung vollständig in der gewünschten Sprache durch. Verfügbar sind Deutsch, Englisch, Polnisch, Ukrainisch, Russisch und Rumänisch. Für Schulungen in rumänischer Sprache fällt ein Dolmetscherzuschlag von 179,99 € netto pro Tag an.",
  },
  {
    q: "Wie lange dauert die Ausbildung?",
    a: "Der Standard für Gabelstapler sind 2 Tage: Tag 1 Theorie mit schriftlicher Prüfung, Tag 2 Praxis mit Fahrprüfung. Je nach Vorerfahrung und Gerät gibt es eine verkürzte und eine verlängerte Variante:",
    bullets: [
      "1 Tag: bei mindestens 6 Monaten Praxiserfahrung",
      "3 Tage: z. B. bei Schubmaststaplern",
    ],
  },
  {
    q: "Was benötigen wir, wenn die Schulung in unserem Betrieb stattfindet?",
    a: "Bei einer Schulung in unserer Schulungshalle entfällt die Bereitstellung von Raum, Übungsbereich und Stapler. Findet die Schulung in Ihrem Betrieb statt, benötigen Sie für die Theorie (Tag 1) einen ruhigen Raum mit Tischen und Stühlen. Für die Praxis (Tag 2) benötigen Sie:",
    bullets: [
      "einen geeigneten Übungsbereich (Lagerfläche oder Betriebshof)",
      "einen funktionsfähigen Gabelstapler",
      "Europaletten und idealerweise Gitterboxen",
    ],
  },
  {
    q: "Welche Unterlagen müssen die Teilnehmenden mitbringen?",
    a: "Jede teilnehmende Person bringt Folgendes mit:",
    bullets: [
      "gültigen Ausweis (Personalausweis oder Reisepass)",
      "Sicherheitsschuhe (Pflicht für den praktischen Teil)",
    ],
  },
  {
    q: "Erhalten die Teilnehmenden einen anerkannten Staplerschein?",
    a: "Ja. Nach bestandener Prüfung erhalten alle Teilnehmenden einen offiziellen deutschen Staplerschein gemäß DGUV Vorschrift 68, bundesweit anerkannt. Das Zertifikat erhalten Sie digital als PDF sowie für Apple Wallet und Google Wallet.",
  },
  {
    q: "Bieten Sie auch die jährliche Unterweisung an?",
    a: "Ja. Wir führen die jährliche Unterweisung nach DGUV Vorschrift 1 für Ihre Mitarbeitenden durch. Das ist auch als Inhouse-Variante direkt in Ihrem Betrieb möglich.",
  },
];

const faqAnswerText = (f: FaqItem) => (f.bullets?.length ? `${f.a} ${f.bullets.join("; ")}.` : f.a);

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "STAPLERO",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/staplero_logo.jpeg`,
  email: CONTACT.email,
  telephone: CONTACT.phones[0].href,
  sameAs: SOCIALS,
};

/** Strukturierte Daten: Service + FAQPage + BreadcrumbList (JSON-LD). */
export const buildJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${PAGE_URL}#service`,
    name: "Staplerschein Firmenschulung Berlin",
    serviceType: "Firmenschulung für Gabelstaplerfahrer im Betrieb oder in der Schulungshalle (DGUV Vorschrift 68 / DGUV Grundsatz 308-001)",
    description: SEO.description,
    url: PAGE_URL,
    inLanguage: "de-DE",
    provider: organization,
    areaServed: [
      { "@type": "City", name: "Berlin" },
      { "@type": "Country", name: "Deutschland" },
    ],
    audience: { "@type": "BusinessAudience", name: "Unternehmen" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: faqAnswerText(f) },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Startseite", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Firmenschulung Berlin", item: PAGE_URL },
    ],
  },
];
