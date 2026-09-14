import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, MessageCircle, Loader2, X, Volume2 } from 'lucide-react';
import { useFollowUp } from '@/hooks/useFollowUp';
import { useVoice } from '@/contexts/VoiceContext';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * FollowUpInput
 *
 * Completely isolated from the shared VoiceContext recording/processing state.
 * Uses its own MediaRecorder + Web Speech instance via useFollowUp hook so that:
 *   • Main query response and searchResults are never wiped mid-session
 *   • Global isProcessing / isListening flags stay clean
 *   • Answer always comes back in the user's selected language
 *
 * Props:
 *   onAnswer(responseData) — called with API response once follow-up is answered
 *   className             — extra wrapper classes
 */
const FollowUpInput = ({ onAnswer, className = '' }) => {
  const { language, currentLanguage, t } = useLanguage();
  const { speak } = useVoice();                     // only for TTS, no state shared
  const {
    isProcessing,
    isListening,
    silenceDetected,
    transcript,
    interim,
    error: hookError,
    submit,
    startMic,
    stopMic,
  } = useFollowUp();

  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('text');          // 'text' | 'mic'
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState('');
  const inputRef = useRef(null);

  // Sync hook error into local error so it shows in UI
  useEffect(() => {
    if (hookError) setLocalError(hookError);
  }, [hookError]);

  // ── Refs for mic auto-submit path ───────────────────────────────────────
  const processedSilenceRef = useRef(false);
  const transcriptRef       = useRef(transcript);
  transcriptRef.current     = transcript;

  // Auto-submit when silence is detected — no manual tap needed
  useEffect(() => {
    if (!silenceDetected || mode !== 'mic') return;
    if (processedSilenceRef.current) return;
    processedSilenceRef.current = true;
    const captured = transcriptRef.current.trim();
    // stopMic returns the blob, then we submit
    stopMic().then((blob) => {
      submit(captured, blob, language, speak).then((res) => {
        if (res) {
          onAnswer?.(res);
          setExpanded(false);
          setMode('text');
        }
        processedSilenceRef.current = false;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silenceDetected]);

  // Reset silence guard when mic starts fresh
  useEffect(() => {
    if (isListening) processedSilenceRef.current = false;
  }, [isListening]);

  // Auto-focus text input when expanded
  useEffect(() => {
    if (expanded && mode === 'text') {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [expanded, mode]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleOpen = () => {
    setExpanded(true);
    setLocalError('');
    setText('');
    setMode('text');
  };

  const handleClose = () => {
    setExpanded(false);
    setText('');
    setLocalError('');
    if (isListening) stopMic();
    setMode('text');
  };

  // ── Text submit ──────────────────────────────────────────────────────────
  const handleTextSubmit = async (e) => {
    e?.preventDefault();
    const query = text.trim();
    if (!query || isProcessing) return;
    setLocalError('');

    const res = await submit(query, null, language, speak);
    if (res) {
      onAnswer?.(res);
      setText('');
      setExpanded(false);
    }
  };

  // ── Voice submit ─────────────────────────────────────────────────────────
  const handleMicToggle = async () => {
    if (isListening) {
      // Manual stop — same as auto silence path
      processedSilenceRef.current = true;
      const blob = await stopMic();
      const captured = transcriptRef.current.trim();
      setLocalError('');
      const res = await submit(captured, blob, language, speak);
      if (res) {
        onAnswer?.(res);
        setExpanded(false);
        setMode('text');
      }
      processedSilenceRef.current = false;
    } else {
      // Start recording — silence detection will auto-submit
      setLocalError('');
      processedSilenceRef.current = false;
      await startMic(language);
    }
  };

  const switchToMic = async () => {
    setMode('mic');
    setLocalError('');
    processedSilenceRef.current = false;
    await startMic(language);
  };

  const switchToText = async () => {
    if (isListening) await stopMic();
    setMode('text');
  };

  const isLoading = isProcessing;
  const liveText = `${transcript}${interim ? ' ' + interim : ''}`.trim();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full ${className}`}>
      <AnimatePresence mode="wait">
        {/* ── Collapsed pill ── */}
        {!expanded && (
          <motion.button
            key="pill"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            onClick={handleOpen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary-300 bg-primary-50 hover:bg-primary-100 hover:border-primary-400 transition-all text-sm text-primary-700 font-medium w-full justify-center group"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {t('followUp.askFollowUp')}
          </motion.button>
        )}

        {/* ── Expanded state ── */}
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="rounded-2xl border border-primary-200 bg-white shadow-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary-50 border-b border-primary-100">
              <span className="text-xs font-semibold text-primary-700 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                {t('followUp.title')}
                <span className="text-primary-400 font-normal">· {currentLanguage.name}</span>
              </span>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-primary-400 hover:text-primary-700 hover:bg-primary-100 transition-colors"
                aria-label={t('close')}
                disabled={isLoading}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input body */}
            <div className="px-4 py-3 space-y-2">

              {/* ── Text mode ── */}
              {mode === 'text' && (
                <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('followUp.placeholder', { lang: currentLanguage.name })}
                    disabled={isLoading}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all placeholder-gray-400 disabled:opacity-60"
                  />
                  {/* Switch to mic */}
                  <button
                    type="button"
                    onClick={switchToMic}
                    disabled={isLoading}
                    className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all disabled:opacity-40 flex-shrink-0"
                    title={t('voice.tapToSpeak')}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  {/* Send */}
                  <button
                    type="submit"
                    disabled={!text.trim() || isLoading}
                    className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white hover:bg-primary-700 transition-colors disabled:opacity-40 flex-shrink-0"
                    title={t('submit')}
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </form>
              )}

              {/* ── Mic mode ── */}
              {mode === 'mic' && (
                <div className="flex items-center gap-3">
                  {/* Mic button */}
                  <motion.button
                    onClick={handleMicToggle}
                    disabled={isLoading && !isListening}
                    whileTap={{ scale: 0.93 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md flex-shrink-0 transition-all ${
                      isListening
                        ? 'bg-red-500 shadow-red-200'
                        : isLoading
                        ? 'bg-amber-500 shadow-amber-200'
                        : 'bg-primary-600 shadow-primary-200'
                    }`}
                  >
                    {isLoading && !isListening ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <MicOff className="w-4 h-4 text-white" />
                      </motion.div>
                    ) : (
                      <Mic className="w-4 h-4 text-white" />
                    )}
                  </motion.button>

                  {/* Live transcript / waveform */}
                  <div className="flex-1 min-w-0">
                    {isListening ? (
                      <div className="flex items-center gap-1.5 h-6">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-red-500 rounded-full"
                            animate={{ height: ['30%', '100%', '30%'] }}
                            transition={{
                              duration: 0.7,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: 'easeInOut',
                            }}
                            style={{ minHeight: 4, maxHeight: 24 }}
                          />
                        ))}
                        {liveText && (
                          <span className="text-xs text-gray-500 ml-2 truncate max-w-[120px]">
                            {liveText}
                          </span>
                        )}
                      </div>
                    ) : isLoading ? (
                      <p className="text-xs text-amber-600 font-medium">
                        {t('dashboard.analyzing') || 'Analyzing…'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 truncate">
                        {liveText || t('followUp.tapMicToAsk')}
                      </p>
                    )}
                  </div>

                  {/* Switch to text */}
                  <button
                    onClick={switchToText}
                    disabled={isLoading}
                    className="text-xs text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0 disabled:opacity-40"
                  >
                    {t('dashboard.type')}
                  </button>
                </div>
              )}

              {/* Error */}
              {localError && (
                <p className="text-xs text-red-500 text-center">{localError}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FollowUpInput;
