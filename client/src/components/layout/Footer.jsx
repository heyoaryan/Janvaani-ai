import React from 'react';
import LogoIcon from '@/components/brand/LogoIcon';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-semibold text-gray-900">JanVaani AI</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Support</a>
          </div>

          <p className="text-xs text-gray-500 text-center md:text-right">
            This is an AI-powered prototype. Not an official government portal.
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} JanVaani AI. All rights reserved. Built for CCU Hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
