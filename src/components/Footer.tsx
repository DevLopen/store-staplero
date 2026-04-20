import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const footerText = {
  de: { quickLinks: "Schnelllinks", home: "Startseite", advantages: "Vorteile", prices: "Preise", contact: "Kontakt", hours: "Mo-Fr: 9:00 - 17:00 Uhr", rights: "Alle Rechte vorbehalten.", dev: "Website entwickelt von" },
  en: { quickLinks: "Quick Links", home: "Home", advantages: "Advantages", prices: "Prices", contact: "Contact", hours: "Mon-Fri: 9:00 - 17:00", rights: "All rights reserved.", dev: "Website developed by" },
  uk: { quickLinks: "Швидкі посилання", home: "Головна", advantages: "Переваги", prices: "Ціни", contact: "Контакт", hours: "Пн-Пт: 9:00 - 17:00", rights: "Всі права захищені.", dev: "Сайт розроблено" },
  pl: { quickLinks: "Szybkie linki", home: "Strona główna", advantages: "Zalety", prices: "Cennik", contact: "Kontakt", hours: "Pon-Pt: 9:00 - 17:00", rights: "Wszelkie prawa zastrzeżone.", dev: "Strona wykonana przez" },
};

const legalLinks = {
  de: { impressum: "Impressum", datenschutz: "Datenschutz", agb: "AGB" },
  en: { impressum: "Imprint", datenschutz: "Privacy Policy", agb: "Terms" },
  uk: { impressum: "Вихідні дані", datenschutz: "Конфіденційність", agb: "Умови" },
  pl: { impressum: "Impressum", datenschutz: "Polityka prywatności", agb: "Regulamin" },
};

const Footer = () => {
  const { language } = useLanguage();
  const lang = (language as keyof typeof footerText) in footerText ? (language as keyof typeof footerText) : "de";
  const t = footerText[lang];
  const l = legalLinks[lang];

  return (
    <footer className="bg-industrial text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">S</span>
              </div>
              <span className="font-display font-bold text-xl text-primary-foreground">
                Stapler<span className="text-primary">o</span>
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-sm">
              Ihre Online-Plattform für die theoretische Ausbildung zum Gabelstaplerfahrer.
              Lernen Sie flexibel und bereiten Sie sich optimal auf Ihre Prüfung vor.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">
              {t.quickLinks}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-primary-foreground/70 hover:text-primary text-sm transition-colors">
                  {t.home}
                </Link>
              </li>
              <li>
                <a href="/#features" className="text-primary-foreground/70 hover:text-primary text-sm transition-colors">
                  {t.advantages}
                </a>
              </li>
              <li>
                <a href="/#pricing" className="text-primary-foreground/70 hover:text-primary text-sm transition-colors">
                  {t.prices}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">
              {t.contact}
            </h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>info@staplero.com</li>
              <li>+49 176 22067783</li>
              <li>+49 160 92490070</li>
              <li>{t.hours}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-primary-foreground/50 text-sm">
              © 2025 Staplero. {t.rights}
            </p>
            <p className="text-primary-foreground/30 text-xs">
              {t.dev}{" "}
              <a
                href="https://devlopen.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary/60 transition-colors underline"
              >
                devlopen.pl
              </a>
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/impressum" className="text-primary-foreground/50 hover:text-primary transition-colors">
              {l.impressum}
            </Link>
            <Link to="/datenschutz" className="text-primary-foreground/50 hover:text-primary transition-colors">
              {l.datenschutz}
            </Link>
            <Link to="/agb" className="text-primary-foreground/50 hover:text-primary transition-colors">
              {l.agb}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
