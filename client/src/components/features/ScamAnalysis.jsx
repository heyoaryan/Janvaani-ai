import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Phone, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';

const ScamAnalysis = ({
  riskLevel = 'medium',
  indicators = [],
  advice = [],
  analyzedText = '',
  onCheckAnother,
}) => {
  const riskConfig = {
    low: { label: 'Low Risk', variant: 'success', description: 'This appears to be safe.' },
    medium: { label: 'Medium Risk', variant: 'warning', description: 'Exercise caution with this.' },
    high: { label: 'High Risk', variant: 'error', description: 'This is likely a scam. Do not proceed.' },
  };

  const config = riskConfig[riskLevel] || riskConfig.medium;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            riskLevel === 'high' ? 'bg-red-100' : riskLevel === 'medium' ? 'bg-amber-100' : 'bg-green-100'
          }`}>
            <Shield className={`w-8 h-8 ${
              riskLevel === 'high' ? 'text-red-600' : riskLevel === 'medium' ? 'text-amber-600' : 'text-green-600'
            }`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Risk Assessment</h3>
            <Badge variant={config.variant} className="text-sm px-3 py-1">
              {config.label}
            </Badge>
            <p className="text-sm text-gray-600 mt-2">{config.description}</p>
          </div>
        </div>

        {analyzedText && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Analyzed Text</h4>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
              {analyzedText}
            </div>
          </div>
        )}
      </Card>

      {indicators.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Risk Indicators Detected
          </h4>
          <div className="space-y-3">
            {indicators.map((indicator, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{indicator.title}</p>
                  <p className="text-sm text-gray-600">{indicator.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {advice.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Safety Advice
          </h4>
          <ul className="space-y-2">
            {advice.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Alert variant={config.variant} title="Stay Safe">
        Never share OTPs, passwords, or bank details with anyone. Government officials will never ask for these via phone or message.
      </Alert>

      {onCheckAnother && (
        <div className="flex justify-center">
          <Button onClick={onCheckAnother} icon={Shield}>
            Check Another Message
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScamAnalysis;
