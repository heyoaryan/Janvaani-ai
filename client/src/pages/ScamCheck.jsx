import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader2, AlertTriangle, CheckCircle2, ExternalLink, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { scamApi } from '@/services/api';

const RISK_CONFIG = {
  high:   { color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   badge: 'error',   icon: '🚨' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'warning', icon: '⚠️' },
  low:    { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', badge: 'success', icon: '✅' },
};

const ScamCheck = () => {
  const { t, language } = useLanguage();
  const [inputText, setInputText]   = useState('');
  const [url, setUrl]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');

  const scamExamples = [
    { typeKey: 'sms',      text: 'Dear Customer, Your Aadhaar is being deactivated. Click here to verify: bit.ly/fake-link' },
    { typeKey: 'call',     text: 'This is calling from Bank of India. Your account will be blocked. Share your OTP to prevent this.' },
    { typeKey: 'whatsapp', text: 'Congratulations! You have won ₹5 lakhs from PM Scheme. Share your bank details to claim.' },
  ];

  const analyze = async () => {
    const text = inputText.trim();
    const urlVal = url.trim();
    if (!text && !urlVal) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Call real backend — runs weighted heuristic engine, returns riskLevel + indicators
      const combined = [text, urlVal].filter(Boolean).join('\n');
      const [textResult, urlResult] = await Promise.all([
        text   ? scamApi.analyze(text)          : Promise.resolve(null),
        urlVal ? scamApi.checkUrl(urlVal)        : Promise.resolve(null),
      ]);

      // Merge results — take the higher risk
      const riskOrder = { high: 3, medium: 2, low: 1 };
      const textRisk = textResult?.riskLevel || 'low';
      const urlRisk  = urlResult?.riskLevel  || 'low';
      const finalRisk = riskOrder[textRisk] >= riskOrder[urlRisk] ? textRisk : urlRisk;

      const indicators = [
        ...(textResult?.indicatorsFound || []).map(i => ({
          label: i.label,
          source: 'message',
        })),
        ...(urlResult?.indicatorsFound || []).map(i => ({
          label: i.label,
          source: 'url',
        })),
      ];

      const advice = textResult?.safetyAdvice || urlResult?.safetyAdvice || '';

      setResult({
        riskLevel:  finalRisk,
        indicators,
        advice,
        analyzedText: combined,
        textResult,
        urlResult,
      });
    } catch (err) {
      setError(t('scamCheck.analyzeError') || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInputText('');
    setUrl('');
    setResult(null);
    setError('');
  };

  const cfg = result ? (RISK_CONFIG[result.riskLevel] || RISK_CONFIG.medium) : null;

  return (
    <div className="space-y-6 px-4 py-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('scamCheck.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('scamCheck.subtitle')}</p>
      </div>

      {/* ── Input Card ── */}
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">{t('scamCheck.analyzeTitle')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('scamCheck.pasteLabel')}</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('scamCheck.pasteMessage')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('scamCheck.urlLabel')}</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button
                  onClick={analyze}
                  disabled={loading || (!inputText.trim() && !url.trim())}
                  icon={loading ? Loader2 : Shield}
                  className="w-full sm:w-auto"
                >
                  {loading ? (t('scamCheck.analyzing') || 'Analyzing…') : t('scamCheck.analyzeButton')}
                </Button>
              </div>
            </Card>

            {/* Examples */}
            <Card className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t('scamCheck.examples')}</h3>
              <div className="space-y-3">
                {scamExamples.map((ex, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="error" className="text-xs capitalize">{t(`scamCheck.${ex.typeKey}`) || ex.typeKey}</Badge>
                      <button
                        onClick={() => setInputText(ex.text)}
                        className="text-xs text-primary-600 font-medium hover:underline"
                      >
                        {t('scamCheck.tryThis')}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{ex.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ) : (
          /* ── Result Card ── */
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Risk Header */}
            <Card>
              <div className={`rounded-2xl ${cfg.bg} ${cfg.border} border p-5 mb-4`}>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{cfg.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('scamCheck.riskAssessment')}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.badge} className="text-sm px-3 py-1 font-bold">
                        {t(`scamCheck.${result.riskLevel}`) || result.riskLevel.toUpperCase()} {t('scamCheck.riskLevel') || 'Risk'}
                      </Badge>
                    </div>
                    <p className={`text-sm mt-1.5 font-medium ${cfg.color}`}>
                      {t(`scamCheck.${result.riskLevel}Desc`) || result.advice}
                    </p>
                  </div>
                </div>
              </div>

              {/* Analyzed text */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('scamCheck.analyzedText')}</p>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 max-h-28 overflow-y-auto whitespace-pre-wrap">
                  {result.analyzedText}
                </div>
              </div>
            </Card>

            {/* Indicators */}
            {result.indicators.length > 0 && (
              <Card>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  {t('scamCheck.riskIndicators')} ({result.indicators.length})
                </h4>
                <div className="space-y-2">
                  {result.indicators.map((ind, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ind.label}</p>
                        {ind.source === 'url' && (
                          <p className="text-xs text-gray-500 mt-0.5">{t('scamCheck.foundInUrl') || 'Found in URL'}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Safety Advice */}
            {result.advice && (
              <Card>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {t('scamCheck.safetyAdvice')}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{result.advice}</p>
              </Card>
            )}

            {/* Standard tips */}
            <Card>
              <h4 className="font-semibold text-gray-900 mb-3">{t('scamCheck.staySafe')}</h4>
              <ul className="space-y-2">
                {[
                  t('scamCheck.neverShare'),
                  t('scamCheck.verifyOfficial'),
                  t('scamCheck.suspiciousUrls'),
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="flex gap-3">
              <Button onClick={reset} icon={Shield} className="flex-1">
                {t('scamCheck.checkAnother')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScamCheck;
