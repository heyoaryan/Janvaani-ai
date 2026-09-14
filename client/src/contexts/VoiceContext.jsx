import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceRecognition } from '@/hooks/useVoice';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { voiceApi } from '@/services/api';

const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  const { user } = useAuth();
  const { language: appLanguage, setLanguage: setAppLanguage } = useLanguage();
  const [lastResponse, setLastResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const language = appLanguage;

  // ── Language ref — always current, avoids stale closures in speak() ──────
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);

  // Browser Web Speech API runs in the user's selected language for live display.
  // Whisper on the backend also uses the same selected language — no auto-switching.
  const { isListening, transcript, interim, audioBlob, error: sttError, silenceDetected, start, stop } = useVoiceRecognition(language);

  const startListening = useCallback(() => {
    setError(null);
    setLastResponse(null);
    start();
  }, [start]);

  const stopListening = useCallback(() => stop(), [stop]);

  // ── speak ─────────────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text, responseLanguage) => {
    if (!text) return;
    stopSpeaking();

    // Always use the explicitly passed responseLanguage.
    // Fall back to languageRef (always current — no stale closure risk).
    const lang = responseLanguage || languageRef.current;
    const short = text.length > 400 ? `${text.slice(0, 400).trim()}…` : text;

    try {
      setIsSpeaking(true);
      const result = await voiceApi.synthesize(short, lang);
      if (result?.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audioRef.current = audio;

        audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };

        audio.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          _browserSpeak(short, lang);
        };

        // Guard against empty/corrupt audio from edge-tts
        audio.oncanplaythrough = () => {
          if (audio.duration === 0 || !isFinite(audio.duration)) {
            setIsSpeaking(false);
            audioRef.current = null;
            _browserSpeak(short, lang);
            return;
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setIsSpeaking(false);
            audioRef.current = null;
            _browserSpeak(short, lang);
          });
        }
        return;
      }
    } catch {
      // synthesize API failed — fall through to browser TTS
    }

    setIsSpeaking(false);
    _browserSpeak(short, lang);
  }, [stopSpeaking]); // intentionally no 'language' dep — languageRef always current

  const clearError = useCallback(() => setError(null), []);

  const setLanguage = useCallback((newLang) => {
    setAppLanguage(newLang);
  }, [setAppLanguage]);

  // ── processVoice ──────────────────────────────────────────────────────────
  const processVoice = useCallback(async (input = '', recordedAudio = null) => {
    let text = (input || '').trim();

    setIsProcessing(true);
    setError(null);
    setLastResponse(null);
    try {
      const audioAvailable = recordedAudio && recordedAudio.size > 0;
      if (audioAvailable) {
        try {
          // Always send the user's currently selected language — no auto-switching.
          const transcription = await voiceApi.transcribe(recordedAudio, languageRef.current);
          const whisperText = (transcription?.transcription || '').trim();
          if (whisperText) {
            // Prefer Whisper for non-English; for English prefer if longer
            const isNonEnglish = languageRef.current !== 'en-IN';
            if (isNonEnglish || !text || whisperText.length >= text.length) {
              text = whisperText;
            }
          }
        } catch {
          // Browser STT transcript stays as fallback
        }
      }

      if (!text) text = (transcript || '').trim();
      if (!text) return null;

      const sessionId = user.sessionId;
      const userProfile = {
        name: user.name || '',
        occupation: user.occupation || '',
        age: user.age || '',
        gender: user.gender || '',
        state: user.state || '',
        income: user.income || user.annualIncome || '',
      };
      const data = await voiceApi.process(text, sessionId, languageRef.current, userProfile);
      if (!data?.success) {
        throw new Error(data?.message || 'Voice processing failed');
      }
      setLastResponse(data);
      return data;
    } catch (err) {
      setError(err.message || 'Voice processing failed. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, user]); // languageRef used directly — no stale closure

  const currentError = error || sttError;

  return (
    <VoiceContext.Provider value={{
      isListening, transcript, interimTranscript: interim, audioBlob, silenceDetected,
      isProcessing, lastResponse, language, error: currentError, isSpeaking,
      startListening, stopListening, processVoice, speak, stopSpeaking, setLanguage, clearError,
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

// ── Browser TTS fallback ──────────────────────────────────────────────────────
// Used when edge-tts audio fails or browser blocks autoplay.
// lang is always explicitly passed so it's never stale.
function _browserSpeak(text, lang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);

  // BCP-47 fix: Odia browser code is 'or-IN', not 'od-IN'
  const bcp47 = lang === 'od-IN' ? 'or-IN' : lang;
  utt.lang = bcp47;

  const PROSODY = {
    'hi-IN':  { rate: 0.90, pitch: 1.05 },
    'en-IN':  { rate: 0.95, pitch: 1.00 },
    'bn-IN':  { rate: 0.88, pitch: 1.05 },
    'ta-IN':  { rate: 0.85, pitch: 1.00 },
    'te-IN':  { rate: 0.85, pitch: 1.00 },
    'mr-IN':  { rate: 0.88, pitch: 1.05 },
    'gu-IN':  { rate: 0.88, pitch: 1.05 },
    'kn-IN':  { rate: 0.85, pitch: 1.00 },
    'ml-IN':  { rate: 0.85, pitch: 1.00 },
    'pa-IN':  { rate: 0.88, pitch: 1.05 },
    'or-IN':  { rate: 0.85, pitch: 1.00 },
    'mai-IN': { rate: 0.90, pitch: 1.05 },
    'bho-IN': { rate: 0.90, pitch: 1.05 },
  };
  const prosody = PROSODY[bcp47] || { rate: 0.90, pitch: 1.00 };
  utt.rate  = prosody.rate;
  utt.pitch = prosody.pitch;

  const _doSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const prefix = (bcp47 || 'hi').split('-')[0];

    // Find the best voice for this language
    const match =
      voices.find(v => v.lang === bcp47 && /neural|premium|enhanced/i.test(v.name)) ||
      voices.find(v => v.lang === bcp47) ||
      voices.find(v => v.lang.toLowerCase().startsWith(prefix));

    // If no voice found for this language, do NOT fall back to English —
    // that would speak the wrong language. Stay silent instead.
    if (!match) {
      return;
    }

    utt.voice = match;
    window.speechSynthesis.speak(utt);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    _doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      _doSpeak();
    };
  }
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
}
