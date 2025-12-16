import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'de' | 'en' | 'uk';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.benefits': 'Vorteile',
    'nav.pricing': 'Preise',
    'nav.myCourse': 'Mein Kurs',
    'nav.admin': 'Admin',
    'nav.login': 'Anmelden',
    'nav.logout': 'Abmelden',
    'nav.start': 'Jetzt starten',
    'nav.practicalCourse': 'Praxiskurs',
    
    // Practical course page
    'practical.title': 'Praktische Staplerfahrer-Ausbildung',
    'practical.subtitle': 'Werden Sie zum zertifizierten Staplerfahrer mit unserer professionellen Praxisausbildung',
    'practical.courseDetails': 'Kursdetails',
    'practical.duration': 'Kursdauer',
    'practical.durationText': '2 Tage praktische Ausbildung',
    'practical.certificate': 'Zertifikat',
    'practical.certificateText': 'Offizieller Staplerschein nach DGUV',
    'practical.included': 'Inklusive',
    'practical.includedText': 'Prüfungsgebühren, Unterlagen, Schutzausrüstung',
    'practical.faq': 'Häufige Fragen',
    'practical.selectLocation': 'Standort wählen',
    'practical.selectDate': 'Termin wählen',
    'practical.plasticCard': 'Plastikkarte (Bedienerausweis im Kartenformat)',
    'practical.plasticCardPrice': '+14,99 €',
    'practical.toPayment': 'Zur Zahlung',
    'practical.locationInactive': 'Demnächst verfügbar',
    'practical.price': 'Preis',
    'practical.perPerson': 'pro Person',
    
    // FAQ
    'faq.q1': 'Welche Voraussetzungen muss ich erfüllen?',
    'faq.a1': 'Sie müssen mindestens 18 Jahre alt sein, körperlich und geistig geeignet sein und unseren Theoriekurs erfolgreich abgeschlossen haben.',
    'faq.q2': 'Was muss ich zum Kurs mitbringen?',
    'faq.a2': 'Bitte bringen Sie einen gültigen Personalausweis oder Reisepass, festes Schuhwerk (Sicherheitsschuhe empfohlen) und wetterfeste Kleidung mit.',
    'faq.q3': 'Wie läuft die praktische Prüfung ab?',
    'faq.a3': 'Die Prüfung besteht aus einer praktischen Fahrübung mit verschiedenen Manövern wie Stapeln, Transportieren und sicherem Abstellen von Lasten.',
    'faq.q4': 'Was passiert, wenn ich die Prüfung nicht bestehe?',
    'faq.a4': 'Sie können die Prüfung wiederholen. Eine Wiederholungsprüfung ist gegen eine geringe Gebühr möglich.',
    
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.add': 'Hinzufügen',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.benefits': 'Benefits',
    'nav.pricing': 'Pricing',
    'nav.myCourse': 'My Course',
    'nav.admin': 'Admin',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.start': 'Get Started',
    'nav.practicalCourse': 'Practical Course',
    
    // Practical course page
    'practical.title': 'Practical Forklift Training',
    'practical.subtitle': 'Become a certified forklift operator with our professional hands-on training',
    'practical.courseDetails': 'Course Details',
    'practical.duration': 'Duration',
    'practical.durationText': '2 days practical training',
    'practical.certificate': 'Certificate',
    'practical.certificateText': 'Official forklift license according to DGUV',
    'practical.included': 'Included',
    'practical.includedText': 'Exam fees, materials, safety equipment',
    'practical.faq': 'Frequently Asked Questions',
    'practical.selectLocation': 'Select Location',
    'practical.selectDate': 'Select Date',
    'practical.plasticCard': 'Plastic Card (Operator ID in card format)',
    'practical.plasticCardPrice': '+€14.99',
    'practical.toPayment': 'Proceed to Payment',
    'practical.locationInactive': 'Coming Soon',
    'practical.price': 'Price',
    'practical.perPerson': 'per person',
    
    // FAQ
    'faq.q1': 'What are the requirements?',
    'faq.a1': 'You must be at least 18 years old, physically and mentally fit, and have successfully completed our theory course.',
    'faq.q2': 'What should I bring to the course?',
    'faq.a2': 'Please bring a valid ID or passport, sturdy footwear (safety shoes recommended), and weather-appropriate clothing.',
    'faq.q3': 'How does the practical exam work?',
    'faq.a3': 'The exam consists of practical driving exercises with various maneuvers such as stacking, transporting, and safely placing loads.',
    'faq.q4': 'What happens if I fail the exam?',
    'faq.a4': 'You can retake the exam. A retake is possible for a small fee.',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
  },
  uk: {
    // Navigation
    'nav.home': 'Головна',
    'nav.benefits': 'Переваги',
    'nav.pricing': 'Ціни',
    'nav.myCourse': 'Мій курс',
    'nav.admin': 'Адмін',
    'nav.login': 'Увійти',
    'nav.logout': 'Вийти',
    'nav.start': 'Почати',
    'nav.practicalCourse': 'Практичний курс',
    
    // Practical course page
    'practical.title': 'Практичне навчання водія навантажувача',
    'practical.subtitle': 'Станьте сертифікованим водієм навантажувача з нашим професійним практичним навчанням',
    'practical.courseDetails': 'Деталі курсу',
    'practical.duration': 'Тривалість',
    'practical.durationText': '2 дні практичного навчання',
    'practical.certificate': 'Сертифікат',
    'practical.certificateText': 'Офіційна ліцензія на навантажувач згідно з DGUV',
    'practical.included': 'Включено',
    'practical.includedText': 'Вартість іспиту, матеріали, захисне спорядження',
    'practical.faq': 'Часті питання',
    'practical.selectLocation': 'Виберіть місце',
    'practical.selectDate': 'Виберіть дату',
    'practical.plasticCard': 'Пластикова картка (посвідчення оператора у форматі картки)',
    'practical.plasticCardPrice': '+14,99 €',
    'practical.toPayment': 'До оплати',
    'practical.locationInactive': 'Незабаром',
    'practical.price': 'Ціна',
    'practical.perPerson': 'за особу',
    
    // FAQ
    'faq.q1': 'Які вимоги до участі?',
    'faq.a1': 'Вам має бути щонайменше 18 років, ви маєте бути фізично та психічно здоровими і успішно завершити наш теоретичний курс.',
    'faq.q2': 'Що потрібно взяти з собою на курс?',
    'faq.a2': 'Будь ласка, візьміть дійсний паспорт, міцне взуття (рекомендується захисне взуття) та одяг, відповідний погоді.',
    'faq.q3': 'Як проходить практичний іспит?',
    'faq.a3': 'Іспит складається з практичних вправ з водіння з різними маневрами, такими як штабелювання, транспортування та безпечне розміщення вантажів.',
    'faq.q4': 'Що буде, якщо я не здам іспит?',
    'faq.a4': 'Ви можете перескласти іспит. Повторна спроба можлива за невелику плату.',
    
    // Common
    'common.loading': 'Завантаження...',
    'common.error': 'Помилка',
    'common.success': 'Успіх',
    'common.save': 'Зберегти',
    'common.cancel': 'Скасувати',
    'common.delete': 'Видалити',
    'common.edit': 'Редагувати',
    'common.add': 'Додати',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'de';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
