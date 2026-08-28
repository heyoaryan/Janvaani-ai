import { useState, useEffect, useRef, useCallback } from 'react';

const INDIAN_LANGUAGES = [
  { code: 'hi-IN', name: 'हिंदी', englishName: 'Hindi' },
  { code: 'bn-IN', name: 'বাংলা', englishName: 'Bengali' },
  { code: 'ta-IN', name: 'தமிழ்', englishName: 'Tamil' },
  { code: 'te-IN', name: 'తెలుగు', englishName: 'Telugu' },
  { code: 'mr-IN', name: 'मराठी', englishName: 'Marathi' },
  { code: 'gu-IN', name: 'ગુજરાતી', englishName: 'Gujarati' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ml-IN', name: 'മലയാളം', englishName: 'Malayalam' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi' },
  { code: 'od-IN', name: 'ଓଡ଼ିଆ', englishName: 'Odia' },
  { code: 'en-IN', name: 'English', englishName: 'English (Indian)' },
];

const BROWSER_STT_LANG = { 'od-IN': 'or-IN' };

function pickRecorderMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

export function useVoiceRecognition(language = 'hi-IN') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const maxListenTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isListeningRef = useRef(false);
  const heardSpeechRef = useRef(false);
  const interimRef = useRef('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const stopResolveRef = useRef(null);

  const SILENCE_THRESHOLD = 0.045;
  const SILENCE_DURATION = 2000;
  const MAX_LISTEN_DURATION = 20000;

  const getAudioLevel = useCallback(() => {
    if (!analyserRef.current) return 0;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255);
  }, []);

  const finishStop = useCallback((blob) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxListenTimerRef.current) {
      clearTimeout(maxListenTimerRef.current);
      maxListenTimerRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    const resolver = stopResolveRef.current;
    stopResolveRef.current = null;
    resolver?.(blob || null);
  }, []);

  const stopListening = useCallback(() => {
    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      isListeningRef.current = false;
      setIsListening(false);

      const leftover = (interimRef.current || '').trim();
      if (leftover) {
        setTranscript((prev) => (prev ? `${prev} ${leftover}` : leftover).trim());
        interimRef.current = '';
        setInterim('');
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          finishStop(null);
        }
        setTimeout(() => {
          if (stopResolveRef.current === resolve) {
            finishStop(null);
          }
        }, 400);
      } else {
        finishStop(null);
      }
    });
  }, [finishStop]);

  const startListening = useCallback(async () => {
    setError(null);
    setSilenceDetected(false);
    setTranscript('');
    setInterim('');
    setAudioBlob(null);
    audioChunksRef.current = [];
    heardSpeechRef.current = false;
    interimRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (window.MediaRecorder) {
        const mime = pickRecorderMime();
        const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const blob = audioChunksRef.current.length
            ? new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
            : null;
          if (blob) setAudioBlob(blob);
          mediaRecorderRef.current = null;
          finishStop(blob);
        };
        mediaRecorderRef.current = recorder;
        recorder.start(250);
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = BROWSER_STT_LANG[language] || language;
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
          lastActivityRef.current = Date.now();
          heardSpeechRef.current = true;
          let final = '';
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interimText += event.results[i][0].transcript;
            }
          }
          if (final) {
            setTranscript((prev) => `${prev} ${final}`.trim());
          }
          interimRef.current = interimText;
          setInterim(interimText);
        };

        recognition.onerror = (event) => {
          if (event.error === 'no-speech' || event.error === 'aborted') return;
          if (event.error === 'not-allowed') {
            setError(event.error);
            stopListening();
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch {
              // Chrome throws if start() is called too quickly
            }
          }
        };

        try {
          recognition.start();
        } catch {
          // MediaRecorder + Whisper still work without browser STT
        }
      }

      isListeningRef.current = true;
      setIsListening(true);
      lastActivityRef.current = Date.now();

      const checkSilence = () => {
        if (!isListeningRef.current) return;
        const level = getAudioLevel();
        if (level >= SILENCE_THRESHOLD) {
          lastActivityRef.current = Date.now();
          heardSpeechRef.current = true;
        }
        const elapsed = Date.now() - lastActivityRef.current;
        if (heardSpeechRef.current && elapsed >= SILENCE_DURATION) {
          setSilenceDetected(true);
          stopListening();
          return;
        }
        silenceTimerRef.current = setTimeout(checkSilence, 200);
      };
      silenceTimerRef.current = setTimeout(checkSilence, 200);

      maxListenTimerRef.current = setTimeout(() => {
        if (isListeningRef.current) {
          setSilenceDetected(true);
          stopListening();
        }
      }, MAX_LISTEN_DURATION);
    } catch (err) {
      setError('Could not start speech recognition. Please allow microphone access.');
      stopListening();
    }
  }, [language, getAudioLevel, stopListening, finishStop]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { isListening, transcript, interim, error, silenceDetected, audioBlob, start: startListening, stop: stopListening, setIsListening };
}

export function useTextToSpeech(language = 'hi-IN') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const prefix = (language || 'en').split('-')[0];
      const indianVoices = availableVoices.filter((voice) =>
        ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'od', 'en'].some((p) =>
          voice.lang.toLowerCase().startsWith(p)
        )
      );
      setVoices(indianVoices);

      const match = indianVoices.find((v) => v.lang === language)
        || indianVoices.find((v) => v.lang.startsWith(prefix))
        || indianVoices.find((v) => v.lang.startsWith('en'));
      setSelectedVoice(match || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language]);

  const speak = useCallback((text, responseLanguage = language) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = responseLanguage === 'od-IN' ? 'or-IN' : (responseLanguage || language);
    utterance.lang = lang;
    utterance.rate = 0.92;
    utterance.pitch = 1;

    const prefix = (lang || 'en').split('-')[0];
    const available = window.speechSynthesis.getVoices();
    const match = available.find((v) => v.lang === lang)
      || available.find((v) => v.lang.toLowerCase().startsWith(prefix))
      || selectedVoice;
    if (match) {
      utterance.voice = match;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language, selectedVoice]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, voices, selectedVoice, speak, stop, setSelectedVoice };
}

export { INDIAN_LANGUAGES };
