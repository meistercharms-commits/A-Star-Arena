import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const PACKS = [
  {
    id: 'scholar', name: 'Scholar', amount: 20, price: '£1.99', perCredit: '10p / credit',
    colour: '#9bb8c4', bgTint: 'rgba(155,184,196,0.07)', borderColour: 'rgba(155,184,196,0.2)',
    dotColour: '#9bb8c4', labelColour: 'rgba(155,184,196,0.5)', priceSecondary: 'rgba(155,184,196,0.4)',
    ruleBg: 'rgba(155,184,196,0.12)', badge: null, topBorder: false,
    features: [
      '20 standard battles',
      'Good for a few focused sessions',
      'Unlocks Scholar badge',
    ],
  },
  {
    id: 'distinction', name: 'Distinction', amount: 50, price: '£3.99', perCredit: '8p / credit',
    colour: '#a3c094', bgTint: 'rgba(163,192,148,0.08)', borderColour: 'rgba(163,192,148,0.28)',
    dotColour: '#a3c094', labelColour: 'rgba(163,192,148,0.5)', priceSecondary: 'rgba(163,192,148,0.4)',
    ruleBg: 'rgba(163,192,148,0.15)', badge: 'Best value', topBorder: true,
    features: [
      '50 standard battles',
      '10 video quiz imports',
      'Unlocks Distinction badge',
      'Covers a full revision season',
    ],
  },
  {
    id: 'elite', name: 'A* Elite', amount: 100, price: '£6.99', perCredit: '7p / credit',
    colour: '#d4b896', bgTint: 'rgba(212,184,150,0.07)', borderColour: 'rgba(212,184,150,0.25)',
    dotColour: '#d4b896', labelColour: 'rgba(212,184,150,0.5)', priceSecondary: 'rgba(212,184,150,0.4)',
    ruleBg: 'rgba(212,184,150,0.12)', badge: 'Most popular', topBorder: true,
    features: [
      '100 standard battles',
      '20 video quiz imports',
      'Unlocks A* Elite badge',
      'Parent dashboard access',
      'Weekly AI tutor report',
    ],
  },
  {
    id: 'honours', name: 'Honours', amount: 250, price: '£14.99', perCredit: '6p / credit',
    colour: '#e4ede0', bgTint: 'rgba(255,255,255,0.03)', borderColour: 'rgba(255,255,255,0.1)',
    dotColour: 'rgba(228,237,224,0.4)', labelColour: 'rgba(228,237,224,0.3)', priceSecondary: 'rgba(228,237,224,0.3)',
    ruleBg: 'rgba(255,255,255,0.07)', badge: null, topBorder: false,
    btnStyle: { background: 'rgba(255,255,255,0.08)', color: '#e4ede0', border: '0.5px solid rgba(255,255,255,0.12)' },
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
  { name: 'Foundation', credits: 'Free', colour: '#a3c094', bg: 'rgba(163,192,148,0.08)', border: 'rgba(163,192,148,0.2)' },
  { name: 'Scholar', credits: '20 credits', colour: '#9bb8c4', bg: 'rgba(155,184,196,0.08)', border: 'rgba(155,184,196,0.2)' },
  { name: 'Distinction', credits: '50 credits', colour: '#a3c094', bg: 'rgba(163,192,148,0.08)', border: 'rgba(163,192,148,0.25)' },
  { name: 'A* Elite', credits: '100 credits', colour: '#d4b896', bg: 'rgba(212,184,150,0.08)', border: 'rgba(212,184,150,0.25)' },
  { name: 'Honours', credits: '250 credits', colour: '#e4ede0', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)' },
];

export default function Credits() {
  const { isGuest, userProfile } = useAuth();

  const freeUsed = userProfile?.freeAiBattlesUsedThisWeek || 0;
  const freeRemaining = Math.max(0, 5 - freeUsed);
  const paidCredits = userProfile?.credits || 0;
  const highestTier = userProfile?.highestTier || (paidCredits > 0 ? 'Scholar' : 'Foundation');

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
        <div
          className="rounded-xl px-6 py-5 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="font-display text-[38px] font-semibold leading-none" style={{ color: '#a3c094' }}>
                {freeRemaining}
              </div>
              <div className="text-[9px] tracking-[0.1em] uppercase mt-1" style={{ color: 'rgba(163,192,148,0.5)' }}>
                Free this week
              </div>
            </div>
            <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <div className="font-display text-[38px] font-semibold leading-none" style={{ color: '#d4b896' }}>
                {paidCredits}
              </div>
              <div className="text-[9px] tracking-[0.1em] uppercase mt-1" style={{ color: 'rgba(212,184,150,0.5)' }}>
                Paid credits
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className="text-[11px] font-medium px-3 py-1 rounded-full font-display italic"
              style={{
                background: `${TIERS.find(t => t.name === highestTier)?.bg || TIERS[0].bg}`,
                color: TIERS.find(t => t.name === highestTier)?.colour || TIERS[0].colour,
                border: `0.5px solid ${TIERS.find(t => t.name === highestTier)?.border || TIERS[0].border}`,
              }}
            >
              {highestTier}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(228,237,224,0.28)' }}>
              Free resets Monday
            </span>
          </div>
        </div>
      )}

      {/* Free banner */}
      <div
        className="rounded-[10px] px-5 py-4 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(163,192,148,0.08)',
          border: '0.5px solid rgba(163,192,148,0.2)',
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
            <div className="text-[9px] font-medium tracking-[0.1em] uppercase" style={{ color: 'rgba(163,192,148,0.5)' }}>
              free credits
            </div>
          </div>
          {isGuest ? (
            <Link
              to="/signup"
              className="no-underline text-xs font-medium px-4.5 py-2 rounded-[7px] cursor-pointer"
              style={{
                background: 'rgba(163,192,148,0.15)',
                color: '#a3c094',
                border: '0.5px solid rgba(163,192,148,0.3)',
              }}
            >
              Get started
            </Link>
          ) : (
            <span
              className="text-xs font-medium px-4.5 py-2 rounded-[7px]"
              style={{
                background: 'rgba(163,192,148,0.15)',
                color: '#a3c094',
                border: '0.5px solid rgba(163,192,148,0.3)',
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
              background: pack.bgTint,
              border: `0.5px solid ${pack.borderColour}`,
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
                style={{ color: pack.labelColour }}
              >
                credits
              </div>
            </div>

            {/* Rule */}
            <div className="h-px" style={{ background: pack.ruleBg }} />

            {/* Features */}
            <div className="flex flex-col gap-1.5">
              {pack.features.map((feat, i) => (
                <div key={i} className="text-[11px] flex items-start gap-1.5 leading-snug" style={{ color: 'rgba(228,237,224,0.6)' }}>
                  <div
                    className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                    style={{ background: pack.dotColour }}
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
              <div className="text-[9px] tracking-[0.06em]" style={{ color: pack.priceSecondary }}>
                {pack.perCredit}
              </div>
            </div>

            {/* Button */}
            <button
              className="w-full py-2.5 rounded-[7px] text-xs font-medium cursor-pointer border-0 transition-opacity hover:opacity-90"
              style={pack.btnStyle || { background: pack.colour, color: '#181f2c' }}
              onClick={() => alert('Stripe payments coming soon!')}
            >
              Buy {pack.name} pack
            </button>
          </div>
        ))}
      </div>

      {/* How credits work */}
      <div
        className="rounded-[10px] px-5 py-4 flex flex-col gap-3"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="text-[9px] font-medium tracking-[0.16em] uppercase text-text-muted">
          How credits work
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: '#a3c094' }}>1 credit</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(228,237,224,0.38)' }}>
              Standard question battle — any subject, any topic
            </div>
          </div>
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: '#9bb8c4' }}>3 credits</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(228,237,224,0.38)' }}>
              Extended answer with full AI mark scheme feedback
            </div>
          </div>
          <div>
            <div className="font-display text-[22px] font-semibold leading-none" style={{ color: '#d4b896' }}>5 credits</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(228,237,224,0.38)' }}>
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
              style={{ background: tier.bg, border: `0.5px solid ${tier.border}` }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: tier.colour }} />
              <span className="text-[11px] font-medium" style={{ color: tier.colour }}>{tier.name}</span>
              <span className="text-[10px] opacity-50" style={{ color: tier.colour }}>{tier.credits}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] leading-relaxed" style={{ color: 'rgba(228,237,224,0.22)' }}>
        Credits never expire. No subscriptions. No hidden fees.
        <br />
        Gifting a pack? Select "Gift this pack" at checkout — we'll send a code directly to your student.
      </p>
    </div>
  );
}
