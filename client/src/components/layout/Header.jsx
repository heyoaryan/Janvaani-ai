import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Header = ({ onMenuToggle }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { language, setLanguage, t, currentLanguage, languages } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLangMenu && !e.target.closest('.language-menu-container')) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLangMenu]);

  const navLinks = [
    { path: '/dashboard', key: 'nav.dashboard' },
    { path: '/for-you', key: 'nav.forYou' },
    { path: '/schemes', key: 'nav.schemes' },
    { path: '/compare', key: 'nav.compare' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-transparent">
      {/* Centered container with margin from edges */}
      <div className="mx-4 lg:mx-8 my-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-2xl transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/95 backdrop-blur-lg shadow-lg border border-gray-200' 
              : 'bg-white border border-gray-200 shadow-md'
          }`}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Menu button (mobile) */}
              <div className="lg:hidden">
                <button
                  onClick={onMenuToggle}
                  className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* Center: Navigation Links — hidden on mobile (sidebar handles it) */}
              <nav className="hidden lg:flex items-center gap-2 mx-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      location.pathname === link.path
                        ? 'text-white bg-primary-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {t(link.key)}
                  </Link>
                ))}
              </nav>

              {/* Mobile: app name in center */}
              <span className="lg:hidden text-sm font-bold text-gray-900 mx-auto">{t('appName')}</span>

              {/* Right: Language Picker */}
              <div className="relative language-menu-container">
                <motion.button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    showLangMenu 
                      ? 'text-primary-700 bg-primary-50 ring-2 ring-primary-200' 
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="hidden sm:inline">{currentLanguage.name}</span>
                  <span className="sm:hidden text-lg">{currentLanguage.flag}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t('header.selectLanguage')}
                        </p>
                      </div>
                      <div className="py-1">
                        {languages.map((lang) => (
                          <motion.button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code);
                              setShowLangMenu(false);
                            }}
                            whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                              language === lang.code 
                                ? 'text-primary-700 bg-primary-50 font-semibold' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{lang.flag}</span>
                              <div className="text-left">
                                <p className="font-medium">{lang.name}</p>
                                <p className="text-xs text-gray-500">{lang.englishName}</p>
                              </div>
                            </div>
                            {language === lang.code && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
