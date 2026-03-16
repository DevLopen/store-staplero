// frontend/src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, t } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Pobierz język z localStorage lub użyj domyślnego (niemiecki)
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'de';
  });

  // Zapisz do localStorage przy zmianie
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Helper function dla tłumaczeń
  const translate = (key: string) => t(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook do używania w komponentach
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
