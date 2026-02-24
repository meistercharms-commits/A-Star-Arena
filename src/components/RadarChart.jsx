import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { getAllTopicMasteries } from '../lib/mastery';
import { useSubject } from '../contexts/SubjectContext';

const CATEGORY_COLOURS = {
  strong: '#22c55e',
  developing: '#eab308',
  weak: '#ef4444',
  untested: '#6b7280',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold">{data.name}</p>
      <p className="text-text-secondary">{Math.round(data.mastery * 100)}% mastery</p>
      <p className="text-text-muted">{data.attemptCount} attempts</p>
    </div>
  );
}

export default function TopicRadar({ onTopicClick, className = '' }) {
  const { topics } = useSubject();
  const topicData = getAllTopicMasteries(topics);

  const chartData = topicData.map(t => ({
    ...t,
    value: Math.round(t.mastery * 100),
    fullMark: 100,
  }));

  // Determine the fill colour based on average mastery
  const avgMastery = topicData.reduce((sum, t) => sum + t.mastery, 0) / topicData.length;
  const fillColour = avgMastery >= 0.8
    ? CATEGORY_COLOURS.strong
    : avgMastery >= 0.55
      ? CATEGORY_COLOURS.developing
      : avgMastery >= 0.3
        ? CATEGORY_COLOURS.weak
        : CATEGORY_COLOURS.untested;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="shortName"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Mastery"
            dataKey="value"
            stroke={fillColour}
            fill={fillColour}
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {topicData.map(t => {
          const colour = CATEGORY_COLOURS[t.category] || CATEGORY_COLOURS.untested;
          return (
            <button
              key={t.topicId}
              onClick={() => onTopicClick?.(t.topicId)}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: colour }}
              />
              <span className="truncate max-w-[80px]">{t.shortName}</span>
              <span className="font-mono text-text-muted">{Math.round(t.mastery * 100)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
