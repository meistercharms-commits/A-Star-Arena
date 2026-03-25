import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSettings, getProgress, getLevelProgress, getRecentSessions, getExamBoard, getCurrentLevel, getUpcomingExams, getExamCountdown, isNewUser } from '../lib/storage';
import { getMasteryCategory, formatDate } from '../lib/utils';
import { getTodaysMission, getReviewSummary } from '../lib/recommend';
import { getRecurringMistakes } from '../lib/errorPatterns';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { getLevelMeta } from '../lib/qualificationLevel';
import { getNearestExamForSubject, getExamCoverage } from '../lib/examPlanner';
import TopicRadar from '../components/RadarChart';

export default function Home() {
  const navigate = useNavigate();
  const { subjectId, topics, bosses } = useSubject();
  const { level } = useLevel();
  const levelMeta = getLevelMeta(level);
  const settings = getSettings() || {};
  const progress = getProgress();
  const levelInfo = getLevelProgress();
  const recentSessions = getRecentSessions(5);
  const newUser = isNewUser();

  const targetGrade = settings[`targetGrade_${level}`] || settings.targetGrade || levelMeta.defaultTargetGrade;

  const greeting = settings.studentName
    ? `Welcome back, ${settings.studentName}`
    : 'Welcome back';

  // Today's Mission — powered by the SRS-enhanced recommendation engine
  const missionRaw = getTodaysMission(topics, bosses);
  const mission = {
    ...missionRaw,
    category: getMasteryCategory(missionRaw.mastery),
  };

  // SRS review summary
  const reviewSummary = getReviewSummary(topics, bosses);

  // Recurring mistake patterns
  const recurringMistakes = getRecurringMistakes();

  // Exam countdown
  const upcomingExams = getUpcomingExams();
  const nearestExam = getNearestExamForSubject(upcomingExams, subjectId, level);
  const nearestCountdown = nearestExam ? getExamCountdown(nearestExam.date) : null;
  const examCoverage = nearestExam ? getExamCoverage(topics) : null;

  if (newUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-display">{greeting}</h1>
          <p className="text-text-muted text-sm">
            {getExamBoard(subjectId) !== 'generic' ? getExamBoard(subjectId).toUpperCase() + ' · ' : ''}
            {levelMeta.shortLabel} · Target: {level === 'gcse' ? `Grade ${targetGrade}` : targetGrade}
          </p>
        </div>

        {/* Today's Mission — prominent for new users */}
        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-8 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <h2 className="font-display text-title">Today's Mission</h2>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{mission.emoji}</span>
                <h3 className="font-display text-lg">{mission.topicName}</h3>
                <span className={`text-xs font-mono text-${mission.category.colour}`}>
                  {mission.category.emoji} {mission.mastery.toFixed(2)}
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-3">{mission.reason}</p>
              <div className="flex gap-2">
                <Link
                  to={`/battle/${mission.topicId}`}
                  className="bg-accent hover:bg-accent-hover text-bg-primary font-ui text-button py-2 px-4 rounded-lg transition-colors no-underline shadow-button"
                >
                  Start Battle
                </Link>
                <Link
                  to="/topics"
                  className="bg-bg-tertiary hover:bg-border text-text-secondary py-2 px-4 rounded-lg text-sm transition-colors no-underline"
                >
                  Choose another
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Link to="/topics" className="text-button bg-bg-tertiary text-text-secondary px-4 py-2.5 rounded-lg no-underline inline-block mt-2">Browse All Topics</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display">{greeting}</h1>
        <p className="text-text-muted text-sm">
          {getExamBoard(subjectId) !== 'generic' ? getExamBoard(subjectId).toUpperCase() + ' · ' : ''}
          {levelMeta.shortLabel} · Target: {level === 'gcse' ? `Grade ${targetGrade}` : targetGrade}
        </p>
      </div>

      {/* Exam Countdown */}
      {nearestExam && nearestCountdown && (
        <Link to="/exams" className="block no-underline">
          <div className={`rounded-xl p-4 border flex items-center gap-4 transition-colors hover:bg-bg-secondary/80 ${
            nearestCountdown.urgent ? 'bg-weak/5 border-weak/30' : nearestCountdown.days <= 28 ? 'bg-developing/5 border-developing/30' : 'bg-accent/5 border-accent/30'
          }`}>
            <div className={`text-stat ${
              nearestCountdown.urgent ? 'text-weak' : nearestCountdown.days <= 28 ? 'text-developing' : 'text-accent'
            }`}>
              {nearestCountdown.days}d
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{nearestExam.title}</p>
              <p className="text-xs text-text-muted">
                {examCoverage.notCovered > 0
                  ? `${examCoverage.notCovered} topic${examCoverage.notCovered !== 1 ? 's' : ''} not yet covered`
                  : examCoverage.partial > 0
                    ? `${examCoverage.partial} topic${examCoverage.partial !== 1 ? 's' : ''} need more work`
                    : 'All topics covered'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-stat text-accent">{examCoverage.percentage}%</div>
              <div className="text-[10px] text-text-muted">ready</div>
            </div>
          </div>
        </Link>
      )}

      {/* Today's Mission */}
      <div className="bg-bg-secondary border border-accent/30 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🎯</span>
          <h2 className="font-display text-title">Today's Mission</h2>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{mission.emoji}</span>
              <h3 className="font-display text-lg">{mission.topicName}</h3>
              <span className={`text-xs font-mono text-${mission.category.colour}`}>
                {mission.category.emoji} {mission.mastery.toFixed(2)}
              </span>
            </div>
            <p className="text-text-secondary text-sm mb-3">{mission.reason}</p>
            <div className="flex gap-2">
              <Link
                to={`/battle/${mission.topicId}`}
                className="bg-accent hover:bg-accent-hover text-bg-primary font-ui text-button py-2 px-4 rounded-lg transition-colors no-underline shadow-button"
              >
                Start Battle
              </Link>
              <Link
                to="/topics"
                className="bg-bg-tertiary hover:bg-border text-text-secondary py-2 px-4 rounded-lg text-sm transition-colors no-underline"
              >
                Choose another
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SRS Review Summary — collapsible */}
      {reviewSummary.total > 0 && (
        <details open={reviewSummary?.overdue > 0}>
          <summary className="text-label cursor-pointer select-none py-2">Review Schedule</summary>
          <div className={`border rounded-xl p-4 flex items-start gap-3 shadow-card ${
            reviewSummary.overdue > 0
              ? 'bg-weak/5 border-weak/30'
              : reviewSummary.dueToday > 0
                ? 'bg-developing/5 border-developing/30'
                : 'bg-accent/5 border-accent/30'
          }`}>
            <span className="text-lg">
              {reviewSummary.overdue > 0 ? '🔴' : reviewSummary.dueToday > 0 ? '🟡' : '📅'}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {reviewSummary.overdue > 0 && (
                  <span className="text-weak">{reviewSummary.overdue} overdue</span>
                )}
                {reviewSummary.overdue > 0 && reviewSummary.dueToday > 0 && <span className="text-text-muted"> · </span>}
                {reviewSummary.dueToday > 0 && (
                  <span className="text-developing">{reviewSummary.dueToday} due today</span>
                )}
                {(reviewSummary.overdue > 0 || reviewSummary.dueToday > 0) && reviewSummary.dueSoon > 0 && <span className="text-text-muted"> · </span>}
                {reviewSummary.dueSoon > 0 && (
                  <span className="text-accent">{reviewSummary.dueSoon} due soon</span>
                )}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {reviewSummary.overdue > 0
                  ? 'Review overdue topics to prevent knowledge decay.'
                  : reviewSummary.dueToday > 0
                    ? 'Stay on schedule — complete your reviews today.'
                    : 'Upcoming reviews in the next 2 days.'}
              </p>
            </div>
          </div>
        </details>
      )}

      {/* Progress + Streak row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon="⚡"
          label="Level"
          value={levelInfo.level}
          sub={`${levelInfo.xpInLevel} / ${levelInfo.xpNeeded} XP`}
          bar={levelInfo.percentage}
        />
        <StatCard
          icon="🏆"
          label="Total XP"
          value={progress.totalXP.toLocaleString()}
          sub={`${progress.totalSessions} sessions`}
        />
        <StatCard
          icon="🔥"
          label="Streak"
          value={progress.streak > 0 ? `${progress.streak} day${progress.streak !== 1 ? 's' : ''}` : 'None'}
          sub={progress.lastSessionDate ? `Last: ${formatDate(progress.lastSessionDate + 'T12:00:00')}` : 'Start today!'}
        />
      </div>

      {/* Recurring Mistakes — collapsible */}
      {recurringMistakes.length > 0 && (
        <details open={false}>
          <summary className="text-label cursor-pointer select-none py-2">Recurring Mistakes</summary>
          <div className="bg-bg-secondary border border-developing/30 rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔄</span>
              <h2 className="font-display text-title">Recurring Mistakes</h2>
              {recurringMistakes.filter(m => m.severity === 'critical').length > 0 && (
                <span className="text-xs bg-weak/10 text-weak px-2 py-0.5 rounded-full ml-auto">
                  {recurringMistakes.filter(m => m.severity === 'critical').length} critical
                </span>
              )}
            </div>
            <div className="space-y-2">
              {recurringMistakes.slice(0, 5).map((mistake, i) => {
                const topicNames = mistake.topicIds
                  .map(id => topics.find(t => t.id === id)?.name || id)
                  .join(', ');
                const drillTopicId = mistake.topicIds[0];
                const drillSkills = mistake.topicBreakdown[drillTopicId]?.subskillIds?.join(',') || '';
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <span className={`text-xs font-mono mt-0.5 ${
                      mistake.severity === 'critical' ? 'text-weak' : 'text-developing'
                    }`}>
                      {mistake.severity === 'critical' ? '!!' : '!'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Missing: {mistake.keyword}
                      </p>
                      <p className="text-xs text-text-muted">
                        {mistake.occurrences}x in {topicNames}
                      </p>
                    </div>
                    <Link
                      to={`/drill/${drillTopicId}${drillSkills ? `?skills=${drillSkills}` : ''}`}
                      className="text-xs text-accent hover:underline no-underline shrink-0"
                    >
                      Drill →
                    </Link>
                  </div>
                );
              })}
            </div>
            {recurringMistakes.length > 3 && (
              <Link to="/mistakes" className="text-xs text-accent hover:text-accent-hover no-underline font-medium mt-3 inline-block">
                View All →
              </Link>
            )}
          </div>
        </details>
      )}

      {/* Weak Spot Radar — collapsible */}
      <details open={false}>
        <summary className="text-label cursor-pointer select-none py-2">Weak Spot Radar</summary>
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
          <h2 className="font-display text-title mb-3">Weak Spot Radar</h2>
          <TopicRadar
            onTopicClick={(topicId) => navigate(`/battle/${topicId}`)}
          />
          <p className="text-xs text-text-muted mt-2 text-center">
            Click a topic below to start a battle.
          </p>
        </div>
      </details>

      {/* Recent Sessions — collapsible */}
      <details open={false}>
        <summary className="text-label cursor-pointer select-none py-2">Recent Sessions</summary>
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
          <h2 className="font-display text-title mb-3">Recent Sessions</h2>
          {recentSessions.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl block mb-2">📝</span>
              <p className="text-text-secondary text-sm">
                No sessions yet. Complete your first battle to see your history.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session, i) => {
                const topic = topics.find(t => t.id === session.topicId);
                const boss = bosses.find(b => b.topicId === session.topicId);
                const phases = session.phases;
                const phaseDetail = phases
                  ? `${phases.recall?.correct ?? 0}/${phases.recall?.total ?? 5} recall · ${phases.application?.correct ?? 0}/${phases.application?.total ?? 3} app · ${phases.extended?.score ?? 0}/${phases.extended?.maxScore ?? 6} ext`
                  : 'No details';
                return (
                  <div
                    key={session.id || i}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <span className="text-lg">{boss?.emoji || '📘'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {topic?.name || session.topicId}
                        </span>
                        {session.bossDefeated && (
                          <span className="text-xs text-strong">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted">{phaseDetail}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-accent font-mono">+{session.xpEarned || 0} XP</div>
                      <div className="text-xs text-text-muted">{formatDate(session.startedAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </details>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link
          to="/topics"
          className="bg-bg-secondary border border-border hover:border-accent rounded-lg px-4 py-2.5 text-sm no-underline text-text-primary transition-colors"
        >
          📚 Browse Topics
        </Link>
        <Link
          to="/exam"
          className="bg-bg-secondary border border-border hover:border-accent rounded-lg px-4 py-2.5 text-sm no-underline text-text-primary transition-colors"
        >
          🎓 Exam Simulator
        </Link>
        <Link
          to={`/study-guide/${mission.topicId}`}
          className="bg-bg-secondary border border-border hover:border-accent rounded-lg px-4 py-2.5 text-sm no-underline text-text-primary transition-colors"
        >
          📖 Study Guide
        </Link>
        <Link
          to="/history"
          className="bg-bg-secondary border border-border hover:border-accent rounded-lg px-4 py-2.5 text-sm no-underline text-text-primary transition-colors"
        >
          📊 Full History
        </Link>
      </div>
    </div>
  );
}

// --- Helpers ---

function StatCard({ icon, label, value, sub, bar }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-subtle">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="font-ui text-label">{label}</span>
      </div>
      <div className="font-display text-stat">{value}</div>
      {bar !== undefined && (
        <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-2">
          <div
            className="bg-accent h-1.5 rounded-full transition-all"
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
      <p className="text-xs text-text-muted mt-1">{sub}</p>
    </div>
  );
}
