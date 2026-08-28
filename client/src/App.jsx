import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ForYou = lazy(() => import('@/pages/ForYou'));
const SchemeFinder = lazy(() => import('@/pages/SchemeFinder'));
const SchemeDetail = lazy(() => import('@/pages/SchemeDetail'));
const CompareSchemes = lazy(() => import('@/pages/CompareSchemes'));
const SavedSchemes = lazy(() => import('@/pages/SavedSchemes'));
const EligibilityChecker = lazy(() => import('@/pages/EligibilityChecker'));
const MissingDocs = lazy(() => import('@/pages/MissingDocs'));
const LifeEvents = lazy(() => import('@/pages/LifeEvents'));
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

const page = (Component) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={page(Dashboard)} />
        <Route path="for-you" element={page(ForYou)} />
        <Route path="schemes" element={page(SchemeFinder)} />
        <Route path="schemes/:id" element={page(SchemeDetail)} />
        <Route path="compare" element={page(CompareSchemes)} />
        <Route path="saved" element={page(SavedSchemes)} />
        <Route path="eligibility" element={page(EligibilityChecker)} />
        <Route path="missing-docs" element={page(MissingDocs)} />
        <Route path="life-events" element={page(LifeEvents)} />
        <Route path="scam-check" element={page(ScamCheck)} />
        <Route path="documents" element={<Navigate to="/missing-docs" replace />} />
        <Route path="application-copilot" element={<Navigate to="/for-you" replace />} />
        <Route path="family-benefits" element={<Navigate to="/for-you" replace />} />
        <Route path="nearby-help" element={<Navigate to="/schemes" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
