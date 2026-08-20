import React from 'react';
import { motion } from 'framer-motion';

const Card = React.forwardRef(({
  children,
  className = '',
  header,
  footer,
  variant = 'default',
  hover = false,
  onClick,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-white border-gray-100',
    elevated: 'bg-white border-gray-100 shadow-md',
    outlined: 'bg-transparent border-2 border-gray-200',
    filled: 'bg-gray-50 border-gray-200',
  };

  const baseClasses = 'rounded-2xl border transition-all duration-200';
  const variantClasses = variants[variant] || variants.default;
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '';
  const clickClasses = onClick ? 'cursor-pointer' : '';

  return (
    <motion.div
      ref={ref}
      className={`${baseClasses} ${variantClasses} ${hoverClasses} ${clickClasses} ${className}`}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-100">
          {header}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </motion.div>
  );
});

Card.displayName = 'Card';

export default Card;
