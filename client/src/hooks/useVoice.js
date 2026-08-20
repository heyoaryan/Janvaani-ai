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

export function useVoiceRecognition(language = 'hi-IN') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
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
        setTranscript(prev => prev + ' ' + final);
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
        setInterim('');
        setError(null);
      } catch (e) {
        setError('Could not start speech recognition');
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, interim, error, start, stop, setIsListening };
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
      const indianVoices = availableVoices.filter(voice => 
        voice.lang.startsWith('hi') || voice.lang.startsWith('bn') || voice.lang.startsWith('ta') ||
        voice.lang.startsWith('te') || voice.lang.startsWith('mr') || voice.lang.startsWith('gu') ||
        voice.lang.startsWith('kn') || voice.lang.startsWith('ml') || voice.lang.startsWith('pa') ||
        voice.lang.startsWith('od') || voice.lang.startsWith('en')
      );
      setVoices(indianVoices);
      
      const match = indianVoices.find(v => v.lang === language) || 
                    indianVoices.find(v => v.lang.startsWith(language.split('-')[0])) ||
                    indianVoices.find(v => v.lang.startsWith('en'));
      setSelectedVoice(match || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language]);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
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

export function useMockVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState(null);

  const mockResponses = {
    'main college student hoon': {
      intent: 'find_education_benefit',
      entities: { occupation: 'student', income: 'low' },
      response: 'Main samajh gaya! Aap student hain aur income kam hai. Mujhe kuch educational schemes dhundhne hain jo aapke liye suitable ho sakte hain. Yahan kuch options hain:',
      schemes: [1, 5, 7],
    },
    'mujhe scholarship chahiye': {
      intent: 'find_education_benefit',
      entities: { need: 'scholarship' },
      response: 'Scholarship ke liye aapko PM Scholarship Scheme, Startup India, aur other schemes available hain. Aapke profile ke according main aapke liye best matches dhundhunga.',
      schemes: [1, 5, 7],
    },
    'main farmer hoon': {
      intent: 'find_agriculture_benefit',
      entities: { occupation: 'farmer' },
      response: 'Farmer ke liye bahut se schemes hain! PM-Kisan, PMFBY, aur Kisan Credit Card jaise. Aapke liye sabse suitable konsa hai yeh main check karta hoon.',
      schemes: [3, 11],
    },
    'meri job chali gayi': {
      intent: 'find_employment_benefit',
      entities: { employmentStatus: 'unemployed' },
      response: 'Job chali jane par aapko PMEGP aur DDU-GKY jaise schemes mil sakte hain. Aapke skills aur background ke according main aapko best options batata hoon.',
      schemes: [5, 7],
    },
    'default': {
      intent: 'general_query',
      entities: {},
      response: 'Main samajh gaya! Aapke baare mein thoda aur bataiye taaki main aapke liye sabse relevant government schemes aur services dhundh sakoon.',
      schemes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  };

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    setResponse(null);
  };

  const stopListening = () => {
    setIsListening(false);
    if (transcript) {
      setIsProcessing(true);
      setTimeout(() => {
        const lowerTranscript = transcript.toLowerCase();
        let matched = mockResponses.default;
        for (const [key, value] of Object.entries(mockResponses)) {
          if (key !== 'default' && lowerTranscript.includes(key)) {
            matched = value;
            break;
          }
        }
        setResponse({
          ...matched,
          transcript,
        });
        setIsProcessing(false);
      }, 1500);
    }
  };

  return { isListening, transcript, isProcessing, response, startListening, stopListening };
}

export { INDIAN_LANGUAGES };
