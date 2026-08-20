import React, { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Onboarding from '@/components/Onboarding';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const SchemeFinder = lazy(() => import('@/pages/SchemeFinder'));
const SchemeDetail = lazy(() => import('@/pages/SchemeDetail'));
const EligibilityChecker = lazy(() => import('@/pages/EligibilityChecker'));
const DocumentChecker = lazy(() => import('@/pages/DocumentChecker'));
const MissingDocs = lazy(() => import('@/pages/MissingDocs'));
const ApplicationCopilot = lazy(() => import('@/pages/ApplicationCopilot'));
const FamilyBenefits = lazy(() => import('@/pages/FamilyBenefits'));
const LifeEvents = lazy(() => import('@/pages/LifeEvents'));
const NearbyHelp = lazy(() => import('@/pages/NearbyHelp'));
const ScamCheck = lazy(() => import('@/pages/ScamCheck'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
    />
  </div>
);

const App = () => {
  const { onboardingComplete } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Layout />}>
        {!onboardingComplete ? (
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Dashboard />
            </Suspense>
          } />
        ) : (
          <>
            <Route path="dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="schemes" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SchemeFinder />
              </Suspense>
            } />
            <Route path="schemes/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SchemeDetail />
              </Suspense>
            } />
            <Route path="eligibility" element={
              <Suspense fallback={<LoadingSpinner />}>
                <EligibilityChecker />
              </Suspense>
            } />
            <Route path="documents" element={
              <Suspense fallback={<LoadingSpinner />}>
                <DocumentChecker />
              </Suspense>
            } />
            <Route path="missing-docs" element={
              <Suspense fallback={<LoadingSpinner />}>
                <MissingDocs />
              </Suspense>
            } />
            <Route path="application-copilot" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApplicationCopilot />
              </Suspense>
            } />
            <Route path="family-benefits" element={
              <Suspense fallback={<LoadingSpinner />}>
                <FamilyBenefits />
              </Suspense>
            } />
            <Route path="life-events" element={
              <Suspense fallback={<LoadingSpinner />}>
                <LifeEvents />
              </Suspense>
            } />
            <Route path="nearby-help" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NearbyHelp />
              </Suspense>
            } />
            <Route path="scam-check" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ScamCheck />
              </Suspense>
            } />
          </>
        )}
      </Route>
    </Routes>
  );
};

export default App;
