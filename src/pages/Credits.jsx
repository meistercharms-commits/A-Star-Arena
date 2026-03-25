import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const PACKS = [
  {
    id: 'scholar', name: 'Scholar', amount: 20, price: '\u00a31.99', perCredit: '10p / credit',
    colour: '#9bb8c4', badge: null, topBorder: false,
    features: [
      '20 standard battles',
      'Good for a few focused sessions',
      'Unlocks Scholar badge',
    ],
  },
  {
    id: 'distinction', name: 'Distinction', amount: 50, price: '\u00a33.99', perCredit: '8p / credit',
    colour: '#a3c094', badge: 'Best value', topBorder: true,
    features: [
      '50 standard battles',
      '10 video quiz imports',
      'Unlocks Distinction badge',
      'Covers a full revision season',
    ],
  },
  {
    id: 'elite', name: 'A* Elite', amount: 100, price: '\u00a36.99', perCredit: '7p / credit',
    colour: '#d4b896', badge: 'Most popular', topBorder: true,
    features: [
      '100 standard battles',
      '20 video quiz imports',
      'Unlocks A* Elite badge',
      'Parent dashboard access',
      'Weekly AI tutor report',
    ],
  },
  {
    id: 'honours', name: 'Honours', amount: 250, price: '\u00a314.99', perCredit: '6p / credit',
    colour: '#e4ede0', badge: null, topBorder: false,
    features: [
      '250 standard battles',
      '50 video quiz imports',
      'All A* Elite features',
      'Ideal for full academic year',
      'Gift a pack to a student',
    ],
  },
];

const TIERS = [
  { name: 'Foundation', credits: 'Free', colour: '#a3c094' },
  { name: 'Scholar', credits: '20 credits', colour: '#9bb8c4' },
  { name: 'Distinction', credits: '50 credits', colour: '#a3c094' },
  { name: 'A* Elite', credits: '100 credits', colour: '#d4b896' },
  { name: 'Honours', credits: '250 credits', colour: '#e4ede0' },
  { name: 'Fellow', credits: 'Unlimited', colour: '#e4ede0' },
];

