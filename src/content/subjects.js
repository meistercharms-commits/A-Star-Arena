/**
 * Subject Registry — central place for all subject definitions and content loading.
 */

import biologyTopics from './biology/topics.json';
import biologyBosses from './biology/bosses.json';
import chemistryTopics from './chemistry/topics.json';
import chemistryBosses from './chemistry/bosses.json';
import mathematicsTopics from './mathematics/topics.json';
import mathematicsBosses from './mathematics/bosses.json';
import chemistryMCQ from './chemistry/mcq.json';
import chemistryPracticals from './chemistry/practicals.json';

// ─── Subject Definitions ───

export const SUBJECTS = [
  { id: 'biology', name: 'Biology', emoji: '🧬', colour: 'accent' },
  { id: 'chemistry', name: 'Chemistry', emoji: '⚗️', colour: 'accent' },
  { id: 'mathematics', name: 'Mathematics', emoji: '📐', colour: 'accent' },
];

// ─── Content Store ───

const mcqStore = {
  chemistry: chemistryMCQ,
};

const practicalsStore = {
  chemistry: chemistryPracticals,
};

const contentStore = {
  biology: { topics: biologyTopics, bosses: biologyBosses },
  chemistry: { topics: chemistryTopics, bosses: chemistryBosses },
  mathematics: { topics: mathematicsTopics, bosses: mathematicsBosses },
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

/**
 * Check if a topic has MCQ content available.
 */
export function hasMCQ(subjectId, topicId) {
  const mcq = mcqStore[subjectId];
  return mcq && mcq[topicId] && mcq[topicId].length > 0;
}

/**
 * Get MCQ questions for a topic.
 */
export function getMCQQuestions(subjectId, topicId) {
  return mcqStore[subjectId]?.[topicId] || [];
}

/**
 * Check if a subject has required practicals.
 */
export function hasPracticals(subjectId) {
  return practicalsStore[subjectId]?.length > 0;
}

/**
 * Get required practicals for a subject.
 */
export function getPracticals(subjectId) {
  return practicalsStore[subjectId] || [];
}
