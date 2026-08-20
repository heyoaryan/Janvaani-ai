import { createContext, useContext, useState, useCallback } from 'react';
import { useVoiceRecognition, useTextToSpeech } from '@/hooks/useVoice';
import { useAuth } from '@/contexts/AuthContext';

const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState('hi-IN');
  const [lastResponse, setLastResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { isListening, transcript, interim, error: sttError, start, stop, setIsListening } = useVoiceRecognition(language);
  const { isSpeaking, speak: ttsSpeak, stop: ttsStop } = useTextToSpeech(language);

  const startListening = useCallback(() => {
    setError(null);
    setLastResponse(null);
    start();
  }, [start]);

  const stopListening = useCallback(() => {
    stop();
  }, [stop]);

  const processVoice = useCallback(async (input) => {
    const text = input || transcript || '';
    if (!text.trim()) return null;

    setIsProcessing(true);
    setError(null);
    try {
      const sessionId = user.sessionId || `sess-${Date.now()}`;
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, sessionId, language, userProfile: user }),
      });
      const data = await res.json();
      setLastResponse(data);
      return data;
    } catch (err) {
      setError('Voice processing failed. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, language, user]);

  const speak = useCallback((text) => {
    if (text) {
      ttsSpeak(text);
    }
  }, [ttsSpeak]);

  const stopSpeaking = useCallback(() => {
    ttsStop();
  }, [ttsStop]);

  const clearError = useCallback(() => setError(null), []);

  const currentError = error || sttError;

  return (
    <VoiceContext.Provider value={{
      isListening, transcript, interimTranscript: interim, isProcessing,
      lastResponse, language, error: currentError,
      startListening, stopListening, processVoice, speak, stopSpeaking, setLanguage, clearError, isSpeaking,
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
