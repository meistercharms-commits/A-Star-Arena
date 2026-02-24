import { getMasteryCache, getSessions } from './storage';
import { detectConfidenceMismatch } from './mastery';
import topics from '../content/topics.json';
import bosses from '../content/bosses.json';

// ─── Priority Score ───
// Higher score = more urgent to practise
// Formula: (1 - mastery) * e^(-0.1 * daysAgo) * highYieldWeight * categoryBoost
//
// - mastery 0 → high priority (lots to learn)
// - mastery 1 → low priority (already strong)
// - daysAgo 0 → full recency weight (just practised = lower urgency... handled by the decay)
//   Actually: daysAgo large → e^(-0.1 * daysAgo) → small → LOWER priority
//   We WANT: topics not practised recently to be higher priority
//   So we invert: recencyBoost = 1 - e^(-0.1 * daysAgo), capped at 1
//   → daysAgo 0 → boost 0 (just did it), daysAgo 7 → ~0.5, daysAgo 30 → ~0.95

function recencyBoost(daysAgo) {
  if (daysAgo === Infinity || daysAgo === null || daysAgo === undefined) return 0.6; // untested — moderate
  return 1 - Math.exp(-0.1 * daysAgo);
}

function computePriorityScore(mastery, daysAgo, highYield) {
  const gap = 1 - mastery;
  const recency = recencyBoost(daysAgo);
  const yieldWeight = highYield ? 1.5 : 1.0;

  // Penalise fully untested (encourage practised-weak first)
  const untestedPenalty = mastery === 0 ? 0.8 : 1.0;

  // Penalise strong topics heavily (don't keep drilling what you know)
  const strongPenalty = mastery >= 0.8 ? 0.2 : 1.0;

  return gap * recency * yieldWeight * untestedPenalty * strongPenalty;
}

// ─── Get Days Since Last Practice ───

function getDaysSinceLastPractice(topicId, sessions) {
  const topicSessions = sessions.filter(s => s.topicId === topicId);
  if (topicSessions.length === 0) return Infinity;

  // Sessions are stored newest first
  const lastSession = topicSessions[0];
  const lastDate = lastSession.completedAt || lastSession.startedAt;
  if (!lastDate) return Infinity;

  return Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
}

// ─── Main Recommendation Functions ───

/**
 * Get ranked list of all topics with priority scores.
 * Returns array sorted by priority (highest first).
 */
export function getRankedTopics() {
  const masteryCache = getMasteryCache();
  const sessions = getSessions();

  return topics.map(topic => {
    const mastery = masteryCache[topic.id]?.topicMastery ?? 0;
    const category = masteryCache[topic.id]?.category ?? 'untested';
    const attemptCount = masteryCache[topic.id]?.attemptCount ?? 0;
    const daysAgo = getDaysSinceLastPractice(topic.id, sessions);
    const boss = bosses.find(b => b.topicId === topic.id);

    const priority = computePriorityScore(mastery, daysAgo, topic.highYield);

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
    };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Get the single best recommendation for "Today's Mission".
 * Returns an object with topicId, reason, action type, etc.
 */
export function getTodaysMission() {
  const ranked = getRankedTopics();

  if (ranked.length === 0) {
    return fallbackMission();
  }

  const top = ranked[0];

  // Determine action type and reason
  let action, reason, difficulty;

  if (top.mastery === 0 && top.attemptCount === 0) {
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
    // All topics are strong — pick least recently practised
    const leastRecent = ranked.sort((a, b) => b.daysAgo - a.daysAgo)[0];
    action = 'battle';
    difficulty = 4;
    reason = `All topics are strong! Revisit ${leastRecent.topicName} to keep it fresh (last practised ${formatDaysAgo(leastRecent.daysAgo)}).`;
    return {
      topicId: leastRecent.topicId,
      topicName: leastRecent.topicName,
      emoji: leastRecent.emoji,
      mastery: leastRecent.mastery,
      category: leastRecent.category,
      action,
      reason,
      difficulty,
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
  };
}

/**
 * Get post-battle recommendation based on the session results.
 */
export function getPostBattleRecommendation({ topicId, score, maxScore, errorTypes, subskillIds }) {
  const masteryCache = getMasteryCache();
  const sessions = getSessions();
  const ranked = getRankedTopics();

  const currentMastery = masteryCache[topicId]?.topicMastery ?? 0;
  const currentTopic = topics.find(t => t.id === topicId);
  const performance = maxScore > 0 ? score / maxScore : 0;

  // Confidence mismatch: if mastery was high but performance was low, flag overconfidence
  const mismatch = detectConfidenceMismatch(currentMastery, performance);

  // Check for weak subskills within this topic
  const weakSubskills = findWeakSubskills(topicId, masteryCache);

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
 * Returns a drill config for 3 focused questions.
 */
export function getTargetedDrillConfig(topicId, focusSubskillIds) {
  const topic = topics.find(t => t.id === topicId);
  if (!topic) return null;

  const subskills = focusSubskillIds.length > 0
    ? topic.subskills.filter(s => focusSubskillIds.includes(s.id))
    : findWeakSubskills(topicId, getMasteryCache());

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

function findWeakSubskills(topicId, masteryCache) {
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

function fallbackMission() {
  const first = topics[0];
  const boss = bosses.find(b => b.topicId === first.id);
  return {
    topicId: first.id,
    topicName: first.name,
    emoji: boss?.emoji || '📘',
    mastery: 0,
    category: 'untested',
    action: 'start_new_topic',
    reason: 'Welcome! Start with Biological Molecules — it\'s a high-yield foundation topic.',
    difficulty: 2,
  };
}
