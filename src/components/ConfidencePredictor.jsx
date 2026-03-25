import { useState } from 'react';

const OPTIONS = [
  { id: 'struggle', label: "I'll struggle", emoji: '\u{1F630}', value: 30 },
  { id: 'okay', label: "I'll be okay", emoji: '\u{1F60A}', value: 60 },
  { id: 'ace', label: "I'll ace it", emoji: '\u{1F525}', value: 90 },
];

export default function ConfidencePredictor({ onPredict, onSkip }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-title">How confident are you?</h3>
        <p className="text-xs text-text-muted mt-1">Predict your performance. We'll compare after.</p>
      </div>
      <div className="flex gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt)}
            className={`flex-1 py-3 rounded-xl text-center cursor-pointer border transition-all ${
              selected?.id === opt.id
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent/30'
            }`}
          >
            <div className="text-xl mb-1">{opt.emoji}</div>
            <div className="text-xs font-medium">{opt.label}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => selected && onPredict(selected.value)}
          disabled={!selected}
          className="flex-1 text-button bg-accent text-bg-primary py-2.5 rounded-lg cursor-pointer border-0 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Confirm
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-text-muted bg-transparent border-0 cursor-pointer hover:text-text-secondary px-3"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
