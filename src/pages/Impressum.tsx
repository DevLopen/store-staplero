import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const content = {
  de: {
    title: "Impressum",
    provider: "Angaben gemäß § 5 TMG",
    sections: [
      {
        heading: "Anbieter",
        lines: [
          "STAPLERO",
          "Inh. Bohdan Kutko",
          "Jakobstr. 13",
          "02826 Görlitz, Deutschland",
        ],
      },
      {
        heading: "Kontakt",
        lines: [
          "Telefon: +49 176 22067783",
          "Telefon: +49 160 92490070",
          "E-Mail: info@staplero.com",
          "Web: www.staplero.com",
        ],
      },
      {
        heading: "Umsatzsteuer-Identifikationsnummer",
        lines: [
          "USt-IdNr.: DE363749650",
          "(gemäß § 27a Umsatzsteuergesetz)",
        ],
      },
      {
        heading: "Aufsichtsbehörde / Berufsrechtliche Regelungen",
        lines: [
          "Die Ausbildungen werden gemäß DGUV Vorschrift 68 und DGUV Grundsatz 308-001 durchgeführt.",
        ],
      },
      {
        heading: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV",
        lines: [
          "Bohdan Kutko",
          "Jakobstr. 13, 02826 Görlitz",
        ],
      },
      {
        heading: "Online-Streitbeilegung",
        lines: [
          "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:",
          "https://ec.europa.eu/consumers/odr/",
          "Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
      {
        heading: "Haftungshinweis",
        lines: [
          "Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.",
        ],
      },
      {
        heading: "Website entwickelt von",
        lines: [
          "devlopen.pl – Professionelle Webentwicklung",
          "https://devlopen.pl",
        ],
        link: "https://devlopen.pl",
      },
    ],
  },
  en: {
    title: "Legal Notice / Imprint",
    provider: "Information pursuant to § 5 TMG (German Telemedia Act)",
    sections: [
      {
        heading: "Service Provider",
        lines: [
          "STAPLERO",
          "Owner: Bohdan Kutko",
          "Jakobstr. 13",
          "02826 Görlitz, Germany",
        ],
      },
      {
        heading: "Contact",
        lines: [
          "Phone: +49 176 22067783",
          "Phone: +49 160 92490070",
          "Email: info@staplero.com",
          "Web: www.staplero.com",
        ],
      },
      {
        heading: "VAT Identification Number",
        lines: [
          "VAT ID: DE363749650",
          "(pursuant to § 27a of the German VAT Act)",
        ],
      },
      {
        heading: "Regulatory Authority / Professional Regulations",
        lines: [
          "Training courses are conducted in accordance with DGUV Regulation 68 and DGUV Principle 308-001.",
        ],
      },
      {
        heading: "Responsible for Content pursuant to § 55 Para. 2 RStV",
        lines: [
          "Bohdan Kutko",
          "Jakobstr. 13, 02826 Görlitz",
        ],
      },
      {
        heading: "Online Dispute Resolution",
        lines: [
          "The European Commission provides a platform for online dispute resolution (ODR):",
          "https://ec.europa.eu/consumers/odr/",
          "We are neither obligated nor willing to participate in dispute resolution proceedings before a consumer arbitration board.",
        ],
      },
      {
        heading: "Liability Notice",
        lines: [
          "Despite careful content control, we assume no liability for the content of external links. The operators of linked pages are solely responsible for their content.",
        ],
      },
      {
        heading: "Website developed by",
        lines: [
          "devlopen.pl – Professional Web Development",
          "https://devlopen.pl",
        ],
        link: "https://devlopen.pl",
      },
    ],
  },
  uk: {
    title: "Вихідні дані",
    provider: "Відомості відповідно до § 5 TMG",
    sections: [
      {
        heading: "Постачальник послуг",
        lines: [
          "STAPLERO",
          "Власник: Богдан Кутко",
          "Jakobstr. 13",
          "02826 Görlitz, Німеччина",
        ],
      },
      {
        heading: "Контакт",
        lines: [
          "Телефон: +49 176 22067783",
          "Телефон: +49 160 92490070",
          "Електронна пошта: info@staplero.com",
          "Веб: www.staplero.com",
        ],
      },
      {
        heading: "Ідентифікаційний номер платника ПДВ",
        lines: [
          "ПДВ-ID: DE363749650",
          "(відповідно до § 27a Закону про ПДВ)",
        ],
      },
      {
        heading: "Наглядовий орган / Нормативні положення",
        lines: [
          "Навчання проводяться відповідно до DGUV Приписи 68 та DGUV Принципу 308-001.",
        ],
      },
      {
        heading: "Відповідальний за зміст відповідно до § 55 Абз. 2 RStV",
        lines: [
          "Богдан Кутко",
          "Jakobstr. 13, 02826 Görlitz",
        ],
      },
      {
        heading: "Онлайн-вирішення спорів",
        lines: [
          "Європейська Комісія надає платформу для онлайн-вирішення спорів (ODR):",
          "https://ec.europa.eu/consumers/odr/",
          "Ми не зобов'язані та не готові брати участь у процедурах вирішення спорів перед органом з вирішення споживчих спорів.",
        ],
      },
      {
        heading: "Застереження про відповідальність",
        lines: [
          "Незважаючи на ретельний контроль вмісту, ми не несемо відповідальності за вміст зовнішніх посилань. Оператори пов'язаних сторінок несуть виключну відповідальність за їх вміст.",
        ],
      },
      {
        heading: "Веб-сайт розроблений",
        lines: [
          "devlopen.pl – Професійна веб-розробка",
          "https://devlopen.pl",
        ],
        link: "https://devlopen.pl",
      },
    ],
  },
  pl: {
    title: "Impressum / Dane firmy",
    provider: "Dane zgodnie z § 5 TMG (niemieckie prawo mediów)",
    sections: [
      {
        heading: "Podmiot świadczący usługi",
        lines: [
          "STAPLERO",
          "Właściciel: Bohdan Kutko",
          "Jakobstr. 13",
          "02826 Görlitz, Niemcy",
        ],
      },
      {
        heading: "Kontakt",
        lines: [
          "Telefon: +49 176 22067783",
          "Telefon: +49 160 92490070",
          "E-mail: info@staplero.com",
          "Web: www.staplero.com",
        ],
      },
      {
        heading: "Numer identyfikacyjny VAT",
        lines: [
          "NIP DE: DE363749650",
          "(zgodnie z § 27a ustawy o podatku VAT)",
        ],
      },
      {
        heading: "Organ nadzoru / Regulacje prawne",
        lines: [
          "Szkolenia prowadzone są zgodnie z DGUV Przepis 68 i DGUV Zasada 308-001.",
        ],
      },
      {
        heading: "Odpowiedzialny za treść zgodnie z § 55 ust. 2 RStV",
        lines: [
          "Bohdan Kutko",
          "Jakobstr. 13, 02826 Görlitz",
        ],
      },
      {
        heading: "Platforma do rozwiązywania sporów online",
        lines: [
          "Komisja Europejska udostępnia platformę do internetowego rozstrzygania sporów (ODR):",
          "https://ec.europa.eu/consumers/odr/",
          "Nie jesteśmy zobowiązani ani skłonni do udziału w postępowaniach przed polubownym organem rozstrzygania sporów konsumenckich.",
        ],
      },
      {
        heading: "Zastrzeżenie odpowiedzialności",
        lines: [
          "Pomimo starannej kontroli treści nie ponosimy odpowiedzialności za zawartość zewnętrznych linków. Za treść podlinkowanych stron odpowiadają wyłącznie ich operatorzy.",
        ],
      },
      {
        heading: "Strona wykonana przez",
        lines: [
          "devlopen.pl – Profesjonalne tworzenie stron internetowych",
          "https://devlopen.pl",
        ],
        link: "https://devlopen.pl",
      },
    ],
  },
};

const Impressum = () => {
  const { language } = useLanguage();
  const lang = (language as keyof typeof content) in content ? (language as keyof typeof content) : "de";
  const c = content[lang];

  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{c.title}</h1>
            <p className="text-muted-foreground text-sm">{c.provider}</p>
          </div>

          <div className="space-y-8">
            {c.sections.map((section, idx) => (
                <section key={idx}>
                  <h2 className="text-xl font-semibold text-foreground mb-3">{section.heading}</h2>
                  <div className="text-muted-foreground leading-relaxed space-y-1">
                    {section.lines.map((line, lineIdx) => {
                      if (line.startsWith("https://") && section.link) {
                        return (
                            <p key={lineIdx}>
                              <a
                                  href={section.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                              >
                                {line}
                              </a>
                            </p>
                        );
                      }
                      return <p key={lineIdx}>{line}</p>;
                    })}
                  </div>
                </section>
            ))}
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Impressum;