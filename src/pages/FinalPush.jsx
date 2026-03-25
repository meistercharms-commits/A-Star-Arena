import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { getExams } from '../lib/storage';
import { getAllTopicMasteries } from '../lib/mastery';
import { formatDate } from '../lib/utils';

export default function FinalPush() {
  const { topics, bosses, subjectId } = useSubject();
  const { level } = useLevel();
  const navigate = useNavigate();

  // Find the nearest upcoming exam for this subject
  const exams = getExams();
  const now = new Date();
  const nearestExam = useMemo(() => {
    return exams
      .filter(e => new Date(e.date) > now && e.subjectId === subjectId)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [exams, subjectId]);

  const daysRemaining = nearestExam
    ? Math.max(0, Math.ceil((new Date(nearestExam.date) - now) / 86400000))
    : null;

  // Get mastery for all topics
  const masteries = getAllTopicMasteries(topics);
  const readyTopics = masteries.filter(t => t.mastery >= 0.7);
  const notReadyTopics = masteries.filter(t => t.mastery < 0.7).sort((a, b) => a.mastery - b.mastery);

  // Today's focus: top 4 weakest topics
  const todaysFocus = notReadyTopics.slice(0, 4);

  if (!nearestExam || daysRemaining > 14) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-display">The Final Push</h1>
          <p className="text-text-secondary text-sm mt-1">
            This mode activates when you have an exam within 14 days.
          </p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center shadow-card">
          <p className="text-text-muted mb-4">
            {nearestExam
              ? `Your next exam is in ${daysRemaining} days. The Final Push activates at 14 days.`
              : 'No upcoming exams found. Add one in the Exam Planner.'}
          </p>
          <Link to="/exams" className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg no-underline inline-block">
            {nearestExam ? 'View Exams' : 'Add an Exam'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-display">The Final Push</h1>
        <p className="text-sm mt-1" style={{ color: daysRemaining <= 3 ? 'var(--color-weak)' : daysRemaining <= 7 ? 'var(--color-developing)' : 'var(--color-accent)' }}>
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} until {nearestExam.title || 'your exam'}
        </p>
      </div>

      {/* Readiness overview */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-label">Topic Readiness</h2>
          <span className="font-display text-lg font-medium text-accent">
            {readyTopics.length}/{masteries.length} ready
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-3 rounded-full overflow-hidden bg-border">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${masteries.length > 0 ? (readyTopics.length / masteries.length) * 100 : 0}%`,
              background: 'var(--color-strong)',
            }}
          />
        </div>
      </div>

      {/* Today's focus */}
      {todaysFocus.length > 0 && (
        <div>
          <h2 className="text-label mb-3">Today's Focus</h2>
          <div className="grid gap-2">
            {todaysFocus.map(t => {
              const topic = topics.find(tp => tp.id === t.topicId);
              const boss = bosses.find(b => b.topicId === t.topicId);
              return (
                <div
                  key={t.topicId}
                  className="bg-bg-secondary border border-border rounded-xl p-4 flex items-center justify-between shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{boss?.emoji || '\u{1F4D8}'}</span>
                    <div>
                      <div className="font-display text-base font-medium">{t.name}</div>
                      <div className="text-xs text-text-muted">
                        {Math.round(t.mastery * 100)}% mastery
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/battle/${t.topicId}`)}
                    className="text-button bg-accent text-bg-primary px-3 py-2 rounded-lg cursor-pointer border-0 text-xs"
                  >
                    Quick Battle
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All topics checklist */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
        <h2 className="text-label mb-3">All Topics</h2>
        <div className="space-y-1.5">
          {masteries.sort((a, b) => a.mastery - b.mastery).map(t => {
            const isReady = t.mastery >= 0.7;
            return (
              <div key={t.topicId} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: isReady ? 'var(--color-strong)' : 'var(--color-weak)' }}>
                    {isReady ? '\u2713' : '\u2717'}
                  </span>
                  <span className={isReady ? 'text-text-secondary' : 'text-text-primary'}>{t.name}</span>
                </div>
                <span className="font-display text-xs font-medium" style={{ color: isReady ? 'var(--color-strong)' : 'var(--color-weak)' }}>
                  {Math.round(t.mastery * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
