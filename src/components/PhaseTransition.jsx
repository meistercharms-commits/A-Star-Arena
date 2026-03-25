import { useEffect, useRef, useState } from 'react';
import { Zap, FlaskConical, Target } from 'lucide-react';

const PHASE_INFO = {
  recall: {
    name: 'Phase 1: Recall',
    description: 'Show what you know. Quick-fire questions testing your foundations.',
    Icon: Zap,
  },
  application: {
    name: 'Phase 2: Application',
    description: 'Apply your knowledge. Deeper questions that test understanding.',
    Icon: FlaskConical,
  },
  extended: {
    name: 'Phase 3: Extended Response',
    description: 'The final challenge. Show the examiner everything you\'ve got.',
    Icon: Target,
  },
};

export default function PhaseTransition({ phase, bossTaunt, onComplete }) {
  const [visible, setVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);
  const firedRef = useRef(false);
  onCompleteRef.current = onComplete;
  const info = PHASE_INFO[phase] || PHASE_INFO.recall;

  const dismiss = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setVisible(false);
    onCompleteRef.current?.();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(24,31,44,0.92)' }}
    >
      <div className="text-center space-y-4 animate-slide-up max-w-sm px-6">
        <div className="flex justify-center"><info.Icon size={40} className="text-accent" /></div>
        <h2 className="font-display text-[28px] font-semibold text-text-primary">{info.name}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{info.description}</p>
        {bossTaunt && (
          <p className="font-display italic text-accent text-base mt-2">"{bossTaunt}"</p>
        )}
        <button
          onClick={dismiss}
          className="mt-4 text-button bg-accent text-bg-primary px-6 py-2.5 rounded-lg cursor-pointer border-0 transition-opacity hover:opacity-90"
          autoFocus
        >
          Continue
        </button>
      </div>
    </div>
  );
}
