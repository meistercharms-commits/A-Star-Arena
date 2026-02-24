import { getMasteryCache, getSessions, getSRSData } from './storage';
import { detectConfidenceMismatch } from './mastery';
import { getReviewPriority } from './srs';

// ─── Priority Score ───
// SRS-driven: overdue > due_today > due_soon > high mastery gap > normal
// Fallback to mastery-based for topics with no SRS data yet.

const SRS_PRIORITY_WEIGHTS = {
  overdue: 10,
  due_today: 8,
  due_soon: 5,
  new: 3,      // Never practised — moderate priority
  normal: 1,   // Not due yet — low priority
};

function recencyBoost(daysAgo) {
  if (daysAgo === Infinity || daysAgo === null || daysAgo === undefined) return 0.6;
  return 1 - Math.exp(-0.1 * daysAgo);
}

function computePriorityScore(mastery, daysAgo, highYield, srsPriority) {
  // SRS base score (dominant factor when SRS data exists)
  const srsWeight = SRS_PRIORITY_WEIGHTS[srsPriority] || 1;

  // Mastery gap (0 = mastered, 1 = no mastery)
  const gap = 1 - mastery;

  // Recency boost (higher = longer since last practice)
  const recency = recencyBoost(daysAgo);

  // High-yield topics get a boost
  const yieldWeight = highYield ? 1.5 : 1.0;

  // Penalise fully untested slightly (encourage practised-weak first)
  const untestedPenalty = mastery === 0 ? 0.8 : 1.0;

  // Penalise strong topics that aren't due for review
  const strongPenalty = mastery >= 0.8 && srsPriority === 'normal' ? 0.1 : 1.0;

  // Combined score: SRS weight is the primary driver
  return srsWeight * gap * recency * yieldWeight * untestedPenalty * strongPenalty;
}

// ─── Get Days Since Last Practice ───

function getDaysSinceLastPractice(topicId, sessions) {
  const topicSessions = sessions.filter(s => s.topicId === topicId);
  if (topicSessions.length === 0) return Infinity;

  const lastSession = topicSessions[0];
  const lastDate = lastSession.completedAt || lastSession.startedAt;
  if (!lastDate) return Infinity;

  return Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
}

// ─── Main Recommendation Functions ───

/**
 * Get ranked list of all topics with priority scores.
 * topics & bosses come from SubjectContext.
 */
