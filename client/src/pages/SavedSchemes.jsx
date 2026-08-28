import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { schemes } from '@/data/schemes';
import SchemeCard from '@/components/features/SchemeCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeScheme } from '@/utils/schemeLocale';
import { getSavedSchemeIds, toggleSavedScheme } from '@/utils/savedSchemes';

const SavedSchemes = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [ids, setIds] = useState(getSavedSchemeIds);

  useEffect(() => {
    const sync = () => setIds(getSavedSchemeIds());
    window.addEventListener('janvaani-saved-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('janvaani-saved-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const saved = ids.map((id) => schemes.find((s) => String(s.id) === String(id))).filter(Boolean);

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('saved.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('saved.subtitle')}</p>
      </div>

      {saved.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bookmark className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">{t('saved.empty')}</p>
            <Link to="/schemes">
              <Button>{t('saved.browse')}</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((scheme) => (
            <div key={scheme.id} className="relative">
              <button
                type="button"
                onClick={() => { toggleSavedScheme(scheme.id); setIds(getSavedSchemeIds()); }}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-primary-600 text-white shadow-sm"
              >
                <Bookmark className="w-4 h-4" fill="currentColor" />
              </button>
              <SchemeCard
                scheme={localizeScheme(scheme, language)}
                matchPercentage={0}
                onClick={() => navigate(`/schemes/${scheme.id}`)}
                onCheckEligibility={() => navigate(`/eligibility?scheme=${scheme.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSchemes;
