import React from 'react';
import { motion } from 'framer-motion';

const Progress = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = true,
  label,
  className = '',
  animated = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    primary: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-amber-500',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showLabel) && (
        <div className="flex justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-900">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          className={`${variants[variant]} h-full rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 1, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
};

export default Progress;
