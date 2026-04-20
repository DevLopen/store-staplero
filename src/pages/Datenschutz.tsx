import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections_de = [
  {
    heading: "1. Verantwortlicher",
    text: `Verantwortlicher im Sinne der DSGVO ist:\n\nSTAPLERO – Inh. Bohdan Kutko\nJakobstr. 13, 02826 Görlitz, Deutschland\nE-Mail: info@staplero.com`,
  },
  {
    heading: "2. Erhobene Daten",
    text: `Wir erheben folgende personenbezogene Daten:\n\n• Registrierung: Name, E-Mail-Adresse, Passwort (verschlüsselt)\n• Kursbuchung: Name, Adresse, Telefon, E-Mail, Geburtsdatum\n• Zahlung: Zahlungsdaten (verarbeitet über Stripe – wir speichern keine vollständigen Kartendaten)\n• Website-Nutzung: IP-Adresse (anonymisiert), Browsertyp, besuchte Seiten`,
  },
  {
    heading: "3. Rechtsgrundlagen",
    text: `• Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung\n• Art. 6 Abs. 1 lit. c DSGVO – Rechtliche Verpflichtungen\n• Art. 6 Abs. 1 lit. f DSGVO – Berechtigte Interessen\n• Art. 6 Abs. 1 lit. a DSGVO – Einwilligung`,
  },
  {
    heading: "4. Speicherdauer",
    text: `Daten werden nur so lange gespeichert, wie erforderlich. Buchhaltungsrelevante Daten werden gemäß § 147 AO für 10 Jahre aufbewahrt.`,
  },
  {
    heading: "5. Weitergabe an Dritte",
    text: `Weitergabe nur an:\n• Stripe Inc. (Zahlungsabwicklung, EU-US Data Privacy Framework)\n• E-Mail-Dienstleister für Buchungsbestätigungen\n• Behörden bei gesetzlicher Verpflichtung\n\nKeine Weitergabe zu Werbezwecken.`,
  },
  {
    heading: "6. Cookies",
    text: `Wir verwenden:\n• Notwendige Cookies (technischer Betrieb, keine Einwilligung erforderlich)\n• Analyse-Cookies (nur mit Ihrer Einwilligung)\n\nSie können Cookies in Ihrem Browser jederzeit deaktivieren.`,
  },
  {
    heading: "7. Ihre Rechte",
    text: `Sie haben folgende Rechte:\n• Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17)\n• Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20)\n• Widerspruch (Art. 21), Widerruf einer Einwilligung (Art. 7 Abs. 3)\n\nKontakt: info@staplero.com\n\nSie haben das Recht, Beschwerde bei der zuständigen Datenschutzaufsichtsbehörde einzureichen.`,
  },
  {
    heading: "8. Datensicherheit",
    text: `Wir verwenden technische und organisatorische Maßnahmen (HTTPS-Verschlüsselung) zum Schutz Ihrer Daten.`,
  },
];

const sections_en = [
  {
    heading: "1. Data Controller",
    text: `The data controller under GDPR is:\n\nSTAPLERO – Owner: Bohdan Kutko\nJakobstr. 13, 02826 Görlitz, Germany\nEmail: info@staplero.com`,
  },
  {
    heading: "2. Data Collected",
    text: `We collect:\n• Registration: name, email, password (encrypted)\n• Course booking: name, address, phone, email, date of birth\n• Payment: payment data via Stripe (we do not store full card details)\n• Website usage: anonymized IP, browser type, pages visited`,
  },
  {
    heading: "3. Legal Basis",
    text: `• Art. 6(1)(b) GDPR – Contract performance\n• Art. 6(1)(c) GDPR – Legal obligations\n• Art. 6(1)(f) GDPR – Legitimate interests\n• Art. 6(1)(a) GDPR – Consent`,
  },
  {
    heading: "4. Storage Duration",
    text: `Data is only stored as long as necessary. Accounting-relevant data is retained for 10 years per German law.`,
  },
  {
    heading: "5. Disclosure to Third Parties",
    text: `Disclosure only to:\n• Stripe Inc. (payment processing, EU-US Data Privacy Framework)\n• Email providers for booking confirmations\n• Authorities when legally required\n\nNo disclosure for advertising purposes.`,
  },
  {
    heading: "6. Cookies",
    text: `We use:\n• Necessary cookies (technical operation, no consent required)\n• Analytics cookies (only with your consent)\n\nYou can disable cookies in your browser at any time.`,
  },
  {
    heading: "7. Your Rights",
    text: `You have the right to: access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20), objection (Art. 21), and withdrawal of consent (Art. 7(3)).\n\nContact: info@staplero.com\n\nYou also have the right to lodge a complaint with the competent supervisory authority.`,
  },
  {
    heading: "8. Data Security",
    text: `We use technical and organizational measures (HTTPS encryption) to protect your data.`,
  },
];

