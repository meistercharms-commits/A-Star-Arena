export function ShieldIcon({ size = 32, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const shieldFill = isDark ? '#1a2535' : '#ece9e2';
  const strokeColor = isDark ? '#a3c094' : '#3d5080';
  const starFill = isDark ? '#a3c094' : '#3d5080';
  const boltFill = isDark ? '#1a2535' : '#ece9e2';
  const jewelFill = isDark ? '#d4b896' : '#b07a50';

  // Size-based detail levels
  const showInnerRing = size >= 48;
  const showBolt = size >= 24;
  const showJewel = size >= 48;

  return (
    <svg width={size} height={size * 73/64} viewBox="0 0 72 82" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer shield */}
      <path d="M8,12 L36,4 L64,12 L64,50 Q64,68 36,78 Q8,68 8,50 Z"
        fill={shieldFill} stroke={strokeColor} strokeWidth={size < 24 ? 2.5 : size < 48 ? 2 : 1.75} />

      {/* Inner ring - only at 48px+ */}
      {showInnerRing && (
        <path d="M14,16 L36,10 L58,16 L58,49 Q58,63 36,72 Q14,63 14,49 Z"
          fill="none" stroke={strokeColor} strokeWidth="0.6" opacity={isDark ? 0.22 : 0.2} />
      )}

      {/* Star */}
      <polygon
        points="36,18 39.8,30 52,30 42.2,37.8 46,50 36,42.5 26,50 29.8,37.8 20,30 32.2,30"
        fill={starFill} />

      {/* Lightning bolt - only at 24px+ */}
      {showBolt && (
        <path d="M38.5,21 L33,35.5 L38,35.5 L34,52 L42.5,34 L37.5,34 L40.5,21 Z"
          fill={boltFill} />
      )}

      {/* Jewel - only at 48px+ */}
      {showJewel && (
        <circle cx="36" cy="4" r="2.8" fill={jewelFill} />
      )}
    </svg>
  );
}

export function LogoLockup({ theme = 'dark' }) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e4ede0' : '#2c2a38';
  const accentColor = isDark ? '#a3c094' : '#5a6ea0';
  const ruleColor = isDark ? '#a3c094' : '#5a6ea0';
  const subBrandColor = isDark ? '#e4ede0' : '#2c2a38';

  return (
    <div className="flex items-center gap-2.5">
      <ShieldIcon size={36} theme={theme} />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-0">
          <span className="font-display text-[22px] font-semibold tracking-[0.02em] leading-none" style={{ color: textColor }}>
            A
          </span>
          <span className="font-display text-[19px] font-semibold leading-none" style={{ color: accentColor }}>
            *
          </span>
          <span className="font-display text-[22px] font-semibold tracking-[0.02em] leading-none ml-1" style={{ color: textColor }}>
            Arena
          </span>
        </div>
        <div className="h-px mt-1 mb-0.5" style={{ backgroundColor: ruleColor, opacity: 0.22 }} />
        <span className="text-sub-brand" style={{ color: subBrandColor, opacity: 0.28 }}>
          BY EVERYDAY ARC
        </span>
      </div>
    </div>
  );
}
