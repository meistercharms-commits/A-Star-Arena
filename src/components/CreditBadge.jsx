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

  // Show tier badge with credits
  if (paidCredits > 0) {
    const tierName = paidCredits > 50 ? 'A* Elite' : 'Scholar';
    const tierColour = paidCredits > 50 ? 'var(--color-accent-sand)' : 'var(--color-accent)';
    return (
      <Link to="/credits" className="no-underline">
        <span className="text-xs px-2 py-1 rounded-md font-medium"
          style={{ background: `color-mix(in srgb, ${tierColour} 15%, transparent)`, color: tierColour }}>
          {paidCredits} · <span className="font-display italic">{tierName}</span>
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
