import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { schemes } from '@/data/schemes';
import Card from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { findSchemeById, localizeScheme, localizeCategory, eligibilityBounds } from '@/utils/schemeLocale';

const CompareSchemes = () => {
  const { t, language } = useLanguage();
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const a = findSchemeById(idA);
  const b = findSchemeById(idB);
  const locA = localizeScheme(a, language);
  const locB = localizeScheme(b, language);

  const options = schemes.map((s) => (
    <option key={s.id} value={s.id}>{localizeScheme(s, language).displayName}</option>
  ));

  const rulesA = a ? eligibilityBounds(a.eligibilityRules) : null;
  const rulesB = b ? eligibilityBounds(b.eligibilityRules) : null;

  const Row = ({ label, left, right }) => (
    <div className="py-3 border-b border-gray-100 text-sm">
      {/* Label */}
      <p className="font-semibold text-gray-400 text-xs uppercase tracking-wide mb-2">{label}</p>
      {/* Values: side by side on sm+, stacked on xs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-gray-800 min-w-0 break-words">{left}</div>
        <div className="text-gray-800 min-w-0 break-words">{right}</div>
      </div>
    </div>
  );

  const list = (items) => (
    <ul className="space-y-1">
      {(items || []).slice(0, 4).map((item, i) => <li key={i}>• {item}</li>)}
    </ul>
  );

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('compare.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('compare.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={idA} onChange={(e) => setIdA(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200">
          <option value="">{t('compare.pickA')}</option>
          {options}
        </select>
        <select value={idB} onChange={(e) => setIdB(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200">
          <option value="">{t('compare.pickB')}</option>
          {options}
        </select>
      </div>

      {(!a || !b || a.id === b.id) ? (
        <Card>
          <p className="text-center py-10 text-gray-500">{t('compare.chooseBoth')}</p>
        </Card>
      ) : (
        <Card>
          {/* Scheme name header */}
          <div className="grid grid-cols-2 gap-3 pb-3 mb-1 border-b border-gray-200">
            <Link to={`/schemes/${a.id}`} className="font-bold text-primary-700 hover:underline text-sm break-words">{locA.displayName}</Link>
            <Link to={`/schemes/${b.id}`} className="font-bold text-primary-700 hover:underline text-sm break-words">{locB.displayName}</Link>
          </div>
          <Row label={t('compare.vs')} left={localizeCategory(a.category, t)} right={localizeCategory(b.category, t)} />
          <Row label={t('compare.benefits')} left={list(locA.displayBenefits)} right={list(locB.displayBenefits)} />
          <Row label={t('compare.documents')} left={`${(a.requiredDocuments || []).length}`} right={`${(b.requiredDocuments || []).length}`} />
          <Row label={t('compare.steps')} left={`${(a.applicationSteps || []).length}`} right={`${(b.applicationSteps || []).length}`} />
          <Row
            label={t('compare.eligibility')}
            left={`${rulesA.minAge}–${rulesA.maxAge} ${t('schemeDetail.years')}`}
            right={`${rulesB.minAge}–${rulesB.maxAge} ${t('schemeDetail.years')}`}
          />
          <Row
            label={t('compare.official')}
            left={a.officialSource ? <a className="text-primary-600 underline" href={a.officialSource} target="_blank" rel="noreferrer">{t('dashboard.officialSite')}</a> : '—'}
            right={b.officialSource ? <a className="text-primary-600 underline" href={b.officialSource} target="_blank" rel="noreferrer">{t('dashboard.officialSite')}</a> : '—'}
          />
        </Card>
      )}
    </div>
  );
};

export default CompareSchemes;
