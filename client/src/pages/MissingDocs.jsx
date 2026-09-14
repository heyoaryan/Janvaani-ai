import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, FileSearch, Trash2 } from 'lucide-react';
import { schemes, documents } from '@/data/schemes';
import Card from '@/components/ui/Card';
import DocumentChecklist from '@/components/features/DocumentChecklist';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { findSchemeById, localizeScheme } from '@/utils/schemeLocale';
import {
  docsForScheme,
  getHaveDocIdsForScheme,
  toggleHaveDocForScheme,
  clearAllDocData,
} from '@/utils/docCatalog';

const MissingDocs = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedSchemeId, setSelectedSchemeId] = useState(searchParams.get('scheme') || '');

  // haveIds is always fresh from per-scheme storage — never bleeds across schemes
  const [haveIds, setHaveIds] = useState(() => getHaveDocIdsForScheme(searchParams.get('scheme') || ''));

  // When scheme changes: reload haveIds for the new scheme (starts empty if first visit)
  useEffect(() => {
    setHaveIds(getHaveDocIdsForScheme(selectedSchemeId));
  }, [selectedSchemeId]);

  // Keep in sync if URL param changes (e.g. navigated from a scheme card)
  useEffect(() => {
    const fromQuery = searchParams.get('scheme');
    if (fromQuery) setSelectedSchemeId(fromQuery);
  }, [searchParams]);

  const selectedScheme = findSchemeById(selectedSchemeId);

  const localizedScheme = useMemo(
    () => (selectedScheme ? localizeScheme(selectedScheme, language) : null),
    [selectedScheme, language],
  );

  const docs = useMemo(
    () => (selectedScheme ? docsForScheme(selectedScheme, documents) : []),
    [selectedScheme],
  );

  const schemeNameEn = localizedScheme?.displayName || selectedScheme?.name || '';
  const schemeNameHi = selectedScheme?.nameHi || localizedScheme?.displayName || '';

  const [clearKey, setClearKey] = useState(0); // forces remount after clear

  const handleToggle = (id) => {
    setHaveIds(toggleHaveDocForScheme(selectedSchemeId, id));
  };

  const handleClear = () => {
    clearAllDocData();
    setHaveIds([]);
    setClearKey(k => k + 1);
  };

  return (
    <div className="space-y-6 px-4 py-4 max-w-2xl mx-auto">
      {/* Page header */}
      <div>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.schemes')}
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {t('nav.missingDocs')}
            </h1>
            <p className="text-sm text-gray-500">
              {language === 'hi-IN'
                ? 'योजना चुनें, दस्तावेज़ अपलोड करें, सत्यापन करें'
                : 'Select a scheme, upload documents, get verified'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            title={language === 'hi-IN' ? 'सभी दस्तावेज़ डेटा साफ़ करें' : 'Clear all document data'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0 mt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {language === 'hi-IN' ? 'साफ़ करें' : 'Clear'}
            </span>
          </button>
        </div>
      </div>

      {/* Scheme picker */}
      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {language === 'hi-IN' ? 'योजना चुनें' : 'Select Scheme'}
        </label>
        <select
          value={selectedSchemeId}
          onChange={(e) => setSelectedSchemeId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
        >
          <option value="">{t('docsChecklist.selectScheme')}</option>
          {schemes.map((scheme) => (
            <option key={scheme.id} value={scheme.id}>
              {localizeScheme(scheme, language).displayName}
            </option>
          ))}
        </select>
      </Card>

      {/* Checklist — key={selectedSchemeId} forces full remount on scheme change,
          which also resets verifyState inside DocumentChecklist */}
      {selectedScheme ? (
        <DocumentChecklist
          key={`${selectedSchemeId}-${clearKey}`}
          schemeId={selectedSchemeId}
          schemeName={schemeNameEn}
          schemeNameHi={schemeNameHi}
          docs={docs}
          haveIds={haveIds}
          onToggle={handleToggle}
          profileName={user?.name || ''}
        />
      ) : (
        <Card>
          <div className="text-center py-14 flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-gray-100">
              <FileSearch className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {language === 'hi-IN'
                ? 'ऊपर से एक योजना चुनें'
                : 'Select a scheme above to see required documents'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MissingDocs;