export function getRankedTopics(topics = [], bosses = []) {
  const masteryCache = getMasteryCache();
  const sessions = getSessions();
  const srsData = getSRSData();

  return topics.map(topic => {
    const mastery = masteryCache[topic.id]?.topicMastery ?? 0;
    const category = masteryCache[topic.id]?.category ?? 'untested';
    const attemptCount = masteryCache[topic.id]?.attemptCount ?? 0;
    const daysAgo = getDaysSinceLastPractice(topic.id, sessions);
    const boss = bosses.find(b => b.topicId === topic.id);

    // SRS review status
    const topicSRS = srsData[topic.id];
    const reviewInfo = getReviewPriority(topicSRS?.nextReviewDate || null);

    const priority = computePriorityScore(mastery, daysAgo, topic.highYield, reviewInfo.priority);

    return {
      topicId: topic.id,
      topicName: topic.name,
      emoji: boss?.emoji || '📘',
      mastery,
      category,
      attemptCount,
      daysAgo,
      highYield: !!topic.highYield,
      priority,
      // SRS fields
      srsStage: topicSRS?.srsStage || 0,
      nextReviewDate: topicSRS?.nextReviewDate || null,
      reviewPriority: reviewInfo.priority,
      daysUntilReview: reviewInfo.daysUntilReview,
    };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Get the single best recommendation for "Today's Mission".
 * topics & bosses come from SubjectContext.
 */
export function getTodaysMission(topics = [], bosses = []) {
  const ranked = getRankedTopics(topics, bosses);

  if (ranked.length === 0) {
    return fallbackMission(topics, bosses);
  }

  const top = ranked[0];

  // Determine action type and reason — SRS-aware
  let action, reason, difficulty;

  // SRS-driven reasons override mastery-based reasons
  if (top.reviewPriority === 'overdue') {
    action = 'battle';
    difficulty = top.mastery < 0.55 ? 2 : 3;
    const overdueDays = Math.abs(top.daysUntilReview);
    reason = `🔴 ${top.topicName} is overdue for review by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}. Don't let it slip!`;
  } else if (top.reviewPriority === 'due_today') {
    action = 'battle';
    difficulty = top.mastery < 0.55 ? 2 : 3;
    reason = `🟡 ${top.topicName} is due for review today. Keep your streak going!`;
  } else if (top.reviewPriority === 'due_soon') {
    action = 'battle';
    difficulty = top.mastery < 0.55 ? 3 : 4;
    reason = `${top.topicName} is due for review in ${top.daysUntilReview} day${top.daysUntilReview !== 1 ? 's' : ''}. Get ahead of the schedule.`;
  } else if (top.mastery === 0 && top.attemptCount === 0) {
    action = 'start_new_topic';
    difficulty = 2;
    reason = top.highYield
      ? `${top.topicName} is a high-yield topic you haven't tried yet. A great place to start.`
      : `You haven't practised ${top.topicName} yet. Time to find out where you stand.`;
  } else if (top.mastery < 0.30) {
    action = 'battle';
    difficulty = 2;
    reason = `${top.topicName} needs attention — you're at ${pct(top.mastery)}% mastery. Let's build a foundation.`;
  } else if (top.mastery < 0.55) {
    action = 'battle';
    difficulty = 3;
    reason = `Your weakest practised area at ${pct(top.mastery)}% mastery. Focused practice here will pay off.`;
  } else if (top.mastery < 0.80) {
    action = 'battle';
    difficulty = 4;
    reason = `At ${pct(top.mastery)}% mastery, there's still room to push ${top.topicName} to A* level.`;
  } else {
    // All topics are strong — pick the one most due for review, or least recently practised
    const sorted = [...ranked].sort((a, b) => {
      // Prefer topics that are due sooner (handle Infinity safely)
      const aDays = a.daysUntilReview === Infinity ? 9999 : a.daysUntilReview;
      const bDays = b.daysUntilReview === Infinity ? 9999 : b.daysUntilReview;
      if (aDays !== bDays) return aDays - bDays;
      // Fallback: prefer least recently practised
      const aAgo = a.daysAgo === Infinity ? 9999 : a.daysAgo;
      const bAgo = b.daysAgo === Infinity ? 9999 : b.daysAgo;
      return bAgo - aAgo;
    });
    const pick = sorted[0];
    action = 'battle';
    difficulty = 4;
    reason = pick.nextReviewDate
      ? `All topics are strong! ${pick.topicName} is next for review (${formatDaysAgo(pick.daysAgo)}).`
      : `All topics are strong! Revisit ${pick.topicName} to keep it fresh (last practised ${formatDaysAgo(pick.daysAgo)}).`;
    return {
      topicId: pick.topicId,
      topicName: pick.topicName,
      emoji: pick.emoji,
      mastery: pick.mastery,
      category: pick.category,
      action,
      reason,
      difficulty,
      reviewPriority: pick.reviewPriority,
    };
  }

  return {
    topicId: top.topicId,
    topicName: top.topicName,
    emoji: top.emoji,
    mastery: top.mastery,
    category: top.category,
    action,
    reason,
    difficulty,
    reviewPriority: top.reviewPriority,
  };
}

/**
 * Get review summary counts for the dashboard.
 * Returns: { overdue, dueToday, dueSoon, total }
 */
export function getReviewSummary(topics = [], bosses = []) {
  const ranked = getRankedTopics(topics, bosses);

  let overdue = 0;
  let dueToday = 0;
  let dueSoon = 0;

  for (const t of ranked) {
    if (t.reviewPriority === 'overdue') overdue++;
    else if (t.reviewPriority === 'due_today') dueToday++;
    else if (t.reviewPriority === 'due_soon') dueSoon++;
  }

  return { overdue, dueToday, dueSoon, total: overdue + dueToday + dueSoon };
}

/**
 * Get post-battle recommendation based on the session results.
 * topics & bosses come from SubjectContext.
 */
export function getPostBattleRecommendation({ topicId, score, maxScore, errorTypes, subskillIds }, topics = [], bosses = []) {
  const masteryCache = getMasteryCache();
  const ranked = getRankedTopics(topics, bosses);

  const currentMastery = masteryCache[topicId]?.topicMastery ?? 0;
  const currentTopic = topics.find(t => t.id === topicId);
  const performance = maxScore > 0 ? score / maxScore : 0;

  // Confidence mismatch: if mastery was high but performance was low, flag overconfidence
  const mismatch = detectConfidenceMismatch(currentMastery, performance);

  // Check for weak subskills within this topic
  const weakSubskills = findWeakSubskills(topicId, masteryCache, topics);

  // Case 0: Overconfident — mastery says strong but score says otherwise → targeted drill
  if (mismatch.type === 'overconfident') {
    return {
      nextAction: 'targeted_drill',
      topic: { id: topicId, name: currentTopic?.name || topicId },
      reason: `Your mastery was ${pct(currentMastery)}% but you scored ${pct(performance)}%. Confidence gap detected — let's reinforce ${currentTopic?.name} with a focused drill.`,
      difficulty: 2,
      focusSubskills: weakSubskills.map(s => s.id),
      drillLength: 3,
      estimatedTimeMin: 5,
    };
  }

  // Case 1: Poor performance on this topic → targeted drill
  if (performance < 0.5 && weakSubskills.length > 0) {
    return {
      nextAction: 'targeted_drill',
      topic: { id: topicId, name: currentTopic?.name || topicId },
      reason: `You scored ${pct(performance)}% — focus on your weakest subskills: ${weakSubskills.map(s => s.name).join(', ')}.`,
      difficulty: 2,
      focusSubskills: weakSubskills.map(s => s.id),
      drillLength: 3,
      estimatedTimeMin: 5,
    };
  }

  // Case 2: Moderate performance → retry this topic at higher difficulty
  if (performance < 0.7 && currentMastery < 0.55) {
    return {
      nextAction: 'battle',
      topic: { id: topicId, name: currentTopic?.name || topicId },
      reason: `Good effort at ${pct(performance)}%! Another round will help solidify your understanding of ${currentTopic?.name}.`,
      difficulty: 3,
      focusSubskills: [],
      drillLength: null,
      estimatedTimeMin: 15,
    };
  }

  // Case 3: Good performance → move to next weakest topic
  const underconfidentNote = mismatch.type === 'underconfident'
    ? ' You did better than expected — trust your knowledge!'
    : '';
  const nextTopic = ranked.find(r => r.topicId !== topicId);
  if (nextTopic) {
    const action = nextTopic.mastery === 0 ? 'start_new_topic' : 'battle';
    return {
      nextAction: action,
      topic: { id: nextTopic.topicId, name: nextTopic.topicName },
      reason: nextTopic.mastery === 0
        ? `Great work!${underconfidentNote} Try ${nextTopic.topicName} next — it's a ${nextTopic.highYield ? 'high-yield ' : ''}topic you haven't explored yet.`
        : `Nice job!${underconfidentNote} ${nextTopic.topicName} is your next weakest area at ${pct(nextTopic.mastery)}% mastery.`,
      difficulty: nextTopic.mastery < 0.4 ? 2 : 3,
      focusSubskills: [],
      drillLength: null,
      estimatedTimeMin: 15,
    };
  }

  // Case 4: Fallback — retry with exam simulator suggestion
  return {
    nextAction: 'exam_simulator',
    topic: { id: topicId, name: currentTopic?.name || topicId },
    reason: 'You\'re doing well across all topics! Try the Exam Simulator for a mixed challenge.',
    difficulty: 4,
    focusSubskills: [],
    drillLength: null,
    estimatedTimeMin: 15,
  };
}

/**
 * Get targeted drill questions for specific weak subskills.
 * topics come from SubjectContext.
 */
export function getTargetedDrillConfig(topicId, focusSubskillIds, topics = []) {
  const topic = topics.find(t => t.id === topicId);
  if (!topic) return null;

  const subskills = focusSubskillIds.length > 0
    ? topic.subskills.filter(s => focusSubskillIds.includes(s.id))
    : findWeakSubskills(topicId, getMasteryCache(), topics);

  if (subskills.length === 0) {
    // No specific weak subskills — drill all
    return {
      topicId,
      topicName: topic.name,
      drillLength: 3,
      phases: ['recall', 'recall', 'application'],
      focusSubskills: topic.subskills.slice(0, 3).map(s => ({ id: s.id, name: s.name })),
      difficulty: 2,
    };
  }

  return {
    topicId,
    topicName: topic.name,
    drillLength: 3,
    phases: ['recall', 'recall', 'application'],
    focusSubskills: subskills.slice(0, 3).map(s => ({ id: s.id, name: s.name })),
    difficulty: 2,
  };
}

// ─── Helpers ───

function findWeakSubskills(topicId, masteryCache, topics = []) {
  const topic = topics.find(t => t.id === topicId);
  if (!topic) return [];

  const subskillMasteries = masteryCache[topicId]?.subskillMasteries || {};

  return topic.subskills
    .map(s => ({
      ...s,
      mastery: subskillMasteries[s.id] ?? 0,
    }))
    .filter(s => s.mastery < 0.55)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);
}

function pct(value) {
  return Math.round(value * 100);
}

function formatDaysAgo(days) {
  if (days === Infinity || days === null) return 'never';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function fallbackMission(topics = [], bosses = []) {
  const first = topics[0];
  if (!first) {
    return {
      topicId: null,
      topicName: 'No topics',
      emoji: '📘',
      mastery: 0,
      category: 'untested',
      action: 'start_new_topic',
      reason: 'No topics available yet.',
      difficulty: 2,
    };
  }
  const boss = bosses.find(b => b.topicId === first.id);
  return {
    topicId: first.id,
    topicName: first.name,
    emoji: boss?.emoji || '📘',
    mastery: 0,
    category: 'untested',
    action: 'start_new_topic',
    reason: `Welcome! Start with ${first.name} — it's a great foundation topic.`,
    difficulty: 2,
  };
}
