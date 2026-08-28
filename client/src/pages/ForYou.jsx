import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bookmark } from 'lucide-react';
import { schemes } from '@/data/schemes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import SchemeCard from '@/components/features/SchemeCard';
import Card from '@/components/ui/Card';
import { occupationLabel, recommendSchemes, localizeScheme } from '@/utils/schemeLocale';
import { toggleSavedScheme, isSchemeSaved } from '@/utils/savedSchemes';
import { useNavigate } from 'react-router-dom';

const ForYou = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const ranked = useMemo(() => recommendSchemes(user, schemes).slice(0, 9), [user]);
  const [, bump] = React.useState(0);

  const profileBits = [
    occupationLabel(user.occupation, t),
    user.age ? `${user.age}` : '',
    user.state ? (t(`states.${user.state}`).startsWith('states.') ? user.state : t(`states.${user.state}`)) : '',
  ].filter((bit) => bit && bit !== '—');

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {t('nav.forYou')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('forYou.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('forYou.subtitle')}</p>
        {profileBits.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">{t('forYou.basedOn')}: {profileBits.join(' · ')}</p>
        )}
        {profileBits.length === 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3">{t('forYou.noProfile')}</p>
        )}
      </div>

      {ranked.length === 0 ? (
        <Card>
          <p className="text-center py-10 text-gray-500">{t('forYou.empty')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ranked.map((scheme) => (
            <div key={scheme.id} className="relative">
              <button
                type="button"
                onClick={() => { toggleSavedScheme(scheme.id); bump((n) => n + 1); }}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm ${isSchemeSaved(scheme.id) ? 'bg-primary-600 text-white' : 'bg-white text-gray-500'}`}
                title={t('forYou.save')}
              >
                <Bookmark className="w-4 h-4" fill={isSchemeSaved(scheme.id) ? 'currentColor' : 'none'} />
              </button>
              <SchemeCard
                scheme={localizeScheme(scheme, language)}
                matchPercentage={scheme.matchPercentage}
                onClick={() => navigate(`/schemes/${scheme.id}`)}
                onCheckEligibility={() => navigate(`/eligibility?scheme=${scheme.id}`)}
              />
            </div>
          ))}
        </div>
      )}

      <Link to="/schemes" className="inline-block text-sm font-semibold text-primary-600 hover:underline">
        {t('saved.browse')} →
      </Link>
    </div>
  );
};

export default ForYou;
