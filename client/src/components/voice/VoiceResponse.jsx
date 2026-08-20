import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

const VoiceResponse = ({ text, onEnd, className = '', autoSpeak = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      onEnd?.();
    }
  }, [currentIndex, text, onEnd]);

  const handleReplay = () => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-5 border border-primary-100 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0">
          <Volume2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 leading-relaxed">
            {displayedText}
            {currentIndex < text.length && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-primary-600 ml-0.5 align-middle"
              />
            )}
          </p>
          {(isPlaying || autoSpeak) && (
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleSpeak}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Listen
                  </>
                )}
              </button>
              {isPlaying && (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
                >
                  <VolumeX className="w-4 h-4" />
                  Stop
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VoiceResponse;
