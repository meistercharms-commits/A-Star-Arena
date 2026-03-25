import { useEffect, useRef, useState } from 'react';

const PHASE_INFO = {
  recall: {
    name: 'Phase 1: Recall',
    description: 'Show what you know. Quick-fire questions testing your foundations.',
    icon: '⚡',
  },
  application: {
    name: 'Phase 2: Application',
    description: 'Apply your knowledge. Deeper questions that test understanding.',
    icon: '🔬',
  },
  extended: {
    name: 'Phase 3: Extended Response',
    description: 'The final challenge. Show the examiner everything you\'ve got.',
    icon: '🎯',
  },
};

export default function PhaseTransition({ phase, bossTaunt, onComplete }) {
  const [visible, setVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const info = PHASE_INFO[phase] || PHASE_INFO.recall;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onCompleteRef.current?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(24,31,44,0.92)' }}
      onClick={() => { setVisible(false); onComplete?.(); }}
    >
      <div className="text-center space-y-4 animate-slide-up max-w-sm px-6">
        <div className="text-5xl">{info.icon}</div>
        <h2 className="font-display text-[28px] font-semibold text-text-primary">{info.name}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{info.description}</p>
        {bossTaunt && (
          <p className="font-display italic text-accent text-base mt-2">"{bossTaunt}"</p>
        )}
        <p className="text-xs text-text-muted mt-4">Tap to continue</p>
      </div>
    </div>
  );
}
