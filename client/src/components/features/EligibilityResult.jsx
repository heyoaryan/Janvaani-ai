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
  criteria = [],
  whyQualify = [],
  whyNotQualify = [],
  schemeName = '',
  onCheckAgain,
}) => {
  const { t } = useLanguage();
  const passCount = criteria.filter((c) => c.status === 'pass').length;
  const failCount = criteria.filter((c) => c.status === 'fail').length;
  const warningCount = criteria.filter((c) => c.status === 'warning').length;
  const summary = score >= 70
    ? t('eligibility.highlyEligible')
    : score >= 40
      ? t('eligibility.partiallyEligible')
      : t('eligibility.notEligible');

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke={score >= 70 ? '#16a34a' : score >= 40 ? '#f59e0b' : '#dc2626'}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: `${2 * Math.PI * 56}`, strokeDashoffset: `${2 * Math.PI * 56}` }}
                animate={{ strokeDashoffset: `${2 * Math.PI * 56 * (1 - score / 100)}` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{score}%</span>
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{schemeName}</h3>
            <p className="text-gray-600 mb-4">{summary}</p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Badge variant="success" dot>
                <CheckCircle2 className="w-3 h-3" />
                {passCount} {t('eligibility.passed')}
              </Badge>
              {warningCount > 0 && (
                <Badge variant="warning" dot>
                  <AlertTriangle className="w-3 h-3" />
                  {warningCount} {t('eligibility.warning')}
                </Badge>
              )}
              {failCount > 0 && (
                <Badge variant="error" dot>
                  <XCircle className="w-3 h-3" />
                  {failCount} {t('eligibility.failed')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {whyQualify.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            {t('eligibility.whyYesTitle')}
          </h4>
          <ul className="space-y-2">
            {whyQualify.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {whyNotQualify.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            {t('eligibility.whyNotTitle')}
          </h4>
          <ul className="space-y-2">
            {whyNotQualify.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-600" />
          {t('eligibility.criteriaBreakdown')}
        </h4>
        <div className="space-y-3">
          {criteria.map((item, i) => (
            <div key={i} className="py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                <div className="flex items-center gap-2">
                  {item.value && <span className="text-sm text-gray-500">{item.value}</span>}
                  {item.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  {item.status === 'fail' && <XCircle className="w-4 h-4 text-red-600" />}
                  {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                </div>
              </div>
              {item.reason && <p className="text-xs text-gray-600 mt-1">{item.reason}</p>}
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
