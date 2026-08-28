import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CheckSquare,
  FileText,
  ClipboardList,
  Calendar,
  Shield,
  X,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { useLanguage } from '@/contexts/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
    { path: '/for-you', icon: Sparkles, key: 'nav.forYou' },
    { path: '/schemes', icon: Search, key: 'nav.schemes' },
    { path: '/compare', icon: ClipboardList, key: 'nav.compare' },
    { path: '/saved', icon: Bookmark, key: 'nav.saved' },
    { path: '/eligibility', icon: CheckSquare, key: 'nav.eligibility' },
    { path: '/missing-docs', icon: FileText, key: 'nav.missingDocs' },
    { path: '/life-events', icon: Calendar, key: 'nav.lifeEvents' },
    { path: '/scam-check', icon: Shield, key: 'nav.scamCheck' },
  ];

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white border-r border-gray-200 shadow-2xl lg:shadow-none lg:!translate-x-0 lg:z-30 lg:sticky lg:top-0 lg:h-[100dvh] overflow-hidden flex flex-col flex-shrink-0"
      >
        {/* Logo Section - Always visible */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-saffron-50">
          <Logo size={40} showText={false} />
          <div>
            <h2 className="font-bold text-lg text-gray-900">{t('appName')}</h2>
            <p className="text-xs text-gray-600">{t('appTagline')}</p>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={onClose} 
            className="ml-auto p-2 rounded-xl hover:bg-white transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-600'
                }`} />
                <span className="flex-1">{t(item.key)}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-2 h-2 rounded-full bg-white"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer badge */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary-50 to-saffron-50 border border-primary-100">
            <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-gray-700">
              {t('dashboard.badge')}
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
