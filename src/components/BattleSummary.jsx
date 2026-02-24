import { Link } from 'react-router-dom';
import { getPostBattleRecommendation } from '../lib/recommend';

const PHASE_CONFIG = {
  recall: { label: 'Rapid Recall', xpPer: 20 },
  application: { label: 'Application', xpPer: 40 },
  extended: { label: 'Exam Brain', xpTotal: 60 },
};

export default function BattleSummary({ session, boss, topic, masteryBefore, masteryAfter, onBattleAgain }) {
  const phases = session.phases;
  const recallCorrect = phases.recall.correct;
  const appCorrect = phases.application.correct;
  const extScore = phases.extended.score;
  const extMax = phases.extended.maxScore;

  const recallXP = recallCorrect * PHASE_CONFIG.recall.xpPer;
  const appXP = appCorrect * PHASE_CONFIG.application.xpPer;
  const extXP = Math.round((extScore / extMax) * PHASE_CONFIG.extended.xpTotal);
  const totalXP = session.xpEarned;
  const defeated = session.bossDefeated;

  // Get recommendation from the real engine
  const rec = getPostBattleRecommendation({
    topicId: session.topicId,
    score: extScore,
    maxScore: extMax,
    errorTypes: [],
    subskillIds: [],
  });

  // Phase score bars
  const recallPct = Math.round((recallCorrect / phases.recall.total) * 100);
  const appPct = Math.round((appCorrect / phases.application.total) * 100);
  const extPct = Math.round((extScore / extMax) * 100);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Victory / Defeat Banner */}
      <div className={`rounded-xl p-6 text-center border ${
        defeated ? 'bg-strong/5 border-strong/30' : 'bg-weak/5 border-weak/30'
      }`}>
        <span className="text-5xl block mb-2">{defeated ? '🏆' : '💀'}</span>
        <h1 className="text-2xl font-bold mb-1">
          {defeated ? 'Boss Defeated!' : 'Boss Survived'}
        </h1>
        <p className="text-text-secondary text-sm">
          {defeated
            ? `You defeated ${boss?.bossName}!`
            : `${boss?.bossName} survived with ${100 - (session.phases.recall.correct * 15 + session.phases.application.correct * 20 + (extScore >= 5 ? 30 : extScore * 5))} HP remaining.`
          }
        </p>
      </div>

      {/* Phase Breakdown with bars */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Phase Breakdown</h3>

        <PhaseBar
          label="Rapid Recall"
          score={`${recallCorrect}/${phases.recall.total}`}
          percentage={recallPct}
          colour={recallPct >= 80 ? 'strong' : recallPct >= 50 ? 'developing' : 'weak'}
        />
        <PhaseBar
          label="Application"
          score={`${appCorrect}/${phases.application.total}`}
          percentage={appPct}
          colour={appPct >= 80 ? 'strong' : appPct >= 50 ? 'developing' : 'weak'}
        />
        <PhaseBar
          label="Exam Brain"
          score={`${extScore}/${extMax}`}
          percentage={extPct}
          colour={extPct >= 80 ? 'strong' : extPct >= 50 ? 'developing' : 'weak'}
        />
      </div>

      {/* XP Breakdown */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">XP Earned</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Recall ({recallCorrect} correct)</span>
            <span className="text-accent font-mono">+{recallXP} XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Application ({appCorrect} correct)</span>
            <span className="text-accent font-mono">+{appXP} XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Extended ({extScore}/{extMax})</span>
            <span className="text-accent font-mono">+{extXP} XP</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-accent font-mono">+{totalXP} XP</span>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide mb-3">Session Stats</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold font-mono">{formatDuration(session.durationSeconds)}</div>
            <div className="text-xs text-text-muted">Duration</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono">
              {recallCorrect + appCorrect + (extScore >= Math.ceil(extMax * 0.7) ? 1 : 0)}/9
            </div>
            <div className="text-xs text-text-muted">Correct</div>
          </div>
          <div>
            <div className={`text-lg font-bold font-mono ${defeated ? 'text-strong' : 'text-weak'}`}>
              {defeated ? 'WIN' : 'LOSS'}
            </div>
            <div className="text-xs text-text-muted">Result</div>
          </div>
        </div>
      </div>

      {/* Mastery Change */}
      {masteryAfter != null && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide mb-3">Mastery Change</h3>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">Before</div>
              <div className="text-xl font-bold font-mono">{Math.round((masteryBefore || 0) * 100)}%</div>
            </div>
            <div className="text-2xl text-text-muted px-3">→</div>
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">After</div>
              <div className="text-xl font-bold font-mono">{Math.round(masteryAfter * 100)}%</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">Change</div>
              {(() => {
                const delta = masteryAfter - (masteryBefore || 0);
                const deltaStr = delta >= 0 ? `+${Math.round(delta * 100)}` : `${Math.round(delta * 100)}`;
                const colour = delta > 0 ? 'text-strong' : delta < 0 ? 'text-weak' : 'text-text-muted';
                return <div className={`text-xl font-bold font-mono ${colour}`}>{deltaStr}%</div>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {rec && (
        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-accent uppercase tracking-wide mb-2">Recommended Next</h3>
          <p className="text-sm text-text-secondary mb-3">{rec.reason}</p>
          <div className="flex gap-2 flex-wrap">
            {rec.nextAction === 'targeted_drill' && (
              <Link
                to={`/drill/${rec.topic.id}${rec.focusSubskills?.length ? `?skills=${rec.focusSubskills.join(',')}` : ''}`}
                className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium"
              >
                Start Drill: {rec.topic.name}
              </Link>
            )}
            {rec.nextAction === 'battle' && (
              <Link
                to={`/battle/${rec.topic.id}`}
                className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium"
              >
                Battle: {rec.topic.name}
              </Link>
            )}
            {rec.nextAction === 'start_new_topic' && (
              <Link
                to={`/battle/${rec.topic.id}`}
                className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium"
              >
                Try: {rec.topic.name}
              </Link>
            )}
            {rec.nextAction === 'exam_simulator' && (
              <Link
                to="/exam"
                className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium"
              >
                Exam Simulator
              </Link>
            )}
            <Link
              to="/"
              className="text-xs bg-bg-tertiary text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg no-underline transition-colors"
            >
              View Radar
            </Link>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBattleAgain}
          className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          Battle Again
        </button>
        <Link
          to="/topics"
          className="flex-1 bg-bg-tertiary hover:bg-border text-text-primary font-semibold py-2.5 rounded-lg transition-colors text-center no-underline"
        >
          Back to Topics
        </Link>
      </div>
    </div>
  );
}

function PhaseBar({ label, score, percentage, colour }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className={`font-mono text-${colour}`}>{score}</span>
      </div>
      <div className="w-full bg-bg-tertiary rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 bg-${colour}`}
          style={{ width: `${Math.max(2, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
