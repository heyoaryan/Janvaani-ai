import React from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            {t('footer.madeWith')} <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {t('footer.for')} {t('footer.citizens')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            © {new Date().getFullYear()} {t('appName')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
