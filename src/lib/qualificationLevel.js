/**
 * Qualification Level — constants, metadata, and helpers for A-Level / GCSE dual-pathway.
 */

const PREFIX = 'astarena';

export const LEVELS = {
  ALEVEL: 'alevel',
  GCSE: 'gcse',
};

export const LEVEL_META = {
  alevel: {
    id: 'alevel',
    label: 'A-Level',
    shortLabel: 'A-Level',
    gradeScale: ['A*', 'A', 'B', 'C', 'D', 'E'],
    defaultTargetGrade: 'A*',
    topTargetGrades: ['A*', 'A'],
    tone: 'rigorous',
    battlePhases: ['recall', 'application', 'extended'],
    extendedMaxScore: 6,
  },
  gcse: {
    id: 'gcse',
    label: 'GCSE',
    shortLabel: 'GCSE',
    gradeScale: ['9', '8', '7', '6', '5', '4', '3', '2', '1'],
    defaultTargetGrade: '9',
    topTargetGrades: ['9', '8', '7'],
    tone: 'supportive',
    battlePhases: ['recall', 'application', 'extended'],
    extendedMaxScore: 6,
  },
};

/**
 * Get the currently selected qualification level from localStorage.
 * @returns {'alevel' | 'gcse' | null}
 */
export function getCurrentLevel() {
  return localStorage.getItem(`${PREFIX}:qualificationLevel`) || null;
}

/**
 * Set the qualification level in localStorage.
 * @param {'alevel' | 'gcse'} level
 */
export function setCurrentLevel(level) {
  localStorage.setItem(`${PREFIX}:qualificationLevel`, level);
}

/**
 * Check whether a qualification level has been selected.
 */
export function hasSelectedLevel() {
  return getCurrentLevel() !== null;
}

/**
 * Get metadata for a qualification level.
 * @param {'alevel' | 'gcse'} level
 */
export function getLevelMeta(level) {
  return LEVEL_META[level] || LEVEL_META.alevel;
}
