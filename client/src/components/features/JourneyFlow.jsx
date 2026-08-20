import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MessageSquare, Search, CheckSquare, FileText, ClipboardList, Users, Calendar, MapPin, Shield, BarChart3 } from 'lucide-react';

const iconMap = {
  Mic, MessageSquare, Search, CheckSquare, FileText, ClipboardList, Users, Calendar, MapPin, Shield, BarChart3
};

const JourneyFlow = ({ className = '' }) => {
  const steps = [
    { label: 'Speak', icon: Mic, color: 'bg-primary-600' },
    { label: 'Understand', icon: MessageSquare, color: 'bg-primary-500' },
    { label: 'Find', icon: Search, color: 'bg-primary-400' },
    { label: 'Check', icon: CheckSquare, color: 'bg-primary-400' },
    { label: 'Prepare', icon: FileText, color: 'bg-primary-400' },
    { label: 'Apply', icon: ClipboardList, color: 'bg-primary-500' },
    { label: 'Get Help', icon: Users, color: 'bg-primary-600' },
  ];

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 text-center mb-8">How It Works</h3>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${step.color} text-white flex items-center justify-center shadow-lg`}>
                <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">{step.label}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.15 + 0.1, duration: 0.3 }}
                className="hidden sm:block w-8 h-0.5 bg-gray-300"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default JourneyFlow;
