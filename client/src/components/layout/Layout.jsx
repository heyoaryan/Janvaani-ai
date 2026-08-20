import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '@/contexts/AuthContext';
import Onboarding from '@/components/Onboarding';

const Layout = () => {
  const { onboardingComplete, completeOnboarding } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />

      {!onboardingComplete && (
        <Onboarding onComplete={completeOnboarding} />
      )}
    </div>
  );
};

export default Layout;
