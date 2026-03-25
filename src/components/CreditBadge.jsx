import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isNewUser } from '../lib/storage';

export default function CreditBadge() {
  const { isGuest, userProfile, hasFirebase } = useAuth();

  if (isNewUser()) return null;

  // Show Foundation badge for guests (with or without Firebase)
  if (isGuest || !userProfile) {
    return (
      <Link to={hasFirebase ? '/credits' : '/signin'} className="no-underline">
        <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-secondary">
          <span className="font-display italic">Foundation</span>
        </span>
      </Link>
    );
  }

  // Fellow tier: unlimited access, no badge shown (discreet)
  if (userProfile?.tier === 'fellow') {
    return (
      <Link to="/credits" className="no-underline">
        <span className="text-xs px-2 py-1 rounded-md text-text-secondary" style={{ background: 'var(--color-bg-tertiary)' }}>
          Unlimited
        </span>
      </Link>
    );
  }

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

  // Foundation tier (no paid credits) — hide badge entirely
  return null;
}
