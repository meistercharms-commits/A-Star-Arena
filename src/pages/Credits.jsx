import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

// Dark mode colours / light mode colours
const PACK_COLOURS = {
  scholar:     { dark: '#9bb8c4', light: '#4a7a8a' },
  distinction: { dark: '#a3c094', light: '#4a7a50' },
  elite:       { dark: '#d4b896', light: '#8a6a3a' },
  honours:     { dark: '#e4ede0', light: '#5a6050' },
};

const PACKS = [
  {
    id: 'scholar', name: 'Scholar', amount: 20, price: '\u00a31.99', perCredit: '10p / credit',
    colourKey: 'scholar', badge: null, topBorder: false,
    features: [
      '20 standard battles',
      'Good for a few focused sessions',
      'Unlocks Scholar badge',
    ],
  },
  {
    id: 'distinction', name: 'Distinction', amount: 50, price: '\u00a33.99', perCredit: '8p / credit',
    colourKey: 'distinction', badge: 'Best value', topBorder: true,
    features: [
      '50 standard battles',
      '10 video quiz imports',
      'Unlocks Distinction badge',
      'Covers a full revision season',
    ],
  },
  {
    id: 'elite', name: 'A* Elite', amount: 100, price: '\u00a36.99', perCredit: '7p / credit',
    colourKey: 'elite', badge: 'Most popular', topBorder: true,
    features: [
      '100 standard battles',
      '20 video quiz imports',
      'Unlocks A* Elite badge',
      'Priority support',
    ],
  },
  {
    id: 'honours', name: 'Honours', amount: 250, price: '\u00a314.99', perCredit: '6p / credit',
    colourKey: 'honours', badge: null, topBorder: false,
    features: [
      '250 standard battles',
      '50 video quiz imports',
      'All A* Elite features',
      'Ideal for full academic year',
      'Gift a pack to a student',
    ],
  },
];

const TIER_COLOURS = {
  Foundation:  { dark: '#a3c094', light: '#4a7a50' },
  Scholar:     { dark: '#9bb8c4', light: '#4a7a8a' },
  Distinction: { dark: '#a3c094', light: '#4a7a50' },
  'A* Elite':  { dark: '#d4b896', light: '#8a6a3a' },
  Honours:     { dark: '#e4ede0', light: '#5a6050' },
};

const TIERS = [
  { name: 'Foundation', credits: 'Free' },
  { name: 'Scholar', credits: '20 credits' },
  { name: 'Distinction', credits: '50 credits' },
  { name: 'A* Elite', credits: '100 credits' },
  { name: 'Honours', credits: '250 credits' },
];

