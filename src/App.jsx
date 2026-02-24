import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { hasCompletedOnboarding, migrateToSubjectNamespaces } from './lib/storage';
import { SubjectProvider } from './contexts/SubjectContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Migrate existing Biology data to subject-namespaced keys on first load
migrateToSubjectNamespaces();

// Lazy-load pages for better initial bundle size
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Home = lazy(() => import('./pages/Home'));
const Topics = lazy(() => import('./pages/Topics'));
const Battle = lazy(() => import('./pages/Battle'));
const Drill = lazy(() => import('./pages/Drill'));
const Exam = lazy(() => import('./pages/Exam'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const StudyGuide = lazy(() => import('./pages/StudyGuide'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  if (!hasCompletedOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SubjectProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/topics" element={<ProtectedRoute><Topics /></ProtectedRoute>} />
              <Route path="/battle/:topicId" element={<ProtectedRoute><Battle /></ProtectedRoute>} />
              <Route path="/drill/:topicId" element={<ProtectedRoute><Drill /></ProtectedRoute>} />
              <Route path="/study-guide/:topicId" element={<ProtectedRoute><StudyGuide /></ProtectedRoute>} />
              <Route path="/exam" element={<ProtectedRoute><Exam /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SubjectProvider>
    </ErrorBoundary>
  );
}
