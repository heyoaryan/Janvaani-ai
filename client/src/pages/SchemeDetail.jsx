import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, FileText, Sparkles, Bookmark } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  findSchemeById,
  localizeScheme,
  localizeCategory,
  eligibilityBounds,
} from '@/utils/schemeLocale';
import { isSchemeSaved, toggleSavedScheme } from '@/utils/savedSchemes';

const SchemeDetail = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const scheme = findSchemeById(id);
  const [activeTab, setActiveTab] = useState('overview');
  const [saved, setSaved] = useState(() => isSchemeSaved(id));

  useEffect(() => {
    setSaved(isSchemeSaved(id));
  }, [id]);

  if (!scheme) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{t('schemeDetail.notFound')}</p>
        <Link to="/schemes">
          <Button variant="outline" icon={ArrowLeft}>{t('schemeDetail.backToSchemes')}</Button>
        </Link>
      </div>
    );
  }

  const localized = localizeScheme(scheme, language);
  const rules = eligibilityBounds(scheme.eligibilityRules);
  const tabs = [
    { id: 'overview', label: t('schemeDetail.overview') },
    { id: 'eligibility', label: t('schemeDetail.eligibilityTab') },
    { id: 'documents', label: t('schemeDetail.documentsTab') },
    { id: 'apply', label: t('schemeDetail.howToApply') },
  ];

  return (
    <div className="space-y-6 px-4 py-4">
      <Link
        to="/schemes"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('schemeDetail.backToSchemes')}
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <Badge variant="neutral" className="mb-3 capitalize">
                {localizeCategory(scheme.category, t)}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{localized.displayName}</h1>
              <p className="text-gray-600">{localized.displayDescription}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Button
                variant={saved ? 'primary' : 'outline'}
                className="w-full sm:w-auto"
                icon={Bookmark}
                onClick={() => setSaved(toggleSavedScheme(scheme.id))}
              >
                {saved ? t('forYou.saved') : t('forYou.save')}
              </Button>
              <Link to={`/eligibility?scheme=${scheme.id}`}>
                <Button variant="primary" className="w-full sm:w-auto">{t('schemeFinder.checkEligibility')}</Button>
              </Link>
              <Link to={`/missing-docs?scheme=${scheme.id}`}>
                <Button variant="outline" icon={FileText} className="w-full sm:w-auto">{t('schemeDetail.missingDocs')}</Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{t('schemeDetail.about')}</h3>
              <p className="text-gray-700 leading-relaxed">{localized.displayDescription}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">{t('schemeDetail.benefits')}</p>
                  <ul className="space-y-1">
                    {(localized.displayBenefits || []).map((benefit, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">{t('schemeDetail.details')}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('schemeDetail.state')}</span>
                      <span className="font-medium text-gray-900">{scheme.state}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('schemeDetail.documents')}</span>
                      <span className="font-medium text-gray-900">{scheme.requiredDocuments.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('schemeDetail.steps')}</span>
                      <span className="font-medium text-gray-900">{scheme.applicationSteps.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{t('schemeDetail.eligibilityCriteria')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: t('schemeDetail.minAge'), value: `${rules.minAge} ${t('schemeDetail.years')}` },
                  { label: t('schemeDetail.maxAge'), value: `${rules.maxAge} ${t('schemeDetail.years')}` },
                  { label: t('schemeDetail.incomeLimit'), value: rules.incomeLimit ? `₹${Number(rules.incomeLimit).toLocaleString('en-IN')}` : t('schemeDetail.noLimit') },
                  { label: t('schemeDetail.gender'), value: (rules.gender || []).join(', ') },
                  { label: t('schemeDetail.studentRequired'), value: rules.studentRequired ? t('schemeDetail.yes') : t('schemeDetail.no') },
                  { label: t('schemeDetail.farmerRequired'), value: rules.farmerRequired ? t('schemeDetail.yes') : t('schemeDetail.no') },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{t('schemeDetail.requiredDocuments')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.requiredDocuments.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-gray-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'apply' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{t('schemeDetail.applicationSteps')}</h3>
              <div className="space-y-3">
                {(localized.displaySteps || []).map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
              {scheme.officialSource && (
                <a
                  href={scheme.officialSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('schemeDetail.visitOfficial')} <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default SchemeDetail;
