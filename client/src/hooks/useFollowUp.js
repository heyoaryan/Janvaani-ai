/**
 * useFollowUp
 *
 * Isolated hook for follow-up questions — completely independent of the
 * shared VoiceContext state so that:
 *   • Main query response / searchResults are never wiped
 *   • Global isProcessing / isListening flags are never toggled
 *   • Voice recording uses its own MediaRecorder + Web Speech + silence detection
 *
 * Returns:
 *   { isProcessing, isListening, silenceDetected, transcript, interim, error,
 *     submit(text, audioBlob, language, speakFn),
 *     startMic(language), stopMic() → Promise<Blob> }
 */

import { useState, useRef, useCallback } from 'react';
import { voiceApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Pick the best supported MIME type for recording
function pickMime() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

// Browser STT language map — mirrors the logic in useVoice.js.
// We always default to 'hi-IN' for unrecognized / Devanagari-family codes
// because it keeps the live interim display useful while Whisper provides
// the authoritative final transcript.
const BROWSER_STT_LANG = {
  'bn-IN': 'bn-IN',
  'ta-IN': 'ta-IN',
  'te-IN': 'te-IN',
  'kn-IN': 'kn-IN',
  'ml-IN': 'ml-IN',
  'gu-IN': 'gu-IN',
  'pa-IN': 'pa-IN',
  'od-IN': 'or-IN',
  'en-IN': 'en-IN',
  'mai-IN': 'hi-IN',
  'bho-IN': 'hi-IN',
};

const SILENCE_THRESHOLD    = 0.045;  // amplitude fraction 0–1
const SILENCE_DURATION     = 1800;   // ms of quiet after speech → auto-stop
const MAX_LISTEN_DURATION  = 15000;  // hard cap

export function useFollowUp() {
  const { user } = useAuth();

  const [isProcessing,    setIsProcessing]    = useState(false);
  const [isListening,     setIsListening]     = useState(false);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const [transcript,      setTranscript]      = useState('');
  const [interim,         setInterim]         = useState('');
  const [error,           setError]           = useState('');

  // Internal refs
  const recorderRef       = useRef(null);
  const chunksRef         = useRef([]);
  const recognitionRef    = useRef(null);
  const streamRef         = useRef(null);
  const audioContextRef   = useRef(null);
  const analyserRef       = useRef(null);
  const silenceTimerRef   = useRef(null);
  const maxTimerRef       = useRef(null);
  const stopResolveRef    = useRef(null);
  const interimRef        = useRef('');
  const isListeningRef    = useRef(false);
  const heardSpeechRef    = useRef(false);
  const lastActivityRef   = useRef(Date.now());

  // ── internal cleanup ────────────────────────────────────────────────────
  const _cleanup = useCallback((blob) => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (maxTimerRef.current)     { clearTimeout(maxTimerRef.current);     maxTimerRef.current = null; }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    const res = stopResolveRef.current;
    stopResolveRef.current = null;
    res?.(blob ?? null);
  }, []);

  // ── startMic ────────────────────────────────────────────────────────────
  const startMic = useCallback(async (language = 'hi-IN') => {
    setError('');
    setTranscript('');
    setInterim('');
    setSilenceDetected(false);
    interimRef.current    = '';
    chunksRef.current     = [];
    heardSpeechRef.current = false;
    lastActivityRef.current = Date.now();

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied.');
      return;
    }
    streamRef.current = stream;

    // ── MediaRecorder (for Whisper) ──────────────────────────────────────
    const mime = pickMime();
    const recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorderRef.current = recorder;
    recorder.start(250);

    // ── AudioContext analyser for silence detection ───────────────────────
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
    } catch { /* silence detection unavailable — manual stop still works */ }

    // ── Web Speech API (live transcript display) ─────────────────────────
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = BROWSER_STT_LANG[language] ?? 'hi-IN';
      recognitionRef.current = rec;

      rec.onresult = (ev) => {
        lastActivityRef.current = Date.now();
        heardSpeechRef.current  = true;
        let final = '';
        let inter = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
          else                       inter += ev.results[i][0].transcript;
        }
        if (final) setTranscript((p) => `${p} ${final}`.trim());
        interimRef.current = inter;
        setInterim(inter);
      };
      rec.onerror = () => {};
      rec.onend = () => {
        if (isListeningRef.current) {
          try { rec.start(); } catch { /* ignore restart race */ }
        }
      };
      try { rec.start(); } catch { /* Whisper handles it */ }
    }

    isListeningRef.current = true;
    setIsListening(true);

    // ── Silence detection loop ───────────────────────────────────────────
    const checkSilence = () => {
      if (!isListeningRef.current) return;
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const level = data.reduce((s, v) => s + v, 0) / (data.length * 255);
        if (level >= SILENCE_THRESHOLD) {
          lastActivityRef.current = Date.now();
          heardSpeechRef.current  = true;
        }
      }
      const elapsed = Date.now() - lastActivityRef.current;
      if (heardSpeechRef.current && elapsed >= SILENCE_DURATION) {
        setSilenceDetected(true);
        stopMic();          // eslint-disable-line no-use-before-define
        return;
      }
      silenceTimerRef.current = setTimeout(checkSilence, 200);
    };
    silenceTimerRef.current = setTimeout(checkSilence, 200);

    // Hard cap
    maxTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        setSilenceDetected(true);
        stopMic();          // eslint-disable-line no-use-before-define
      }
    }, MAX_LISTEN_DURATION);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── stopMic ─────────────────────────────────────────────────────────────
  /** Returns a Promise<Blob|null> */
  const stopMic = useCallback(() => {
    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      isListeningRef.current = false;

      // Flush interim into transcript
      const leftover = (interimRef.current || '').trim();
      if (leftover) {
        setTranscript((p) => (p ? `${p} ${leftover}` : leftover).trim());
        interimRef.current = '';
        setInterim('');
      }

      // Stop Web Speech
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }

      // Stop recorder — blob assembled in onstop
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          const blob = chunksRef.current.length
            ? new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
            : null;
          recorderRef.current = null;
          _cleanup(blob);
        };
        try { recorder.stop(); } catch { _cleanup(null); }
      } else {
        recorderRef.current = null;
        _cleanup(null);
      }
    });
  }, [_cleanup]);

  // ── submit ───────────────────────────────────────────────────────────────
  /**
   * @param {string}    textInput  — browser STT / typed text (fallback)
   * @param {Blob|null} audioBlob  — raw audio for Whisper transcription
   * @param {string}    language   — user's selected BCP-47 code (e.g. 'hi-IN')
   * @param {Function}  speakFn    — VoiceContext speak(text, lang)
   * @returns {Promise<object|null>} API response
   */
  const submit = useCallback(async (textInput, audioBlob, language, speakFn) => {
    let text = (textInput || '').trim();
    setIsProcessing(true);
    setError('');

    try {
      // ── Step 1: Whisper transcription — always uses user's selected language ──
      const hasAudio = audioBlob && audioBlob.size > 0;
      if (hasAudio) {
        try {
          const result = await voiceApi.transcribe(audioBlob, language);
          const whisper = (result?.transcription || '').trim();
          if (whisper) {
            const isNonEnglish = language && language !== 'en-IN';
            if (isNonEnglish || !text || whisper.length >= text.length) {
              text = whisper;
            }
          }
        } catch { /* keep browser STT text */ }
      }

      if (!text) {
        setError('No input detected. Please type or speak your question.');
        return null;
      }

      // ── Step 2: API call ──────────────────────────────────────────────────
      const sessionId = user?.sessionId;
      const userProfile = {
        name:       user?.name       || '',
        occupation: user?.occupation || '',
        age:        user?.age        || '',
        gender:     user?.gender     || '',
        state:      user?.state      || '',
        income:     user?.income     || user?.annualIncome || '',
      };

      const data = await voiceApi.process(text, sessionId, language, userProfile);
      if (!data?.success) throw new Error(data?.message || 'Processing failed');

      // ── Step 3: TTS — speak answer in the same language ───────────────────
      const responseLang = data.responseLanguage || data.language || language;
      if (data.response && speakFn) {
        speakFn(data.response, responseLang);
      }

      data._question = text;
      return data;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  return {
    isProcessing,
    isListening,
    silenceDetected,
    transcript,
    interim,
    error,
    submit,
    startMic,
    stopMic,
  };
}
