import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useVoiceRecognition, useTextToSpeech } from '@/hooks/useVoice';
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
  const [gttsSpeaking, setGttsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const language = appLanguage;

  const { isListening, transcript, interim, audioBlob, error: sttError, silenceDetected, start, stop } = useVoiceRecognition(language);
  const { isSpeaking: browserSpeaking, speak: ttsSpeak, stop: ttsStop } = useTextToSpeech(language);

  const startListening = useCallback(() => {
    setError(null);
    setLastResponse(null);
    start();
  }, [start]);

  const stopListening = useCallback(() => stop(), [stop]);

  const processVoice = useCallback(async (input = '', recordedAudio = null) => {
    let text = (input || '').trim();

    setIsProcessing(true);
    setError(null);
    setLastResponse(null);
    try {
      // Use Whisper when:
      //   a) no browser STT text at all, OR
      //   b) audio blob exists and browser gave very short text (< 4 chars — likely noise)
      //      This handles production where Web Speech API is unavailable or unreliable.
      const audioAvailable = recordedAudio && recordedAudio.size > 0;
      const browserTextWeak = text.length < 4;

      if (audioAvailable && (!text || browserTextWeak)) {
        try {
          const transcription = await voiceApi.transcribe(recordedAudio, language);
          const whisperText = transcription?.transcription?.trim();
          if (whisperText && whisperText.length > text.length) {
            text = whisperText;
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

  const stopSpeaking = useCallback(() => {
    ttsStop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setGttsSpeaking(false);
  }, [ttsStop]);

  const speak = useCallback((text, responseLanguage) => {
    if (!text) return;
    stopSpeaking();
    const short = text.length > 220 ? `${text.slice(0, 220).trim()}…` : text;
    ttsSpeak(short, responseLanguage || language);
  }, [language, stopSpeaking, ttsSpeak]);

  const clearError = useCallback(() => setError(null), []);

  const setLanguage = useCallback((newLang) => {
    setAppLanguage(newLang);
  }, [setAppLanguage]);

  const currentError = error || sttError;

  return (
    <VoiceContext.Provider value={{
      isListening, transcript, interimTranscript: interim, audioBlob, silenceDetected,
      isProcessing, lastResponse, language, error: currentError,
      startListening, stopListening, processVoice, speak, stopSpeaking, setLanguage, clearError,
      isSpeaking: gttsSpeaking || browserSpeaking,
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
}
