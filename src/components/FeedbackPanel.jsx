import { useEffect, useRef } from 'react';

export default function FeedbackPanel({ result, phase, onNext }) {
  if (!result) return null;
  const nextBtnRef = useRef(null);

  const { score, maxScore, correct, feedback } = result;
  const isExtended = phase === 'extended';
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // Auto-focus Next button for keyboard accessibility
  useEffect(() => {
    const timer = setTimeout(() => nextBtnRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle Enter/Space to proceed
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNext?.();
    }
  }

  return (
    <div className={`rounded-xl p-5 space-y-4 border animate-slide-up ${
      correct
        ? 'bg-strong/5 border-strong/30'
        : 'bg-weak/5 border-weak/30'
    }`}>
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xl animate-score-pop ${correct ? 'text-strong' : 'text-weak'}`}>
            {correct ? '✓' : '✗'}
          </span>
          <span className={`font-semibold ${correct ? 'text-strong' : 'text-weak'}`}>
            {correct ? 'Correct!' : 'Not quite'}
          </span>
        </div>
        {isExtended && (
          <span className={`font-mono text-lg font-bold animate-score-pop ${
            percentage >= 80 ? 'text-strong' : percentage >= 50 ? 'text-developing' : 'text-weak'
          }`}>
            {score}/{maxScore}
          </span>
        )}
      </div>

      {/* Boss damage */}
      {correct && (
        <p className="text-sm text-text-secondary">
          {phase === 'recall' && 'Boss takes 15 damage.'}
          {phase === 'application' && 'Boss takes 20 damage.'}
          {phase === 'extended' && score >= 5 && 'Critical hit! Boss takes massive damage.'}
          {phase === 'extended' && score < 5 && `Boss takes ${score * 5} damage.`}
        </p>
      )}

      {/* What you did well */}
      {feedback?.whatYouDidWell?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-strong uppercase tracking-wide mb-1">What you did well</h4>
          <ul className="space-y-1 stagger-children">
            {feedback.whatYouDidWell.map((point, i) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span className="text-strong shrink-0">+</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing points */}
      {feedback?.missingPoints?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-weak uppercase tracking-wide mb-1">Missing points</h4>
          <ul className="space-y-1 stagger-children">
            {feedback.missingPoints.map((point, i) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span className="text-weak shrink-0">-</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* How to improve */}
      {feedback?.howToImprove?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-accent uppercase tracking-wide mb-1">How to improve</h4>
          <ul className="space-y-1 stagger-children">
            {feedback.howToImprove.map((tip, i) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span className="text-accent shrink-0">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Model answer */}
      {feedback?.modelAnswer && (
        <div>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Model answer</h4>
          <p className="text-sm text-text-secondary bg-bg-tertiary rounded-lg p-3">
            {feedback.modelAnswer}
          </p>
        </div>
      )}

      {/* Next button */}
      <button
        ref={nextBtnRef}
        onClick={onNext}
        onKeyDown={handleKeyDown}
        className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
      >
        Next Question
      </button>
    </div>
  );
}
