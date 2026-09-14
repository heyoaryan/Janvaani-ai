import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, IndianRupee, Check, AlertCircle, RotateCcw, Save, Trash2, FileX,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { INDIAN_STATES, normalizeState } from '@/data/indianStates';
import { clearAllDocData } from '@/utils/docCatalog';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dobFromAge(age) {
  if (!age) return '';
  const year = new Date().getFullYear() - Number(age);
  return `${year}-01-01`;
}

function ageFromDob(dob) {
  if (!dob) return '';
  const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
  return age > 0 ? age : '';
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      {hint && <span className="ml-1.5 text-xs font-normal text-gray-400">({hint})</span>}
    </label>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const ManageProfile = () => {
  const { t } = useLanguage();
  const { user, updateUser, resetUser } = useAuth();

  const [form, setForm] = useState({
    name:       user.name       || '',
    dob:        user.dob        || dobFromAge(user.age),
    gender:     user.gender     || '',
    city:       user.city       || '',
    state:      normalizeState(user.state) || '',
    occupation: user.occupation || '',
    income:     user.income     || '',
  });

  const [saved, setSaved]               = useState(false);
  const [showReset, setShowReset]       = useState(false);
  const [showClearDocs, setShowClearDocs] = useState(false);
  const [docsCleared, setDocsCleared]   = useState(false);
  const [dirty, setDirty]               = useState(false);
  // Track if name changed so we can warn + auto-clear docs
  const [nameChanged, setNameChanged]   = useState(false);

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setDirty(true);
    if (key === 'name') {
      setNameChanged(value.trim().toLowerCase() !== (user.name || '').toLowerCase());
    }
  };

  const handleSave = () => {
    const age = form.dob ? ageFromDob(form.dob) : (user.age || '');
    updateUser({
      name:       form.name.trim(),
      dob:        form.dob,
      age,
      gender:     form.gender,
      city:       form.city.trim(),
      state:      form.state,
      occupation: form.occupation,
      income:     form.income ? Number(form.income) : '',
    });
    // Name changed → saved verifications are no longer valid for this person
    if (nameChanged) {
      clearAllDocData();
      setNameChanged(false);
    }
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearDocs = () => {
    clearAllDocData();
    setShowClearDocs(false);
    setDocsCleared(true);
    setTimeout(() => setDocsCleared(false), 3000);
  };

  const handleReset = () => {
    clearAllDocData();
    resetUser();
    setForm({ name: '', dob: '', gender: '', city: '', state: '', occupation: '', income: '' });
    setShowReset(false);
    setDirty(false);
    setSaved(false);
    setNameChanged(false);
  };

  const OCCUPATIONS = [
    { key: 'student',       label: t('onboarding.occupations.student') },
    { key: 'farmer',        label: t('onboarding.occupations.farmer') },
    { key: 'employed',      label: t('onboarding.occupations.employed') },
    { key: 'self-employed', label: t('onboarding.occupations.selfEmployed') },
    { key: 'business',      label: t('onboarding.occupations.business') },
    { key: 'homemaker',     label: t('onboarding.occupations.homemaker') },
    { key: 'unemployed',    label: t('onboarding.occupations.unemployed') },
    { key: 'retired',       label: t('onboarding.occupations.retired') },
    { key: 'other',         label: t('onboarding.occupations.other') },
  ];

  const inputCls  = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm transition-all';
  const selectCls = `${inputCls} appearance-none cursor-pointer`;
  const displayAge = form.dob ? ageFromDob(form.dob) : '';

  return (
    <div className="space-y-6 px-4 py-4 max-w-2xl mx-auto">

      {/* ── Page header ── */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold mb-3">
          <User className="w-3.5 h-3.5" />
          {t('profile.pageTitle')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {user.name
            ? `${user.name} ${t('profile.possessive')} Profile`
            : t('profile.pageTitle')}
        </h1>
        <p className="text-sm text-gray-500">{t('profile.subtitle')}</p>
      </div>

      {/* ── Save success banner ── */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium"
          >
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-green-600" />
            </div>
            {t('profile.savedSuccess')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Name changed warning ── */}
      <AnimatePresence>
        {nameChanged && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <p>
              <span className="font-semibold">नाम बदल रहे हैं?</span>
              {' '}Save करने पर सभी सहेजे गए दस्तावेज़ सत्यापन हट जाएंगे — नए नाम से दोबारा अपलोड करें।
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Docs cleared banner ── */}
      <AnimatePresence>
        {docsCleared && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-blue-600" />
            </div>
            सभी दस्तावेज़ डेटा साफ़ कर दिया गया। अब नए सिरे से अपलोड करें।
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form ── */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          {t('profile.personalInfo')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Name */}
          <div className="sm:col-span-2">
            <Field label={t('profile.name')}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder={t('onboarding.namePlaceholder')}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Date of Birth */}
          <Field
            label={t('onboarding.stepDobTitle')}
            hint={displayAge ? `${displayAge} ${t('onboarding.years')}` : null}
          >
            <input
              type="date"
              value={form.dob}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => set('dob', e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* Gender */}
          <Field label={t('onboarding.stepGenderTitle')}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'male',   emoji: '👨', label: t('eligibility.male') },
                { key: 'female', emoji: '👩', label: t('eligibility.female') },
                { key: 'other',  emoji: '🧑', label: t('eligibility.other') },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => set('gender', opt.key)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.gender === opt.key
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-100 hover:border-primary-200 text-gray-600'
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  {opt.label}
                  {form.gender === opt.key && <Check className="w-3 h-3 text-primary-600" />}
                </button>
              ))}
            </div>
          </Field>

          {/* City */}
          <Field label={t('onboarding.stepCityTitle')}>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder={t('onboarding.cityPlaceholder')}
              className={inputCls}
            />
          </Field>

          {/* State */}
          <Field label={t('eligibility.state')}>
            <select
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className={selectCls}
            >
              <option value="">{t('schemeFinder.allLocations')}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(`states.${s.id}`).startsWith('states.') ? s.id : t(`states.${s.id}`)}
                </option>
              ))}
            </select>
          </Field>

          {/* Occupation */}
          <div className="sm:col-span-2">
            <Field label={t('eligibility.occupation')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OCCUPATIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => set('occupation', opt.key)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                      form.occupation === opt.key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-100 hover:border-primary-200 text-gray-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {form.occupation === opt.key && (
                      <Check className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Annual Income */}
          <div className="sm:col-span-2">
            <Field label={t('eligibility.annualIncome')} hint={t('profile.incomeHint')}>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={form.income}
                  onChange={(e) => set('income', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={`${inputCls} pl-9`}
                />
              </div>
              {form.income && (
                <p className="text-xs text-gray-400 mt-1">
                  ₹{Number(form.income).toLocaleString('en-IN')} / {t('onboarding.years')}
                </p>
              )}
            </Field>
          </div>
        </div>
      </Card>

      {/* ── Action buttons ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleSave}
          icon={saved ? Check : Save}
          disabled={!dirty && !saved}
          className="flex-1 sm:flex-none"
          variant={saved ? 'secondary' : 'primary'}
        >
          {saved ? t('profile.saved') : t('profile.saveChanges')}
        </Button>

        <Button
          variant="outline"
          icon={FileX}
          onClick={() => setShowClearDocs(true)}
          className="flex-1 sm:flex-none text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          दस्तावेज़ डेटा साफ़ करें
        </Button>

        <Button
          variant="outline"
          icon={RotateCcw}
          onClick={() => setShowReset(true)}
          className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
        >
          {t('profile.resetProfile')}
        </Button>
      </div>

      {/* ── Clear docs confirmation modal ── */}
      <AnimatePresence>
        {showClearDocs && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearDocs(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">दस्तावेज़ डेटा साफ़ करें?</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    सभी योजनाओं के अपलोड किए गए दस्तावेज़ और सत्यापन हट जाएंगे।
                    आपकी प्रोफाइल सुरक्षित रहेगी।
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowClearDocs(false)}>
                  {t('profile.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                  icon={Trash2}
                  onClick={handleClearDocs}
                >
                  हाँ, साफ़ करें
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reset confirmation modal ── */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReset(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{t('profile.resetConfirmTitle')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('profile.resetConfirmDetail')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowReset(false)}>
                  {t('profile.cancel')}
                </Button>
                <Button variant="danger" className="flex-1" icon={RotateCcw} onClick={handleReset}>
                  {t('profile.confirmReset')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageProfile;
