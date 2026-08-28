import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Mic, SlidersHorizontal, X } from 'lucide-react';
import { schemes, categories } from '@/data/schemes';
import SchemeCard from '@/components/features/SchemeCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useVoice } from '@/contexts/VoiceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { categoryKey, schemeMatchesQuery, localizeCategory } from '@/utils/schemeLocale';
import { isSchemeForState, INDIAN_STATES, normalizeState } from '@/data/indianStates';
import { voiceApi } from '@/services/api';

const SchemeFinder = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [locationFilter, setLocationFilter] = useState('mine');
  const [showFilters, setShowFilters] = useState(false);
  const { isListening, transcript, interimTranscript, startListening, stopListening } = useVoice();

  React.useEffect(() => {
    if (transcript) setSearchQuery(transcript);
  }, [transcript]);

  const handleMic = async () => {
    if (isListening) {
      const blob = await stopListening();
      if (blob?.size) {
        try {
          const result = await voiceApi.transcribe(blob, language);
          if (result?.transcription?.trim()) setSearchQuery(result.transcription.trim());
        } catch {
          // Transcript from the browser STT remains in the search box.
        }
      }
    } else {
      startListening();
    }
  };

  const filteredSchemes = useMemo(() => {
    const userState = normalizeState(user.state);
    return schemes.filter((scheme) => {
      const matchesSearch = schemeMatchesQuery(scheme, searchQuery);
      const matchesCategory = selectedCategory === 'all'
        || categoryKey(scheme.category) === selectedCategory
        || scheme.category.toLowerCase() === selectedCategory.toLowerCase();
      let matchesLocation = true;
      if (locationFilter === 'mine' && userState) {
        matchesLocation = isSchemeForState(scheme, userState) !== false;
      } else if (locationFilter !== 'all' && locationFilter !== 'mine') {
        matchesLocation = isSchemeForState(scheme, locationFilter) !== false;
      }
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [searchQuery, selectedCategory, locationFilter, user.state]);

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('schemeFinder.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('schemeFinder.subtitle')}</p>
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('schemeFinder.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={isListening ? 'danger' : 'outline'}
              onClick={handleMic}
              icon={Mic}
              className="flex-1 sm:flex-none"
            >
              {isListening ? t('schemeFinder.stop') : t('schemeFinder.voice')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={SlidersHorizontal}
              className="flex-1 sm:flex-none"
            >
              {t('schemeFinder.filters')}
            </Button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <p className="text-sm font-medium text-gray-700 mb-2">{t('schemeFinder.filterByCategory')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('schemeFinder.all')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {localizeCategory(cat.name, t)}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-700 mt-4 mb-2">{t('schemeFinder.filterByState')}</p>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              <option value="mine">{t('schemeFinder.myState')}</option>
              <option value="all">{t('schemeFinder.allLocations')}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.id} value={s.id}>{t(`states.${s.id}`)}</option>
              ))}
            </select>
          </motion.div>
        )}
      </Card>

      <p className="text-sm text-gray-600">
        {t('schemeFinder.showing')} <span className="font-semibold text-gray-900">{filteredSchemes.length}</span> {t('schemeFinder.schemes')}
      </p>

      {isListening && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">{t('dashboard.listening')}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2 min-h-[24px]">
            {interimTranscript || transcript || t('dashboard.speakNow')}
          </p>
        </Card>
      )}

      {filteredSchemes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              matchPercentage={0}
              onClick={() => navigate(`/schemes/${scheme.id}`)}
              onCheckEligibility={() => navigate(`/eligibility?scheme=${scheme.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('schemeFinder.noSchemesFound')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            >
              {t('schemeFinder.clearFilters')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SchemeFinder;
