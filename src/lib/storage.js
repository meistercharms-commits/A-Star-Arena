import { syncSettings, syncProgress, syncSession, syncAttempt, syncMasteryCache, syncSRSData, syncErrorPatterns, syncExam } from './syncStorage';

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
  try {
    localStorage.setItem(getKey(key), JSON.stringify(data));
    return true;
  } catch (err) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      console.warn(`[A* Arena] localStorage quota exceeded when writing "${key}". Consider exporting your data and clearing old sessions.`);
    } else {
      console.warn(`[A* Arena] Failed to write "${key}" to localStorage:`, err);
    }
    return false;
  }
}

function removeKey(key) {
  localStorage.removeItem(getKey(key));
}

// ─── Level Helper ───

export function getCurrentLevel() {
  return localStorage.getItem(`${PREFIX}:qualificationLevel`) || 'alevel';
}

// ─── Subject Helper ───
// Returns current subject from localStorage (default: biology)

export function getCurrentSubject() {
  return localStorage.getItem(`${PREFIX}:currentSubject`) || 'biology';
}

/**
 * Build a level-qualified storage key for per-subject data.
 * e.g. getSubjectKey('biology') => 'alevel:biology' (using current level)
 */
function getSubjectKey(subject) {
  const s = subject || getCurrentSubject();
  const level = getCurrentLevel();
  return `${level}:${s}`;
}

// ─── Data Migration ───

let _migrated = false;

/**
 * Phase 1: Move unnamespaced data into biology namespace (original migration).
 * Phase 2: Move subject-namespaced data into level-qualified namespace.
 */
export function migrateToSubjectNamespaces() {
  if (_migrated) return;
  _migrated = true;

  const aLevelSubjects = ['biology', 'chemistry', 'mathematics'];
  const perSubjectKeys = ['sessions', 'attempts', 'masteryCache', 'srsData', 'errorPatterns'];

  // Phase 1: Move unnamespaced keys into biology namespace
  for (const key of perSubjectKeys) {
    const oldData = readJSON(key);
    const newKey = `biology:${key}`;
    const alreadyMigrated = readJSON(newKey);

    if (oldData && !alreadyMigrated) {
      writeJSON(newKey, oldData);
      removeKey(key);
    }
  }

  // Phase 2: Move subject-namespaced keys into level-qualified namespace
  for (const subj of aLevelSubjects) {
    for (const key of perSubjectKeys) {
      const oldKey = `${subj}:${key}`;
      const newKey = `alevel:${subj}:${key}`;
      const oldData = readJSON(oldKey);
      const alreadyMigrated = readJSON(newKey);

      if (oldData && !alreadyMigrated) {
        writeJSON(newKey, oldData);
        removeKey(oldKey);
      }
    }
  }
}

// --- User Settings (GLOBAL — shared across subjects and levels) ---

export function getSettings() {
  return readJSON('userSettings', null);
}

export function saveSettings(settings) {
  const data = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  writeJSON('userSettings', data);
  syncSettings(data);
}

export function hasCompletedOnboarding() {
  const settings = getSettings();
  if (!settings) return false;
  const level = getCurrentLevel();
  // Check if user has onboarded for the current level
  if (settings.onboardedLevels && Array.isArray(settings.onboardedLevels)) {
    return settings.onboardedLevels.includes(level);
  }
  // Legacy: if onboardedLevels doesn't exist, assume A-Level onboarded
  return level === 'alevel';
}

export function hasSelectedLevel() {
  return localStorage.getItem(`${PREFIX}:qualificationLevel`) !== null;
}

// --- Per-Subject Exam Board ---

export function getExamBoard(subjectId) {
  const settings = getSettings();
  if (!settings) return 'generic';
  const level = getCurrentLevel();
  // Check level-scoped exam boards first
  const levelBoards = settings.examBoards?.[level];
  if (levelBoards && levelBoards[subjectId]) return levelBoards[subjectId];
  // Fallback: check flat exam boards (pre-migration A-Level data)
  const boards = settings.examBoards;
  if (boards && typeof boards === 'object' && boards[subjectId] && typeof boards[subjectId] === 'string') {
    return boards[subjectId];
  }
  return settings.examBoard || 'generic';
}

// --- Sessions (PER-SUBJECT, LEVEL-SCOPED) ---

export function getSessions(subject) {
  const key = getSubjectKey(subject);
  return readJSON(`${key}:sessions`, []);
}

export function saveSession(session, subject) {
  const key = getSubjectKey(subject);
  const sessions = getSessions(subject);
  sessions.unshift(session);
  writeJSON(`${key}:sessions`, sessions);
  syncSession(session, getSubjectKey(subject));
}

export function getRecentSessions(count = 5, subject) {
  return getSessions(subject).slice(0, count);
}

// --- Attempts (PER-SUBJECT, LEVEL-SCOPED) ---

export function getAttempts(subject) {
  const key = getSubjectKey(subject);
  return readJSON(`${key}:attempts`, []);
}

