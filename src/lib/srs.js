// ─── Spaced Repetition Scheduling Engine ───
// Calculates next review dates based on session performance,
// current SRS stage, subject, and topic difficulty.

// SRS Stages (1-4):
//   1 = Learning       (short intervals)
//   2 = Short-term     (medium intervals)
//   3 = Medium-term    (longer intervals)
//   4 = Long-term      (maintenance intervals)

// ─── Interval Tables (in days) ───
// Each entry: [advanceInterval, stayInterval, dropInterval]
// advanceInterval = scored well → move to next stage
// stayInterval    = scored okay → stay at same stage
// dropInterval    = scored poorly → drop a stage

const BIOLOGY_INTERVALS = {
  1: { advance: 1, stay: 1, drop: 1 },     // Learning → Short-term
  2: { advance: 3, stay: 2, drop: 1 },     // Short-term → Medium-term
  3: { advance: 7, stay: 4, drop: 2 },     // Medium-term → Long-term
  4: { advance: 21, stay: 14, drop: 5 },   // Long-term → stay long-term
};

const CHEMISTRY_INTERVALS = {
  easy: { // difficultyRating 1-2
    1: { advance: 1, stay: 1, drop: 1 },
    2: { advance: 3, stay: 2, drop: 1 },
    3: { advance: 7, stay: 4, drop: 2 },
    4: { advance: 21, stay: 14, drop: 5 },
  },
  medium: { // difficultyRating 3
    1: { advance: 1, stay: 1, drop: 1 },
    2: { advance: 2, stay: 1, drop: 1 },
    3: { advance: 5, stay: 3, drop: 1 },
    4: { advance: 14, stay: 10, drop: 3 },
  },
  hard: { // difficultyRating 4-5
    1: { advance: 1, stay: 1, drop: 1 },
    2: { advance: 2, stay: 1, drop: 1 },
    3: { advance: 4, stay: 2, drop: 1 },
    4: { advance: 10, stay: 7, drop: 2 },
  },
};

const MATHEMATICS_INTERVALS = {
  easy: {
    1: { advance: 1, stay: 1, drop: 1 },
    2: { advance: 3, stay: 2, drop: 1 },
    3: { advance: 7, stay: 4, drop: 2 },
    4: { advance: 21, stay: 14, drop: 5 },
  },
  medium: {
    1: { advance: 1, stay: 1, drop: 1 },
    2: { advance: 2, stay: 1, drop: 1 },
    3: { advance: 5, stay: 3, drop: 1 },
    4: { advance: 14, stay: 10, drop: 3 },
  },
  hard: {
    1: { advance: 1, stay: 1, drop: 1 },
    2: { advance: 2, stay: 1, drop: 1 },
    3: { advance: 4, stay: 2, drop: 1 },
    4: { advance: 10, stay: 7, drop: 2 },
  },
};

// ─── Thresholds ───
// Score percentage thresholds for advancing / staying / dropping
const ADVANCE_THRESHOLD = 0.70; // >= 70% → advance stage
const DROP_THRESHOLD = 0.40;     // < 40% → drop stage

// ─── Helpers ───

function getDifficultyTier(difficultyRating) {
  if (difficultyRating <= 2) return 'easy';
  if (difficultyRating <= 3) return 'medium';
  return 'hard';
}

function getIntervalTable(subjectId, difficultyRating) {
  if (subjectId === 'biology') {
    return BIOLOGY_INTERVALS;
  }

  if (subjectId === 'chemistry') {
    const tier = getDifficultyTier(difficultyRating);
    return CHEMISTRY_INTERVALS[tier];
  }

  if (subjectId === 'mathematics') {
    const tier = getDifficultyTier(difficultyRating);
    return MATHEMATICS_INTERVALS[tier];
  }

  // Fallback to biology intervals
  return BIOLOGY_INTERVALS;
}

// ─── Main Calculation ───

/**
 * Calculate the next review date and updated SRS stage after a session.
 *
 * @param {number} scorePercentage — 0-1 fraction (e.g. 0.75 for 75%)
 * @param {number} currentStage — current SRS stage (1-4), default 1 for new topics
 * @param {string} subjectId — 'biology' | 'chemistry' | 'mathematics'
 * @param {number} topicDifficulty — 1-5 difficulty rating from topic data
 * @returns {{ nextReviewDate: string, intervalDays: number, newStage: number, priority: string, outcome: string }}
 */
