import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import ScamAnalysis from '@/components/features/ScamAnalysis';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';

const ScamCheck = () => {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [url, setUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const scamExamples = [
    { typeKey: 'sms', text: 'Dear Customer, Your Aadhaar is being deactivated. Click here to verify: bit.ly/fake-link' },
    { typeKey: 'call', text: 'This is calling from Bank of India. Your account will be blocked. Share your OTP to prevent this.' },
    { typeKey: 'whatsapp', text: 'Congratulations! You have won ₹5 lakhs from PM Scheme. Share your bank details to claim.' },
  ];

  const analyzeText = () => {
    if (!inputText.trim() && !url.trim()) return;
    const lowerText = `${inputText} ${url}`.toLowerCase();
    let riskLevel = 'low';
    const indicators = [];
    const advice = [
      t('scamCheck.neverShare'),
      t('scamCheck.verifyOfficial'),
      t('scamCheck.suspiciousUrls'),
    ];

    if (/otp|pin|password|ओटीपी|पिन|ओटीपी/.test(lowerText)) {
      indicators.push({ title: t('scamCheck.high'), description: t('scamCheck.neverShare') });
      riskLevel = 'high';
    }
    if (/bit\.ly|tinyurl|click here|लिंक/.test(lowerText) || (url && !/\.gov\.in|\.nic\.in/.test(url.toLowerCase()))) {
      indicators.push({ title: t('scamCheck.suspiciousUrls'), description: t('scamCheck.suspiciousUrls') });
      if (riskLevel !== 'high') riskLevel = 'medium';
    }
    if (/won|winner|prize|लख|इनाम|जीत/.test(lowerText)) {
      riskLevel = 'high';
      indicators.push({ title: t('scamCheck.high'), description: t('scamCheck.neverShare') });
    }
    if (/bank details|account number|aadhaar|आधार|खाता/.test(lowerText)) {
      riskLevel = 'high';
    }

    setAnalysisResult({
      riskLevel,
      indicators: indicators.length ? indicators : [{ title: t('scamCheck.safe'), description: t('scamCheck.verifyOfficial') }],
      advice,
      analyzedText: inputText || url,
    });
  };

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('scamCheck.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('scamCheck.subtitle')}</p>
      </div>

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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('scamCheck.urlLabel')}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button onClick={analyzeText} icon={Shield} className="w-full sm:w-auto">
            {t('scamCheck.analyzeButton')}
          </Button>
        </div>
      </Card>

      {analysisResult && (
        <ScamAnalysis
          riskLevel={analysisResult.riskLevel}
          indicators={analysisResult.indicators}
          advice={analysisResult.advice}
          analyzedText={analysisResult.analyzedText}
          onCheckAnother={() => {
            setInputText('');
            setUrl('');
            setAnalysisResult(null);
          }}
        />
      )}

      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">{t('scamCheck.examples')}</h3>
        <div className="space-y-3">
          {scamExamples.map((example, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="error" className="text-xs">{t(`scamCheck.${example.typeKey}`)}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setInputText(example.text)}>
                  {t('scamCheck.tryThis')}
                </Button>
              </div>
              <p className="text-sm text-gray-700">{example.text}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      <Alert variant="info" title={t('scamCheck.stayProtected')}>
        {t('scamCheck.stayProtectedBody')}
      </Alert>
    </div>
  );
};

export default ScamCheck;
