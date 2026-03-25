/**
 * Reusable error state component with retry button.
 */
export default function ErrorState({ message, onRetry, retryLabel = 'Try Again', children }) {
  return (
    <div className="bg-weak/5 border border-weak/30 rounded-xl p-6 text-center space-y-3">
      <span className="text-3xl block">⚠️</span>
      <p className="text-sm text-text-secondary">{message || 'Something went wrong.'}</p>
      {children}
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2 px-6 rounded-lg text-sm transition-colors cursor-pointer"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
