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

  // Show free tier status or paid credits
  if (paidCredits > 0) {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-accent/15 text-accent font-medium">
        {paidCredits} credits
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-secondary">
      {freeRemaining}/5 free
    </span>
  );
}
