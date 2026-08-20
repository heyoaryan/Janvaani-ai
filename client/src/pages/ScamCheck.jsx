import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import ScamAnalysis from '@/components/features/ScamAnalysis';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const scamExamples = [
  { type: 'SMS', text: 'Dear Customer, Your Aadhaar is being deactivated. Click here to verify: bit.ly/fake-link' },
  { type: 'Call', text: 'This is calling from Bank of India. Your account will be blocked. Share your OTP to prevent this.' },
  { type: 'WhatsApp', text: 'Congratulations! You have won ₹5 lakhs from PM Scheme. Share your bank details to claim.' },
];

const ScamCheck = () => {
  const [inputText, setInputText] = useState('');
  const [url, setUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const lowerText = inputText.toLowerCase();
      let riskLevel = 'low';
      const indicators = [];
      const advice = [
        'Never share OTP, PIN, or password with anyone',
        'Always verify messages from official sources',
        'Check the sender ID or phone number carefully',
        'Do not click on suspicious links',
      ];

      if (lowerText.includes('otp') || lowerText.includes('pin') || lowerText.includes('password')) {
        indicators.push({ title: 'Request for Sensitive Information', description: 'The message asks for OTP, PIN, or password which legitimate organizations never do.' });
        riskLevel = 'high';
      }
      if (lowerText.includes('click') || lowerText.includes('link') || lowerText.includes('bit.ly')) {
        indicators.push({ title: 'Suspicious Link', description: 'Shortened or suspicious links are commonly used in phishing attempts.' });
        if (riskLevel !== 'high') riskLevel = 'medium';
      }
      if (lowerText.includes('account') && (lowerText.includes('block') || lowerText.includes('deactivate'))) {
        indicators.push({ title: 'Threat of Account Blocking', description: 'Scammers often create urgency by threatening account closure.' });
        if (riskLevel !== 'high') riskLevel = 'medium';
      }
      if (lowerText.includes('winner') || lowerText.includes('won') || lowerText.includes('prize')) {
        indicators.push({ title: 'Fake Prize or Lottery', description: 'Unsolicited prize notifications are almost always scams.' });
        riskLevel = 'high';
      }
      if (lowerText.includes('bank details') || lowerText.includes('account number')) {
        indicators.push({ title: 'Request for Bank Details', description: 'Legitimate organizations will not ask for bank details via SMS or call.' });
        riskLevel = 'high';
      }
      if (lowerText.includes('aadhaar')) {
        indicators.push({ title: 'Aadhaar-related Scam', description: 'Be cautious of messages claiming Aadhaar issues. Verify through official UIDAI channels.' });
        if (riskLevel !== 'high') riskLevel = 'medium';
      }

      setAnalysisResult({
        riskLevel,
        indicators,
        advice,
        analyzedText: inputText,
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scam Check</h1>
        <p className="text-gray-600">Analyze suspicious messages, calls, and URLs for potential scams</p>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Analyze Suspicious Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paste suspicious message or text</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the suspicious message here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Check suspicious URL (optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button onClick={analyzeText} loading={isAnalyzing} icon={Shield} className="w-full sm:w-auto">
            Analyze for Scam
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
        <h3 className="font-semibold text-gray-900 mb-4">Example Scam Messages</h3>
        <div className="space-y-3">
          {scamExamples.map((example, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="error" className="text-xs">{example.type}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputText(example.text)}
                >
                  Try This
                </Button>
              </div>
              <p className="text-sm text-gray-700">{example.text}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      <Alert variant="info" title="Stay Protected">
        Always verify suspicious messages through official government portals. Never share sensitive information via SMS, email, or phone calls from unknown sources.
      </Alert>
    </div>
  );
};

export default ScamCheck;
