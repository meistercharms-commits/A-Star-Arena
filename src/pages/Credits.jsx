import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ShieldIcon } from '../components/Logo';

const PACKS = [
  { id: '20', name: 'Scholar', amount: 20, price: '£1.99', perCredit: '10p each', popular: false, colour: 'var(--color-accent)' },
  { id: '50', name: 'Distinction', amount: 50, price: '£3.99', perCredit: '8p each', popular: true, colour: 'var(--color-strong)' },
  { id: '100', name: 'A* Elite', amount: 100, price: '£6.99', perCredit: '7p each', popular: false, colour: 'var(--color-accent-sand)' },
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label">Your Balance</h2>
          {!isGuest && (() => {
            const tier = paidCredits >= 80
              ? { name: 'A* Elite', colour: 'var(--color-accent-sand)' }
              : paidCredits >= 30
              ? { name: 'Distinction', colour: 'var(--color-strong)' }
              : paidCredits > 0
              ? { name: 'Scholar', colour: 'var(--color-accent)' }
              : { name: 'Foundation', colour: 'var(--color-text-secondary)' };
            return (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full font-display italic"
                style={{ background: `color-mix(in srgb, ${tier.colour} 15%, transparent)`, color: tier.colour }}>
                {tier.name}
              </span>
            );
          })()}
        </div>

        {isGuest ? (
          <div className="text-center py-4">
            <p className="text-text-secondary mb-3">
              Create a free account to unlock the <span className="font-display italic text-accent">Foundation</span> tier — 5 AI battles every week
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
              <div className="text-label text-text-muted">Foundation (Free)</div>
              <div className="text-xs text-text-muted mt-1">5 per week, resets Monday</div>
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
            <span className="font-medium text-text-primary">3 credits</span>
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
          <h2 className="text-label mb-3">Credit Packs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PACKS.map(pack => (
              <div
                key={pack.id}
                className={`bg-bg-secondary border rounded-xl p-5 text-center shadow-card relative ${
                  pack.popular ? 'border-strong' : 'border-border'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: pack.colour, color: 'var(--color-bg-primary)' }}>
                    Most Popular
                  </span>
                )}
                <div className="font-display text-title italic mb-1" style={{ color: pack.colour }}>
                  {pack.name}
                </div>
                <div className="font-display text-stat text-text-primary">{pack.amount}</div>
                <div className="text-label text-text-muted mb-2">Credits</div>
                <div className="font-display text-xl text-text-primary mb-0.5">{pack.price}</div>
                <div className="text-xs text-text-muted mb-4">{pack.perCredit}</div>
                <button
                  className="text-button px-4 py-2 rounded-lg w-full cursor-pointer border-0 transition-opacity hover:opacity-90"
                  style={{ background: pack.colour, color: 'var(--color-bg-primary)' }}
                  onClick={() => {
                    // Stripe checkout will be wired in Phase 4
                    alert('Stripe payments coming soon!');
                  }}
                >
                  Buy {pack.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
