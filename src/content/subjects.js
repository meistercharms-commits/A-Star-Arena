/**
 * Subject Registry — central place for all subject definitions and content loading.
 */

import biologyTopics from './biology/topics.json';
import biologyBosses from './biology/bosses.json';

// ─── Subject Definitions ───

export const SUBJECTS = [
  { id: 'biology', name: 'Biology', emoji: '🧬', colour: 'accent' },
  { id: 'chemistry', name: 'Chemistry', emoji: '⚗️', colour: 'accent' },
  { id: 'mathematics', name: 'Mathematics', emoji: '📐', colour: 'accent' },
];

// ─── Content Store ───
// Pre-loaded content per subject. Chemistry & Maths will be added in later stages.

const contentStore = {
  biology: { topics: biologyTopics, bosses: biologyBosses },
  chemistry: { topics: [], bosses: [] },
  mathematics: { topics: [], bosses: [] },
};

/**
 * Get topics and bosses for a subject.
 * @param {string} subjectId - 'biology' | 'chemistry' | 'mathematics'
 * @returns {{ topics: Array, bosses: Array }}
 */
export function getSubjectContent(subjectId) {
  return contentStore[subjectId] || contentStore.biology;
}

/**
 * Get subject metadata by ID.
 * @param {string} subjectId
 * @returns {{ id, name, emoji, colour } | undefined}
 */
export function getSubjectInfo(subjectId) {
  return SUBJECTS.find(s => s.id === subjectId);
}

/**
 * Check if a subject has content loaded (topics > 0).
 */
export function isSubjectAvailable(subjectId) {
  const content = contentStore[subjectId];
  return content && content.topics.length > 0;
}
