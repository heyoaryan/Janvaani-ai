import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2, Languages } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { useLanguage } from '@/contexts/LanguageContext';

const VoiceButton = ({ onTranscript, className = '', size = 'lg' }) => {
  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    isProcessing, 
    isSpeaking,
    silenceDetected,
    startListening, 
    stopListening, 
    processVoice,
    speak,
    stopSpeaking,
    error,
    language,
    setLanguage
  } = useVoice();
  
  const { t, languages, currentLanguage } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const processedTranscript = useRef('');
  const langRef = useRef(language);

  useEffect(() => {
    langRef.current = language;
  }, [language]);

  useEffect(() => {
    if (transcript) {
      setLocalTranscript(transcript);
      onTranscript?.(transcript);
    }
  }, [transcript, isListening, onTranscript]);

  useEffect(() => {
    if (!isListening && localTranscript && !response && processedTranscript.current !== localTranscript) {
      processedTranscript.current = localTranscript;
      const timer = setTimeout(() => {
        processVoice(localTranscript).then(data => {
          if (data) {
            setResponse(data);
            if (data.response) {
              speak(data.response, data.responseLanguage || data.language || language);
            }
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, localTranscript, processVoice, speak, response, language]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else if (isSpeaking) {
      stopSpeaking();
      setResponse(null);
    } else {
      setLocalTranscript('');
      setResponse(null);
      processedTranscript.current = '';
      startListening();
    }
  };

  const handleReplay = () => {
    if (response?.response) {
      speak(response.response);
    }
  };

  const handleLangChange = (langCode) => {
    setLanguage(langCode);
    setShowLangPicker(false);
    setLocalTranscript('');
    setResponse(null);
    processedTranscript.current = '';
  };

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <motion.button
          onClick={handleClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onDoubleClick={(e) => { e.preventDefault(); setShowLangPicker(!showLangPicker); }}
          className={`
            ${sizes[size]} rounded-full flex items-center justify-center
            transition-all duration-300 focus:outline-none focus:ring-4 shadow-lg
            ${isListening
              ? 'bg-red-500 text-white shadow-red-200 focus:ring-red-200'
              : isSpeaking
              ? 'bg-green-500 text-white shadow-green-200 focus:ring-green-200'
              : isProcessing
              ? 'bg-amber-500 text-white shadow-amber-200 focus:ring-amber-200'
              : 'bg-primary-600 text-white shadow-primary-300 hover:shadow-xl hover:bg-primary-700 focus:ring-primary-200'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isListening ? (
            <MicOff className="w-7 h-7" />
          ) : isSpeaking ? (
            <Volume2 className="w-7 h-7" />
          ) : isProcessing ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <Mic className="w-7 h-7" />
          )}
        </motion.button>

        {(isListening || isSpeaking) && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ backgroundColor: isListening ? '#ef4444' : '#22c55e' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.3, 1.3], opacity: [0.4, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              style={{ backgroundColor: isListening ? '#ef4444' : '#22c55e' }}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {(isListening || interimTranscript || localTranscript || response || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="max-w-md w-full"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
              {isListening && (
                <div className="flex items-center justify-center gap-1.5 h-10 mb-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-primary-600 rounded-full"
                      animate={{
                        height: ['20%', '80%', '20%'],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              )}
              
              {interimTranscript && isListening && (
                <p className="text-sm text-gray-500 text-center italic mb-2">
                  {interimTranscript}
                </p>
              )}
              
              <p className="text-sm text-gray-700 text-center min-h-[24px] font-medium">
                {localTranscript || transcript || (isListening ? t('dashboard.listening') : '')}
              </p>

              {silenceDetected && !localTranscript && (
                <p className="text-xs text-amber-600 text-center mt-2 font-medium">
                  {t('voice.noSpeechDetected')}
                </p>
              )}

              {error && (
                <p className="mt-2 text-sm text-red-600 text-center font-medium">{error}</p>
              )}

              {response?.response && !isListening && (
                <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <p className="text-sm text-primary-800 text-center leading-relaxed">
                    {response.response}
                  </p>
                  {response.source?.url && (
                    <a
                      href={response.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-xs text-primary-700 underline text-center font-medium"
                    >
                      {response.answerType === 'web' ? t('dashboard.webResult') : t('dashboard.source')}: {response.source.title}
                    </a>
                  )}
                  {response.sourceDisclaimer && (
                    <p className="mt-2 text-[11px] text-gray-500 text-center">{response.sourceDisclaimer}</p>
                  )}
                  <button
                    onClick={handleReplay}
                    className="mt-3 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mx-auto font-medium"
                  >
                    <Volume2 className="w-4 h-4" />
                    {t('dashboard.listenAgain')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLangPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 w-72 max-h-96 overflow-y-auto z-20"
          >
            <p className="text-xs text-gray-500 font-semibold px-3 py-2 uppercase tracking-wide">
              {t('voice.selectLanguageForVoice')}
            </p>
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                    language === lang.code
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                <span className="text-gray-400 text-xs ml-auto">({lang.englishName})</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-lg"
        >
          {isListening ? `${t('voice.tapToStop')} · ${t('voice.doubleClickForLanguage')}` : 
           isSpeaking ? t('voice.tapToStopAudio') : 
           `${t('voice.tapToSpeak')} · ${t('voice.doubleClickForLanguage')}`}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </motion.div>
      )}
    </div>
  );
};

export default VoiceButton;
