import { useEffect, useRef } from 'react';

export default function FeedbackPanel({ result, phase, onNext, isStudyMode = false, patternWarnings = [] }) {
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
        ? 'bg-strong/5 border-strong/30 animate-correct-pulse'
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

      {/* Boss damage (hidden in study mode) */}
      {correct && !isStudyMode && (
        <p className="text-sm text-text-secondary">
          {phase === 'recall' && 'Boss takes 15 damage.'}
          {phase === 'application' && 'Boss takes 20 damage.'}
          {phase === 'extended' && `Boss takes ${Math.round(score * 5)} damage.`}
        </p>
      )}

      {/* Recurring pattern warning */}
      {!correct && patternWarnings.length > 0 && (
        <div className="bg-developing/10 border border-developing/30 rounded-lg p-3 space-y-1">
          <h4 className="text-xs font-medium text-developing uppercase tracking-wide">
            Recurring Pattern
          </h4>
          {patternWarnings.map((w, i) => (
            <p key={i} className="text-sm text-text-secondary">
              <span className={w.severity === 'critical' ? 'text-weak font-semibold' : 'text-developing font-semibold'}>
                {w.severity === 'critical' ? '!!' : '!'}
              </span>{' '}
              You've missed "<strong className="text-text-primary">{w.keyword}</strong>" {w.occurrences} time{w.occurrences !== 1 ? 's' : ''}
              {w.topicIds.length > 1 && ' across multiple topics'}.
            </p>
          ))}
        </div>
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

      {/* Model answer — always shown so students learn from the feedback */}
      {feedback?.modelAnswer && (
        <details open className="group">
          <summary className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1 cursor-pointer select-none list-none flex items-center gap-1">
            <span className="text-text-muted group-open:rotate-90 transition-transform text-[10px]">▶</span>
            Model answer
          </summary>
          <div className="text-sm text-text-secondary bg-bg-tertiary rounded-lg p-3 mt-1 whitespace-pre-line">
            {feedback.modelAnswer}
          </div>
        </details>
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
