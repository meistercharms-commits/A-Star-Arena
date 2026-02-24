const PREFIX = 'astarena';

function getKey(key) {
  return `${PREFIX}:${key}`;
}

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, data) {
  localStorage.setItem(getKey(key), JSON.stringify(data));
}

function removeKey(key) {
  localStorage.removeItem(getKey(key));
}

// ─── Subject Helper ───
// Returns current subject from localStorage (default: biology)

export function getCurrentSubject() {
  return localStorage.getItem(`${PREFIX}:currentSubject`) || 'biology';
}

// ─── Data Migration ───
// On first multi-subject load, move unnamespaced data into biology namespace.

let _migrated = false;

export function migrateToSubjectNamespaces() {
  if (_migrated) return;
  _migrated = true;

  const subjectKeys = ['sessions', 'attempts', 'masteryCache'];
  for (const key of subjectKeys) {
    const oldData = readJSON(key);
    const newKey = `biology:${key}`;
    const alreadyMigrated = readJSON(newKey);

    if (oldData && !alreadyMigrated) {
      writeJSON(newKey, oldData);
      removeKey(key);
    }
  }
}

// --- User Settings (GLOBAL — shared across subjects) ---

export function getSettings() {
  return readJSON('userSettings', null);
}

export function saveSettings(settings) {
  writeJSON('userSettings', {
    ...settings,
    updatedAt: new Date().toISOString(),
  });
}

export function hasCompletedOnboarding() {
  return getSettings() !== null;
}

// --- Sessions (PER-SUBJECT) ---

export function getSessions(subject) {
  const s = subject || getCurrentSubject();
  return readJSON(`${s}:sessions`, []);
}

export function saveSession(session, subject) {
  const s = subject || getCurrentSubject();
  const sessions = getSessions(s);
  sessions.unshift(session);
  writeJSON(`${s}:sessions`, sessions);
}

export function getRecentSessions(count = 5, subject) {
  return getSessions(subject).slice(0, count);
}

// --- Attempts (PER-SUBJECT) ---

export function getAttempts(subject) {
  const s = subject || getCurrentSubject();
  return readJSON(`${s}:attempts`, []);
}

export function saveAttempt(attempt, subject) {
  const s = subject || getCurrentSubject();
  const attempts = getAttempts(s);
  attempts.push(attempt);
  writeJSON(`${s}:attempts`, attempts);
}

export function getAttemptsByTopic(topicId, subject) {
  return getAttempts(subject).filter(a => a.topicId === topicId);
}

export function getAttemptsBySubskill(subskillId, subject) {
  return getAttempts(subject).filter(a => a.subskillIds?.includes(subskillId));
}

// --- Mastery Cache (PER-SUBJECT) ---

export function getMasteryCache(subject) {
  const s = subject || getCurrentSubject();
  return readJSON(`${s}:masteryCache`, {});
}

export function updateMasteryCache(topicId, masteryData, subject) {
  const s = subject || getCurrentSubject();
  const cache = getMasteryCache(s);
  cache[topicId] = {
    ...masteryData,
    lastUpdated: new Date().toISOString(),
  };
  writeJSON(`${s}:masteryCache`, cache);
}

export function getTopicMastery(topicId, subject) {
  const cache = getMasteryCache(subject);
  return cache[topicId]?.topicMastery ?? 0;
}

// --- Progress Tracking (GLOBAL — XP/level/streak shared) ---

export function getProgress() {
  return readJSON('progressTracking', {
    totalSessions: 0,
    totalXP: 0,
    currentLevel: 1,
    streak: 0,
    lastSessionDate: null,
  });
}

export function updateProgress(xpEarned) {
  const progress = getProgress();
  const today = new Date().toISOString().split('T')[0];
  const lastDate = progress.lastSessionDate;

  // Streak calculation
  if (lastDate === today) {
    // Same day — no streak change
  } else if (lastDate) {
    const diff = Math.floor(
      (new Date(today) - new Date(lastDate)) / 86400000
    );
    progress.streak = diff === 1 ? progress.streak + 1 : 1;
  } else {
    progress.streak = 1;
  }

  progress.totalSessions += 1;
  progress.totalXP += xpEarned;
  progress.currentLevel = calculateLevel(progress.totalXP);
  progress.lastSessionDate = today;

  writeJSON('progressTracking', progress);
  return progress;
}

