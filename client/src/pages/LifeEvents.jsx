import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Briefcase, Baby, Home, Tractor, Rocket, Heart,
  User, BookOpen, HeartPulse, Wrench, PiggyBank, Star, Users,
  UserCheck, Accessibility, X, ChevronRight, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { lifeEvents, schemes } from '@/data/schemes';
import { localizeScheme, localizeCategory } from '@/utils/schemeLocale';
import FollowUpInput from '@/components/voice/FollowUpInput';

const iconMap = {
  GraduationCap, Briefcase, Baby, Home, Tractor, Rocket, Heart,
  User, BookOpen, HeartPulse, Wrench, PiggyBank, Star, Users,
  UserCheck, Accessibility,
};

// Colour palette cycled by event index
const PALETTES = [
  { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    ring: 'ring-blue-200' },
  { bg: 'bg-purple-50',  icon: 'bg-purple-100 text-purple-600', ring: 'ring-purple-200' },
  { bg: 'bg-green-50',   icon: 'bg-green-100 text-green-600',   ring: 'ring-green-200' },
  { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',   ring: 'ring-amber-200' },
  { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',     ring: 'ring-rose-200' },
  { bg: 'bg-teal-50',    icon: 'bg-teal-100 text-teal-600',     ring: 'ring-teal-200' },
  { bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-600', ring: 'ring-indigo-200' },
  { bg: 'bg-orange-50',  icon: 'bg-orange-100 text-orange-600', ring: 'ring-orange-200' },
];

const LifeEvents = () => {
  const { t, language } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const relatedSchemes = selectedEvent
    ? schemes.filter(s => selectedEvent.schemes.includes(s.id))
        .map(s => localizeScheme(s, language))
    : [];

  const openEvent = (event) => setSelectedEvent(event);
  const closeModal = () => setSelectedEvent(null);

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('lifeEvents.title')}</h1>
        <p className="text-gray-600 text-sm sm:text-base">{t('lifeEvents.subtitle')}</p>
      </div>

      {/* Event grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {lifeEvents.map((event, i) => {
          const palette = PALETTES[i % PALETTES.length];
          const Icon = iconMap[event.icon] || GraduationCap;
          const title = language === 'hi-IN' && event.nameHi ? event.nameHi : event.name;

          return (
            <motion.button
              key={event.id}
              onClick={() => openEvent(event)}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`${palette.bg} rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 cursor-pointer ring-1 ${palette.ring} ring-opacity-50 hover:ring-2 transition-all duration-200 w-full`}
            >
              <div className={`w-12 h-12 rounded-xl ${palette.icon} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">{title}</p>
              {language !== 'hi-IN' && event.nameHi && (
                <p className="text-[10px] text-gray-500 leading-snug">{event.nameHi}</p>
              )}
              <span className="text-[11px] font-medium text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                {event.schemes.length} {t('schemeFinder.schemes') || 'schemes'}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-x-3 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            >
              {/* Modal header */}
              {(() => {
                const idx = lifeEvents.findIndex(e => e.id === selectedEvent.id);
                const palette = PALETTES[idx % PALETTES.length];
                const Icon = iconMap[selectedEvent.icon] || GraduationCap;
                const title = language === 'hi-IN' && selectedEvent.nameHi ? selectedEvent.nameHi : selectedEvent.name;

                return (
                  <div className={`${palette.bg} px-5 py-5 flex items-start justify-between gap-4 rounded-t-3xl`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${palette.icon} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-600 mt-0.5">{selectedEvent.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-600 flex-shrink-0 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}

              {/* Modal body */}
              <div className="px-5 py-5 space-y-4">
                {relatedSchemes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">{t('schemeFinder.noSchemesFound')}</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {relatedSchemes.length} {t('lifeEvents.schemesForEvent') || 'schemes for this life event'}
                    </p>
                    {relatedSchemes.map((scheme) => (
                      <motion.div
                        key={scheme.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                      >
                        {/* Scheme header */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold text-primary-200 uppercase tracking-wide">
                              {localizeCategory(scheme.category, t)}
                            </span>
                            <h3 className="text-sm font-bold text-white truncate mt-0.5">
                              {scheme.displayName || scheme.name}
                            </h3>
                          </div>
                        </div>
                        {/* Scheme body */}
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {scheme.displayDescription || scheme.description}
                          </p>
                          {(scheme.displayBenefits || scheme.benefits)?.slice(0, 2).map((b, bi) => (
                            <div key={bi} className="flex items-start gap-1.5">
                              <span className="text-green-500 text-xs mt-0.5 flex-shrink-0">✓</span>
                              <span className="text-xs text-green-800">{b}</span>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-1">
                            <Link
                              to={`/schemes/${scheme.id}`}
                              onClick={closeModal}
                              className="flex-1 text-center px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                            >
                              {t('schemeFinder.viewDetails')}
                            </Link>
                            <Link
                              to={`/eligibility?scheme=${scheme.id}`}
                              onClick={closeModal}
                              className="flex-1 text-center px-3 py-2 rounded-xl border border-primary-300 text-primary-600 text-xs font-semibold hover:bg-primary-50 transition-colors"
                            >
                              {t('schemeFinder.checkEligibility')}
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Follow-up for this life event */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">
                    {t('followUp.askFollowUp') || 'Ask a follow-up about these schemes'}
                  </p>
                  <FollowUpInput onAnswer={() => {}} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LifeEvents;
