import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Check, ClipboardCheck, Clock3, FileSearch, Search, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { findApplication } from '@/data/applicationTracker';
import { useLanguage } from '@/contexts/LanguageContext';

const ApplicationTracker = () => {
  const { t, language } = useLanguage();
  const tracker = (key, params) => t(`applicationTracker.${key}`, params);
  const benefitLabels = {
    'hi-IN': { 'APP-1001': '₹ 6,000 सालाना', 'APP-1002': '₹ 1,50,000 तक', 'APP-1003': '₹ 25,000 तक', 'APP-1004': '₹ 20,000 तक', 'APP-1005': '₹ 3,000 प्रति माह' },
    'en-IN': { 'APP-1001': '₹6,000 per year', 'APP-1002': 'Up to ₹1,50,000', 'APP-1003': 'Up to ₹25,000', 'APP-1004': 'Up to ₹20,000', 'APP-1005': '₹3,000 per month' },
  };
  const [referenceId, setReferenceId] = useState('');
  const [application, setApplication] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setApplication(findApplication(referenceId));
    setHasSearched(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      <section className="rounded-2xl border border-primary-100 bg-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl"><div className="flex items-center gap-2 text-primary-700 text-sm font-semibold mb-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50"><Sparkles className="w-4 h-4" /></span> {tracker('eyebrow')}</div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{tracker('title')}</h1><p className="text-gray-600 text-sm sm:text-base">{tracker('subtitle')}</p></div>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl"><label className="sr-only" htmlFor="reference-id">{tracker('reference')}</label><input id="reference-id" value={referenceId} onChange={(event) => setReferenceId(event.target.value.toUpperCase())} placeholder={tracker('referencePlaceholder')} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" autoComplete="off" /><Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white border-0 whitespace-nowrap"><Search className="w-4 h-4" /> {tracker('track')}</Button></form>
        <p className="mt-3 text-xs text-gray-500">{tracker('demoIds')}</p>
      </section>
      {!hasSearched && <Card className="border-dashed border-primary-200 bg-primary-50/40"><div className="py-10 text-center"><ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-primary-500" /><h2 className="text-lg font-bold text-gray-900">{tracker('emptyTitle')}</h2><p className="text-sm text-gray-600 mt-1">{tracker('emptyText')}</p></div></Card>}
      {hasSearched && !application && <Card className="border-red-100 bg-red-50"><div className="flex gap-3 items-start"><AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /><div><h2 className="font-bold text-red-900">{tracker('notFoundTitle')}</h2><p className="text-sm text-red-700 mt-1">{tracker('notFoundText')}</p></div></div></Card>}
      {application && <div className="space-y-5"><Card className="border-primary-100" header={<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{tracker('reference')}</p><p className="font-bold text-xl text-gray-900">{application.referenceId}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1.5 text-sm font-semibold"><Clock3 className="w-4 h-4" /> {tracker(`status.${application.statusKey}`)}</span></div>}><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div><p className="text-xs text-gray-500">{tracker('scheme')}</p><p className="font-semibold text-gray-900 mt-1">{application.scheme}</p></div><div><p className="text-xs text-gray-500">{tracker('currentStage')}</p><p className="font-semibold text-gray-900 mt-1">{tracker(`stage.${application.stageKey}`)}</p></div><div><p className="text-xs text-gray-500">{tracker('nextUpdate')}</p><p className="font-semibold text-gray-900 mt-1">{application.nextUpdateKey ? tracker(`nextUpdates.${application.nextUpdateKey}`) : application.nextUpdate}</p></div><div><p className="text-xs text-gray-500">{tracker('benefit')}</p><p className="font-semibold text-gray-900 mt-1">{benefitLabels[language]?.[application.referenceId] || benefitLabels['en-IN'][application.referenceId]}</p></div></div></Card><Card header={<div><h2 className="text-lg font-bold text-gray-900">{tracker('journey')}</h2><p className="text-sm text-gray-500 mt-1">{tracker('journeyText')}</p></div>}><div className="space-y-0">{application.steps.map((step, index) => <div key={step.key} className="flex gap-4 min-h-[72px]"><div className="flex flex-col items-center"><div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${step.state === 'done' ? 'bg-green-100 text-green-700' : step.state === 'current' ? 'bg-primary-100 text-primary-700 ring-4 ring-primary-50' : 'bg-gray-100 text-gray-400'}`}>{step.state === 'done' ? <Check className="w-4 h-4" /> : step.state === 'current' ? <FileSearch className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</div>{index < application.steps.length - 1 && <div className={`w-0.5 flex-1 my-1 ${step.state === 'done' ? 'bg-green-200' : 'bg-gray-200'}`} />}</div><div className="pb-6 pt-1"><p className={`font-semibold ${step.state === 'current' ? 'text-primary-700' : 'text-gray-800'}`}>{tracker(`steps.${step.key}`)}</p><p className="text-sm text-gray-500 mt-0.5">{step.dateKey ? tracker(`dates.${step.dateKey}`) : step.date}</p></div></div>)}</div></Card></div>}
    </div>
  );
};

export default ApplicationTracker;