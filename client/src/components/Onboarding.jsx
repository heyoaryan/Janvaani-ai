import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, User, Briefcase, Calendar, Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { API_BASE } from '@/services/api';

const STEPS = [
  {
    id: 'name',
    title: 'आपका नाम क्या है?',
    subtitle: 'What\'s your name?',
    icon: User,
    placeholder: 'अपना नाम लिखें...',
    field: 'name',
  },
  {
    id: 'occupation',
    title: 'आप क्या कार्य करते हैं?',
    subtitle: 'What do you do?',
    icon: Briefcase,
    placeholder: 'उदाहरण: छात्र, किसान, व्यवसाय...',
    field: 'occupation',
    options: ['छात्र / Student', 'किसान / Farmer', 'व्यवसाय / Business', 'रोजगार / Employed', 'निरुद्योग / Unemployed', 'घरेलू / Homemaker', 'अन्य / Other'],
  },
  {
    id: 'age',
    title: 'आपकी उम्र क्या है?',
    subtitle: 'What is your age?',
    icon: Calendar,
    placeholder: 'उम्र दर्ज करें...',
    field: 'age',
    inputType: 'number',
  },
];

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ name: '', occupation: '', age: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          occupation: formData.occupation,
          age: formData.age,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('janvaani_onboarding', 'complete');
        localStorage.setItem('janvaani_profile', JSON.stringify(data.profile));
        onComplete?.(data.profile);
      }
    } catch (err) {
      // Fallback for offline mode
      const profile = {
        sessionId: `profile-${Date.now()}`,
        name: formData.name,
        occupation: formData.occupation,
        age: parseInt(formData.age, 10),
      };
      localStorage.setItem('janvaani_onboarding', 'complete');
      localStorage.setItem('janvaani_profile', JSON.stringify(profile));
      onComplete?.(profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    if (step === 0) return formData.name.trim().length > 0;
    if (step === 1) return formData.occupation.trim().length > 0;
    if (step === 2) return formData.age && parseInt(formData.age, 10) > 0;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-900/95 via-primary-800/95 to-primary-700/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-2 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4"
            >
              <currentStep.icon className="w-8 h-8" />
            </motion.div>
            <motion.h2
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-900 mb-1"
            >
              {currentStep.title}
            </motion.h2>
            <motion.p
              key={`sub-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500"
            >
              {currentStep.subtitle}
            </motion.p>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep.options ? (
                <div className="space-y-2 mb-8">
                  {currentStep.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({ ...formData, occupation: option.split(' / ')[0] })}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.occupation === option.split(' / ')[0]
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{option}</span>
                        {formData.occupation === option.split(' / ')[0] && (
                          <Check className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-8">
                  <input
                    type={currentStep.inputType || 'text'}
                    value={formData[currentStep.field]}
                    onChange={(e) => setFormData({ ...formData, [currentStep.field]: e.target.value })}
                    placeholder={currentStep.placeholder}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-0 outline-none text-lg text-center"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isStepValid()) {
                        step === STEPS.length - 1 ? handleSubmit() : handleNext();
                      }
                    }}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
