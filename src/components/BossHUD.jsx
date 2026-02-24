import { useState, useEffect, useRef } from 'react';

const PHASES = [
  { key: 'recall', label: 'Phase 1: Recall' },
  { key: 'application', label: 'Phase 2: Application' },
  { key: 'extended', label: 'Phase 3: Exam Brain' },
];

export default function BossHUD({ boss, hp, maxHp, currentPhase, questionNum, totalQuestions }) {
  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  const hpColour = hpPercent > 50 ? boss?.hpBarColour || '#06b6d4' : hpPercent > 25 ? '#eab308' : '#ef4444';
  const prevHpRef = useRef(hp);
  const [showDamage, setShowDamage] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);

  // Detect HP change and trigger damage animation
  useEffect(() => {
    if (prevHpRef.current > hp) {
      const dmg = prevHpRef.current - hp;
      setDamageAmount(dmg);
      setShowDamage(true);
      const timer = setTimeout(() => setShowDamage(false), 800);
      prevHpRef.current = hp;
      return () => clearTimeout(timer);
    }
    prevHpRef.current = hp;
  }, [hp]);

  return (
    <div className={`bg-bg-secondary border border-border rounded-xl p-4 space-y-3 ${showDamage ? 'animate-shake' : ''}`}>
      {/* Boss info */}
      <div className="flex items-center gap-3">
        <span className={`text-3xl transition-transform ${showDamage ? 'animate-damage-flash' : ''}`}>
          {boss?.emoji || '⚔️'}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate">{boss?.bossName || 'Unknown Boss'}</h2>
          <p className="text-text-muted text-xs italic truncate">{boss?.flavourText}</p>
        </div>
        {/* Floating damage number */}
        {showDamage && damageAmount > 0 && (
          <span className="text-weak font-bold text-lg font-mono animate-score-pop">
            -{damageAmount}
          </span>
        )}
      </div>

      {/* HP Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-secondary">Boss HP</span>
          <span className={`font-mono ${showDamage ? 'text-weak' : ''}`}>
            {Math.max(0, hp)} / {maxHp}
          </span>
        </div>
        <div className="w-full bg-bg-tertiary rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${hpPercent}%`, backgroundColor: hpColour }}
          />
        </div>
      </div>

      {/* Phase indicators + question counter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {PHASES.map(p => (
            <span
              key={p.key}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all duration-300 ${
                currentPhase === p.key
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'bg-bg-tertiary text-text-muted'
              }`}
            >
              {p.label}
            </span>
          ))}
        </div>
        <span className="text-xs text-text-muted font-mono">
          Q {questionNum}/{totalQuestions}
        </span>
      </div>
    </div>
  );
}
