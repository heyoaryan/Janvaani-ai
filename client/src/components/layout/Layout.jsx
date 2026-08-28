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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Fixed left, full height */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Centered, not touching edges */}
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>

      {!onboardingComplete && (
        <Onboarding onComplete={completeOnboarding} />
      )}
    </div>
  );
};

export default Layout;