export default function Credits() {
  const { isGuest, userProfile } = useAuth();

  const freeUsed = userProfile?.freeAiBattlesUsedThisWeek || 0;
  const freeRemaining = Math.max(0, 5 - freeUsed);
  const paidCredits = userProfile?.credits || 0;
  const highestTier = userProfile?.highestTier || (paidCredits > 0 ? 'Scholar' : 'Foundation');

  const currentTier = TIERS.find(t => t.name === highestTier) || TIERS[0];

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div className="text-center flex flex-col gap-1.5">
        <h1 className="font-display text-[34px] font-semibold tracking-[0.02em] text-text-primary">
          Buy credits, use them your way
        </h1>
        <p className="text-[13px] text-text-muted leading-relaxed">
          No subscriptions. No resets. Credits stay in your wallet until you use them.
          <br />Start free — buy more when you need them.
        </p>
      </div>

      {/* Balance card - only for logged-in users */}
      {!isGuest && (
        <div className="rounded-xl px-6 py-5 flex items-center justify-between bg-bg-secondary border border-border">
          {userProfile?.tier === 'fellow' ? (
            <div className="text-center py-4 w-full">
              <div className="font-display text-[38px] font-semibold text-text-primary">∞</div>
              <div className="text-[9px] tracking-[0.1em] uppercase mt-1 text-text-muted">Fellow · Unlimited</div>
              <p className="text-xs text-text-muted mt-2">You have unlimited access to all features.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="font-display text-[38px] font-semibold leading-none" style={{ color: '#a3c094' }}>
                    {freeRemaining}
                  </div>
                  <div className="text-[9px] tracking-[0.1em] uppercase mt-1" style={{ color: `color-mix(in srgb, #a3c094 50%, transparent)` }}>
                    Free this week
                  </div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="font-display text-[38px] font-semibold leading-none" style={{ color: '#d4b896' }}>
                    {paidCredits}
                  </div>
                  <div className="text-[9px] tracking-[0.1em] uppercase mt-1" style={{ color: `color-mix(in srgb, #d4b896 50%, transparent)` }}>
                    Paid credits
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="text-[11px] font-medium px-3 py-1 rounded-full font-display italic"
                  style={{
                    background: `color-mix(in srgb, ${currentTier.colour} 8%, transparent)`,
                    color: currentTier.colour,
                    border: `0.5px solid color-mix(in srgb, ${currentTier.colour} 25%, transparent)`,
                  }}
                >
                  {highestTier}
                </span>
                <span className="text-[10px] text-text-muted opacity-60">
                  Free resets Monday
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Free banner */}
      <div
        className="rounded-[10px] px-5 py-4 flex items-center justify-between gap-4"
        style={{
          background: `color-mix(in srgb, #a3c094 8%, transparent)`,
          border: `0.5px solid color-mix(in srgb, #a3c094 25%, transparent)`,
        }}
      >
        <div>
          <div className="font-display text-xl font-semibold text-text-primary">Start for free</div>
          <div className="text-xs text-text-muted mt-0.5">
            {isGuest
              ? 'Create an account to get 5 credits to explore A* Arena — no card required.'
              : 'Every account gets 5 free credits per week — no card required.'}
          </div>
        </div>
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="text-center">
            <div className="font-display text-[32px] font-semibold leading-none" style={{ color: '#a3c094' }}>5</div>
            <div className="text-[9px] font-medium tracking-[0.1em] uppercase" style={{ color: `color-mix(in srgb, #a3c094 50%, transparent)` }}>
              free credits
            </div>
          </div>
          {isGuest ? (
            <Link
              to="/signup"
              className="no-underline text-xs font-medium px-4.5 py-2 rounded-[7px] cursor-pointer"
              style={{
                background: `color-mix(in srgb, #a3c094 15%, transparent)`,
                color: '#a3c094',
                border: `0.5px solid color-mix(in srgb, #a3c094 30%, transparent)`,
              }}
            >
              Get started
            </Link>
          ) : (
            <span
              className="text-xs font-medium px-4.5 py-2 rounded-[7px]"
              style={{
                background: `color-mix(in srgb, #a3c094 15%, transparent)`,
                color: '#a3c094',
                border: `0.5px solid color-mix(in srgb, #a3c094 30%, transparent)`,
              }}
            >
              Foundation
            </span>
          )}
        </div>
      </div>

      {/* Credit packs */}
      <div className="text-[9px] font-medium tracking-[0.16em] uppercase text-text-muted">Credit packs</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 -mt-4">
        {PACKS.map(pack => (
          <div
            key={pack.id}
            className="rounded-xl flex flex-col gap-3 relative cursor-pointer"
            style={{
              background: `color-mix(in srgb, ${pack.colour} 8%, transparent)`,
              border: `0.5px solid color-mix(in srgb, ${pack.colour} 25%, transparent)`,
              borderTop: pack.topBorder ? `2px solid ${pack.colour}` : undefined,
              padding: pack.topBorder ? '26px 16px 20px' : '20px 16px',
            }}
          >
            {pack.badge && (
              <span
                className="absolute -top-px left-1/2 -translate-x-1/2 text-[8px] font-medium tracking-[0.1em] uppercase px-2.5 py-0.5 whitespace-nowrap"
                style={{
                  background: pack.colour,
                  color: '#181f2c',
                  borderRadius: '0 0 6px 6px',
                }}
              >
                {pack.badge}
              </span>
            )}

            {/* Credits */}
            <div>
              <div className="font-display text-[44px] font-semibold leading-none" style={{ color: pack.colour }}>
                {pack.amount}
              </div>
              <div
                className="text-[9px] tracking-[0.1em] uppercase -mt-1"
                style={{ color: `color-mix(in srgb, ${pack.colour} 50%, transparent)` }}
              >
                credits
              </div>
            </div>

            {/* Rule */}
            <div className="h-px" style={{ background: `color-mix(in srgb, ${pack.colour} 15%, transparent)` }} />

            {/* Features */}
            <div className="flex flex-col gap-1.5">
              {pack.features.map((feat, i) => (
                <div key={i} className="text-[11px] flex items-start gap-1.5 leading-snug text-text-muted">
                  <div
                    className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                    style={{ background: pack.colour }}
                  />
                  {feat}
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline justify-between mt-auto">
              <div className="font-display text-[28px] font-semibold" style={{ color: pack.colour }}>
                {pack.price}
              </div>
              <div className="text-[9px] tracking-[0.06em]" style={{ color: `color-mix(in srgb, ${pack.colour} 40%, transparent)` }}>
                {pack.perCredit}
              </div>
            </div>

            {/* Button */}
            <button
              className="w-full py-2.5 rounded-[7px] text-xs font-medium cursor-pointer border-0 transition-opacity hover:opacity-90"
              style={
                pack.id === 'honours'
                  ? {
                      background: `color-mix(in srgb, ${pack.colour} 10%, transparent)`,
                      color: pack.colour,
                      border: `0.5px solid color-mix(in srgb, ${pack.colour} 15%, transparent)`,
                    }
                  : { background: pack.colour, color: '#181f2c' }
              }
              onClick={() => alert('Stripe payments coming soon!')}
            >
              Buy {pack.name} pack
            </button>
          </div>
        ))}
      </div>

      {/* How credits work */}
      <div className="rounded-[10px] px-5 py-4 flex flex-col gap-3 bg-bg-secondary border border-border">
        <div className="text-[9px] font-medium tracking-[0.16em] uppercase text-text-muted">
          How credits work
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: '#a3c094' }}>1 credit</div>
            <div className="text-[11px] mt-0.5 text-text-muted">
              Standard question battle — any subject, any topic
            </div>
          </div>
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: '#9bb8c4' }}>3 credits</div>
            <div className="text-[11px] mt-0.5 text-text-muted">
              Extended answer with full AI mark scheme feedback
            </div>
          </div>
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: '#d4b896' }}>5 credits</div>
            <div className="text-[11px] mt-0.5 text-text-muted">
              Generate a quiz from a YouTube video or upload
            </div>
          </div>
        </div>
      </div>

      {/* Tier badges */}
      <div className="flex flex-col gap-2.5">
        <div className="text-[9px] font-medium tracking-[0.16em] uppercase text-text-muted">
          Your badge level is set by your highest pack purchase
        </div>
        <div className="flex gap-2 flex-wrap">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${tier.colour} 8%, transparent)`,
                border: `0.5px solid color-mix(in srgb, ${tier.colour} 25%, transparent)`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: tier.colour }} />
              <span className="text-[11px] font-medium" style={{ color: tier.colour }}>{tier.name}</span>
              <span className="text-[10px] opacity-50" style={{ color: tier.colour }}>{tier.credits}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] leading-relaxed text-text-muted opacity-60">
        Credits never expire. No subscriptions. No hidden fees.
        <br />
        Gifting a pack? Select "Gift this pack" at checkout — we'll send a code directly to your student.
      </p>
    </div>
  );
}
