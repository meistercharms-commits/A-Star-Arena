import { db, hasConfig } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Re-use the same read/write helpers from storage.js
// We import them indirectly to avoid circular deps — inline the logic
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
  } catch {
    return false;
  }
}

// ── Sync State ──
let syncEnabled = false;
let currentUid = null;
const pendingWrites = new Map(); // key → { path, data }
let flushTimer = null;

export function enableSync(uid) {
  syncEnabled = true;
  currentUid = uid;
}

export function disableSync() {
  syncEnabled = false;
  currentUid = null;
  pendingWrites.clear();
  if (flushTimer) clearTimeout(flushTimer);
}

export function isSyncEnabled() {
  return syncEnabled && hasConfig && currentUid;
}

// ── Queue & Flush ──

function enqueueWrite(firestorePath, data) {
  if (!isSyncEnabled()) return;
  pendingWrites.set(firestorePath, { data, timestamp: Date.now() });

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushPendingWrites, 500);
}

async function flushPendingWrites() {
  if (!isSyncEnabled() || pendingWrites.size === 0) return;

  const writes = new Map(pendingWrites);
  pendingWrites.clear();

  for (const [path, { data }] of writes) {
    try {
      const ref = doc(db, ...path.split('/'));
      await setDoc(ref, { ...data, lastSyncedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn(`Sync write failed for ${path}:`, err.message);
      // Re-queue failed writes
      pendingWrites.set(path, { data, timestamp: Date.now() });
    }
  }
}

// ── Sync Wrappers for Key Data ──

// Call after any settings change
export function syncSettings(settings) {
  if (!isSyncEnabled()) return;
  enqueueWrite(`users/${currentUid}/settings/main`, settings);
}

// Call after progress update
export function syncProgress(progress) {
  if (!isSyncEnabled()) return;
  enqueueWrite(`users/${currentUid}/progress/main`, progress);
}

// Call after session save
export function syncSession(session, subjectKey) {
  if (!isSyncEnabled()) return;
  enqueueWrite(`users/${currentUid}/subjects/${subjectKey}`, {
    [`sessions_${session.id}`]: session,
  });
}

// Call after attempt save
export function syncAttempt(attempt, subjectKey) {
  if (!isSyncEnabled()) return;
  const attemptId = `${attempt.topicId}_${attempt.timestamp}`;
  enqueueWrite(`users/${currentUid}/subjects/${subjectKey}`, {
    [`attempts_${attemptId}`]: attempt,
  });
}

// Call after mastery cache update
export function syncMasteryCache(topicId, masteryData, subjectKey) {
  if (!isSyncEnabled()) return;
  enqueueWrite(`users/${currentUid}/subjects/${subjectKey}`, {
    [`mastery_${topicId}`]: masteryData,
  });
}

// Call after SRS update
export function syncSRSData(topicId, srsData, subjectKey) {
  if (!isSyncEnabled()) return;
  enqueueWrite(`users/${currentUid}/subjects/${subjectKey}`, {
    [`srs_${topicId}`]: srsData,
  });
}

// Call after error patterns update
export function syncErrorPatterns(errorPatterns, subjectKey) {
  if (!isSyncEnabled()) return;
  enqueueWrite(`users/${currentUid}/subjects/${subjectKey}`, {
    errorPatterns,
  });
}

// Call after exam save
export function syncExam(exam) {
  if (!isSyncEnabled()) return;
  enqueueWrite(`users/${currentUid}/exams/${exam.id}`, exam);
}

// ── Pull from Firestore (on login) ──

export async function pullFromFirestore(uid) {
  if (!hasConfig || !db) return false;

  try {
    // Pull settings
    const settingsSnap = await getDoc(doc(db, 'users', uid, 'settings', 'main'));
    if (settingsSnap.exists()) {
      const cloudSettings = settingsSnap.data();
      const localSettings = readJSON('userSettings', {});
      // Cloud wins for settings
      writeJSON('userSettings', { ...localSettings, ...cloudSettings });
    }

    // Pull progress
    const progressSnap = await getDoc(doc(db, 'users', uid, 'progress', 'main'));
    if (progressSnap.exists()) {
      const cloudProgress = progressSnap.data();
      const localProgress = readJSON('progressTracking', {});
      // Take the higher values (don't lose progress)
      writeJSON('progressTracking', {
        totalSessions: Math.max(localProgress.totalSessions || 0, cloudProgress.totalSessions || 0),
        totalXP: Math.max(localProgress.totalXP || 0, cloudProgress.totalXP || 0),
        currentLevel: Math.max(localProgress.currentLevel || 1, cloudProgress.currentLevel || 1),
        streak: Math.max(localProgress.streak || 0, cloudProgress.streak || 0),
        lastSessionDate: localProgress.lastSessionDate > cloudProgress.lastSessionDate
          ? localProgress.lastSessionDate : cloudProgress.lastSessionDate,
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to pull from Firestore:', err);
    return false;
  }
}

// ── Migration (first login with existing localStorage data) ──

export async function migrateToFirestore(uid) {
  if (!hasConfig || !db) return false;

  try {
    // Check if already migrated
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().migrated) {
      return false; // Already migrated
    }

    // Push settings
    const settings = readJSON('userSettings', null);
    if (settings) {
      await setDoc(doc(db, 'users', uid, 'settings', 'main'), settings, { merge: true });
    }

    // Push progress
    const progress = readJSON('progressTracking', null);
    if (progress) {
      await setDoc(doc(db, 'users', uid, 'progress', 'main'), progress, { merge: true });
    }

    // Push subject data for all levels and subjects
    const levels = ['alevel', 'gcse'];
    const subjects = [
      'biology', 'chemistry', 'mathematics', 'english', 'french',
      'geography', 'history', 'science', 'art', 'drama', 'music',
      'pe', 'design-technology', 're',
    ];

    for (const level of levels) {
      for (const subject of subjects) {
        const subjectKey = `${level}:${subject}`;
        const subjectData = {};

        const sessions = readJSON(`${subjectKey}:sessions`, null);
        if (sessions?.length) {
          sessions.forEach(s => { subjectData[`sessions_${s.id}`] = s; });
        }

        const attempts = readJSON(`${subjectKey}:attempts`, null);
        if (attempts?.length) {
          attempts.forEach((a, i) => {
            subjectData[`attempts_${a.topicId}_${a.timestamp || i}`] = a;
          });
        }

        const mastery = readJSON(`${subjectKey}:masteryCache`, null);
        if (mastery) {
          Object.entries(mastery).forEach(([topicId, data]) => {
            subjectData[`mastery_${topicId}`] = data;
          });
        }

        const srs = readJSON(`${subjectKey}:srsData`, null);
        if (srs) {
          Object.entries(srs).forEach(([topicId, data]) => {
            subjectData[`srs_${topicId}`] = data;
          });
        }

        const errors = readJSON(`${subjectKey}:errorPatterns`, null);
        if (errors) {
          subjectData.errorPatterns = errors;
        }

        // Only write if there's actual data
        if (Object.keys(subjectData).length > 0) {
          await setDoc(doc(db, 'users', uid, 'subjects', subjectKey), subjectData, { merge: true });
        }
      }
    }

    // Push exams
    const exams = readJSON('examPlanner', null);
    if (exams?.length) {
      for (const exam of exams) {
        await setDoc(doc(db, 'users', uid, 'exams', exam.id), exam, { merge: true });
      }
    }

    // Mark as migrated
    await updateDoc(userRef, { migrated: true });

    console.log('localStorage data migrated to Firestore');
    return true;
  } catch (err) {
    console.error('Migration failed:', err);
    return false;
  }
}
