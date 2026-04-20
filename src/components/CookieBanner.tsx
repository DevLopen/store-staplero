import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const text = {
  de: {
    message: "Wir verwenden notwendige Cookies für den technischen Betrieb der Website sowie – mit Ihrer Einwilligung – Analyse-Cookies zur Verbesserung unseres Angebots.",
    accept: "Alle akzeptieren",
    necessary: "Nur notwendige",
    privacy: "Datenschutz",
  },
  en: {
    message: "We use necessary cookies for the technical operation of the website and – with your consent – analytics cookies to improve our services.",
    accept: "Accept all",
    necessary: "Necessary only",
    privacy: "Privacy Policy",
  },
  uk: {
    message: "Ми використовуємо необхідні файли cookie для технічної роботи веб-сайту та – за вашою згодою – аналітичні cookie для покращення наших послуг.",
    accept: "Прийняти всі",
    necessary: "Лише необхідні",
    privacy: "Конфіденційність",
  },
  pl: {
    message: "Używamy niezbędnych plików cookie do technicznego działania strony oraz – za Twoją zgodą – analitycznych plików cookie w celu ulepszenia naszych usług.",
    accept: "Akceptuj wszystkie",
    necessary: "Tylko niezbędne",
    privacy: "Polityka prywatności",
  },
};

const COOKIE_KEY = "staplero_cookie_consent";

const CookieBanner = () => {
  const { language } = useLanguage();
  const lang = (language as keyof typeof text) in text ? (language as keyof typeof text) : "de";
  const t = text[lang];

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "all");
    setVisible(false);
  };

  const handleNecessary = () => {
    localStorage.setItem(COOKIE_KEY, "necessary");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-industrial border-t border-primary-foreground/20 shadow-2xl">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-primary-foreground/80 text-sm flex-1">
          {t.message}{" "}
          <Link to="/datenschutz" className="text-primary underline hover:no-underline" onClick={handleNecessary}>
            {t.privacy}
          </Link>
          .
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleNecessary}
            className="px-4 py-2 text-sm border border-primary-foreground/30 text-primary-foreground/70 rounded-lg hover:bg-primary-foreground/10 transition-colors"
          >
            {t.necessary}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
