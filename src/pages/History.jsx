import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { getSessions } from '../lib/storage';
import { formatDate } from '../lib/utils';

const TIME_FILTERS = [
  { key: 'all', label: 'All Time' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
];

const SORTS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'topic', label: 'By Topic' },
  { key: 'xp-desc', label: 'Most XP' },
];

function daysAgo(isoString) {
  if (!isoString) return Infinity;
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000);
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function History() {
  const { topics, bosses } = useSubject();
  const sessions = getSessions();
  const [timeFilter, setTimeFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [expandedId, setExpandedId] = useState(null);

  // Filter
  const filtered = sessions.filter(s => {
    if (timeFilter === 'all') return true;
    const days = timeFilter === '7d' ? 7 : 30;
    return daysAgo(s.startedAt) <= days;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'newest': return new Date(b.startedAt) - new Date(a.startedAt);
      case 'oldest': return new Date(a.startedAt) - new Date(b.startedAt);
      case 'topic': return (a.topicId || '').localeCompare(b.topicId || '');
      case 'xp-desc': return (b.xpEarned || 0) - (a.xpEarned || 0);
      default: return 0;
    }
  });

  // Stats
  const totalSessions = sessions.length;
  const totalXP = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
  const bossesDefeated = sessions.filter(s => s.bossDefeated).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Session History</h1>
        <p className="text-text-secondary text-sm mt-1">Review past battles and track your improvement.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-secondary border border-border rounded-xl p-3 text-center">
          <div className="text-lg font-bold">{totalSessions}</div>
          <div className="text-xs text-text-muted">Sessions</div>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-accent">{totalXP}</div>
          <div className="text-xs text-text-muted">Total XP</div>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-strong">{bossesDefeated}</div>
          <div className="text-xs text-text-muted">Bosses Defeated</div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-text-secondary text-sm mb-3">
            No sessions yet. Complete a battle to see your history here.
          </p>
          <Link
            to="/topics"
            className="text-sm bg-accent/10 text-accent hover:bg-accent/20 px-4 py-2 rounded-lg no-underline transition-colors"
          >
            Start a Battle
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5">
              {TIME_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setTimeFilter(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    timeFilter === f.key
                      ? 'bg-accent text-bg-primary font-medium'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs bg-bg-tertiary border border-border rounded-lg px-2 py-1.5 text-text-primary outline-none ml-auto"
            >
              {SORTS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Session list */}
          <div className="space-y-3">
            {sorted.map(session => {
              const topic = topics.find(t => t.id === session.topicId);
              const boss = bosses.find(b => b.topicId === session.topicId);
              const phases = session.phases;
              const isExpanded = expandedId === session.id;

              return (
                <div
                  key={session.id}
                  className="bg-bg-secondary border border-border rounded-xl overflow-hidden"
                >
                  {/* Session header — clickable */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    className="w-full p-4 flex items-center gap-3 text-left cursor-pointer hover:bg-bg-tertiary/30 transition-colors"
                  >
                    <span className="text-xl shrink-0">{boss?.emoji || '📘'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {topic?.name || session.topicId}
                        </span>
                        {session.bossDefeated && (
                          <span className="text-xs bg-strong/15 text-strong px-1.5 py-0.5 rounded">WIN</span>
                        )}
                        {!session.bossDefeated && (
                          <span className="text-xs bg-weak/15 text-weak px-1.5 py-0.5 rounded">LOSS</span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {phases
                          ? `${phases.recall?.correct ?? 0}/${phases.recall?.total ?? 5} recall · ${phases.application?.correct ?? 0}/${phases.application?.total ?? 3} app · ${phases.extended?.score ?? 0}/${phases.extended?.maxScore ?? 6} ext`
                          : 'No details'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-accent font-mono font-semibold">+{session.xpEarned || 0} XP</div>
                      <div className="text-xs text-text-muted">{formatDate(session.startedAt)}</div>
                    </div>
                    <span className={`text-text-muted text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && phases && (
                    <div className="border-t border-border p-4 space-y-4 bg-bg-tertiary/20">
                      {/* Phase bars */}
                      <div className="space-y-3">
                        <PhaseDetail
                          label="Rapid Recall"
                          correct={phases.recall?.correct ?? 0}
                          total={phases.recall?.total ?? 5}
                        />
                        <PhaseDetail
                          label="Application"
                          correct={phases.application?.correct ?? 0}
                          total={phases.application?.total ?? 3}
                        />
                        <PhaseDetail
                          label="Exam Brain"
                          correct={phases.extended?.score ?? 0}
                          total={phases.extended?.maxScore ?? 6}
                          isScore
                        />
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                        <span>Duration: {formatDuration(session.durationSeconds)}</span>
                        <span>XP: +{session.xpEarned || 0}</span>
                        <span>{new Date(session.startedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          to={`/battle/${session.topicId}`}
                          className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium"
                        >
                          Retry Battle
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">No sessions match this filter.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PhaseDetail({ label, correct, total, isScore }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const colour = pct >= 80 ? 'strong' : pct >= 50 ? 'developing' : 'weak';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-mono text-xs text-${colour}`}>
          {correct}/{total} {isScore ? 'marks' : 'correct'} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-bg-tertiary rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all bg-${colour}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}
