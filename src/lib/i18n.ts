import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';

// Always initialize with 'vi' so server and client first render match.
// The LanguageProvider reads localStorage after mount and calls i18n.changeLanguage().
i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
});

export default i18n;
