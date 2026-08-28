import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getTranslation, LANGUAGES } from '@/i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Get initial language from localStorage or default to Hindi
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('janvaani_language');
    return saved || 'hi-IN';
  });

  // Persist language changes to localStorage
  useEffect(() => {
    localStorage.setItem('janvaani_language', language);
    // Set HTML lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((newLanguage) => {
    if (LANGUAGES.find(l => l.code === newLanguage)) {
      setLanguageState(newLanguage);
    }
  }, []);

  // Translation function
  const t = useCallback((key, params = {}) => {
    let translation = getTranslation(language, key);
    if (typeof translation !== 'string') return key;

    Object.keys(params).forEach((param) => {
      translation = translation.replaceAll(`{${param}}`, String(params[param]));
    });
    
    return translation;
  }, [language]);

  // Get current language object
  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