function calculateLevel(totalXP) {
  const thresholds = [0, 500, 1200, 2100, 3200, 4500, 6000, 7700, 9600, 11700, 14000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXP >= thresholds[i]) return i + 1;
  }
  return 1;
}

export function getLevelProgress() {
  const progress = getProgress();
  const thresholds = [0, 500, 1200, 2100, 3200, 4500, 6000, 7700, 9600, 11700, 14000];
  const level = progress.currentLevel;
  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1] + 2500;
  return {
    level,
    currentXP: progress.totalXP,
    xpInLevel: progress.totalXP - currentThreshold,
    xpNeeded: nextThreshold - currentThreshold,
    percentage: Math.min(
      100,
      Math.round(((progress.totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    ),
  };
}

// --- SRS Data (PER-SUBJECT) ---
// Stores per-topic: { nextReviewDate, srsStage, reviewHistory[] }

export function getSRSData(subject) {
  const s = subject || getCurrentSubject();
  return readJSON(`${s}:srsData`, {});
}

export function getTopicSRS(topicId, subject) {
  const data = getSRSData(subject);
  return data[topicId] || null;
}

export function updateTopicSRS(topicId, srsUpdate, subject) {
  const s = subject || getCurrentSubject();
  const data = getSRSData(s);

  const existing = data[topicId] || { srsStage: 0, reviewHistory: [] };
  const prevHistory = Array.isArray(existing.reviewHistory) ? existing.reviewHistory : [];

  data[topicId] = {
    srsStage: srsUpdate.newStage,
    nextReviewDate: srsUpdate.nextReviewDate,
    intervalDays: srsUpdate.intervalDays,
    lastReviewDate: new Date().toISOString(),
    reviewHistory: [
      ...prevHistory.slice(-19), // Keep last 20 reviews
      {
        date: new Date().toISOString(),
        scorePercentage: srsUpdate.scorePercentage,
        outcome: srsUpdate.outcome,
        oldStage: existing.srsStage || 1,
        newStage: srsUpdate.newStage,
      },
    ],
  };

  writeJSON(`${s}:srsData`, data);
  return data[topicId];
}

// --- Data Management ---

export function exportAllData() {
  const s = getCurrentSubject();
  return {
    userSettings: readJSON('userSettings'),
    sessions: readJSON(`${s}:sessions`, []),
    attempts: readJSON(`${s}:attempts`, []),
    masteryCache: readJSON(`${s}:masteryCache`, {}),
    srsData: readJSON(`${s}:srsData`, {}),
    progressTracking: readJSON('progressTracking'),
    currentSubject: s,
    exportedAt: new Date().toISOString(),
  };
}

export function clearAllData() {
  // Clear global keys
  removeKey('userSettings');
  removeKey('progressTracking');
  // Clear all subject-namespaced keys
  const subjects = ['biology', 'chemistry', 'mathematics'];
  const perSubjectKeys = ['sessions', 'attempts', 'masteryCache', 'srsData'];
  for (const subj of subjects) {
    for (const k of perSubjectKeys) {
      removeKey(`${subj}:${k}`);
    }
  }
  // Also clear any old unnamespaced keys (pre-migration)
  for (const k of perSubjectKeys) {
    removeKey(k);
  }
}

export function getStorageSize() {
  let total = 0;
  for (const key in localStorage) {
    if (key.startsWith(PREFIX)) {
      total += localStorage.getItem(key).length * 2; // UTF-16
    }
  }
  return total;
}

/**
 * Check localStorage usage and return a warning if over 50%.
 */
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB

export function getStorageWarning() {
  const used = getStorageSize();
  const percentage = Math.round((used / STORAGE_LIMIT) * 100);

  if (percentage >= 90) {
    return { level: 'critical', percentage, message: 'Storage almost full! Export your data and clear old sessions to avoid data loss.' };
  }
  if (percentage >= 75) {
    return { level: 'warning', percentage, message: 'Storage getting full. Consider exporting your data as a backup.' };
  }
  if (percentage >= 50) {
    return { level: 'info', percentage, message: 'Storage over 50% used. Your data is safe but keep an eye on it.' };
  }
  return null;
}

export function getStorageStats() {
  const used = getStorageSize();
  return {
    usedBytes: used,
    usedKB: Math.round(used / 1024),
    limitBytes: STORAGE_LIMIT,
    limitKB: Math.round(STORAGE_LIMIT / 1024),
    percentage: Math.round((used / STORAGE_LIMIT) * 100),
  };
}
