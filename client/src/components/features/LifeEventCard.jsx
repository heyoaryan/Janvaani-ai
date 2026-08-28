import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Baby, Home, Tractor, Rocket, User, Heart } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

import { useLanguage } from '@/contexts/LanguageContext';

const iconMap = {
  GraduationCap, Briefcase, Baby, Home, Tractor, Rocket, User, Heart
};

const LifeEventCard = ({ event, onClick }) => {
  const { language, t } = useLanguage();
  const Icon = iconMap[event.icon] || GraduationCap;
  const title = language === 'hi-IN' && event.nameHi ? event.nameHi : event.name;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        hover
        className="h-full cursor-pointer group"
        onClick={() => onClick?.(event)}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
            <Icon className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          {language !== 'hi-IN' && event.nameHi && <p className="text-xs text-gray-500 mb-1">{event.nameHi}</p>}
          <p className="text-sm text-gray-600 mb-4">{event.description}</p>
          <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
            {event.schemes.length} {t('schemeFinder.schemes')}
            <Badge variant="info" className="text-xs">{event.schemes.length}</Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default LifeEventCard;
