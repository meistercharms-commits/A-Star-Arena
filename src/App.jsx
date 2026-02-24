import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
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

function ProtectedLayout() {
  if (!hasCompletedOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: <Suspense fallback={<PageLoader />}><Onboarding /></Suspense>,
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/topics', element: <Topics /> },
      { path: '/battle/:topicId', element: <Battle /> },
      { path: '/drill/:topicId', element: <Drill /> },
      { path: '/study-guide/:topicId', element: <StudyGuide /> },
      { path: '/exam', element: <Exam /> },
      { path: '/history', element: <History /> },
      { path: '/settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <SubjectProvider>
        <RouterProvider router={router} />
      </SubjectProvider>
    </ErrorBoundary>
  );
}
