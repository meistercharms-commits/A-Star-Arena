import { getAllTopicMasteries } from '../lib/mastery';
import { getReviewSummary } from '../lib/recommend';
import { getExams } from '../lib/storage';

export default function ReadinessScore({ topics, bosses }) {
  // Calculate mastery component (0-1)
  const masteries = getAllTopicMasteries(topics);
  const avgMastery = masteries.length > 0
    ? masteries.reduce((sum, t) => sum + t.mastery, 0) / masteries.length
    : 0;

  // Calculate SRS coverage (0-1)
  const review = getReviewSummary(topics, bosses);
  const totalTopics = topics.length || 1;
  const overdueRatio = (review.overdue || 0) / totalTopics;
  const srsCoverage = 1 - overdueRatio;

  // Calculate exam proximity factor (0-1)
  const exams = getExams();
  const now = new Date();
  let examFactor = 0.5; // default if no exams
  if (exams.length > 0) {
    const upcoming = exams
      .filter(e => new Date(e.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (upcoming.length > 0) {
      const daysUntil = Math.max(1, Math.ceil((new Date(upcoming[0].date) - now) / 86400000));
      // More time = higher factor (less urgent = more ready if mastery is high)
      // Less time = lower factor (more urgent = less ready unless mastery is very high)
      examFactor = Math.min(1, daysUntil / 90); // 90+ days = 1.0, 1 day = ~0.01
    }
  }

  // Combined readiness score (0-100)
  const readiness = Math.round(
    (avgMastery * 0.4 + srsCoverage * 0.3 + examFactor * 0.3) * 100
  );

  // Message based on readiness
  let message, messageColour;
  if (readiness >= 75) {
    message = "You're on track. Keep it up.";
    messageColour = 'var(--color-strong)';
  } else if (readiness >= 50) {
    message = "Good progress. Push a bit harder.";
    messageColour = 'var(--color-developing)';
  } else if (readiness >= 25) {
    message = "You need to pick up the pace.";
    messageColour = 'var(--color-weak)';
  } else {
    message = "Let's get started. Every session counts.";
    messageColour = 'var(--color-weak)';
  }

  // SVG circular gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (readiness / 100) * circumference;
  const gaugeColour = readiness >= 75 ? 'var(--color-strong)' : readiness >= 50 ? 'var(--color-developing)' : 'var(--color-weak)';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular gauge */}
      <div className="relative w-32 h-32">
        <svg width="128" height="128" viewBox="0 0 128 128">
          {/* Background circle */}
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="6" />
          {/* Progress arc */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={gaugeColour}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 64 64)"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[32px] font-semibold leading-none" style={{ color: gaugeColour }}>{readiness}</span>
          <span className="text-[9px] tracking-[0.1em] uppercase text-text-muted mt-0.5">Readiness</span>
        </div>
      </div>
      {/* Message */}
      <p className="text-sm font-medium text-center" style={{ color: messageColour }}>{message}</p>
      {/* Breakdown */}
      <div className="flex gap-4 text-center text-xs text-text-muted">
        <div>
          <div className="font-display text-base font-medium text-text-primary">{Math.round(avgMastery * 100)}%</div>
          <div>Mastery</div>
        </div>
        <div>
          <div className="font-display text-base font-medium text-text-primary">{Math.round(srsCoverage * 100)}%</div>
          <div>Review</div>
        </div>
        <div>
          <div className="font-display text-base font-medium text-text-primary">{review.overdue || 0}</div>
          <div>Overdue</div>
        </div>
      </div>
    </div>
  );
}
