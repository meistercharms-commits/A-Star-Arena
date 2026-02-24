import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook: handles beforeunload + React Router blocking.
 * Must be called at top level of component (not inside conditionals).
 * Returns the blocker object for rendering the modal.
 */
export function useNavigationWarning(when) {
  // ─── Browser tab close / refresh ───
  useEffect(() => {
    if (!when) return;

    function handleBeforeUnload(e) {
      e.preventDefault();
      // Modern browsers show a generic message; returnValue is required for Chrome
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [when]);

  // ─── React Router in-app navigation ───
  return useBlocker(when);
}

/**
 * Modal: renders the "Leave Session?" confirmation dialog.
 * Pass the blocker object from useNavigationWarning.
 */
export function NavigationWarningModal({ blocker }) {
  if (!blocker || blocker.state !== 'blocked') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="bg-bg-secondary border border-border rounded-xl p-6 max-w-sm mx-4 space-y-4 shadow-lg">
        <div className="text-center">
          <span className="text-3xl block mb-2">⚠️</span>
          <h2 className="text-lg font-bold">Leave Session?</h2>
          <p className="text-sm text-text-secondary mt-2">
            Your progress won't be saved. Are you sure you want to leave?
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => blocker.reset()}
            className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Stay
          </button>
          <button
            onClick={() => blocker.proceed()}
            className="flex-1 bg-bg-tertiary hover:bg-border text-weak font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Combined component: drop-in for pages without early returns.
 * Usage: <NavigationWarning when={isActive} />
 */
export default function NavigationWarning({ when }) {
  const blocker = useNavigationWarning(when);
  return <NavigationWarningModal blocker={blocker} />;
}
