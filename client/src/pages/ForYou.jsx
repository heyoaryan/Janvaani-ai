import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Bookmark, MapPin, User, Briefcase, ChevronRight, AlertCircle } from 'lucide-react';
import { schemes } from '@/data/schemes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import SchemeCard from '@/components/features/SchemeCard';
import Card from '@/components/ui/Card';
import { occupationLabel, recommendSchemes, localizeScheme } from '@/utils/schemeLocale';
import { toggleSavedScheme, isSchemeSaved } from '@/utils/savedSchemes';

// Reason tag colours
const REASON_COLORS = {
  age:        'bg-blue-50 text-blue-700',
  state:      'bg-green-50 text-green-700',
  farmer:     'bg-amber-50 text-amber-700',
  student:    'bg-purple-50 text-purple-700',
  Agriculture:'bg-amber-50 text-amber-700',
  Education:  'bg-blue-50 text-blue-700',
  Healthcare: 'bg-red-50 text-red-700',
  Employment: 'bg-indigo-50 text-indigo-700',
  Housing:    'bg-green-50 text-green-700',
  Business:   'bg-violet-50 text-violet-700',
  'Women Welfare': 'bg-rose-50 text-rose-700',
  'Senior Citizens': 'bg-gray-100 text-gray-700',
  Disability: 'bg-cyan-50 text-cyan-700',
};

const reasonLabel = (reason, t) => {
  const map = {
    age:     t('forYou.reasonAge')     || 'Age match',
    state:   t('forYou.reasonState')   || 'Your state',
    farmer:  t('forYou.reasonFarmer')  || 'Farmer',
    student: t('forYou.reasonStudent') || 'Student',
  };
  return map[reason] || reason;
};

const ForYou = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const ranked = useMemo(
    () => recommendSchemes(user, schemes),
    [user]
  );

  // Show schemes with score ≥ 30 first; fallback shows all
  const qualified = ranked.filter(s => s.matchPercentage >= 30);
  const displayed = showAll
    ? ranked.slice(0, 24)
    : (qualified.length >= 3 ? qualified.slice(0, 12) : ranked.slice(0, 12));

  const profileBits = [
    user.occupation ? { icon: Briefcase, label: occupationLabel(user.occupation, t) || user.occupation } : null,
    user.age        ? { icon: User,      label: `${user.age} ${t('forYou.years') || 'yrs'}` } : null,
    user.state      ? { icon: MapPin,    label: user.state } : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6 px-4 py-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {t('nav.forYou')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('forYou.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('forYou.subtitle')}</p>
      </div>

      {/* Profile summary pill */}
      {profileBits.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">{t('forYou.basedOn')}:</span>
          {profileBits.map((bit, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm text-xs font-semibold text-gray-700">
              <bit.icon className="w-3.5 h-3.5 text-primary-500" />
              {bit.label}
            </div>
          ))}
          <Link to="/onboarding" className="text-xs text-primary-600 hover:underline font-medium ml-1">
            {t('forYou.updateProfile') || 'Update profile →'}
          </Link>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{t('forYou.noProfile')}</p>
            <Link to="/onboarding" className="text-xs text-amber-700 underline font-medium">
              {t('forYou.updateProfile') || 'Complete your profile for better matches →'}
            </Link>
          </div>
        </div>
      )}

      {/* Results */}
      {displayed.length === 0 ? (
        <Card>
          <p className="text-center py-10 text-gray-500">{t('forYou.empty')}</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((scheme, idx) => {
              const loc = localizeScheme(scheme, language);
              const reasons = (scheme.reasons || []).slice(0, 3);
              const saved = isSchemeSaved(scheme.id);

              return (
                <motion.div
                  key={scheme.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="relative"
                >
                  {/* Save button */}
                  <button
                    type="button"
                    onClick={() => { toggleSavedScheme(scheme.id); bump(n => n + 1); }}
                    className={`absolute top-3 right-3 z-10 p-1.5 rounded-full shadow-sm transition-colors ${
                      saved ? 'bg-primary-600 text-white' : 'bg-white text-gray-400 hover:text-primary-600'
                    }`}
                    title={t('forYou.save')}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} />
                  </button>

                  {/* Card */}
                  <div
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/schemes/${scheme.id}`)}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
                      <div className="flex items-start justify-between gap-2 pr-7">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-primary-200 uppercase tracking-wide truncate">{scheme.category}</p>
                          <h3 className="text-sm font-bold text-white leading-snug mt-0.5 line-clamp-2">
                            {loc.displayName || loc.name}
                          </h3>
                        </div>
                        {scheme.matchPercentage > 0 && (
                          <span className="flex-shrink-0 text-xs font-bold text-white bg-white/25 px-2 py-0.5 rounded-full">
                            {scheme.matchPercentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-4 py-3 space-y-2.5">
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {loc.displayDescription || loc.description}
                      </p>

                      {/* Benefits */}
                      {(loc.displayBenefits || loc.benefits)?.slice(0, 2).map((b, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-green-500 text-xs flex-shrink-0 mt-0.5">✓</span>
                          <span className="text-xs text-green-800 line-clamp-1">{b}</span>
                        </div>
                      ))}

                      {/* Why this scheme tags */}
                      {reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {reasons.map((r, i) => (
                            <span
                              key={i}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${REASON_COLORS[r] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {reasonLabel(r, t)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          className="flex-1 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/schemes/${scheme.id}`); }}
                        >
                          {t('schemeFinder.viewDetails')}
                        </button>
                        <button
                          className="flex-1 px-3 py-1.5 rounded-xl border border-primary-300 text-primary-600 text-xs font-semibold hover:bg-primary-50 transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/eligibility?scheme=${scheme.id}`); }}
                        >
                          {t('schemeFinder.checkEligibility')}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Show more */}
          {!showAll && ranked.length > displayed.length && (
            <div className="text-center">
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                {t('forYou.showMore') || `Show all ${ranked.length} schemes`}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      <Link to="/schemes" className="inline-block text-sm font-semibold text-primary-600 hover:underline">
        {t('saved.browse')} →
      </Link>
    </div>
  );
};

export default ForYou;
