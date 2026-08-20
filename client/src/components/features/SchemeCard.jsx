import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, FileText, ClipboardList, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';

const SchemeCard = ({ scheme, matchPercentage = 85, onClick, onCheckEligibility, onStartApplication }) => {
  const categoryColors = {
    education: 'bg-blue-100 text-blue-700',
    housing: 'bg-green-100 text-green-700',
    agriculture: 'bg-amber-100 text-amber-700',
    healthcare: 'bg-red-100 text-red-700',
    employment: 'bg-purple-100 text-purple-700',
    maternity: 'bg-pink-100 text-pink-700',
    'skill-development': 'bg-orange-100 text-orange-700',
    'senior-citizen': 'bg-gray-100 text-gray-700',
    women: 'bg-rose-100 text-rose-700',
    business: 'bg-indigo-100 text-indigo-700',
    energy: 'bg-yellow-100 text-yellow-700',
  };

  const eligibilityStatus = matchPercentage >= 80 ? 'pass' : matchPercentage >= 50 ? 'warning' : 'fail';
  const statusConfig = {
    pass: { label: 'Eligible', color: 'success', icon: CheckCircle2 },
    warning: { label: 'Partial Match', color: 'warning', icon: AlertCircle },
    fail: { label: 'Not Eligible', color: 'error', icon: XCircle },
  };

  const StatusIcon = statusConfig[eligibilityStatus].icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card hover className="h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="neutral" className="capitalize">
            {scheme.category.replace('-', ' ')}
          </Badge>
          <Badge variant={statusConfig[eligibilityStatus].color} dot>
            <StatusIcon className="w-3 h-3" />
            {statusConfig[eligibilityStatus].label}
          </Badge>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 leading-tight">{scheme.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">{scheme.description}</p>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">Match</span>
            <span className="text-xs font-semibold text-gray-900">{matchPercentage}%</span>
          </div>
          <Progress value={matchPercentage} variant={eligibilityStatus === 'pass' ? 'success' : eligibilityStatus === 'warning' ? 'warning' : 'error'} size="sm" showLabel={false} />
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4 text-gray-400" />
            <span>{scheme.requiredDocuments.length} documents required</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <span>{scheme.applicationSteps.length} steps to apply</span>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(scheme);
            }}
          >
            Details
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onCheckEligibility?.(scheme);
            }}
          >
            Check Eligibility
          </Button>
        </div>

        <a
          href={scheme.officialSource}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-3 font-medium"
        >
          Official Source <ExternalLink className="w-3 h-3" />
        </a>
      </Card>
    </motion.div>
  );
};

export default SchemeCard;
