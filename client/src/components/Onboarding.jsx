import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Calendar, ArrowRight, ArrowLeft, Check, MapPin, Globe, Building2 } from 'lucide-react';
import { LANGUAGES } from '@/i18n/translations';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Custom DOB Input ───────────────────────────────────────────────────────────
// Supports typing DD/MM/YYYY or selecting via three dropdowns
const DOBInput = ({ value, onChange }) => {
  // Parse initial value "YYYY-MM-DD" into parts
  const initParts = value ? value.split('-') : ['', '', ''];

  // LOCAL state for each dropdown — prevents stale-closure wipe on re-render
  const [selYear,  setSelYear]  = useState(initParts[0] || '');
  const [selMonth, setSelMonth] = useState(initParts[1] || '');
  const [selDay,   setSelDay]   = useState(initParts[2] || '');

  const [text, setText] = useState(
    initParts[2] ? `${initParts[2]}/${initParts[1]}/${initParts[0]}` : ''
  );
  const [mode, setMode] = useState('dropdowns');
  const inputRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years  = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const daysInMonth = (m, y) => {
    if (!m || !y) return 31;
    return new Date(Number(y), Number(m), 0).getDate();
  };
  const days = Array.from({ length: daysInMonth(selMonth, selYear) }, (_, i) => i + 1);

  // Emit ISO string only when all three parts are filled
  const emitISO = (d, m, y) => {
    if (d && m && y && String(y).length === 4) {
      onChange(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    } else {
      onChange('');
    }
  };

  const handleDayChange = (e) => {
    const d = e.target.value;
    setSelDay(d);
    emitISO(d, selMonth, selYear);
  };
  const handleMonthChange = (e) => {
    const m = e.target.value;
    setSelMonth(m);
    // If day > days in new month, reset day
    const maxD = daysInMonth(m, selYear);
    const d = Number(selDay) > maxD ? '' : selDay;
    if (d !== selDay) setSelDay(d);
    emitISO(d, m, selYear);
  };
  const handleYearChange = (e) => {
    const y = e.target.value;
    setSelYear(y);
    emitISO(selDay, selMonth, y);
  };

  // Handle typed input: auto-insert slashes, validate on complete
  const handleType = (e) => {
    let raw = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length > 4) formatted = raw.slice(0,2) + '/' + raw.slice(2,4) + '/' + raw.slice(4);
    else if (raw.length > 2) formatted = raw.slice(0,2) + '/' + raw.slice(2);
    setText(formatted);

    if (raw.length === 8) {
      const d = raw.slice(0,2), m = raw.slice(2,4), y = raw.slice(4,8);
      if (Number(d) >= 1 && Number(d) <= 31 && Number(m) >= 1 && Number(m) <= 12) {
        setSelDay(d); setSelMonth(m); setSelYear(y);
        onChange(`${y}-${m}-${d}`);
      } else {
        onChange('');
      }
    } else {
      onChange('');
    }
  };

  if (mode === 'type') {
    return (
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={text}
          onChange={handleType}
          placeholder="DD/MM/YYYY"
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-xl font-mono font-bold text-center shadow-sm tracking-widest transition-all"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setMode('dropdowns')}
          className="w-full text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          ↕ Switch to dropdown selectors
        </button>
      </div>
    );
  }

  // Dropdown mode
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {/* Day */}
        <select
          value={selDay}
          onChange={handleDayChange}
          className="px-2 py-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-center font-semibold text-gray-800 text-sm transition-all cursor-pointer"
        >
          <option value="">Day</option>
          {days.map((d) => (
            <option key={d} value={String(d).padStart(2,'0')}>{d}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={selMonth}
          onChange={handleMonthChange}
          className="px-2 py-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-center font-semibold text-gray-800 text-sm transition-all cursor-pointer"
        >
          <option value="">Month</option>
          {months.map((m, i) => (
            <option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={selYear}
          onChange={handleYearChange}
          className="px-2 py-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-center font-semibold text-gray-800 text-sm transition-all cursor-pointer"
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Show selected date preview */}
      {selDay && selMonth && selYear && (
        <p className="text-center text-sm font-semibold text-indigo-600">
          {selDay}/{selMonth}/{selYear}
        </p>
      )}

      <button
        type="button"
        onClick={() => { setMode('type'); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        ✏️ Type date instead (DD/MM/YYYY)
      </button>
    </div>
  );
};

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// ── Language selector screen ──────────────────────────────────────────────────
const LanguageStep = ({ onSelect }) => (
  <div className="flex flex-col h-full">
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 mb-4">
        <Globe className="w-8 h-8 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Choose your language</h2>
      <p className="text-sm text-gray-500">अपनी भाषा चुनें • ਭਾਸ਼ਾ ਚੁਣੋ • ভাষা বেছে নিন</p>
    </div>

    <div className="grid grid-cols-2 gap-2.5 overflow-y-auto scrollbar-hide flex-1">
      {LANGUAGES.map((lang) => (
        <motion.button
          key={lang.code}
          onClick={() => onSelect(lang.code)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
        >
          <span className="text-2xl">{lang.flag}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{lang.name}</p>
            <p className="text-xs text-gray-400 leading-tight">{lang.englishName}</p>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const Onboarding = ({ onComplete }) => {
  const { t, setLanguage } = useLanguage();

  // step -1 = language picker, 0..N = profile steps
  const [step, setStep] = useState(-1);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    city: '',
    occupation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const OCCUPATIONS = [
    { key: 'student',      label: t('onboarding.occupations.student') },
    { key: 'farmer',       label: t('onboarding.occupations.farmer') },
    { key: 'employed',     label: t('onboarding.occupations.employed') },
    { key: 'self-employed',label: t('onboarding.occupations.selfEmployed') },
    { key: 'business',     label: t('onboarding.occupations.business') },
    { key: 'homemaker',    label: t('onboarding.occupations.homemaker') },
    { key: 'unemployed',   label: t('onboarding.occupations.unemployed') },
    { key: 'retired',      label: t('onboarding.occupations.retired') },
    { key: 'other',        label: t('onboarding.occupations.other') },
  ];

  const STEPS = [
    {
      id: 'name',
      icon: User,
      title: () => t('onboarding.step1Title'),
      subtitle: () => t('onboarding.step1Subtitle'),
      content: () => (
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('onboarding.namePlaceholder')}
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-lg font-medium text-center shadow-sm transition-all"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && isStepValid()) handleNext(); }}
        />
      ),
      valid: () => formData.name.trim().length > 0,
    },
    {
      id: 'dob',
      icon: Calendar,
      title: () => t('onboarding.stepDobTitle'),
      subtitle: () => t('onboarding.stepDobSubtitle'),
      content: () => (
        <DOBInput
          value={formData.dob}
          onChange={(val) => setFormData({ ...formData, dob: val })}
        />
      ),
      valid: () => formData.dob.length > 0,
    },
    {
      id: 'city',
      icon: Building2,
      title: () => t('onboarding.stepCityTitle'),
      subtitle: () => t('onboarding.stepCitySubtitle'),
      content: () => (
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder={t('onboarding.cityPlaceholder')}
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-lg font-medium text-center shadow-sm transition-all"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && isStepValid()) handleNext(); }}
        />
      ),
      valid: () => formData.city.trim().length > 0,
    },
    {
      id: 'occupation',
      icon: Briefcase,
      title: () => t('onboarding.step2Title'),
      subtitle: () => t('onboarding.step2Subtitle'),
      content: () => (
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
          {OCCUPATIONS.map((opt) => (
            <motion.button
              key={opt.key}
              onClick={() => setFormData({ ...formData, occupation: opt.key })}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                formData.occupation === opt.key
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
              }`}
            >
              <span className="font-semibold text-sm">{opt.label}</span>
              {formData.occupation === opt.key && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      ),
      valid: () => formData.occupation.length > 0,
    },
  ];

  const currentStep = STEPS[step];
  const totalSteps = STEPS.length;
  const progress = step >= 0 ? ((step + 1) / totalSteps) * 100 : 0;

  const isStepValid = () => step >= 0 && STEPS[step]?.valid();

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 0) setStep(-1);
    else if (step > 0) setStep(step - 1);
  };

  const handleLanguageSelect = (code) => {
    setLanguage(code);
    setStep(0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Derive age from DOB
    const age = formData.dob
      ? Math.floor((Date.now() - new Date(formData.dob)) / (365.25 * 24 * 3600 * 1000))
      : null;

    try {
      const res = await fetch(`${API_BASE}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, occupation: formData.occupation, age, city: formData.city, dob: formData.dob }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('janvaani_onboarding', 'complete');
        localStorage.setItem('janvaani_profile', JSON.stringify(data.profile));
        onComplete?.(data.profile);
        return;
      }
    } catch (_) { /* fallback below */ }

    const profile = {
      sessionId: `profile-${Date.now()}`,
      name: formData.name,
      occupation: formData.occupation,
      age,
      city: formData.city,
      dob: formData.dob,
    };
    localStorage.setItem('janvaani_onboarding', 'complete');
    localStorage.setItem('janvaani_profile', JSON.stringify(profile));
    onComplete?.(profile);
    setIsSubmitting(false);
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-orange-100 opacity-50 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: step === -1 ? '5%' : `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>

        {/* App brand strip */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">J</span>
            </div>
            <span className="text-sm font-bold text-gray-900">JanVaani AI</span>
          </div>
          {step === -1 && (
            <button
              onClick={() => {
                localStorage.setItem('janvaani_onboarding', 'complete');
                onComplete?.({});
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip →
            </button>
          )}
          {step >= 0 && (
            <span className="text-xs text-gray-400 font-medium">{step + 1} / {totalSteps}</span>
          )}
        </div>

        <div className="px-6 pb-6 pt-2">
          <AnimatePresence mode="wait">
            {step === -1 ? (
              <motion.div
                key="lang-step"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <LanguageStep onSelect={handleLanguageSelect} />
              </motion.div>
            ) : (
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {/* Step icon + title */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 mb-3"
                  >
                    {React.createElement(currentStep.icon, { className: 'w-7 h-7 text-indigo-600' })}
                  </motion.div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{currentStep.title()}</h2>
                  <p className="text-sm text-gray-500">{currentStep.subtitle()}</p>
                </div>

                {/* Field */}
                <div className="mb-6">{currentStep.content()}</div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('back')}
                  </motion.button>

                  {isLastStep ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={!isStepValid() || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      {isSubmitting ? t('loading') : t('onboarding.letsStart')}
                      <Check className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      {t('next')}
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dot indicators — only for profile steps */}
          {step >= 0 && (
            <div className="flex justify-center gap-1.5 mt-5">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === step ? 'w-6 bg-indigo-500' : idx < step ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
