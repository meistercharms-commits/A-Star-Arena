/**
 * Exam Planner — coverage calculation and revision plan generation.
 */

import { getMasteryCache } from './storage';

/**
 * Calculate topic coverage for a subject's exam.
 * @param {Array} topics - All topics for the subject
 * @param {string} subject - Subject ID (used for mastery lookup)
 * @returns {{ covered, partial, notCovered, percentage, topicDetails }}
 */
export function getExamCoverage(topics) {
  const cache = getMasteryCache();
  let covered = 0;
  let partial = 0;
  let notCovered = 0;

  const topicDetails = topics.map(topic => {
    const mastery = cache[topic.id]?.topicMastery ?? 0;
    const category = cache[topic.id]?.category ?? 'untested';
    let status;

    if (mastery >= 0.55) {
      status = 'covered';
      covered++;
    } else if (mastery >= 0.25) {
      status = 'partial';
      partial++;
    } else {
      status = 'not_covered';
      notCovered++;
    }

    return {
      topicId: topic.id,
      name: topic.name,
      mastery,
      category,
      status,
      highYield: topic.highYield || false,
    };
  });

  const total = topics.length;
  const percentage = total > 0 ? Math.round((covered / total) * 100) : 0;

  return { covered, partial, notCovered, percentage, total, topicDetails };
}

/**
 * Generate a prioritised revision plan for an upcoming exam.
 * @param {Array} topics - All topics for the subject
 * @param {number} daysRemaining - Days until the exam
 * @param {number} minsPerDay - Student's daily revision goal in minutes
 * @returns {Array<{ day, topics, estimatedMins, mode }>}
 */
export function generateRevisionPlan(topics, daysRemaining, minsPerDay = 30) {
  const coverage = getExamCoverage(topics);
  const { topicDetails } = coverage;

  // Sort topics by priority: untested high-yield > weak high-yield > untested > weak > partial > covered
  const prioritised = [...topicDetails].sort((a, b) => {
    const scoreA = getPriorityScore(a, daysRemaining);
    const scoreB = getPriorityScore(b, daysRemaining);
    return scoreB - scoreA;
  });

  // Triage mode: <7 days, only focus on recall and consolidation
  const isTriage = daysRemaining <= 7;
  const isUrgent = daysRemaining <= 14;

  // Estimate ~20 mins per topic session
  const topicsPerDay = Math.max(1, Math.floor(minsPerDay / 20));
  const effectiveDays = Math.min(daysRemaining, 42); // Cap at 6 weeks planning

  const plan = [];
  let topicIdx = 0;

  for (let day = 1; day <= effectiveDays && topicIdx < prioritised.length; day++) {
    const dayTopics = [];
    for (let i = 0; i < topicsPerDay && topicIdx < prioritised.length; i++) {
      const topic = prioritised[topicIdx];

      // In triage mode, skip topics that are already strong
      if (isTriage && topic.status === 'covered') {
        topicIdx++;
        i--;
        continue;
      }

      let mode;
      if (topic.status === 'not_covered') {
        mode = isUrgent ? 'quick_drill' : 'full_battle';
      } else if (topic.status === 'partial') {
        mode = 'targeted_drill';
      } else {
        mode = 'review';
      }

      dayTopics.push({
        ...topic,
        mode,
        suggestedDifficulty: isTriage ? 2 : (topic.mastery < 0.3 ? 2 : topic.mastery < 0.6 ? 3 : 4),
      });
      topicIdx++;
    }

    if (dayTopics.length > 0) {
      plan.push({
        day,
        topics: dayTopics,
        estimatedMins: dayTopics.length * 20,
      });
    }
  }

  return plan;
}

/**
 * Get the nearest exam for a given subject and level.
 */
export function getNearestExamForSubject(exams, subjectId, level) {
  const now = new Date();
  return exams
    .filter(e => e.subjectId === subjectId && e.level === level && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

// Internal: priority scoring for plan generation
function getPriorityScore(topicDetail, daysRemaining) {
  let score = 0;

  // Status weighting
  if (topicDetail.status === 'not_covered') score += 10;
  else if (topicDetail.status === 'partial') score += 5;
  else score += 1;

  // High-yield boost
  if (topicDetail.highYield) score += 3;

  // Urgency: lower mastery matters more when time is short
  if (daysRemaining <= 14) {
    score += (1 - topicDetail.mastery) * 5;
  }

  return score;
}