export default function Credits() {
  const { isGuest, userProfile } = useAuth();
  const { theme } = useTheme();
  const mode = theme === 'light' ? 'light' : 'dark';

  // Resolve pack colour for current theme
  const packColour = (pack) => PACK_COLOURS[pack.colourKey]?.[mode] || '#888';
  // Resolve tier colour for current theme
  const tierColour = (tierName) => TIER_COLOURS[tierName]?.[mode] || '#888';
  // Sage accent for the free banner
  const sage = mode === 'light' ? '#4a7a50' : '#a3c094';

  const freeUsed = userProfile?.freeAiBattlesUsedThisWeek || 0;
  const freeRemaining = Math.max(0, 5 - freeUsed);
  const paidCredits = userProfile?.credits || 0;
  const highestTier = userProfile?.highestTier || (paidCredits > 0 ? 'Scholar' : 'Foundation');

  const currentTierColour = tierColour(highestTier);

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
                  <div className="font-display text-[38px] font-semibold leading-none" style={{ color: sage }}>
                    {freeRemaining}
                  </div>
                  <div className="text-[9px] tracking-[0.1em] uppercase mt-1" style={{ color: `color-mix(in srgb, ${sage} 50%, transparent)` }}>
                    Free this week
                  </div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="font-display text-[38px] font-semibold leading-none" style={{ color: tierColour('A* Elite') }}>
                    {paidCredits}
                  </div>
                  <div className="text-[9px] tracking-[0.1em] uppercase mt-1" style={{ color: `color-mix(in srgb, ${tierColour('A* Elite')} 50%, transparent)` }}>
                    Paid credits
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="text-[11px] font-medium px-3 py-1 rounded-full font-display italic"
                  style={{
                    background: `color-mix(in srgb, ${currentTierColour} 8%, transparent)`,
                    color: currentTierColour,
                    border: `0.5px solid color-mix(in srgb, ${currentTierColour} 25%, transparent)`,
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
          background: `color-mix(in srgb, ${sage} 8%, transparent)`,
          border: `0.5px solid color-mix(in srgb, ${sage} 25%, transparent)`,
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
            <div className="font-display text-[32px] font-semibold leading-none" style={{ color: sage }}>5</div>
            <div className="text-[9px] font-medium tracking-[0.1em] uppercase" style={{ color: `color-mix(in srgb, ${sage} 50%, transparent)` }}>
              free credits
            </div>
          </div>
          {isGuest ? (
            <Link
              to="/signup"
              className="no-underline text-xs font-medium px-4.5 py-2 rounded-[7px] cursor-pointer"
              style={{
                background: `color-mix(in srgb, ${sage} 15%, transparent)`,
                color: sage,
                border: `0.5px solid color-mix(in srgb, ${sage} 30%, transparent)`,
              }}
            >
              Get started
            </Link>
          ) : (
            <span
              className="text-xs font-medium px-4.5 py-2 rounded-[7px]"
              style={{
                background: `color-mix(in srgb, ${sage} 15%, transparent)`,
                color: sage,
                border: `0.5px solid color-mix(in srgb, ${sage} 30%, transparent)`,
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
              background: `color-mix(in srgb, ${packColour(pack)} 8%, transparent)`,
              border: `0.5px solid color-mix(in srgb, ${packColour(pack)} 25%, transparent)`,
              borderTop: pack.topBorder ? `2px solid ${packColour(pack)}` : undefined,
              padding: pack.topBorder ? '26px 16px 20px' : '20px 16px',
            }}
          >
            {pack.badge && (
              <span
                className="absolute -top-px left-1/2 -translate-x-1/2 text-[8px] font-medium tracking-[0.1em] uppercase px-2.5 py-0.5 whitespace-nowrap"
                style={{
                  background: packColour(pack),
                  color: '#181f2c',
                  borderRadius: '0 0 6px 6px',
                }}
              >
                {pack.badge}
              </span>
            )}

            {/* Credits */}
            <div>
              <div className="font-display text-[44px] font-semibold leading-none" style={{ color: packColour(pack) }}>
                {pack.amount}
              </div>
              <div
                className="text-[9px] tracking-[0.1em] uppercase mt-0.5"
                style={{ color: `color-mix(in srgb, ${packColour(pack)} 50%, transparent)` }}
              >
                credits
              </div>
            </div>

            {/* Rule */}
            <div className="h-px" style={{ background: `color-mix(in srgb, ${packColour(pack)} 15%, transparent)` }} />

            {/* Features */}
            <div className="flex flex-col gap-1.5">
              {pack.features.map((feat, i) => (
                <div key={i} className="text-[11px] flex items-start gap-1.5 leading-snug text-text-muted">
                  <div
                    className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                    style={{ background: packColour(pack) }}
                  />
                  {feat}
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline justify-between mt-auto">
              <div className="font-display text-[28px] font-semibold" style={{ color: packColour(pack) }}>
                {pack.price}
              </div>
              <div className="text-[9px] tracking-[0.06em]" style={{ color: `color-mix(in srgb, ${packColour(pack)} 40%, transparent)` }}>
                {pack.perCredit}
              </div>
            </div>

            {/* Button */}
            <button
              className="w-full py-2.5 rounded-[7px] text-xs font-medium cursor-pointer border-0 transition-opacity hover:opacity-90"
              style={
                pack.id === 'honours'
                  ? {
                      background: `color-mix(in srgb, ${packColour(pack)} 10%, transparent)`,
                      color: packColour(pack),
                      border: `0.5px solid color-mix(in srgb, ${packColour(pack)} 15%, transparent)`,
                    }
                  : { background: packColour(pack), color: '#181f2c' }
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
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: sage }}>1 credit</div>
            <div className="text-[11px] mt-0.5 text-text-muted">
              AI battle (recall + application phases)
            </div>
          </div>
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: tierColour('Scholar') }}>3 credits</div>
            <div className="text-[11px] mt-0.5 text-text-muted">
              Extended response with full AI mark scheme feedback
            </div>
          </div>
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: tierColour('A* Elite') }}>5 credits</div>
            <div className="text-[11px] mt-0.5 text-text-muted">
              Video lesson from a YouTube link (Opus-powered)
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
          {TIERS.map(tier => {
            const tc = tierColour(tier.name);
            return (
              <div
                key={tier.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: `color-mix(in srgb, ${tc} 8%, transparent)`,
                  border: `0.5px solid color-mix(in srgb, ${tc} 25%, transparent)`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: tc }} />
                <span className="text-[11px] font-medium" style={{ color: tc }}>{tier.name}</span>
                <span className="text-[10px] opacity-50" style={{ color: tc }}>{tier.credits}</span>
              </div>
            );
          })}
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
