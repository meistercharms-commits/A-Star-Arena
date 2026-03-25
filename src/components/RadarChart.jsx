import { useMemo } from 'react';
import { getAllTopicMasteries } from '../lib/mastery';
import { useSubject } from '../contexts/SubjectContext';

const CATEGORY_META = {
  strong:     { colour: 'var(--color-strong)',     label: 'Strong',      order: 3 },
  developing: { colour: 'var(--color-developing)',  label: 'Developing',  order: 2 },
  weak:       { colour: 'var(--color-weak)',        label: 'Weak',        order: 1 },
  untested:   { colour: 'var(--color-untested)',    label: 'Not Started', order: 0 },
};

/* ── Mini Radar (compact spider chart, pure SVG) ── */
function MiniRadar({ data }) {
  const n = data.length;
  if (n < 3) return null;

  // Scale radar based on topic count - smaller radius for more topics
  const r = n > 12 ? 55 : n > 8 ? 65 : 75;
  const labelOffset = n > 12 ? 22 : 28;
  const size = (r + labelOffset + 30) * 2; // Enough room for labels
  const cx = size / 2;
  const cy = size / 2;
  const levels = [0.25, 0.5, 0.75, 1.0];
  const fontSize = n > 12 ? 6.5 : 8;

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, ratio) => ({
    x: cx + r * ratio * Math.cos(angle(i)),
    y: cy + r * ratio * Math.sin(angle(i)),
  });

  // Grid rings
  const rings = levels.map(level => {
    const pts = Array.from({ length: n }, (_, i) => point(i, level));
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  });

  // Axes
  const axes = Array.from({ length: n }, (_, i) => point(i, 1));

  // Data polygon
  const dataPts = data.map((d, i) => point(i, d.mastery));
  const dataPath = dataPts.map(p => `${p.x},${p.y}`).join(' ');

  // Average mastery for fill colour
  const avg = data.reduce((s, d) => s + d.mastery, 0) / n;
  const fillCat = avg >= 0.8 ? 'strong' : avg >= 0.55 ? 'developing' : avg >= 0.3 ? 'weak' : 'untested';
  const fillColour = CATEGORY_META[fillCat].colour;

  // Label positions (pushed outside the radar)
  const labelPts = data.map((d, i) => {
    const lr = r + labelOffset;
    return {
      x: cx + lr * Math.cos(angle(i)),
      y: cy + lr * Math.sin(angle(i)),
      anchor: Math.cos(angle(i)) < -0.3 ? 'end' : Math.cos(angle(i)) > 0.3 ? 'start' : 'middle',
    };
  });

  // Truncate label to fit
  const truncLabel = (name) => name.length > 10 ? name.slice(0, 9) + '…' : name;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto" style={{ height: 'auto' }}>
      {/* Grid */}
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.6" />
      ))}

      {/* Axes */}
      {axes.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-border)" strokeWidth="0.3" opacity="0.4" />
      ))}

      {/* Data polygon */}
      <polygon points={dataPath} fill={fillColour} fillOpacity="0.15" stroke={fillColour} strokeWidth="1.5" />

      {/* Vertex dots */}
      {dataPts.map((p, i) => {
        const cat = data[i].category;
        return (
          <circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill={CATEGORY_META[cat]?.colour || CATEGORY_META.untested.colour} />
        );
      })}

      {/* Labels */}
      {labelPts.map((lp, i) => (
        <text key={i} x={lp.x} y={lp.y} textAnchor={lp.anchor} dominantBaseline="central"
          fill="var(--color-text-secondary)" fontSize={fontSize} fontFamily="var(--font-ui)">
          {truncLabel(data[i].shortName)}
        </text>
      ))}
    </svg>
  );
}

/* ── Progress Bars Section ── */
function ProgressBars({ groups, onTopicClick }) {
  const groupOrder = ['weak', 'untested', 'developing', 'strong'];

  return (
    <div className="space-y-4">
      {groupOrder.map(cat => {
        const items = groups[cat];
        if (!items?.length) return null;
        const meta = CATEGORY_META[cat];

        return (
          <div key={cat}>
            <div className="text-label mb-2" style={{ color: meta.colour }}>
              {meta.label} ({items.length})
            </div>
            <div className="space-y-2">
              {items.map(t => (
                <div key={t.topicId} className="flex items-center gap-2">
                  <span className="text-sm flex-1 min-w-0"
                    style={{ color: 'var(--color-text-primary)' }}>
                    {t.name}
                  </span>
                  <div className="w-[80px] sm:w-[120px] shrink-0 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, Math.round(t.mastery * 100))}%`,
                        background: meta.colour,
                      }}
                    />
                  </div>
                  <span className="font-display text-base font-medium w-[38px] text-right shrink-0"
                    style={{ color: meta.colour }}>
                    {Math.round(t.mastery * 100)}%
                  </span>
                  {(cat === 'weak' || cat === 'untested') && (
                    <button
                      onClick={() => onTopicClick?.(t.topicId)}
                      className="text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer transition-colors"
                      style={{
                        color: 'var(--color-weak)',
                        background: 'color-mix(in srgb, var(--color-weak) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-weak) 22%, transparent)',
                      }}
                    >
                      {cat === 'untested' ? 'Start ▸' : 'Revise ▸'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Export ── */
export default function TopicRadar({ onTopicClick, className = '' }) {
  const { topics } = useSubject();
  const topicData = getAllTopicMasteries(topics);

  // Group by category
  const groups = useMemo(() => {
    const g = { strong: [], developing: [], weak: [], untested: [] };
    topicData.forEach(t => {
      const cat = t.category || 'untested';
      if (g[cat]) g[cat].push(t);
    });
    // Sort within groups: weak/untested by mastery ascending, strong/developing by mastery descending
    g.weak.sort((a, b) => a.mastery - b.mastery);
    g.untested.sort((a, b) => a.mastery - b.mastery);
    g.developing.sort((a, b) => a.mastery - b.mastery);
    g.strong.sort((a, b) => b.mastery - a.mastery);
    return g;
  }, [topicData]);

  // Overall stats
  const avg = topicData.length
    ? Math.round((topicData.reduce((s, t) => s + t.mastery, 0) / topicData.length) * 100)
    : 0;

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Compact radar + overall stat */}
      <div className="flex flex-col items-center gap-2">
        <MiniRadar data={topicData} />
        <div className="text-center">
          <span className="font-display text-2xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {avg}%
          </span>
          <span className="text-label ml-2" style={{ color: 'var(--color-text-secondary)' }}>
            overall mastery
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: 'var(--color-border)' }} />

      {/* Progress bars */}
      <ProgressBars groups={groups} onTopicClick={onTopicClick} />
    </div>
  );
}
