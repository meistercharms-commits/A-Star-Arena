import { Link } from 'react-router-dom';
import { getPostBattleRecommendation } from '../lib/recommend';
import { formatNextReview, getSRSStageLabel } from '../lib/srs';
import { useSubject } from '../contexts/SubjectContext';
import BattleReportCard from './BattleReportCard';

const PHASE_CONFIG = {
  recall: { label: 'Rapid Recall', xpPer: 20 },
  application: { label: 'Application', xpPer: 40 },
  extended: { label: 'Exam Brain', xpTotal: 60 },
};

export default function BattleSummary({ session, boss, topic, masteryBefore, masteryAfter, srsResult, battleMode = 'challenge', bossDialogue, confidencePrediction, onBattleAgain }) {
  const { topics, bosses } = useSubject();
  const phases = session.phases || {};
  const recallCorrect = phases.recall?.correct || 0;
  const appCorrect = phases.application?.correct || 0;
  const extScore = phases.extended?.score || 0;
  const extMax = phases.extended?.maxScore || 6;

  const recallXP = recallCorrect * PHASE_CONFIG.recall.xpPer;
  const appXP = appCorrect * PHASE_CONFIG.application.xpPer;
  const extXP = extMax > 0 ? Math.round((extScore / extMax) * PHASE_CONFIG.extended.xpTotal) : 0;
  const totalXP = session.xpEarned;
  const defeated = session.bossDefeated;
  const isStudyMode = battleMode === 'study';

  // Get recommendation from the real engine
  const rec = getPostBattleRecommendation({
    topicId: session.topicId,
    score: extScore,
    maxScore: extMax,
    errorTypes: [],
    subskillIds: [],
  }, topics, bosses);

  // Phase score bars
  const recallPct = phases.recall?.total ? Math.round((recallCorrect / phases.recall?.total || 5) * 100) : 0;
  const appPct = phases.application?.total ? Math.round((appCorrect / phases.application?.total || 3) * 100) : 0;
  const extPct = extMax > 0 ? Math.round((extScore / extMax) * 100) : 0;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Victory / Defeat / Session Complete Banner */}
      <div className={`rounded-xl p-6 text-center border shadow-card ${
        isStudyMode ? 'bg-accent/5 border-accent/30' :
        defeated ? 'bg-strong/5 border-strong/30 animate-starburst' : 'bg-weak/5 border-weak/30'
      }`}>
        <span className="text-5xl block mb-2">{isStudyMode ? '📖' : defeated ? '🏆' : '💀'}</span>
        <h1 className="font-display text-display mb-1">
          {isStudyMode ? 'Session Complete' : defeated ? 'Boss Defeated!' : 'Boss Survived'}
        </h1>
        <p className="text-text-secondary text-sm">
          {isStudyMode
            ? `Study session on ${topic?.name} complete.`
            : defeated
              ? `You defeated ${boss?.bossName}!`
              : `${boss?.bossName} survived with ${Math.max(0, 100 - (recallCorrect * 15 + appCorrect * 20 + (extScore >= 5 ? 30 : extScore * 5)))} HP remaining.`
          }
        </p>
        {bossDialogue && !isStudyMode && (
          <p className="font-display italic text-sm text-text-secondary mt-2">
            "{defeated ? bossDialogue.defeated : bossDialogue.survived}"
          </p>
        )}
      </div>

      {/* Phase Breakdown with bars */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 shadow-card">
        <h3 className="font-ui text-label">Phase Breakdown</h3>

        <PhaseBar
          label="Rapid Recall"
          score={`${recallCorrect}/${phases.recall?.total || 5}`}
          percentage={recallPct}
          colour={recallPct >= 80 ? 'strong' : recallPct >= 50 ? 'developing' : 'weak'}
        />
        <PhaseBar
          label="Application"
          score={`${appCorrect}/${phases.application?.total || 3}`}
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
      <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3 shadow-card">
        <h3 className="font-ui text-label">XP Earned</h3>
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
            <span>Total{isStudyMode ? ' (50% Study Mode)' : ''}</span>
            <span className="text-accent font-mono">+{totalXP} XP</span>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
        <h3 className="font-ui text-label mb-3">Session Stats</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-display text-stat">{formatDuration(session.durationSeconds)}</div>
            <div className="font-ui text-label">Duration</div>
          </div>
          <div>
            <div className="font-display text-stat">
              {recallCorrect + appCorrect + (extScore >= Math.ceil(extMax * 0.7) ? 1 : 0)}/9
            </div>
            <div className="font-ui text-label">Correct</div>
          </div>
          <div>
            <div className={`font-display text-stat ${
              isStudyMode ? 'text-accent' : defeated ? 'text-strong' : 'text-weak'
            }`}>
              {isStudyMode ? 'STUDY' : defeated ? 'WIN' : 'LOSS'}
            </div>
            <div className="font-ui text-label">Result</div>
          </div>
        </div>
      </div>

      {/* Confidence Check */}
      {confidencePrediction != null && (() => {
        // Calculate actual score as percentage
        // Use percentage-based scoring to normalise across phases
        const recallPctVal = (phases.recall?.total || 5) > 0 ? recallCorrect / (phases.recall?.total || 5) : 0;
        const appPctVal = (phases.application?.total || 3) > 0 ? appCorrect / (phases.application?.total || 3) : 0;
        const extPctVal = extMax > 0 ? extScore / extMax : 0;
        const actualPct = Math.round(((recallPctVal + appPctVal + extPctVal) / 3) * 100);
        const diff = actualPct - confidencePrediction;

        let message, messageColour;
        if (Math.abs(diff) <= 10) {
          message = "Spot on! Your self-awareness is excellent.";
          messageColour = 'var(--color-strong)';
        } else if (diff > 10) {
          message = "You did better than you thought! More confidence next time.";
          messageColour = 'var(--color-accent)';
        } else {
          message = "Tougher than expected. That's good to know for revision planning.";
          messageColour = 'var(--color-developing)';
        }

        return (
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
            <h3 className="text-label mb-3">Confidence Check</h3>
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="font-display text-stat text-text-muted">{confidencePrediction}%</div>
                <div className="text-label text-text-muted">Predicted</div>
              </div>
              <div className="text-xl text-text-muted">&rarr;</div>
              <div>
                <div className="font-display text-stat text-accent">{actualPct}%</div>
                <div className="text-label text-text-muted">Actual</div>
              </div>
            </div>
            <p className="text-sm text-center mt-3" style={{ color: messageColour }}>{message}</p>
          </div>
        );
      })()}

      {/* Mastery Change */}
      {masteryAfter != null && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-ui text-label mb-3">Mastery Change</h3>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">Before</div>
              <div className="font-display text-stat">{Math.round((masteryBefore || 0) * 100)}%</div>
            </div>
            <div className="text-2xl text-text-muted px-3">→</div>
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">After</div>
              <div className="font-display text-stat">{Math.round(masteryAfter * 100)}%</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">Change</div>
              {(() => {
                const delta = masteryAfter - (masteryBefore || 0);
                const deltaStr = delta >= 0 ? `+${Math.round(delta * 100)}` : `${Math.round(delta * 100)}`;
                const colour = delta > 0 ? 'text-strong' : delta < 0 ? 'text-weak' : 'text-text-muted';
                return <div className={`font-display text-stat ${colour}`}>{deltaStr}%</div>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SRS Next Review */}
      {srsResult && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-ui text-label mb-3">Spaced Review</h3>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">Next Review</div>
              <div className="text-lg font-bold font-mono text-accent">
                {formatNextReview(srsResult.nextReviewDate)}
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">SRS Stage</div>
              <div className="text-lg font-bold font-mono">
                {getSRSStageLabel(srsResult.newStage)}
              </div>
              <p className="text-xs text-text-muted mt-1">
                {srsResult.newStage === 1 && 'Just getting started — review again tomorrow'}
                {srsResult.newStage === 2 && 'Building short-term memory — review in a few days'}
                {srsResult.newStage === 3 && 'Moving to medium-term memory — review next week'}
                {srsResult.newStage >= 4 && 'Locked in long-term memory — just maintain it'}
              </p>
              {srsResult.nextReviewDate && (
                <p className="text-xs text-accent mt-1">
                  Next review: {formatNextReview(srsResult.nextReviewDate)}
                </p>
              )}
            </div>
            <div className="text-center flex-1">
              <div className="text-sm text-text-muted mb-1">Outcome</div>
              <div className={`text-lg font-bold font-mono ${
                srsResult.outcome === 'advanced' ? 'text-strong' :
                srsResult.outcome === 'maintained' ? 'text-strong' :
                srsResult.outcome === 'stayed' ? 'text-developing' :
                'text-weak'
              }`}>
                {srsResult.outcome === 'advanced' ? '↑ Advanced' :
                 srsResult.outcome === 'maintained' ? '✓ Maintained' :
                 srsResult.outcome === 'stayed' ? '— Stayed' :
                 '↓ Dropped'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Study Guide — show when score is low */}
      {(extPct < 70 || appPct < 50) && (
        <div className="bg-bg-secondary border border-developing/30 rounded-xl p-4 flex items-center justify-between shadow-card">
          <div>
            <p className="text-sm font-medium">Need help with {topic?.name}?</p>
            <p className="text-xs text-text-muted">Get a personalised study guide based on your weak spots.</p>
          </div>
          <Link
            to={`/study-guide/${session.topicId}`}
            className="text-xs bg-developing/10 text-developing hover:bg-developing/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium shrink-0"
          >
            📖 Study Guide
          </Link>
        </div>
      )}

      {/* Recommendation */}
      {rec && (
        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-5 shadow-card">
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
          className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-ui text-button py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          Battle Again
        </button>
        <Link
          to="/topics"
          className="flex-1 bg-bg-tertiary hover:bg-border text-text-primary font-semibold py-2.5 rounded-lg transition-colors text-center no-underline"
        >
          Back to Topics
        </Link>
        <BattleReportCard
          results={{
            recallScore: recallCorrect,
            recallMax: phases.recall?.total || 5,
            appScore: appCorrect,
            appMax: phases.application?.total || 3,
            extScore,
            extMax,
            xpEarned: totalXP,
            masteryAfter: masteryAfter || 0,
            duration: formatDuration(session.durationSeconds),
          }}
          bossName={boss?.bossName}
          bossEmoji={boss?.emoji}
          topicName={topic?.name}
          isVictory={defeated}
        />
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
