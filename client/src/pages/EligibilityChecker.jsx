import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, User, MapPin, Briefcase, IndianRupee } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { schemes } from '@/data/schemes';
import { useAuth } from '@/contexts/AuthContext';
import EligibilityResult from '@/components/features/EligibilityResult';

const EligibilityChecker = () => {
  const { user, updateUser } = useAuth();
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = () => {
    if (!selectedSchemeId) return;
    setIsChecking(true);
    setResult(null);
    setTimeout(() => {
      const scheme = schemes.find(s => s.id === parseInt(selectedSchemeId));
      const score = 60 + Math.floor(Math.random() * 40);
      const criteria = [
        { name: 'Age', value: `${user.age} years`, status: user.age >= (scheme?.eligibilityRules?.minAge || 18) && user.age <= (scheme?.eligibilityRules?.maxAge || 99) ? 'pass' : 'fail' },
        { name: 'Gender', value: user.gender, status: scheme?.eligibilityRules?.gender?.includes(user.gender) ? 'pass' : 'fail' },
        { name: 'Income', value: `₹${user.income?.toLocaleString()}`, status: !scheme?.eligibilityRules?.incomeLimit || user.income <= scheme.eligibilityRules.incomeLimit ? 'pass' : 'fail' },
        { name: 'Category', value: 'General', status: 'pass' },
        { name: 'Student Status', value: user.studentStatus ? 'Yes' : 'No', status: scheme?.eligibilityRules?.studentRequired === user.studentStatus ? 'pass' : 'warning' },
        { name: 'Farmer Status', value: user.farmerStatus ? 'Yes' : 'No', status: scheme?.eligibilityRules?.farmerRequired === user.farmerStatus ? 'pass' : 'warning' },
      ];
      setResult({
        score,
        criteria,
        whyQualify: ['You meet the basic age requirements', 'Your income falls within the eligible range', 'You have the required identification documents'],
        whyNotQualify: score < 80 ? ['Some additional documentation may be required'] : [],
        schemeName: scheme?.name || 'Selected Scheme',
      });
      setIsChecking(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Eligibility Checker</h1>
        <p className="text-sm sm:text-base text-gray-600">Check if you're eligible for government schemes</p>
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Your Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
            <input
              type="number"
              value={user.age || ''}
              onChange={(e) => updateUser({ age: parseInt(e.target.value) || '' })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select
              value={user.gender}
              onChange={(e) => updateUser({ gender: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <input
              type="text"
              value={user.state}
              onChange={(e) => updateUser({ state: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Occupation</label>
            <select
              value={user.occupation}
              onChange={(e) => updateUser({ occupation: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="student">Student</option>
              <option value="farmer">Farmer</option>
              <option value="employed">Employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="self-employed">Self Employed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Income</label>
            <input
              type="number"
              value={user.income || ''}
              onChange={(e) => updateUser({ income: parseInt(e.target.value) || '' })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheme</label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a scheme</option>
              {schemes.map(scheme => (
                <option key={scheme.id} value={scheme.id}>{scheme.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleCheck} loading={isChecking} className="w-full sm:w-auto">
            Check Eligibility
          </Button>
        </div>
      </Card>

      {isChecking && (
        <Card>
          <div className="flex items-center justify-center gap-2 py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
               className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
            />
            <span className="text-gray-600">Checking eligibility...</span>
          </div>
        </Card>
      )}

      {result && (
        <EligibilityResult
          score={result.score}
          criteria={result.criteria}
          whyQualify={result.whyQualify}
          whyNotQualify={result.whyNotQualify}
          schemeName={result.schemeName}
          onCheckAgain={handleCheck}
        />
      )}
    </div>
  );
};

export default EligibilityChecker;
