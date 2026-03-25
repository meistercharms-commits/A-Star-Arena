import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ShieldIcon } from '../components/Logo';

const PACKS = [
  { id: '20', amount: 20, price: '\u00a31.99', perCredit: '10p each', popular: false },
  { id: '50', amount: 50, price: '\u00a33.99', perCredit: '8p each', popular: true },
  { id: '100', amount: 100, price: '\u00a36.99', perCredit: '7p each', popular: false },
];

export default function Credits() {
  const { isGuest, userProfile, hasFirebase } = useAuth();
  const { theme } = useTheme();

  const freeUsed = userProfile?.freeAiBattlesUsedThisWeek || 0;
  const freeRemaining = Math.max(0, 5 - freeUsed);
  const paidCredits = userProfile?.credits || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display">Credits</h1>
        <p className="text-text-secondary text-sm mt-1">
          AI-powered battles use credits. Mock battles are always free.
        </p>
      </div>

      {/* Balance card */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-card">
        <h2 className="text-label mb-4">Your Balance</h2>

        {isGuest ? (
          <div className="text-center py-4">
            <p className="text-text-secondary mb-3">
              Create a free account to get 5 AI battles per week
            </p>
            <Link
              to="/signup"
              className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg no-underline inline-block"
            >
              Create Free Account
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="font-display text-stat text-accent">{freeRemaining}</div>
              <div className="text-label text-text-muted">Free This Week</div>
              <div className="text-xs text-text-muted mt-1">Resets every Monday</div>
            </div>
            <div className="text-center">
              <div className="font-display text-stat" style={{ color: 'var(--color-accent-sand)' }}>{paidCredits}</div>
              <div className="text-label text-text-muted">Paid Credits</div>
              <div className="text-xs text-text-muted mt-1">Never expire</div>
            </div>
          </div>
        )}
      </div>

      {/* How credits work */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-card">
        <h2 className="text-label mb-3">How Credits Work</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex justify-between">
            <span>AI Battle (3 phases)</span>
            <span className="font-medium text-text-primary">1 credit</span>
          </div>
          <div className="flex justify-between">
            <span>AI Study Guide</span>
            <span className="font-medium text-text-primary">1 credit</span>
          </div>
          <div className="flex justify-between">
            <span>Video Lesson (YouTube)</span>
            <span className="font-medium text-text-primary">2 credits</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between">
            <span>Mock Battles (no AI)</span>
            <span className="font-medium text-strong">Always free</span>
          </div>
          <div className="flex justify-between">
            <span>MCQ Drills</span>
            <span className="font-medium text-strong">Always free</span>
          </div>
        </div>
      </div>

      {/* Purchase packs */}
      {!isGuest && (
        <div>
          <h2 className="text-label mb-3">Buy Credits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PACKS.map(pack => (
              <div
                key={pack.id}
                className={`bg-bg-secondary border rounded-xl p-5 text-center shadow-card relative ${
                  pack.popular ? 'border-accent' : 'border-border'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-accent text-bg-primary px-2.5 py-0.5 rounded-full font-medium">
                    Best Value
                  </span>
                )}
                <div className="font-display text-stat text-text-primary">{pack.amount}</div>
                <div className="text-label text-text-muted mb-1">Credits</div>
                <div className="font-display text-xl text-text-primary mb-0.5">{pack.price}</div>
                <div className="text-xs text-text-muted mb-3">{pack.perCredit}</div>
                <button
                  className="text-button bg-accent text-bg-primary px-4 py-2 rounded-lg w-full cursor-pointer border-0 transition-opacity hover:opacity-90"
                  onClick={() => {
                    // Stripe checkout will be wired in Phase 4
                    alert('Stripe payments coming soon!');
                  }}
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
