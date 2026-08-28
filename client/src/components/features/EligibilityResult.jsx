import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

const EligibilityResult = ({
  score = 0,
  eligible = null,
  criteria = [],
  whyQualify = [],
  whyNotQualify = [],
  schemeName = '',
  onCheckAgain,
}) => {
  const { t } = useLanguage();
  const passCount   = criteria.filter((c) => c.status === 'pass').length;
  const failCount   = criteria.filter((c) => c.status === 'fail').length;
  const warningCount = criteria.filter((c) => c.status === 'warning').length;

  // eligible prop (boolean) is the source of truth; fall back to no-fail heuristic
  const isEligible     = eligible !== null ? eligible : failCount === 0;
  const hasWarningsOnly = failCount === 0 && warningCount > 0;

  return (
    <div className="space-y-5">

      {/* ── VERDICT BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap ${
          isEligible
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
            : hasWarningsOnly
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isEligible ? 'bg-green-100' : hasWarningsOnly ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          {isEligible
            ? <CheckCircle2 className="w-8 h-8 text-green-600" />
            : hasWarningsOnly
            ? <AlertTriangle className="w-8 h-8 text-amber-600" />
            : <XCircle className="w-8 h-8 text-red-600" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-xl font-extrabold leading-tight ${
            isEligible ? 'text-green-800' : hasWarningsOnly ? 'text-amber-800' : 'text-red-800'
          }`}>
            {isEligible
              ? `${t('eligibility.eligible')} ✓`
              : hasWarningsOnly
              ? t('eligibility.partiallyEligible')
              : `${t('eligibility.notEligible')} ✗`
            }
          </p>
          <p className={`text-sm mt-0.5 font-medium truncate ${
            isEligible ? 'text-green-700' : hasWarningsOnly ? 'text-amber-700' : 'text-red-700'
          }`}>
            {schemeName}
          </p>
          {hasWarningsOnly && (
            <p className="text-xs text-amber-600 mt-1">
              Fill in missing details for a definitive result.
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className={`text-3xl font-black ${
            isEligible ? 'text-green-700' : hasWarningsOnly ? 'text-amber-700' : 'text-red-700'
          }`}>{score}%</p>
          <p className="text-xs text-gray-500 whitespace-nowrap">{t('eligibility.yourEligibilityScore')}</p>
        </div>
      </motion.div>

      {/* ── PASS / FAIL / WARNING COUNTS ── */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success" dot>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {passCount} {t('eligibility.passed')}
        </Badge>
        {warningCount > 0 && (
          <Badge variant="warning" dot>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {warningCount} {t('eligibility.warning')}
          </Badge>
        )}
        {failCount > 0 && (
          <Badge variant="error" dot>
            <XCircle className="w-3 h-3 mr-1" />
            {failCount} {t('eligibility.failed')}
          </Badge>
        )}
      </div>

      {/* ── WHY YOU QUALIFY ── */}
      {whyQualify.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            {t('eligibility.whyYesTitle')}
          </h4>
          <ul className="space-y-2">
            {whyQualify.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── WHY YOU DON'T QUALIFY ── */}
      {whyNotQualify.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            {t('eligibility.whyNotTitle')}
          </h4>
          <ul className="space-y-2">
            {whyNotQualify.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── DETAILED CRITERIA BREAKDOWN ── */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-600 flex-shrink-0" />
          {t('eligibility.criteriaBreakdown')}
        </h4>
        <div className="space-y-1">
          {criteria.map((item, i) => (
            <div key={i} className="py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-800 min-w-0">{item.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.value && <span className="text-xs text-gray-500 hidden sm:inline">{item.value}</span>}
                  {item.status === 'pass'    && <CheckCircle2  className="w-4 h-4 text-green-500" />}
                  {item.status === 'fail'    && <XCircle       className="w-4 h-4 text-red-500" />}
                  {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              {item.reason && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.reason}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Alert variant="warning" title={t('eligibility.warning')}>
        {t('footer.disclaimer')}
      </Alert>

      {onCheckAgain && (
        <div className="flex justify-center">
          <Button onClick={onCheckAgain} icon={CheckCircle2}>
            {t('eligibility.checkEligibility')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EligibilityResult;
