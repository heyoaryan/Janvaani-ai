import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, Mic, MicOff, Volume2,
  Loader2, X, FileText, ArrowLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { schemes } from '@/data/schemes';
import { localizeScheme, schemeMatchesQuery, localizeCategory, extractedProfileUpdates, inferOccupationFromQuery } from '@/utils/schemeLocale';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const {
    lastResponse, processVoice, speak,
    isListening, isProcessing, isSpeaking,
    startListening, stopListening,
    transcript, interimTranscript, silenceDetected, audioBlob,
  } = useVoice();
  const { t, currentLanguage, language } = useLanguage();
  const audioBlobRef = useRef(audioBlob);
  audioBlobRef.current = audioBlob;
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const interimRefDash = useRef(interimTranscript);
  interimRefDash.current = interimTranscript;
  const processedSilenceRef = useRef(false);
  const searchInFlightRef = useRef(false);

  // mode: null = home, 'mic' = voice, 'type' = text
  const [mode, setMode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const announcedForRef = useRef(null);

  const roleLabel = (occ) => {
    if (occ === 'farmer') return t('dashboard.roleFarmer');
    if (occ === 'student') return t('dashboard.roleStudent');
    return '';
  };

  const buildFoundIntro = (count, occ) => {
    const role = roleLabel(occ);
    const title = role
      ? t('dashboard.foundIntro', { role, count })
      : t('dashboard.foundIntroGeneric', { count });
    return { title, hint: t('dashboard.foundIntroHint') };
  };

  const speakFoundIntro = (count, occ, queryKey) => {
    if (!count) return;
    const key = queryKey || `${occ || 'any'}:${count}`;
    if (announcedForRef.current === key) return;
    announcedForRef.current = key;
    const { title, hint } = buildFoundIntro(count, occ);
    speak(`${title} ${hint}`, language);
  };

  const applyQueryProfile = (query, entities) => {
    const updates = extractedProfileUpdates(entities || {}, user);
    const occ = inferOccupationFromQuery(query);
    if (occ && !user.occupation && !updates.occupation) updates.occupation = occ;
    if (Object.keys(updates).length) updateUser(updates);
    return occ || updates.occupation || user.occupation || '';
  };

  const handleVoiceProcess = async (blob) => {
    if (searchInFlightRef.current) return;
    searchInFlightRef.current = true;
    await new Promise((r) => setTimeout(r, 50));
    const text = `${transcriptRef.current || ''} ${interimRefDash.current || ''}`.trim();
    const audio = blob || audioBlobRef.current;

    // Need at least some audio or text to proceed
    if (!text && !(audio && audio.size > 0)) {
      searchInFlightRef.current = false;
      return;
    }
    try {
      setHasSearched(true);
      const hasAudio = Boolean(audio && audio.size > 0);
      // Voice: always send audio to the API so Tamil/Telugu/etc. is transcribed
      // in the selected language. Browser STT is only a fallback when there is no clip.
      if (hasAudio) {
        const res = await processVoice(text, audio);
        const spoken = (res?.transcription || text || '').trim();
        const occ = applyQueryProfile(spoken, res?.entities);
        const apiSchemes = res?.suggestedSchemes || [];
        if (apiSchemes.length) {
          speakFoundIntro(apiSchemes.length, inferOccupationFromQuery(spoken) || occ, spoken);
        } else if (res?.response) {
          speak(res.response, language);
        }
        return;
      }

      const local = text.length >= 2
        ? schemes.filter((s) => schemeMatchesQuery(s, text)).slice(0, 6)
        : [];
      const occ = applyQueryProfile(text, {});
      if (local.length) {
        speakFoundIntro(local.length, occ, text);
        return;
      }
      const res = await processVoice(text, audio);
      applyQueryProfile(text || res?.transcription || '', res?.entities);
      const apiSchemes = res?.suggestedSchemes || [];
      if (apiSchemes.length) {
        speakFoundIntro(apiSchemes.length, inferOccupationFromQuery(text) || occ, text);
      } else if (res?.response) {
        speak(res.response, language);
      }
    } finally {
      searchInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!silenceDetected) {
      processedSilenceRef.current = false;
      return;
    }
    if (mode !== 'mic' || processedSilenceRef.current) return;
    if (audioBlob?.size > 0) {
      processedSilenceRef.current = true;
      handleVoiceProcess(audioBlob);
      return;
    }
    const timer = setTimeout(() => {
      if (processedSilenceRef.current) return;
      processedSilenceRef.current = true;
      handleVoiceProcess(audioBlobRef.current);
    }, 150);
    return () => clearTimeout(timer);
  }, [silenceDetected, audioBlob, mode]);

  const handleMicToggle = async () => {
    if (isListening) {
      const blob = await stopListening();
      processedSilenceRef.current = true;
      await handleVoiceProcess(blob);
    } else {
      searchInFlightRef.current = false;
      processedSilenceRef.current = false;
      announcedForRef.current = null;
      startListening();
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setHasSearched(true);
    announcedForRef.current = null;
    const local = schemes.filter((s) => schemeMatchesQuery(s, query)).slice(0, 6);
    const occ = applyQueryProfile(query, {});
    if (local.length) {
      speakFoundIntro(local.length, occ, query);
      return;
    }
    const res = await processVoice(query);
    applyQueryProfile(query, res?.entities);
    if (res?.suggestedSchemes?.length) {
      speakFoundIntro(res.suggestedSchemes.length, inferOccupationFromQuery(query) || user.occupation, query);
    } else if (res?.response) {
      speak(res.response, language);
    }
  };

  const handleReset = () => {
    setMode(null);
    setSearchQuery('');
    setHasSearched(false);
    announcedForRef.current = null;
    stopListening();
  };

  const handleSwitchMode = (newMode) => {
    stopListening();
    setMode(newMode);
    setHasSearched(false);
    setSearchQuery('');
    announcedForRef.current = null;
  };

  const liveText = transcript + (interimTranscript ? ' ' + interimTranscript : '');
  const activeQuery = (mode === 'mic' ? `${transcript} ${interimTranscript}` : searchQuery).trim();
  const inferredOcc = inferOccupationFromQuery(activeQuery) || user.occupation || '';

  const searchResults = useMemo(() => {
    if (!hasSearched) return [];
    const local = activeQuery.length >= 2
      ? schemes.filter((s) => schemeMatchesQuery(s, activeQuery)).slice(0, 6)
      : [];
    let source = local;
    const api = lastResponse?.suggestedSchemes || [];
    if (api.length) {
      if (inferredOcc === 'farmer') {
        const ag = api.filter((s) => s.category === 'Agriculture' || s.eligibilityRules?.farmerRequired);
        source = ag.length ? ag : local;
      } else {
        source = api;
      }
    }
    return source.map((s) => localizeScheme(s, language));
  }, [hasSearched, lastResponse, activeQuery, language, inferredOcc]);

  const intro = searchResults.length > 0 ? buildFoundIntro(searchResults.length, inferredOcc) : null;

  // ── HOME ────────────────────────────────────────────────────────
  if (mode === null) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-saffron-100 to-primary-100 border border-saffron-200 text-saffron-800 text-xs font-bold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {t('dashboard.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {user.name ? `${t('dashboard.greeting')}, ${user.name}!` : t('dashboard.greetingQuestion')}
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {t('dashboard.description')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-stretch gap-3 w-full max-w-sm"
        >
          {/* Mic */}
          <motion.button
            onClick={() => { setMode('mic'); startListening(); }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg transition-all group"
          >
            <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold">{t('dashboard.speak')}</span>
            <span className="text-xs text-primary-200">{currentLanguage.name}</span>
          </motion.button>

          {/* Divider */}
          <div className="flex flex-col items-center justify-center gap-1 select-none">
            <div className="w-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">{t('dashboard.or')}</span>
            <div className="w-px flex-1 bg-gray-200" />
          </div>

          {/* Type */}
          <motion.button
            onClick={() => setMode('type')}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-white border-2 border-gray-200 text-gray-600 shadow-lg hover:border-primary-400 hover:text-primary-600 transition-all group"
          >
            <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold">{t('dashboard.type')}</span>
            <span className="text-xs text-gray-400">{t('dashboard.searchAction')}</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── MIC / TYPE RESULTS SCREEN ──────────────────────────────────
  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex flex-col">

      {/* ── TOP INPUT BAR ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">

          {/* Back */}
          <button onClick={handleReset}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>

          {mode === 'type' ? (
            /* Type input */
            <form onSubmit={handleTypeSubmit} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
                autoFocus
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all text-sm"
              />
              {searchQuery && (
                <button type="button"
                  onClick={() => { setSearchQuery(''); setHasSearched(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          ) : (
            /* Mic status */
            <div className="flex-1 flex items-center gap-3">
              <motion.button
                onClick={handleMicToggle}
                whileTap={{ scale: 0.93 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md flex-shrink-0 transition-all ${
                  isListening ? 'bg-red-500 shadow-red-200' :
                  isProcessing ? 'bg-amber-500 shadow-amber-200' :
                  'bg-primary-600 shadow-primary-200'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isProcessing
                    ? <Loader2 key="spin" className="w-4 h-4 text-white animate-spin" />
                    : isListening
                    ? <motion.div key="on" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        <MicOff className="w-4 h-4 text-white" />
                      </motion.div>
                    : <Mic key="off" className="w-4 h-4 text-white" />
                  }
                </AnimatePresence>
              </motion.button>

              {/* Live transcript inline */}
              <div className="flex-1 min-w-0">
                {liveText.trim() ? (
                  <p className="text-sm text-gray-800 truncate">
                    {transcript}
                    {interimTranscript && <span className="text-gray-400 italic"> {interimTranscript}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    {isListening ? `${t('dashboard.listening')} · ${currentLanguage.name}` :
                     isProcessing ? t('dashboard.processing') :
                     isSpeaking ? t('dashboard.speaking') :
                     `${t('dashboard.tapMicToStart') || 'Tap mic to speak'}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Switch mode pill */}
          <button
            onClick={() => handleSwitchMode(mode === 'mic' ? 'type' : 'mic')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:border-primary-400 hover:text-primary-600 transition-all bg-white shadow-sm"
          >
            {mode === 'mic' ? <Search className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {mode === 'mic' ? t('dashboard.type') : t('dashboard.speak')}
          </button>
        </div>
      </div>

      {/* ── RESULTS BODY ── */}
      <div className="flex-1 px-4 py-5 max-w-2xl w-full mx-auto space-y-4">

        {/* Processing */}
        <AnimatePresence>
          {isProcessing && searchResults.length === 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
              <span className="text-sm text-amber-700">{t('dashboard.analyzing')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {intro && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-5 py-4"
          >
            <p className="text-base font-semibold text-gray-900 leading-snug">{intro.title}</p>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{intro.hint}</p>
          </motion.div>
        )}

        {/* ── PRIMARY SCHEME — full card ── */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              key="primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Main scheme card */}
              <PrimarySchemeCard scheme={searchResults[0]} />

              {/* Remaining schemes — compact horizontal chips */}
              {searchResults.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
                    {t('dashboard.schemesFound') || 'More schemes'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.slice(1).map((scheme, i) => (
                      <Link
                        key={scheme.id ?? i}
                        to={`/schemes/${scheme.id}`}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:text-primary-600 transition-all shadow-sm text-xs font-medium text-gray-700 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 group-hover:bg-primary-600 flex-shrink-0" />
                        <span className="max-w-[180px] truncate">{scheme.displayName || scheme.name}</span>
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-primary-500 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EMPTY STATE ── */}
        <AnimatePresence>
          {hasSearched && !isProcessing && searchResults.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('dashboard.noSchemesFound')}</p>
              <p className="text-xs mt-1">{t('dashboard.tryDifferentKeywords')}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── IDLE HINT ── */}
        {!hasSearched && !isProcessing && searchResults.length === 0 && (
          <div className="text-center py-16 text-gray-300">
            {mode === 'mic'
              ? <><Mic className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">{t('dashboard.tapMicAndSpeak')}</p></>
              : <><Search className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">{t('dashboard.typeToSearch')}</p></>
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ── PRIMARY SCHEME CARD (big, with voice) ───────────────────────
const PrimarySchemeCard = ({ scheme }) => {
  const { t, language } = useLanguage();
  const { speak } = useVoice();
  const localized = localizeScheme(scheme, language);

  const handleSpeak = () => {
    const text = `${localized.displayName}. ${localized.displayDescription}. ${(localized.displayBenefits || []).slice(0, 2).join('. ')}`;
    speak(text, language);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary-200 uppercase tracking-wide">{localizeCategory(scheme.category, t)}</span>
            {scheme.matchPercentage > 0 && (
              <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">{t('dashboard.matchPercent', { percent: scheme.matchPercentage })}</span>
            )}
          </div>
          <h2 className="text-base font-bold text-white leading-snug">{localized.displayName}</h2>
          {language !== 'hi-IN' && scheme.nameHi && <p className="text-xs text-primary-200 mt-0.5">{scheme.nameHi}</p>}
        </div>
        {/* Voice button */}
        <button
          onClick={handleSpeak}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          title={t('dashboard.listen')}
        >
          <Volume2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed">{localized.displayDescription}</p>

        {/* Benefits */}
        {localized.displayBenefits?.length > 0 && (
          <div className="bg-green-50 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">{t('dashboard.benefits')}</p>
            {localized.displayBenefits.slice(0, 3).map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-500 font-bold text-xs mt-0.5">✓</span>
                <span className="text-xs text-green-800">{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Docs + Steps row */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
          {scheme.requiredDocuments?.length > 0 && (
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {t('dashboard.documentsNeededCount', { count: scheme.requiredDocuments.length })}
            </span>
          )}
          {scheme.applicationSteps?.length > 0 && (
            <span className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5" />
              {t('dashboard.stepsToApplyCount', { count: scheme.applicationSteps.length })}
            </span>
          )}
          {scheme.officialSource && (
            <a href={scheme.officialSource} target="_blank" rel="noreferrer"
              className="ml-auto text-primary-500 hover:underline font-medium">
              {t('dashboard.officialSite')} ↗
            </a>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2 pt-1">
          <Link to={`/schemes/${scheme.id}`}
            className="flex-1 text-center px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
            {t('schemeFinder.viewDetails')}
          </Link>
          <Link to={`/eligibility?scheme=${scheme.id}`}
            className="flex-1 text-center px-4 py-2.5 rounded-xl border-2 border-primary-600 text-primary-600 text-sm font-semibold hover:bg-primary-50 transition-colors">
            {t('schemeFinder.checkEligibility')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};


const SchemeCard = ({ scheme }) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{scheme.name}</h3>
          <p className="text-xs text-primary-200 mt-0.5">{scheme.category}</p>
        </div>
        {scheme.matchPercentage > 0 && (
          <span className="flex-shrink-0 text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
            {scheme.matchPercentage}%
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{scheme.description}</p>

        {/* Benefits */}
        {scheme.benefits?.length > 0 && (
          <div className="flex flex-col gap-1">
            {scheme.benefits.slice(0, 2).map((b, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-green-500 text-xs mt-0.5">✓</span>
                <span className="text-xs text-green-700">{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Docs + steps */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {scheme.requiredDocuments?.length > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {scheme.requiredDocuments.length} {t('schemeFinder.documents')}
            </span>
          )}
          {scheme.applicationSteps?.length > 0 && (
            <span className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {scheme.applicationSteps.length} {t('schemeFinder.steps')}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <Link to={`/schemes/${scheme.id}`}
            className="flex-1 text-center px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors">
            {t('schemeFinder.viewDetails')}
          </Link>
          <Link to={`/eligibility?scheme=${scheme.id}`}
            className="flex-1 text-center px-3 py-2 rounded-xl border border-primary-300 text-primary-600 text-xs font-semibold hover:bg-primary-50 transition-colors">
            {t('schemeFinder.checkEligibility')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
