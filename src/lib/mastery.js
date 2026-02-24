import { getAttemptsByTopic, getAttemptsBySubskill, updateMasteryCache, getMasteryCache } from './storage';
import topics from '../content/topics.json';

// Phase weights: extended answers count more than recall
const PHASE_WEIGHTS = {
  recall: 1.0,
  application: 1.5,
  extended: 2.0,
};

// Difficulty multiplier: harder questions contribute more
function difficultyMultiplier(difficulty = 3) {
  return 0.8 + (difficulty * 0.1);
}

// Convert a single attempt into a normalised performance score (0-1)
function attemptPerformance(attempt) {
  if (attempt.phase === 'extended') {
    return attempt.maxScore > 0 ? attempt.score / attempt.maxScore : 0;
  }
  // Recall / application: binary correct + partial credit from score
  if (attempt.maxScore > 0) {
    return attempt.score / attempt.maxScore;
  }
  return attempt.correct ? 1 : 0;
}

// Weighted moving average with exponential decay over last N attempts
// Most recent = weight 1.0, older = decayed by factor
function weightedMovingAverage(attempts, maxAttempts = 20, decayFactor = 0.7) {
  if (attempts.length === 0) return 0;

  // Sort by timestamp, newest first
  const sorted = [...attempts]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxAttempts);

  let weightedSum = 0;
  let totalWeight = 0;

  sorted.forEach((attempt, index) => {
    const perf = attemptPerformance(attempt);
    const phaseWeight = PHASE_WEIGHTS[attempt.phase] || 1.0;
    const diffMult = difficultyMultiplier(attempt.difficulty || 3);

    // Exponential decay: recent attempts count more
    const recencyWeight = Math.pow(decayFactor, index);
    const weight = phaseWeight * diffMult * recencyWeight;

    weightedSum += perf * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// Calculate mastery for a single subskill
function calculateSubskillMastery(subskillId) {
  const attempts = getAttemptsBySubskill(subskillId);
  if (attempts.length === 0) return 0;
  return weightedMovingAverage(attempts);
}

// Calculate full topic mastery with critical subskill penalty
export function calculateTopicMastery(topicId) {
  const topic = topics.find(t => t.id === topicId);
  if (!topic) return { topicMastery: 0, subskillMasteries: {}, category: 'untested' };

  const topicAttempts = getAttemptsByTopic(topicId);

  // If no attempts, return untested
  if (topicAttempts.length === 0) {
    return {
      topicMastery: 0,
      subskillMasteries: {},
      category: 'untested',
      attemptCount: 0,
    };
  }

  // Calculate per-subskill mastery
  const subskillMasteries = {};
  let hasCriticalPenalty = false;

  for (const subskill of topic.subskills) {
    const mastery = calculateSubskillMastery(subskill.id);
    subskillMasteries[subskill.id] = mastery;

    // Check critical subskill penalty
    if (subskill.critical && mastery < 0.40) {
      hasCriticalPenalty = true;
    }
  }

  // Overall topic mastery = weighted average of attempts
  let topicMastery = weightedMovingAverage(topicAttempts);

  // Critical subskill penalty: cap at 0.70 if any critical subskill is weak
  if (hasCriticalPenalty && topicMastery > 0.70) {
    topicMastery = 0.70;
  }

  // Clamp
  topicMastery = Math.max(0, Math.min(1, topicMastery));

  // Category
  let category;
  if (topicMastery >= 0.80) category = 'strong';
  else if (topicMastery >= 0.55) category = 'developing';
  else if (topicMastery >= 0.30) category = 'weak';
  else category = 'untested';

  return {
    topicMastery,
    subskillMasteries,
    category,
    attemptCount: topicAttempts.length,
    hasCriticalPenalty,
  };
}

// Recalculate and save mastery for a topic after a battle
export function updateTopicMastery(topicId) {
  const result = calculateTopicMastery(topicId);
  updateMasteryCache(topicId, result);
  return result;
}

// Recalculate all topic masteries
export function recalculateAllMasteries() {
  const results = {};
  for (const topic of topics) {
    results[topic.id] = updateTopicMastery(topic.id);
  }
  return results;
}

// Confidence mismatch detection
// High confidence + low score → overconfident
// Low confidence + high score → underconfident
export function detectConfidenceMismatch(confidence, performance) {
  // confidence: 0-1 (self-reported or inferred from speed)
  // performance: 0-1 (actual score)
  const gap = confidence - performance;

  if (gap > 0.3) return { type: 'overconfident', gap };
  if (gap < -0.3) return { type: 'underconfident', gap: Math.abs(gap) };
  return { type: 'aligned', gap: Math.abs(gap) };
}

// Get mastery summary for all topics (for radar chart)
export function getAllTopicMasteries() {
  const cache = getMasteryCache();
  return topics.map(topic => ({
    topicId: topic.id,
    name: topic.name,
    shortName: topic.name.split(' ')[0],
    mastery: cache[topic.id]?.topicMastery ?? 0,
    category: cache[topic.id]?.category ?? 'untested',
    attemptCount: cache[topic.id]?.attemptCount ?? 0,
  }));
}
