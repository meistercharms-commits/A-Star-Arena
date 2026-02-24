import { useState } from 'react';
import { Link } from 'react-router-dom';
import topics from '../content/topics.json';
import bosses from '../content/bosses.json';
import { getTopicMastery, getMasteryCache, getSessions } from '../lib/storage';
import { getMasteryCategory, getDaysSince } from '../lib/utils';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'strong', label: 'Strong' },
  { key: 'developing', label: 'Developing' },
  { key: 'weak', label: 'Weak' },
  { key: 'untested', label: 'Untested' },
];

const SORTS = [
  { key: 'default', label: 'Default' },
  { key: 'mastery-asc', label: 'Weakest First' },
  { key: 'mastery-desc', label: 'Strongest First' },
  { key: 'recent', label: 'Recently Practised' },
  { key: 'stale', label: 'Needs Review' },
];

function getLastPractised(topicId) {
  const cache = getMasteryCache();
  return cache[topicId]?.lastUpdated || null;
}

export default function Topics() {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('default');

  const enrichedTopics = topics.map(topic => {
    const mastery = getTopicMastery(topic.id);
    const cat = getMasteryCategory(mastery);
    const boss = bosses.find(b => b.topicId === topic.id);
    const lastPractised = getLastPractised(topic.id);
    const daysSince = getDaysSince(lastPractised);
    return { ...topic, mastery, cat, boss, lastPractised, daysSince };
  });

  // Filter
  const filtered = enrichedTopics.filter(t => {
    if (filter === 'all') return true;
    return t.cat.label.toLowerCase() === filter;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'mastery-asc': return a.mastery - b.mastery;
      case 'mastery-desc': return b.mastery - a.mastery;
      case 'recent': return (a.daysSince === Infinity ? 999 : a.daysSince) - (b.daysSince === Infinity ? 999 : b.daysSince);
      case 'stale': return (b.daysSince === Infinity ? 999 : b.daysSince) - (a.daysSince === Infinity ? 999 : a.daysSince);
      default: return 0;
    }
  });

  const filterCounts = {};
  FILTERS.forEach(f => {
    filterCounts[f.key] = f.key === 'all'
      ? enrichedTopics.length
      : enrichedTopics.filter(t => t.cat.label.toLowerCase() === f.key).length;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Topics</h1>
        <p className="text-text-secondary text-sm mt-1">Choose a topic to battle. Defeat the boss to prove your mastery.</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === f.key
                ? 'bg-accent text-bg-primary font-medium'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.label} ({filterCounts[f.key]})
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Sort:</span>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-xs bg-bg-tertiary border border-border rounded-lg px-2 py-1 text-text-primary outline-none"
        >
          {SORTS.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Topic grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(topic => (
          <div
            key={topic.id}
            className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent/50 transition-colors group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{topic.boss?.emoji || '⚔️'}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{topic.name}</h3>
                  <p className="text-xs text-text-muted truncate">{topic.boss?.bossName}</p>
                </div>
              </div>
              {topic.highYield && (
                <span className="text-xs bg-developing/20 text-developing px-2 py-0.5 rounded shrink-0">
                  High Yield
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-text-muted mb-3 line-clamp-2">{topic.description}</p>

            {/* Mastery bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className={`text-${topic.cat.colour} font-medium`}>
                  {topic.cat.emoji} {topic.cat.label}
                </span>
                <span className="text-text-muted font-mono">{Math.round(topic.mastery * 100)}%</span>
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all bg-${topic.cat.colour}`}
                  style={{ width: `${Math.max(2, topic.mastery * 100)}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {topic.daysSince === Infinity
                  ? 'Never practised'
                  : topic.daysSince === 0
                    ? 'Practised today'
                    : `${topic.daysSince}d ago`
                }
              </span>
              <Link
                to={`/battle/${topic.id}`}
                className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium"
              >
                Battle
              </Link>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-10">
          <p className="text-text-muted">No topics match this filter.</p>
        </div>
      )}
    </div>
  );
}
