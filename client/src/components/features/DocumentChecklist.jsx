import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';

const DocumentChecklist = ({
  docs = [],
  haveIds = [],
  onToggle,
}) => {
  const { t } = useLanguage();
  const haveSet = new Set(haveIds);
  const haveCount = docs.filter((d) => haveSet.has(d.id)).length;
  const missing = docs.filter((d) => !haveSet.has(d.id));

  const nameOf = (doc) => {
    const translated = t(`docNames.${doc.id}`);
    if (translated && !translated.startsWith('docNames.')) return translated;
    return doc.name || doc.requiredLabel || doc.id;
  };

  const howTo = (doc) => {
    const translated = t(`docHowTo.${doc.id}`);
    if (translated && !translated.startsWith('docHowTo.')) return translated;
    return t('docsChecklist.howToGet');
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">{t('docsChecklist.status')}</h3>
          <p className="text-sm text-gray-600">{t('docsChecklist.ofUploaded', { have: haveCount, total: docs.length })}</p>
          <p className="text-xs text-gray-500 mt-1">{t('docsChecklist.markHave')}</p>
        </div>

        <div className="space-y-3">
          {docs.map((doc, i) => {
            const have = haveSet.has(doc.id);
            return (
              <motion.button
                type="button"
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onToggle?.(doc.id)}
                className={`w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all ${
                  have ? 'bg-green-50/70 border-green-200' : 'bg-white border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {have
                    ? <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    : <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{nameOf(doc)}</p>
                    <p className="text-xs text-gray-500">{have ? t('docsChecklist.haveIt') : t('docsChecklist.missing')}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {missing.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t('docsChecklist.howToGet')}</h3>
          <div className="space-y-4">
            {missing.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{nameOf(doc)}</p>
                    <p className="text-sm text-gray-600 mt-1">{howTo(doc)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DocumentChecklist;
