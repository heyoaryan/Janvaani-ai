import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CheckSquare,
  FileText,
  ClipboardList,
  MessageSquare,
  Users,
  Calendar,
  MapPin,
  Shield,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', labelHi: 'डैशबोर्ड' },
    { path: '/schemes', icon: Search, label: 'Find Schemes', labelHi: 'योजनाएं खोजें' },
    { path: '/eligibility', icon: CheckSquare, label: 'Eligibility Check', labelHi: 'पात्रता जांच' },
    { path: '/documents', icon: FileText, label: 'Documents', labelHi: 'दस्तावेज' },
    { path: '/missing-docs', icon: ClipboardList, label: 'Missing Docs', labelHi: 'गुम दस्तावेज' },
    { path: '/application-copilot', icon: MessageSquare, label: 'App Co-Pilot', labelHi: 'एप को-पायलट' },
    { path: '/family-benefits', icon: Users, label: 'Family Benefits', labelHi: 'पारिवारिक लाभ' },
    { path: '/life-events', icon: Calendar, label: 'Life Events', labelHi: 'जीवन के कार्यक्रम' },
    { path: '/nearby-help', icon: MapPin, label: 'Nearby Help', labelHi: 'पास की मदद' },
    { path: '/scam-check', icon: Shield, label: 'Scam Check', labelHi: 'स्कैम जांच' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-xl lg:shadow-lg lg:!translate-x-0 lg:z-30 lg:static lg:block lg:shadow-none"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
          <span className="font-bold text-lg text-gray-900">Menu</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-full pb-20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;