export function saveAttempt(attempt, subject) {
  const key = getSubjectKey(subject);
  const attempts = getAttempts(subject);
  attempts.push(attempt);
  writeJSON(`${key}:attempts`, attempts);
  syncAttempt(attempt, getSubjectKey(subject));
}

export function getAttemptsByTopic(topicId, subject) {
  return getAttempts(subject).filter(a => a.topicId === topicId);
}

export function getAttemptsBySubskill(subskillId, subject) {
  return getAttempts(subject).filter(a => a.subskillIds?.includes(subskillId));
}

// --- Mastery Cache (PER-SUBJECT, LEVEL-SCOPED) ---

export function getMasteryCache(subject) {
  const key = getSubjectKey(subject);
  return readJSON(`${key}:masteryCache`, {});
}

export function updateMasteryCache(topicId, masteryData, subject) {
  const key = getSubjectKey(subject);
  const cache = getMasteryCache(subject);
  cache[topicId] = {
    ...masteryData,
    lastUpdated: new Date().toISOString(),
  };
  writeJSON(`${key}:masteryCache`, cache);
  syncMasteryCache(topicId, masteryData, getSubjectKey(subject));
}

export function getTopicMastery(topicId, subject) {
  const cache = getMasteryCache(subject);
  return cache[topicId]?.topicMastery ?? 0;
}

// --- Progress Tracking (GLOBAL — XP/level/streak shared across levels) ---

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
  syncProgress(progress);
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

// --- SRS Data (PER-SUBJECT, LEVEL-SCOPED) ---
// Stores per-topic: { nextReviewDate, srsStage, reviewHistory[] }

export function getSRSData(subject) {
  const key = getSubjectKey(subject);
  return readJSON(`${key}:srsData`, {});
}

export function getTopicSRS(topicId, subject) {
  const data = getSRSData(subject);
  return data[topicId] || null;
}

export function updateTopicSRS(topicId, srsUpdate, subject) {
  const key = getSubjectKey(subject);
  const data = getSRSData(subject);

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

  writeJSON(`${key}:srsData`, data);
  syncSRSData(topicId, data[topicId], getSubjectKey(subject));
  return data[topicId];
}

// --- Data Management ---

export function exportAllData() {
  const s = getCurrentSubject();
  const key = getSubjectKey(s);
  return {
    userSettings: readJSON('userSettings'),
    sessions: readJSON(`${key}:sessions`, []),
    attempts: readJSON(`${key}:attempts`, []),
    masteryCache: readJSON(`${key}:masteryCache`, {}),
    srsData: readJSON(`${key}:srsData`, {}),
    errorPatterns: readJSON(`${key}:errorPatterns`, {}),
    progressTracking: readJSON('progressTracking'),
    currentSubject: s,
    currentLevel: getCurrentLevel(),
    exportedAt: new Date().toISOString(),
  };
}

export function clearAllData() {
  // Clear global keys
  removeKey('userSettings');
  removeKey('progressTracking');
  localStorage.removeItem(`${PREFIX}:qualificationLevel`);
  localStorage.removeItem(`${PREFIX}:currentSubject`);

  // Clear all level-qualified subject keys
  const levels = ['alevel', 'gcse'];
  const aLevelSubjects = ['biology', 'chemistry', 'mathematics'];
  const gcseSubjects = ['art', 'design-technology', 'drama', 'english', 'french', 'geography', 'history', 'mathematics', 'music', 'pe', 're', 'science'];
  const perSubjectKeys = ['sessions', 'attempts', 'masteryCache', 'srsData', 'errorPatterns'];

  for (const level of levels) {
    const subjects = level === 'alevel' ? aLevelSubjects : gcseSubjects;
    for (const subj of subjects) {
      for (const k of perSubjectKeys) {
        removeKey(`${level}:${subj}:${k}`);
      }
    }
  }

  // Also clear any old unnamespaced/un-levelled keys (pre-migration)
  for (const subj of aLevelSubjects) {
    for (const k of perSubjectKeys) {
      removeKey(`${subj}:${k}`);
    }
  }
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

// --- Exam Planner (GLOBAL - shared across levels) ---

export function getExams() {
  return readJSON('examPlanner', []);
}

export function saveExam(exam) {
  const exams = getExams();
  exams.push(exam);
  writeJSON('examPlanner', exams);
  syncExam(exam);
}

export function updateExam(id, updates) {
  const exams = getExams();
  const idx = exams.findIndex(e => e.id === id);
  if (idx !== -1) {
    exams[idx] = { ...exams[idx], ...updates };
    writeJSON('examPlanner', exams);
  }
}

export function removeExam(id) {
  const exams = getExams().filter(e => e.id !== id);
  writeJSON('examPlanner', exams);
}

export function getUpcomingExams() {
  return getExams()
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getExamCountdown(examDate) {
  const days = Math.ceil((new Date(examDate) - new Date()) / 86400000);
  return { days, weeks: Math.floor(days / 7), urgent: days <= 14 };
}
