import { useState } from 'react';

export default function AnswerInput({ phase, onSubmit, onSkip, onHint, disabled, hint }) {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  function handleSubmit() {
    if (!answer.trim() || disabled) return;
    onSubmit(answer.trim());
    setAnswer('');
    setShowHint(false);
  }

  function handleKeyDown(e) {
    // Enter submits for recall (short answers), Ctrl+Enter for longer phases
    if (phase === 'recall' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleHint() {
    setShowHint(true);
    onHint?.();
  }

  const isExtended = phase === 'extended';
  const isApplication = phase === 'application';

  return (
    <div className="space-y-3">
      {isExtended || isApplication ? (
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isExtended
              ? 'Write your extended response here... (Ctrl+Enter to submit)'
              : 'Explain your reasoning... (Ctrl+Enter to submit)'
          }
          disabled={disabled}
          className="textarea-field"
          style={{ minHeight: isExtended ? '10rem' : '6rem' }}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer... (Enter to submit)"
          disabled={disabled}
          className="input-field"
          autoFocus
        />
      )}

      {/* Word count for extended */}
      {isExtended && (
        <p className="text-xs text-text-muted text-right">
          {answer.trim().split(/\s+/).filter(Boolean).length} words
        </p>
      )}

      {/* Hint */}
      {showHint && hint && (
        <div className="bg-developing/10 border border-developing/30 rounded-lg px-3 py-2 text-sm text-developing">
          💡 {hint}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || disabled}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            answer.trim() && !disabled
              ? 'bg-accent hover:bg-accent-hover text-bg-primary'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
          }`}
        >
          Submit
        </button>
        <button
          onClick={() => { setAnswer(''); setShowHint(false); onSkip?.(); }}
          disabled={disabled}
          className="px-4 py-2 rounded-lg text-sm bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip
        </button>
        {hint && !showHint && (
          <button
            onClick={handleHint}
            disabled={disabled}
            className="px-4 py-2 rounded-lg text-sm bg-bg-tertiary text-developing hover:bg-developing/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hint
          </button>
        )}
      </div>
    </div>
  );
}
