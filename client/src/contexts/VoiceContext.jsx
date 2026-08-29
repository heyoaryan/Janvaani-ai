import { createContext, useContext, useState, useCallback, useRef } from 'react';
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

  const { isListening, transcript, interim, audioBlob, error: sttError, silenceDetected, start, stop } = useVoiceRecognition(language);

  const startListening = useCallback(() => {
    setError(null);
    setLastResponse(null);
    start();
  }, [start]);

  const stopListening = useCallback(() => stop(), [stop]);

  // ── speak: use backend gTTS for proper Indian language audio ─────────────
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    // Also cancel browser TTS as safety net
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text, responseLanguage) => {
    if (!text) return;
    stopSpeaking();

    const lang = responseLanguage || language;
    // Truncate to keep gTTS fast (backend caps at 500 chars too)
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
          // Fallback to browser TTS if audio playback fails
          _browserSpeak(short, lang);
        };
        await audio.play();
        return;
      }
    } catch {
      // gTTS failed — fall back to browser TTS
    }

    // Browser TTS fallback
    setIsSpeaking(false);
    _browserSpeak(short, lang);
  }, [language, stopSpeaking]);

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
      // Browser STT is weak for many Indian languages — always prefer backend STT when we have audio.
      const audioAvailable = recordedAudio && recordedAudio.size > 0;
      if (audioAvailable) {
        try {
          const transcription = await voiceApi.transcribe(recordedAudio, language);
          const whisperText = (transcription?.transcription || '').trim();
          if (whisperText) {
            const indic = language && language !== 'en-IN';
            if (indic || !text || whisperText.length >= text.length) {
              text = whisperText;
            }
          }
        } catch {
          // Browser STT transcript stays as fallback
        }
      }

      if (!text) text = (transcript || '').trim();
      if (!text) return null;

      const sessionId = user.sessionId || `sess-${Date.now()}`;
      const userProfile = {
        name: user.name || '',
        occupation: user.occupation || '',
        age: user.age || '',
        gender: user.gender || '',
        state: user.state || '',
        income: user.income || user.annualIncome || '',
      };
      const data = await voiceApi.process(text, sessionId, language, userProfile);
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
  }, [transcript, language, user]);

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

// ── Browser TTS fallback (used only when gTTS/audio fails) ───────────────────
function _browserSpeak(text, lang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === 'od-IN' ? 'or-IN' : lang;
  utt.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const prefix = (lang || 'en').split('-')[0];
  const match = voices.find(v => v.lang === lang)
    || voices.find(v => v.lang.startsWith(prefix))
    || voices.find(v => v.lang.startsWith('hi'))
    || voices.find(v => v.lang.startsWith('en'));
  if (match) utt.voice = match;
  window.speechSynthesis.speak(utt);
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
}
