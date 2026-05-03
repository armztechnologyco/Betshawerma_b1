import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ variant = 'light' }) => {
  const { i18n } = useTranslation();

  const isDark = variant === 'dark';

  return (
    <div className={`flex rounded-xl p-1 backdrop-blur-md ${isDark ? 'bg-black/10' : 'bg-white/10'}`}>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-300 ${
          i18n.language === 'en' 
            ? 'bg-white text-orange-600 shadow-lg scale-105' 
            : 'text-white hover:bg-white/20'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage('ar')}
        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-300 ${
          i18n.language === 'ar' 
            ? 'bg-white text-orange-600 shadow-lg scale-105' 
            : 'text-white hover:bg-white/20'
        }`}
      >
        AR
      </button>
    </div>
  );
};

export default LanguageSwitcher;