const sections_uk = [
  {
    heading: "1. Відповідальна особа",
    text: `Відповідальна особа відповідно до GDPR:\n\nSTAPLERO – Власник: Богдан Кутко\nJakobstr. 13, 02826 Görlitz, Німеччина\nEmail: info@staplero.com`,
  },
  {
    heading: "2. Зібрані дані",
    text: `Ми збираємо:\n• Реєстрація: ім'я, email, пароль (зашифрований)\n• Бронювання курсу: ім'я, адреса, телефон, email, дата народження\n• Оплата: платіжні дані через Stripe (повні дані картки не зберігаємо)\n• Використання сайту: анонімна IP-адреса, тип браузера, відвідані сторінки`,
  },
  {
    heading: "3. Правові підстави",
    text: `• Ст. 6(1)(b) GDPR – виконання договору\n• Ст. 6(1)(c) GDPR – правові зобов'язання\n• Ст. 6(1)(f) GDPR – законні інтереси\n• Ст. 6(1)(a) GDPR – згода`,
  },
  {
    heading: "4. Строки зберігання",
    text: `Дані зберігаються лише до тих пір, поки це необхідно. Бухгалтерські дані зберігаються 10 років.`,
  },
  {
    heading: "5. Передача третім особам",
    text: `Передача лише:\n• Stripe Inc. (обробка платежів, EU-US Data Privacy Framework)\n• Постачальникам email для підтверджень бронювання\n• Державним органам за законної необхідності\n\nПередача для рекламних цілей не здійснюється.`,
  },
  {
    heading: "6. Файли cookie",
    text: `Ми використовуємо:\n• Необхідні cookie (технічна робота сайту, без згоди)\n• Аналітичні cookie (лише за вашою згодою)\n\nВи можете вимкнути cookie у браузері будь-коли.`,
  },
  {
    heading: "7. Ваші права",
    text: `Ви маєте право на: доступ (ст. 15), виправлення (ст. 16), видалення (ст. 17), обмеження (ст. 18), перенесення даних (ст. 20), заперечення (ст. 21), відкликання згоди (ст. 7(3)).\n\nКонтакт: info@staplero.com`,
  },
  {
    heading: "8. Безпека даних",
    text: `Ми застосовуємо технічні та організаційні заходи (HTTPS-шифрування) для захисту ваших даних.`,
  },
];

const sections_pl = [
  {
    heading: "1. Administrator danych",
    text: `Administratorem danych zgodnie z RODO jest:\n\nSTAPLERO – Właściciel: Bohdan Kutko\nJakobstr. 13, 02826 Görlitz, Niemcy\nE-mail: info@staplero.com`,
  },
  {
    heading: "2. Gromadzone dane",
    text: `Gromadzimy:\n• Rejestracja: imię i nazwisko, e-mail, hasło (szyfrowane)\n• Rezerwacja kursu: imię, nazwisko, adres, telefon, e-mail, data urodzenia\n• Płatność: dane płatnicze przez Stripe (nie przechowujemy pełnych danych karty)\n• Korzystanie z serwisu: anonimowe IP, typ przeglądarki, odwiedzone strony`,
  },
  {
    heading: "3. Podstawy prawne",
    text: `• Art. 6(1)(b) RODO – wykonanie umowy\n• Art. 6(1)(c) RODO – obowiązki prawne\n• Art. 6(1)(f) RODO – prawnie uzasadnione interesy\n• Art. 6(1)(a) RODO – zgoda`,
  },
  {
    heading: "4. Okres przechowywania",
    text: `Dane przechowywane są tylko przez czas niezbędny. Dane księgowe przechowywane są przez 10 lat zgodnie z przepisami prawa.`,
  },
  {
    heading: "5. Przekazywanie danych osobom trzecim",
    text: `Przekazywanie wyłącznie do:\n• Stripe Inc. (obsługa płatności, EU-US Data Privacy Framework)\n• Dostawców e-mail do wysyłki potwierdzeń rezerwacji\n• Organów publicznych w przypadku obowiązku prawnego\n\nBrak przekazywania danych w celach marketingowych.`,
  },
  {
    heading: "6. Pliki cookie",
    text: `Używamy:\n• Niezbędnych plików cookie (działanie techniczne strony, bez zgody)\n• Analitycznych plików cookie (wyłącznie za Twoją zgodą)\n\nMożesz wyłączyć pliki cookie w przeglądarce w dowolnym momencie.`,
  },
  {
    heading: "7. Twoje prawa",
    text: `Przysługuje Ci prawo do: dostępu (art. 15), sprostowania (art. 16), usunięcia (art. 17), ograniczenia (art. 18), przenoszenia (art. 20), sprzeciwu (art. 21), cofnięcia zgody (art. 7 ust. 3).\n\nKontakt: info@staplero.com\n\nPrzysługuje Ci prawo do wniesienia skargi do organu nadzorczego.`,
  },
  {
    heading: "8. Bezpieczeństwo danych",
    text: `Stosujemy techniczne i organizacyjne środki bezpieczeństwa (szyfrowanie HTTPS) w celu ochrony Twoich danych.`,
  },
];

const allContent: Record<string, { title: string; lastUpdated: string; sections: { heading: string; text: string }[] }> = {
  de: { title: "Datenschutzerklärung", lastUpdated: "Stand: Januar 2025", sections: sections_de },
  en: { title: "Privacy Policy", lastUpdated: "As of: January 2025", sections: sections_en },
  uk: { title: "Політика конфіденційності", lastUpdated: "Станом на: січень 2025", sections: sections_uk },
  pl: { title: "Polityka prywatności", lastUpdated: "Stan na: styczeń 2025", sections: sections_pl },
};

const Datenschutz = () => {
  const { language } = useLanguage();
  const lang = language in allContent ? language : "de";
  const c = allContent[lang];

  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{c.title}</h1>
            <p className="text-muted-foreground text-sm">{c.lastUpdated}</p>
          </div>
          <div className="space-y-8">
            {c.sections.map((section, idx) => (
                <section key={idx}>
                  <h2 className="text-xl font-semibold text-foreground mb-3">{section.heading}</h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.text}
                  </div>
                </section>
            ))}
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Datenschutz;