import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Logo from '@/components/brand/Logo';

const Header = ({ onMenuToggle }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', labelHi: 'डैशबोर्ड' },
    { path: '/schemes', label: 'Schemes', labelHi: 'योजनाएं' },
    { path: '/eligibility', label: 'Eligibility', labelHi: 'पात्रता' },
    { path: '/documents', label: 'Documents', labelHi: 'दस्तावेज' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/dashboard" className="hidden lg:flex items-center gap-2.5">
              <Logo size={36} showText={false} />
              <div className="leading-tight">
                <h1 className="font-bold text-lg text-gray-900">JanVaani AI</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Government Services, In Your Voice</p>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {language === 'en' ? link.label : link.labelHi}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'English' : 'हिंदी'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
                  >
                    <button
                      onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm ${language === 'en' ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm ${language === 'hi' ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      हिंदी
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
