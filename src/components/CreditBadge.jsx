import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CreditBadge() {
  const { isGuest, userProfile, hasFirebase } = useAuth();

  // Don't show if Firebase isn't configured
  if (!hasFirebase) return null;

  if (isGuest) {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">
        Guest
      </span>
    );
  }

  if (!userProfile) return null;

  const freeRemaining = Math.max(0, 5 - (userProfile.freeAiBattlesUsedThisWeek || 0));
  const paidCredits = userProfile.credits || 0;

  // Tier based on current credit balance — drops to Foundation at zero
  const tier = paidCredits >= 80
    ? { name: 'A* Elite',    colour: 'var(--color-accent-sand)' }
    : paidCredits >= 30
    ? { name: 'Distinction', colour: 'var(--color-strong)' }
    : paidCredits > 0
    ? { name: 'Scholar',     colour: 'var(--color-accent)' }
    : null;

  if (tier) {
    return (
      <Link to="/credits" className="no-underline">
        <span className="text-xs px-2 py-1 rounded-md font-medium"
          style={{ background: `color-mix(in srgb, ${tier.colour} 15%, transparent)`, color: tier.colour }}>
          {paidCredits} · <span className="font-display italic">{tier.name}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link to="/credits" className="no-underline">
      <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-secondary">
        {freeRemaining}/5 · <span className="font-display italic">Foundation</span>
      </span>
    </Link>
  );
}
