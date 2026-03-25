// ─── Mistake Pattern Detection ───
// Tracks recurring error keywords across sessions, detects patterns,
// and surfaces them for dashboard alerts and feedback warnings.

import { getCurrentSubject, getCurrentLevel } from './storage';

const PREFIX = 'astarena';

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, data) {
  localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(data));
}

function errorPatternsKey(subject) {
  const s = subject || getCurrentSubject();
  const level = getCurrentLevel();
  return `${level}:${s}:errorPatterns`;
}

// ─── Severity Thresholds ───
const WARNING_THRESHOLD = 2;   // 2 occurrences = warning
const CRITICAL_THRESHOLD = 3;  // 3+ occurrences = critical
const STALE_DAYS = 14;         // Patterns older than 14 days are filtered out

// ─── Write-Time Aggregation ───

/**
 * Track error patterns from a marked attempt.
 * Called after saveAttempt() for incorrect answers with error data.
 *
 * @param {object} attempt — must have { topicId, subskillIds?, errorKeywords? }
 * @param {string} [subject] — defaults to current subject
 */
export function trackErrorPatterns(attempt, subject) {
  const patterns = readJSON(errorPatternsKey(subject), {});

  const { topicId, subskillIds = [], errorKeywords = [] } = attempt;

  for (const keyword of errorKeywords) {
    const normalised = keyword.toLowerCase().trim();
    if (!normalised) continue;

    if (!patterns[normalised]) {
      patterns[normalised] = {
        occurrences: 0,
        lastSeen: null,
        topicBreakdown: {},
      };
    }

    const p = patterns[normalised];
    p.occurrences += 1;
    p.lastSeen = new Date().toISOString();

    if (!p.topicBreakdown[topicId]) {
      p.topicBreakdown[topicId] = { count: 0, subskillIds: [] };
    }
    p.topicBreakdown[topicId].count += 1;

    // Merge subskillIds (deduplicate)
    const existing = new Set(p.topicBreakdown[topicId].subskillIds);
    for (const sid of subskillIds) existing.add(sid);
    p.topicBreakdown[topicId].subskillIds = [...existing];
  }

  writeJSON(errorPatternsKey(subject), patterns);
}

// ─── Read Functions ───

/**
 * Get raw error patterns for a subject.
 */
export function getErrorPatterns(subject) {
  return readJSON(errorPatternsKey(subject), {});
}

/**
 * Get recurring mistakes for the dashboard.
 * Returns patterns with 2+ occurrences, sorted by severity then count.
 * Filters out patterns older than STALE_DAYS.
 */
export function getRecurringMistakes(subject) {
  const patterns = getErrorPatterns(subject);
  const now = Date.now();
  const staleMs = STALE_DAYS * 24 * 60 * 60 * 1000;

  return Object.entries(patterns)
    .filter(([, p]) => {
      if (!p.lastSeen) return false;
      return (now - new Date(p.lastSeen).getTime()) < staleMs;
    })
    .map(([keyword, p]) => ({
      keyword,
      occurrences: p.occurrences,
      lastSeen: p.lastSeen,
      severity: p.occurrences >= CRITICAL_THRESHOLD ? 'critical' : 'warning',
      topicIds: Object.keys(p.topicBreakdown),
      topicBreakdown: p.topicBreakdown,
    }))
    .filter(p => p.occurrences >= WARNING_THRESHOLD)
    .sort((a, b) => {
      // Critical first, then by occurrence count descending
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
      return b.occurrences - a.occurrences;
    });
}

/**
 * Check if any of the given error keywords are recurring patterns.
 * Used by FeedbackPanel to show inline warnings after incorrect answers.
 *
 * @param {string[]} errorKeywords — keywords from the current marking result
 * @param {string} [subject]
 * @returns {Array<{ keyword, occurrences, severity, topicIds }>}
 */
export function getPatternWarningsForAttempt(errorKeywords = [], subject) {
  const patterns = getErrorPatterns(subject);
  const warnings = [];

  for (const kw of errorKeywords) {
    const normalised = kw.toLowerCase().trim();
    const p = patterns[normalised];
    if (p && p.occurrences >= WARNING_THRESHOLD) {
      warnings.push({
        keyword: kw,
        occurrences: p.occurrences,
        severity: p.occurrences >= CRITICAL_THRESHOLD ? 'critical' : 'warning',
        topicIds: Object.keys(p.topicBreakdown),
      });
    }
  }

  return warnings.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Get recurring mistakes grouped by topic.
 * Returns { topicId: { topicId, mistakes: [...] } } sorted by mistake count.
 */
export function getMistakesByTopic(subject) {
  const mistakes = getRecurringMistakes(subject);
  const byTopic = {};

  for (const m of mistakes) {
    for (const tid of m.topicIds) {
      if (!byTopic[tid]) byTopic[tid] = { topicId: tid, mistakes: [] };
      byTopic[tid].mistakes.push(m);
    }
  }

  return Object.values(byTopic).sort((a, b) => b.mistakes.length - a.mistakes.length);
}

// ─── Management Functions ───

/**
 * Dismiss/remove a specific pattern (student marks it as resolved).
 */
export function dismissPattern(keyword, subject) {
  const patterns = readJSON(errorPatternsKey(subject), {});
  const normalised = keyword.toLowerCase().trim();
  delete patterns[normalised];
  writeJSON(errorPatternsKey(subject), patterns);
}

/**
 * Clear all error patterns for a subject.
 */
export function clearErrorPatterns(subject) {
  writeJSON(errorPatternsKey(subject), {});
}
