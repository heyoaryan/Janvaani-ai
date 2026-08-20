import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, FileText, ClipboardList, CheckCircle, Sparkles } from 'lucide-react';
import { schemes } from '@/data/schemes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';

const SchemeDetail = () => {
  const { id } = useParams();
  const scheme = schemes.find(s => s.id === parseInt(id));
  const [activeTab, setActiveTab] = useState('overview');

  if (!scheme) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Scheme not found</p>
        <Link to="/schemes">
          <Button variant="outline" icon={ArrowLeft}>Back to Schemes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/schemes"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Schemes
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <Badge variant="neutral" className="mb-3 capitalize">
                {scheme.category.replace('-', ' ')}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{scheme.name}</h1>
              <p className="text-gray-600">{scheme.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Link to={`/eligibility?scheme=${scheme.id}`}>
                <Button variant="primary" icon={CheckCircle} className="w-full sm:w-auto">Check Eligibility</Button>
              </Link>
              <Link to={`/missing-docs?scheme=${scheme.id}`}>
                <Button variant="outline" icon={FileText} className="w-full sm:w-auto">What's Missing?</Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'eligibility' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('eligibility')}
            >
              Eligibility
            </Button>
            <Button
              variant={activeTab === 'documents' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </Button>
            <Button
              variant={activeTab === 'apply' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('apply')}
            >
              How to Apply
            </Button>
          </div>

          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-900">About This Scheme</h3>
              <p className="text-gray-700 leading-relaxed">{scheme.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Benefits</p>
                  <ul className="space-y-1">
                    {scheme.benefits.map((benefit, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">State</span>
                      <span className="font-medium text-gray-900">{scheme.state}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Documents</span>
                      <span className="font-medium text-gray-900">{scheme.requiredDocuments.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Steps</span>
                      <span className="font-medium text-gray-900">{scheme.applicationSteps.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'eligibility' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Eligibility Criteria</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Min Age', value: `${scheme.eligibilityRules.minAge} years` },
                  { label: 'Max Age', value: `${scheme.eligibilityRules.maxAge} years` },
                  { label: 'Income Limit', value: scheme.eligibilityRules.incomeLimit ? `₹${scheme.eligibilityRules.incomeLimit.toLocaleString()}` : 'No limit' },
                  { label: 'Gender', value: scheme.eligibilityRules.gender.join(', ') },
                  { label: 'Category', value: scheme.eligibilityRules.category.join(', ') },
                  { label: 'Student Required', value: scheme.eligibilityRules.studentRequired ? 'Yes' : 'No' },
                  { label: 'Farmer Required', value: scheme.eligibilityRules.farmerRequired ? 'Yes' : 'No' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Required Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.requiredDocuments.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-gray-700">{doc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'apply' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Application Steps</h3>
              <div className="space-y-3">
                {scheme.applicationSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
              <a
                href={scheme.officialSource}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Visit Official Source <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default SchemeDetail;
