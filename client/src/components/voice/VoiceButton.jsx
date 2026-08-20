import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';

const VoiceButton = ({ onTranscript, className = '', size = 'lg' }) => {
  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    isProcessing, 
    isSpeaking,
    startListening, 
    stopListening, 
    processVoice,
    speak,
    stopSpeaking,
    error
  } = useVoice();
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const processedTranscript = useRef('');

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
              speak(data.response);
            }
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, localTranscript, processVoice, speak, response]);

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
          className={`
            ${sizes[size]} rounded-full flex items-center justify-center
            transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200
            ${isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-200'
              : isSpeaking
              ? 'bg-green-500 text-white shadow-lg shadow-green-200'
              : isProcessing
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
              : 'bg-primary-600 text-white shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isListening ? (
            <MicOff className="w-6 h-6" />
          ) : isSpeaking ? (
            <Volume2 className="w-6 h-6" />
          ) : isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </motion.button>

        {(isListening || isSpeaking) && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ backgroundColor: isListening ? '#ef4444' : '#22c55e' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.3, 1.3], opacity: [0.3, 0, 0] }}
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              {isListening && (
                <div className="flex items-center justify-center gap-1 h-8 mb-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary-600 rounded-full"
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
              
              <p className="text-sm text-gray-700 text-center min-h-[24px]">
                {localTranscript || transcript || 'Listening...'}
              </p>

              {error && (
                <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
              )}

              {response?.response && !isListening && (
                <div className="mt-3 p-3 bg-primary-50 rounded-xl">
                  <p className="text-sm text-primary-800 text-center">
                    {response.response}
                  </p>
                  <button
                    onClick={handleReplay}
                    className="mt-2 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mx-auto"
                  >
                    <Volume2 className="w-4 h-4" />
                    Listen again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showTooltip && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-10">
          {isListening ? 'Tap to stop' : isSpeaking ? 'Tap to stop audio' : 'Tap to speak'}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default VoiceButton;
