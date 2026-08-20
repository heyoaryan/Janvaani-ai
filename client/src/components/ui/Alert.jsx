import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

const Alert = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
  icon,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      text: 'text-green-700',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-800',
      text: 'text-amber-700',
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      text: 'text-red-700',
    },
  };

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const DefaultIcon = icon || icons[variant];

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 200);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`rounded-xl border p-4 ${variants[variant].container} ${className}`}
        >
          <div className="flex gap-3">
            <DefaultIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${variants[variant].icon}`} />
            <div className="flex-1">
              {title && (
                <h4 className={`font-semibold mb-1 ${variants[variant].title}`}>
                  {title}
                </h4>
              )}
              <div className={`text-sm ${variants[variant].text}`}>
                {children}
              </div>
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${variants[variant].icon}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
