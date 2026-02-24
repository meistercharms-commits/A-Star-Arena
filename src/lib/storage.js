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

// --- User Settings ---

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

// --- Sessions ---

export function getSessions() {
  return readJSON('sessions', []);
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift(session);
  writeJSON('sessions', sessions);
}

export function getRecentSessions(count = 5) {
  return getSessions().slice(0, count);
}

// --- Attempts ---

export function getAttempts() {
  return readJSON('attempts', []);
}

export function saveAttempt(attempt) {
  const attempts = getAttempts();
  attempts.push(attempt);
  writeJSON('attempts', attempts);
}

export function getAttemptsByTopic(topicId) {
  return getAttempts().filter(a => a.topicId === topicId);
}

export function getAttemptsBySubskill(subskillId) {
  return getAttempts().filter(a => a.subskillIds?.includes(subskillId));
}

// --- Mastery Cache ---

export function getMasteryCache() {
  return readJSON('masteryCache', {});
}

export function updateMasteryCache(topicId, masteryData) {
  const cache = getMasteryCache();
  cache[topicId] = {
    ...masteryData,
    lastUpdated: new Date().toISOString(),
  };
  writeJSON('masteryCache', cache);
}

export function getTopicMastery(topicId) {
  const cache = getMasteryCache();
  return cache[topicId]?.topicMastery ?? 0;
}

// --- Progress Tracking ---

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
  // Each level requires progressively more XP
  // Level 1: 0, Level 2: 500, Level 3: 1200, Level 4: 2100, etc.
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

// --- Data Management ---

export function exportAllData() {
  return {
    userSettings: readJSON('userSettings'),
    sessions: readJSON('sessions', []),
    attempts: readJSON('attempts', []),
    masteryCache: readJSON('masteryCache', {}),
    progressTracking: readJSON('progressTracking'),
    exportedAt: new Date().toISOString(),
  };
}

export function clearAllData() {
  const keys = ['userSettings', 'sessions', 'attempts', 'masteryCache', 'progressTracking'];
  keys.forEach(k => removeKey(k));
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
 * localStorage limit is typically ~5MB (5242880 bytes).
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
