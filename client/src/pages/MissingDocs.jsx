import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { schemes, documents } from '@/data/schemes';
import Card from '@/components/ui/Card';
import DocumentChecklist from '@/components/features/DocumentChecklist';
import { useLanguage } from '@/contexts/LanguageContext';
import { findSchemeById, localizeScheme } from '@/utils/schemeLocale';
import { docsForScheme, getHaveDocIds, toggleHaveDoc } from '@/utils/docCatalog';

const MissingDocs = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [selectedSchemeId, setSelectedSchemeId] = useState(searchParams.get('scheme') || '');
  const [haveIds, setHaveIds] = useState(getHaveDocIds);

  useEffect(() => {
    const fromQuery = searchParams.get('scheme');
    if (fromQuery) setSelectedSchemeId(fromQuery);
  }, [searchParams]);

  const selectedScheme = findSchemeById(selectedSchemeId);
  const docs = useMemo(
    () => (selectedScheme ? docsForScheme(selectedScheme, documents) : []),
    [selectedScheme],
  );

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <Link to="/schemes" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2">
          <ArrowLeft className="w-4 h-4" />
          {t('nav.schemes')}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('nav.missingDocs')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('schemeDetail.requiredDocuments')}</p>
      </div>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('schemeFinder.schemes')}</label>
        <select
          value={selectedSchemeId}
          onChange={(e) => setSelectedSchemeId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{t('docsChecklist.selectScheme')}</option>
          {schemes.map((scheme) => (
            <option key={scheme.id} value={scheme.id}>{localizeScheme(scheme, language).displayName}</option>
          ))}
        </select>
      </Card>

      {selectedScheme && (
        <DocumentChecklist
          docs={docs}
          haveIds={haveIds}
          onToggle={(id) => setHaveIds(toggleHaveDoc(id))}
        />
      )}

      {!selectedScheme && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{t('docsChecklist.selectScheme')}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MissingDocs;
