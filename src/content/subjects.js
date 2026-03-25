/**
 * Subject Registry — central place for all subject definitions and content loading.
 * Supports both A-Level and GCSE qualification levels.
 */

import biologyTopics from './biology/topics.json';
import biologyBosses from './biology/bosses.json';
import chemistryTopics from './chemistry/topics.json';
import chemistryBosses from './chemistry/bosses.json';
import mathematicsTopics from './mathematics/topics.json';
import mathematicsBosses from './mathematics/bosses.json';
import chemistryMCQ from './chemistry/mcq.json';
import chemistryPracticals from './chemistry/practicals.json';

// GCSE content imports
import gcseMathsTopics from './gcse/mathematics/topics.json';
import gcseMathsBosses from './gcse/mathematics/bosses.json';
import gcseScienceTopics from './gcse/science/topics.json';
import gcseScienceBosses from './gcse/science/bosses.json';
import gcseEnglishTopics from './gcse/english/topics.json';
import gcseEnglishBosses from './gcse/english/bosses.json';
import gcseFrenchTopics from './gcse/french/topics.json';
import gcseFrenchBosses from './gcse/french/bosses.json';
import gcseHistoryTopics from './gcse/history/topics.json';
import gcseHistoryBosses from './gcse/history/bosses.json';
import gcseGeographyTopics from './gcse/geography/topics.json';
import gcseGeographyBosses from './gcse/geography/bosses.json';
import gcseRETopics from './gcse/re/topics.json';
import gcseREBosses from './gcse/re/bosses.json';
import gcseArtTopics from './gcse/art/topics.json';
import gcseArtBosses from './gcse/art/bosses.json';
import gcseDramaTopics from './gcse/drama/topics.json';
import gcseDramaBosses from './gcse/drama/bosses.json';
import gcseMusicTopics from './gcse/music/topics.json';
import gcseMusicBosses from './gcse/music/bosses.json';
import gcsePETopics from './gcse/pe/topics.json';
import gcsePEBosses from './gcse/pe/bosses.json';
import gcseDTTopics from './gcse/design-technology/topics.json';
import gcseDTBosses from './gcse/design-technology/bosses.json';

// ─── Subject Definitions ───

export const ALEVEL_SUBJECTS = [
  { id: 'biology', name: 'Biology', emoji: '🧬', colour: 'accent' },
  { id: 'chemistry', name: 'Chemistry', emoji: '⚗️', colour: 'accent' },
  { id: 'mathematics', name: 'Mathematics', emoji: '📐', colour: 'accent' },
];

export const GCSE_SUBJECTS = [
  { id: 'art', name: 'Art', emoji: '🎨', colour: 'accent' },
  { id: 'design-technology', name: 'Design & Technology', emoji: '🔧', colour: 'accent' },
  { id: 'drama', name: 'Drama', emoji: '🎭', colour: 'accent' },
  { id: 'english', name: 'English', emoji: '📝', colour: 'accent' },
  { id: 'french', name: 'French', emoji: '🇫🇷', colour: 'accent' },
  { id: 'geography', name: 'Geography', emoji: '🌍', colour: 'accent' },
  { id: 'history', name: 'History', emoji: '📜', colour: 'accent' },
  { id: 'mathematics', name: 'Mathematics', emoji: '🔢', colour: 'accent' },
  { id: 'music', name: 'Music', emoji: '🎵', colour: 'accent' },
  { id: 'pe', name: 'Physical Education', emoji: '🏃', colour: 'accent' },
  { id: 're', name: 'Religious Education', emoji: '🕊️', colour: 'accent' },
  { id: 'science', name: 'Science', emoji: '🔬', colour: 'accent' },
];

// Backward-compatible alias
export const SUBJECTS = ALEVEL_SUBJECTS;

/**
 * Get the subjects list for a given qualification level.
 */
export function getSubjectsForLevel(level) {
  return level === 'gcse' ? GCSE_SUBJECTS : ALEVEL_SUBJECTS;
}

// ─── Content Stores ───

const alevelContentStore = {
  biology: { topics: biologyTopics, bosses: biologyBosses },
  chemistry: { topics: chemistryTopics, bosses: chemistryBosses },
  mathematics: { topics: mathematicsTopics, bosses: mathematicsBosses },
};

const gcseContentStore = {
  mathematics: { topics: gcseMathsTopics, bosses: gcseMathsBosses },
  science: { topics: gcseScienceTopics, bosses: gcseScienceBosses },
  english: { topics: gcseEnglishTopics, bosses: gcseEnglishBosses },
  french: { topics: gcseFrenchTopics, bosses: gcseFrenchBosses },
  history: { topics: gcseHistoryTopics, bosses: gcseHistoryBosses },
  geography: { topics: gcseGeographyTopics, bosses: gcseGeographyBosses },
  re: { topics: gcseRETopics, bosses: gcseREBosses },
  art: { topics: gcseArtTopics, bosses: gcseArtBosses },
  drama: { topics: gcseDramaTopics, bosses: gcseDramaBosses },
  music: { topics: gcseMusicTopics, bosses: gcseMusicBosses },
  pe: { topics: gcsePETopics, bosses: gcsePEBosses },
  'design-technology': { topics: gcseDTTopics, bosses: gcseDTBosses },
};

const mcqStore = {
  chemistry: chemistryMCQ,
};

const practicalsStore = {
  chemistry: chemistryPracticals,
};

/**
 * Get topics and bosses for a subject.
 * @param {string} subjectId
 * @param {string} level - 'alevel' | 'gcse'
 * @returns {{ topics: Array, bosses: Array }}
 */
export function getSubjectContent(subjectId, level = 'alevel') {
  const store = level === 'gcse' ? gcseContentStore : alevelContentStore;
  const fallbackStore = level === 'gcse' ? gcseContentStore : alevelContentStore;
  const fallbackKey = level === 'gcse' ? 'mathematics' : 'biology';
  return store[subjectId] || fallbackStore[fallbackKey];
}

/**
 * Get subject metadata by ID.
 * @param {string} subjectId
 * @param {string} level - 'alevel' | 'gcse'
 * @returns {{ id, name, emoji, colour } | undefined}
 */
export function getSubjectInfo(subjectId, level = 'alevel') {
  const subjects = getSubjectsForLevel(level);
  return subjects.find(s => s.id === subjectId);
}

/**
 * Check if a subject has content loaded (topics > 0).
 */
export function isSubjectAvailable(subjectId, level = 'alevel') {
  const store = level === 'gcse' ? gcseContentStore : alevelContentStore;
  const content = store[subjectId];
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