export function calculateNextReview(scorePercentage, currentStage = 1, subjectId = 'biology', topicDifficulty = 3) {
  const stage = Math.max(1, Math.min(4, currentStage));
  const table = getIntervalTable(subjectId, topicDifficulty);
  const stageIntervals = table[stage];

  let newStage, interval, outcome;

  if (scorePercentage >= ADVANCE_THRESHOLD) {
    // Good performance → advance (or stay at max)
    newStage = Math.min(4, stage + 1);
    interval = stageIntervals.advance;
    outcome = stage < 4 ? 'advanced' : 'maintained';
  } else if (scorePercentage >= DROP_THRESHOLD) {
    // Moderate performance → stay at same stage
    newStage = stage;
    interval = stageIntervals.stay;
    outcome = 'stayed';
  } else {
    // Poor performance → drop a stage (min 1)
    newStage = Math.max(1, stage - 1);
    interval = stageIntervals.drop;
    outcome = 'dropped';
  }

  const now = new Date();
  const nextReview = new Date(now.getTime() + interval * 86400000);

  return {
    nextReviewDate: nextReview.toISOString(),
    intervalDays: interval,
    newStage,
    priority: getPriorityFromStage(newStage, interval),
    outcome,
  };
}

/**
 * Determine the priority label for a topic based on its review timing.
 */
function getPriorityFromStage(stage, intervalDays) {
  if (stage <= 1 && intervalDays <= 1) return 'urgent';
  if (stage <= 2) return 'high';
  return 'normal';
}

/**
 * Get the current priority for a topic based on its next review date.
 * Used by the dashboard to colour-code and sort topics.
 *
 * @param {string|null} nextReviewDate — ISO date string or null
 * @returns {{ priority: 'overdue'|'due_today'|'due_soon'|'normal'|'new', daysUntilReview: number }}
 */
export function getReviewPriority(nextReviewDate) {
  if (!nextReviewDate) {
    return { priority: 'new', daysUntilReview: Infinity };
  }

  const now = new Date();
  const review = new Date(nextReviewDate);
  const diffMs = review.getTime() - now.getTime();
  const diffDays = diffMs / 86400000;

  if (diffDays < -0.5) {
    // More than 12 hours overdue
    return { priority: 'overdue', daysUntilReview: Math.floor(diffDays) };
  }
  if (diffDays < 0.5) {
    // Due within 12 hours either way → treat as "due today"
    return { priority: 'due_today', daysUntilReview: 0 };
  }
  if (diffDays <= 2) {
    // Due within next 2 days
    return { priority: 'due_soon', daysUntilReview: Math.ceil(diffDays) };
  }

  return { priority: 'normal', daysUntilReview: Math.ceil(diffDays) };
}

/**
 * Calculate session score percentage from a battle/drill/exam session.
 * Normalises across different session types.
 *
 * @param {object} session — session object with phases data
 * @returns {number} 0-1 percentage score
 */
export function getSessionScorePercentage(session) {
  if (!session) return 0;

  const phases = session.phases;
  if (!phases) return 0;

  // Battle / session with recall + application + extended
  let totalScore = 0;
  let totalMax = 0;

  if (phases.recall) {
    totalScore += phases.recall.correct || 0;
    totalMax += phases.recall.total || 5;
  }
  if (phases.application) {
    totalScore += phases.application.correct || 0;
    totalMax += phases.application.total || 3;
  }
  if (phases.extended) {
    totalScore += phases.extended.score || 0;
    totalMax += phases.extended.maxScore || 6;
  }

  // For exam sessions that have totalScore/totalMaxScore directly
  if (session.totalScore !== undefined && session.totalMaxScore !== undefined) {
    return session.totalMaxScore > 0 ? session.totalScore / session.totalMaxScore : 0;
  }

  return totalMax > 0 ? totalScore / totalMax : 0;
}

/**
 * Format the next review date for display.
 *
 * @param {string|null} nextReviewDate — ISO date string
 * @returns {string} Human-readable string like "in 3 days", "tomorrow", "overdue by 2 days"
 */
export function formatNextReview(nextReviewDate) {
  if (!nextReviewDate) return 'not scheduled';

  const now = new Date();
  const review = new Date(nextReviewDate);
  const diffMs = review.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays < -1) return `overdue by ${Math.abs(diffDays)} days`;
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return `in ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''}`;
}

/**
 * Get the SRS stage label for display.
 */
export function getSRSStageLabel(stage) {
  switch (stage) {
    case 1: return 'Learning';
    case 2: return 'Short-term';
    case 3: return 'Medium-term';
    case 4: return 'Long-term';
    default: return 'New';
  }
}
