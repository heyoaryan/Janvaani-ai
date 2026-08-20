import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, MessageSquare, CheckCircle, Send } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import VoiceResponse from '@/components/voice/VoiceResponse';

const steps = [
  {
    id: 1,
    title: 'Check Eligibility',
    titleHi: 'पात्रता जांचें',
    description: 'Verify if you meet all the criteria for this scheme',
    message: 'Great! Let\'s start by checking your eligibility. We\'ll verify your age, income, and other criteria.',
  },
  {
    id: 2,
    title: 'Prepare Documents',
    titleHi: 'दस्तावेज तैयार करें',
    description: 'Gather all required documents before applying',
    message: 'Make sure you have all these documents ready: Aadhaar, Income Certificate, Bank Account details, and any other required documents.',
  },
  {
    id: 3,
    title: 'Review Profile',
    titleHi: 'प्रोफाइल की समीक्षा करें',
    description: 'Ensure your personal information is accurate',
    message: 'Please review your name, address, and other details. Make sure everything matches your documents.',
  },
  {
    id: 4,
    title: 'Fill Application Form',
    titleHi: 'आवेदन फॉर्म भरें',
    description: 'Complete the official application form',
    message: 'Fill in all the required fields carefully. Double-check your entries before submitting.',
  },
  {
    id: 5,
    title: 'Upload Documents',
    titleHi: 'दस्तावेज अपलोड करें',
    description: 'Upload scanned copies of all required documents',
    message: 'Upload clear, readable copies of all your documents. Make sure the text is visible in each file.',
  },
  {
    id: 6,
    title: 'Review Application',
    titleHi: 'आवेदन की समीक्षा करें',
    description: 'Double-check everything before final submission',
    message: 'Review all the information you\'ve entered. Make sure everything is correct before you submit.',
  },
  {
    id: 7,
    title: 'Final Checklist',
    titleHi: 'अंतिम जांच सूची',
    description: 'Run through the final checklist',
    message: 'Here\'s your final checklist: All documents uploaded? Information verified? Ready to submit?',
  },
  {
    id: 8,
    title: 'Official Channel',
    titleHi: 'आधिकारिक चैनल',
    description: 'Submit through official government portal',
    message: 'Great job! Now submit your application through the official portal. Keep your application number for tracking.',
  },
];

const ApplicationCopilot = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState(0);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Namaste! Main aapke application co-pilot hoon. Main aapko step by step guide karunga. Chaliye shuru karte hain!' },
  ]);
  const [inputValue, setInputValue] = useState('');

  const goToStep = (index) => {
    setCurrentStep(index);
    setExpandedStep(index);
    setMessages(prev => [...prev, { role: 'assistant', text: steps[index].message }]);
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: inputValue }]);
    setInputValue('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Main samajh gaya! Aapke sawal ka jawab dhundh raha hoon. Kuch der ke liye intezaar kariye.' }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Application Co-Pilot</h1>
        <p className="text-gray-600">Your step-by-step guide through the application process</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Application Steps</h3>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <button
                  key={step.id}
                  onClick={() => goToStep(i)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    currentStep === i
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      currentStep === i
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.titleHi}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">
                Step {currentStep + 1}: {steps[currentStep].title}
              </h3>
              <Badge variant="info">Step {currentStep + 1} of {steps.length}</Badge>
            </div>
            <p className="text-gray-600 mb-4">{steps[currentStep].description}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                size="sm"
                onClick={() => goToStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
                className="w-full sm:w-auto"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              AI Assistant
            </h3>
            <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto mb-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      {msg.role === 'assistant' && (
                        <VoiceResponse text={msg.text} className="!p-0 !bg-transparent !border-0" />
                      )}
                      {msg.role === 'user' && <p className="text-sm">{msg.text}</p>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button onClick={sendMessage} icon={Send} className="flex-shrink-0" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCopilot;
