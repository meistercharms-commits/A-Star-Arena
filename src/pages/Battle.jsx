import { useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { generateQuestion, markAnswer } from '../lib/claudeClient';
import { getSettings, saveSession, saveAttempt, updateProgress, getTopicMastery, updateTopicSRS, getCurrentSubject, getSRSData } from '../lib/storage';
import { generateId } from '../lib/utils';
import { updateTopicMastery } from '../lib/mastery';
import { calculateNextReview, getSessionScorePercentage } from '../lib/srs';
import BossHUD from '../components/BossHUD';
import QuestionCard from '../components/QuestionCard';
import AnswerInput from '../components/AnswerInput';
import FeedbackPanel from '../components/FeedbackPanel';
import BattleSummary from '../components/BattleSummary';
import Timer from '../components/Timer';

const PHASE_CONFIG = {
  recall: { label: 'Rapid Recall', questionCount: 5, timerSeconds: 120, damage: 15, xp: 20 },
  application: { label: 'Application', questionCount: 3, timerSeconds: 180, damage: 20, xp: 40 },
  extended: { label: 'Exam Brain', questionCount: 1, timerSeconds: 360, damage: 0, xp: 60 },
};

const PHASE_ORDER = ['recall', 'application', 'extended'];

export default function Battle() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { topics, bosses } = useSubject();
  const topic = topics.find(t => t.id === topicId);
  const boss = bosses.find(b => b.topicId === topicId);
  const settings = getSettings();

  // Battle state
  const [stage, setStage] = useState('idle'); // idle | fighting | feedback | complete
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [hp, setHp] = useState(boss?.hp || 100);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [completedSession, setCompletedSession] = useState(null);
  const [masteryBefore, setMasteryBefore] = useState(null);
  const [masteryAfter, setMasteryAfter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiSource, setApiSource] = useState(null); // 'claude' | 'mock'
  const [srsResult, setSrsResult] = useState(null);

  // Track results across entire battle
  const resultsRef = useRef({ recall: [], application: [], extended: [] });
  const attemptsRef = useRef([]);
  const sessionIdRef = useRef(generateId());
  const startTimeRef = useRef(null);

  const currentPhase = PHASE_ORDER[phaseIndex];
  const phaseConfig = PHASE_CONFIG[currentPhase];

  // Count total questions across all phases
  const totalQuestionsInPhase = phaseConfig?.questionCount || 0;

  async function startBattle() {
    setMasteryBefore(getTopicMastery(topicId));
    startTimeRef.current = Date.now();
    setPhaseIndex(0);
    setQuestionNum(0);
    setHp(boss?.hp || 100);
    resultsRef.current = { recall: [], application: [], extended: [] };
    attemptsRef.current = [];
    sessionIdRef.current = generateId();
    await loadQuestion('recall', 0);
  }

  async function loadQuestion(phase, qNum) {
    setLoading(true);
    try {
      const result = await generateQuestion({
        topicId,
        phase,
        difficulty: 3,
        examBoard: settings?.examBoard || 'generic',
        topics,
      });

      if (result.success) {
        setCurrentQuestion(result.data);
        setCurrentResult(null);
        setStage('fighting');
        setTimerRunning(true);
        setTimerKey(prev => prev + 1);
        setQuestionNum(qNum + 1);
        setApiSource(result.source || null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(answer) {
    if (!currentQuestion) return;
    setTimerRunning(false);
    setLoading(true);

    try {
      const markResult = await markAnswer({
        questionId: currentQuestion.questionId,
        questionPrompt: currentQuestion.prompt,
        studentAnswer: answer,
        phase: currentPhase,
        difficulty: currentQuestion.difficulty,
        rubric: currentQuestion.marking,
        examBoard: settings?.examBoard || 'generic',
        topicId,
      });

      if (markResult.success) {
        const result = markResult.data;

        // Calculate HP damage
        let damage = 0;
        if (result.correct) {
          if (currentPhase === 'recall') damage = PHASE_CONFIG.recall.damage;
          else if (currentPhase === 'application') damage = PHASE_CONFIG.application.damage;
          else if (currentPhase === 'extended') {
            damage = result.score >= 5 ? 30 : result.score * 5;
          }
        }

        setHp(prev => Math.max(0, prev - damage));
        setCurrentResult(result);
        setStage('feedback');
        setApiSource(markResult.source || null);

        // Track results
        resultsRef.current[currentPhase].push(result);
        attemptsRef.current.push({
          id: generateId(),
          sessionId: sessionIdRef.current,
          topicId,
          subskillIds: currentQuestion.subskillIds,
          phase: currentPhase,
          questionId: currentQuestion.questionId,
          prompt: currentQuestion.prompt,
          studentAnswer: answer,
          score: result.score,
          maxScore: result.maxScore,
          correct: result.correct,
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    setTimerRunning(false);

    const skipResult = {
      score: 0,
      maxScore: currentQuestion?.marking?.maxScore || 1,
      correct: false,
      feedback: {
        whatYouDidWell: [],
        missingPoints: ['Question was skipped'],
        howToImprove: ['Try to attempt every question, even with a partial answer.'],
        modelAnswer: currentQuestion?.marking?.rubricPoints
          ? currentQuestion.marking.rubricPoints.join('. ') + '.'
          : `Key points: ${(currentQuestion?.marking?.keywords || []).join(', ')}.`,
      },
    };

    setCurrentResult(skipResult);
    setStage('feedback');
    resultsRef.current[currentPhase].push(skipResult);
  }

  const handleTimerExpire = useCallback(() => {
    handleSkip();
  }, [currentQuestion, currentPhase]);

  async function handleNext() {
    const nextQNum = questionNum;
    const totalInPhase = PHASE_CONFIG[currentPhase].questionCount;

    if (nextQNum < totalInPhase) {
      // More questions in this phase
      await loadQuestion(currentPhase, nextQNum);
    } else if (phaseIndex < PHASE_ORDER.length - 1) {
      // Move to next phase
      const nextPhaseIndex = phaseIndex + 1;
      const nextPhase = PHASE_ORDER[nextPhaseIndex];
      setPhaseIndex(nextPhaseIndex);
      setQuestionNum(0);
      await loadQuestion(nextPhase, 0);
    } else {
      // Battle complete
      completeBattle();
    }
  }

  function completeBattle() {
    setStage('complete');
    setTimerRunning(false);

    // Calculate XP
    const recallCorrect = resultsRef.current.recall.filter(r => r.correct).length;
    const appCorrect = resultsRef.current.application.filter(r => r.correct).length;
    const extendedResult = resultsRef.current.extended[0];
    const extendedScore = extendedResult?.score || 0;
    const extendedMax = extendedResult?.maxScore || 6;

    const recallXP = recallCorrect * PHASE_CONFIG.recall.xp;
    const appXP = appCorrect * PHASE_CONFIG.application.xp;
    const extXP = Math.round((extendedScore / extendedMax) * PHASE_CONFIG.extended.xp);
    const totalXP = recallXP + appXP + extXP;

    // Save session
    const session = {
      id: sessionIdRef.current,
      topicId,
      type: 'battle',
      startedAt: new Date(startTimeRef.current).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      phases: {
        recall: {
          correct: recallCorrect,
          total: PHASE_CONFIG.recall.questionCount,
          percentage: Math.round((recallCorrect / PHASE_CONFIG.recall.questionCount) * 100),
        },
        application: {
          correct: appCorrect,
          total: PHASE_CONFIG.application.questionCount,
          percentage: Math.round((appCorrect / PHASE_CONFIG.application.questionCount) * 100),
        },
        extended: {
          score: extendedScore,
          maxScore: extendedMax,
          percentage: Math.round((extendedScore / extendedMax) * 100),
        },
      },
      bossDefeated: hp <= 0,
      xpEarned: totalXP,
    };

    saveSession(session);
    attemptsRef.current.forEach(a => saveAttempt(a));
    updateProgress(totalXP);

    // Update mastery after saving attempts
    const newMastery = updateTopicMastery(topicId, topics);
    setMasteryAfter(newMastery.topicMastery);

    // Update SRS scheduling
    const scorePercentage = getSessionScorePercentage(session);
    const srsData = getSRSData();
    const currentStage = srsData[topicId]?.srsStage || 1;
    const topicDifficulty = topic?.difficultyRating || 3;
    const subjectId = getCurrentSubject();

    const srs = calculateNextReview(scorePercentage, currentStage, subjectId, topicDifficulty);
    updateTopicSRS(topicId, { ...srs, scorePercentage });
    setSrsResult(srs);

    setCompletedSession(session);
  }

  // ─── Not Found ───
  if (!topic) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Topic Not Found</h1>
        <p className="text-text-secondary">No topic with ID "{topicId}".</p>
        <Link to="/topics" className="text-accent no-underline">Back to Topics</Link>
      </div>
    );
  }

  // ─── Pre-Battle Screen ───
  if (stage === 'idle') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Link to="/topics" className="text-text-secondary hover:text-text-primary no-underline text-sm">&larr; Back to Topics</Link>

        <div className="bg-bg-secondary border border-border rounded-xl p-6 text-center space-y-4">
          <span className="text-5xl block">{boss?.emoji || '⚔️'}</span>
          <h1 className="text-2xl font-bold">{boss?.bossName || 'Unknown Boss'}</h1>
          <p className="text-text-muted italic text-sm">{boss?.flavourText}</p>
          <p className="text-text-secondary text-sm">Topic: {topic.name}</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Battle Phases</h3>
          {PHASE_ORDER.map((phase, i) => {
            const cfg = PHASE_CONFIG[phase];
            return (
              <div key={phase} className="flex items-center justify-between bg-bg-tertiary rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-sm">Phase {i + 1}: {cfg.label}</p>
                  <p className="text-xs text-text-muted">
                    {cfg.questionCount} question{cfg.questionCount > 1 ? 's' : ''} &middot; {Math.floor(cfg.timerSeconds / 60)} min each
                  </p>
                </div>
                <span className="text-xs text-text-muted font-mono">
                  {phase === 'extended' ? 'Up to 30 dmg' : `-${cfg.damage} HP each`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide mb-2">Subskills Tested</h3>
          <div className="flex flex-wrap gap-2">
            {topic.subskills.map(s => (
              <span
                key={s.id}
                className={`text-xs px-2 py-1 rounded ${
                  s.critical
                    ? 'bg-weak/10 text-weak border border-weak/30'
                    : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                {s.name} {s.critical && '★'}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={startBattle}
          className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-bold py-3 rounded-xl text-lg transition-colors cursor-pointer"
        >
          Start Battle
        </button>
      </div>
    );
  }

  // ─── Battle Complete Screen ───
  if (stage === 'complete' && completedSession) {
    return (
      <BattleSummary
        session={completedSession}
        boss={boss}
        topic={topic}
        masteryBefore={masteryBefore}
        masteryAfter={masteryAfter}
        srsResult={srsResult}
        onBattleAgain={() => { setStage('idle'); setHp(boss?.hp || 100); setCompletedSession(null); setSrsResult(null); }}
      />
    );
  }

  // ─── Active Battle (fighting / feedback) ───
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Boss HUD */}
      <BossHUD
        boss={boss}
        hp={hp}
        maxHp={boss?.hp || 100}
        currentPhase={currentPhase}
        questionNum={questionNum}
        totalQuestions={totalQuestionsInPhase}
      />

      {/* Timer */}
      <div className="flex justify-end">
        <Timer
          key={timerKey}
          seconds={phaseConfig.timerSeconds}
          onExpire={handleTimerExpire}
          running={timerRunning}
        />
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        phase={currentPhase}
        questionNum={questionNum}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-6 text-center space-y-3">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          <p className="text-text-secondary text-sm">
            {stage === 'fighting' ? 'Marking your answer...' : 'Generating question...'}
          </p>
          {apiSource === 'claude' && (
            <p className="text-xs text-accent">Powered by Claude AI</p>
          )}
        </div>
      )}

      {/* Answer Input or Feedback */}
      {!loading && stage === 'fighting' ? (
        <AnswerInput
          phase={currentPhase}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onHint={() => {}}
          disabled={loading}
          hint={currentQuestion?.hint}
        />
      ) : !loading && stage === 'feedback' ? (
        <FeedbackPanel
          result={currentResult}
          phase={currentPhase}
          onNext={handleNext}
        />
      ) : null}
    </div>
  );
}
