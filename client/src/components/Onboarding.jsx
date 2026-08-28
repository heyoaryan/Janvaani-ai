import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Calendar, ArrowRight, ArrowLeft, Check, MapPin } from 'lucide-react';
import { INDIAN_STATES } from '@/data/indianStates';
import { useLanguage } from '@/contexts/LanguageContext';

const Onboarding = ({ onComplete }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ name: '', occupation: '', age: '', state: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STEPS = [
    {
      id: 'name',
      icon: User,
      field: 'name',
    },
    {
      id: 'occupation',
      icon: Briefcase,
      field: 'occupation',
      options: [
        { key: 'student', label: t('onboarding.occupations.student') },
        { key: 'farmer', label: t('onboarding.occupations.farmer') },
        { key: 'business', label: t('onboarding.occupations.business') },
        { key: 'employed', label: t('onboarding.occupations.employed') },
        { key: 'unemployed', label: t('onboarding.occupations.unemployed') },
        { key: 'self-employed', label: t('onboarding.occupations.selfEmployed') },
        { key: 'homemaker', label: t('onboarding.occupations.homemaker') },
        { key: 'retired', label: t('onboarding.occupations.retired') },
        { key: 'other', label: t('onboarding.occupations.other') },
      ],
    },
    {
      id: 'state',
      icon: MapPin,
      field: 'state',
    },
    {
      id: 'age',
      icon: Calendar,
      field: 'age',
      inputType: 'number',
    },
  ];

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
          state: formData.state,
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
        state: formData.state,
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
    if (step === 2) return Boolean(formData.state);
    if (step === 3) return formData.age && parseInt(formData.age, 10) > 0;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-900/95 via-primary-800/95 to-primary-700/95 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-2.5 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-saffron-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-50 to-saffron-50 text-primary-600 mb-5 shadow-sm"
            >
              <currentStep.icon className="w-10 h-10" />
            </motion.div>
            <motion.h2
              key={`title-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-extrabold text-gray-900 mb-2"
            >
              {step === 0 ? t('onboarding.step1Title') :
               step === 1 ? t('onboarding.step2Title') :
               step === 2 ? t('onboarding.stepStateTitle') :
               t('onboarding.step3Title')}
            </motion.h2>
            <motion.p
              key={`sub-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-gray-600"
            >
              {step === 0 ? t('onboarding.step1Subtitle') :
               step === 1 ? t('onboarding.step2Subtitle') :
               step === 2 ? t('onboarding.stepStateSubtitle') :
               t('onboarding.step3Subtitle')}
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
              {currentStep.field === 'state' ? (
                <div className="mb-8">
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none text-base"
                  >
                    <option value="">{t('schemeFinder.allLocations')}</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.id} value={s.id}>{t(`states.${s.id}`)}</option>
                    ))}
                  </select>
                </div>
              ) : currentStep.options ? (
                <div className="space-y-2.5 mb-8 max-h-96 overflow-y-auto scrollbar-hide">
                  {currentStep.options.map((option) => (
                    <motion.button
                      key={option.key}
                      onClick={() => setFormData({ ...formData, occupation: option.key })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                        formData.occupation === option.key
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{option.label}</span>
                        {formData.occupation === option.key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="mb-8">
                  <input
                    type={currentStep.inputType || 'text'}
                    value={formData[currentStep.field]}
                    onChange={(e) => setFormData({ ...formData, [currentStep.field]: e.target.value })}
                    placeholder={
                      step === 0 ? t('onboarding.namePlaceholder') :
                      step === 3 ? t('onboarding.agePlaceholder') : ''
                    }
                    className="w-full px-6 py-5 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-0 outline-none text-lg text-center font-medium shadow-sm hover:border-gray-300 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isStepValid()) {
                        step === STEPS.length - 1 ? handleSubmit() : handleNext();
                      }
                    }}
                  />
                  {step === 3 && formData.age && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      {formData.age} {t('onboarding.years')}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            {step > 0 ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </motion.button>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem('janvaani_onboarding', 'complete');
                  onComplete?.({});
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {t('onboarding.skip')}
              </button>
            )}

            {step === STEPS.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? t('loading') : t('onboarding.letsStart')}
                <Check className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {t('next')}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? 'w-8 bg-primary-600' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Welcome message at the top */}
        <div className="absolute top-0 left-0 right-0 text-center pt-6">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-bold text-lg"
          >
            {t('onboarding.welcome')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-sm mt-1"
          >
            {t('onboarding.subtitle')}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
