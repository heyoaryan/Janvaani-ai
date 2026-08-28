import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { schemes } from '@/data/schemes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import EligibilityResult from '@/components/features/EligibilityResult';
import { findSchemeById, localizeScheme, evaluateSchemeEligibility } from '@/utils/schemeLocale';
import { INDIAN_STATES, normalizeState } from '@/data/indianStates';

const EligibilityChecker = () => {
  const { t, language } = useLanguage();
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedSchemeId, setSelectedSchemeId] = useState(searchParams.get('scheme') || '');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fromQuery = searchParams.get('scheme');
    if (fromQuery) setSelectedSchemeId(fromQuery);
  }, [searchParams]);

  const handleCheck = () => {
    if (!selectedSchemeId) return;
    const scheme = findSchemeById(selectedSchemeId);
    if (!scheme) return;
    setIsChecking(true);
    setResult(null);
    try {
      const result = evaluateSchemeEligibility(scheme, user, t, language);
      setResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('eligibility.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('eligibility.subtitle')}</p>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">{t('eligibility.yourProfile')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('eligibility.age')}</label>
            <input
              type="number"
              value={user.age || ''}
              onChange={(e) => updateUser({ age: parseInt(e.target.value, 10) || '' })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('eligibility.gender')}</label>
            <select
              value={user.gender || 'male'}
              onChange={(e) => updateUser({ gender: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="male">{t('eligibility.male')}</option>
              <option value="female">{t('eligibility.female')}</option>
              <option value="other">{t('eligibility.other')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('eligibility.state')}</label>
            <select
              value={normalizeState(user.state) || ''}
              onChange={(e) => updateUser({ state: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('schemeFinder.allLocations')}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.id} value={s.id}>{t(`states.${s.id}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('eligibility.occupation')}</label>
            <select
              value={['student', 'farmer', 'business', 'employed', 'unemployed', 'self-employed', 'selfEmployed', 'homemaker', 'retired', 'other'].includes(user.occupation) ? (user.occupation === 'selfEmployed' ? 'self-employed' : user.occupation) : (user.occupation || 'student')}
              onChange={(e) => updateUser({ occupation: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="student">{t('onboarding.occupations.student')}</option>
              <option value="farmer">{t('onboarding.occupations.farmer')}</option>
              <option value="business">{t('onboarding.occupations.business')}</option>
              <option value="employed">{t('onboarding.occupations.employed')}</option>
              <option value="unemployed">{t('onboarding.occupations.unemployed')}</option>
              <option value="self-employed">{t('onboarding.occupations.selfEmployed')}</option>
              <option value="homemaker">{t('onboarding.occupations.homemaker')}</option>
              <option value="retired">{t('onboarding.occupations.retired')}</option>
              <option value="other">{t('onboarding.occupations.other')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('eligibility.annualIncome')}</label>
            <input
              type="number"
              value={user.income || ''}
              onChange={(e) => updateUser({ income: parseInt(e.target.value, 10) || '' })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('schemeFinder.schemes')}</label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('schemeFinder.searchPlaceholder')}</option>
              {schemes.map((scheme) => (
                <option key={scheme.id} value={scheme.id}>{localizeScheme(scheme, language).displayName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleCheck} loading={isChecking} className="w-full sm:w-auto">
            {isChecking ? t('eligibility.checking') : t('eligibility.checkEligibility')}
          </Button>
        </div>
      </Card>

      {isChecking && (
        <Card>
          <div className="flex items-center justify-center gap-2 py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
            />
            <span className="text-gray-600">{t('eligibility.checking')}</span>
          </div>
        </Card>
      )}

      {result && (
        <EligibilityResult
          score={result.score}
          criteria={result.criteria}
          whyQualify={result.whyQualify}
          whyNotQualify={result.whyNotQualify}
          schemeName={result.schemeName}
          onCheckAgain={handleCheck}
        />
      )}
    </div>
  );
};

export default EligibilityChecker;
