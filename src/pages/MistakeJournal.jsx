import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { getMistakesByTopic, getRecurringMistakes, dismissPattern } from '../lib/errorPatterns';

export default function MistakeJournal() {
  const { topics } = useSubject();
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDismiss, setPendingDismiss] = useState(null);
  const timerRef = useRef(null);

  const allMistakes = getRecurringMistakes();
  const byTopic = getMistakesByTopic();

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleDismiss = (keyword) => {
    // Cancel any existing pending dismiss
    if (timerRef.current) clearTimeout(timerRef.current);

    setPendingDismiss(keyword);

    timerRef.current = setTimeout(() => {
      dismissPattern(keyword);
      setPendingDismiss(null);
      timerRef.current = null;
      setRefreshKey(k => k + 1);
    }, 5000);
  };

  const handleUndo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setPendingDismiss(null);
  };

  // Find worst topic
  const worstTopic = byTopic[0];
  const worstTopicName = worstTopic
    ? topics.find(t => t.id === worstTopic.topicId)?.name || worstTopic.topicId
    : null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto" key={refreshKey}>
      <div>
        <h1 className="text-2xl font-bold">Mistake Journal</h1>
        <p className="text-text-secondary text-sm mt-1">Recurring errors across your sessions — tackle these to level up.</p>
      </div>

      {/* Summary stats */}
      {allMistakes.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-secondary border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold font-mono text-weak">{allMistakes.length}</div>
              <div className="text-xs text-text-muted">Patterns</div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold font-mono text-developing">
                {allMistakes.filter(m => m.severity === 'critical').length}
              </div>
              <div className="text-xs text-text-muted">Critical</div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-xl p-4 text-center">
              <div className="text-lg font-bold font-mono text-accent truncate">{worstTopicName || '—'}</div>
              <div className="text-xs text-text-muted">Worst Topic</div>
            </div>
          </div>

          {/* Mistakes by topic */}
          {byTopic.map(group => {
            const topicName = topics.find(t => t.id === group.topicId)?.name || group.topicId;
            return (
              <div key={group.topicId} className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{topicName}</h3>
                  <span className="text-xs text-text-muted font-mono">{group.mistakes.length} pattern{group.mistakes.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {group.mistakes.map(m => (
                    <div key={m.keyword} className={`flex items-center justify-between gap-3 bg-bg-tertiary rounded-lg px-3 py-2 transition-opacity ${pendingDismiss === m.keyword ? 'opacity-30' : ''}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold shrink-0 ${
                          m.severity === 'critical' ? 'text-weak' : 'text-developing'
                        }`}>
                          {m.severity === 'critical' ? '!!' : '!'}
                        </span>
                        <span className="text-sm truncate">{m.keyword}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-text-muted font-mono">{m.occurrences}x</span>
                        <Link
                          to={`/drill/${group.topicId}`}
                          className="text-xs text-accent hover:text-accent-hover no-underline font-medium"
                        >
                          Practice
                        </Link>
                        <button
                          onClick={() => handleDismiss(m.keyword)}
                          className="text-xs text-text-muted hover:text-text-secondary cursor-pointer"
                          title="Dismiss pattern"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
          <span className="text-4xl block mb-3">🎯</span>
          <p className="text-text-secondary text-sm">No recurring mistakes yet — keep battling to build your journal.</p>
          <Link to="/topics" className="text-accent hover:text-accent-hover no-underline text-sm font-medium mt-2 inline-block">
            Go to Topics
          </Link>
        </div>
      )}

      <Link
        to="/"
        className="block text-center text-sm text-text-secondary hover:text-text-primary no-underline"
      >
        Back to Dashboard
      </Link>

      {/* Undo toast */}
      {pendingDismiss && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border rounded-lg px-4 py-2.5 shadow-lg flex items-center gap-3 z-50">
          <span className="text-sm text-text-secondary">Pattern dismissed.</span>
          <button
            onClick={handleUndo}
            className="text-sm text-accent hover:text-accent-hover font-medium cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
