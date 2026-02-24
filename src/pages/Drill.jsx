import { useState, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import topics from '../content/topics.json';
import bosses from '../content/bosses.json';
import { generateQuestion, markAnswer } from '../lib/claudeClient';
import { getSettings, saveAttempt, updateProgress } from '../lib/storage';
import { updateTopicMastery } from '../lib/mastery';
import { getTargetedDrillConfig } from '../lib/recommend';
import { generateId } from '../lib/utils';
import QuestionCard from '../components/QuestionCard';
import AnswerInput from '../components/AnswerInput';
import FeedbackPanel from '../components/FeedbackPanel';

export default function Drill() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = topics.find(t => t.id === topicId);
  const boss = bosses.find(b => b.topicId === topicId);
  const settings = getSettings();

  const skillsParam = searchParams.get('skills');
  const focusSkillIds = skillsParam ? skillsParam.split(',') : [];

  const drillConfig = getTargetedDrillConfig(topicId, focusSkillIds);

  const [stage, setStage] = useState('intro'); // intro | drilling | feedback | complete
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const attemptsRef = useRef([]);

  if (!topic || !drillConfig) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Topic Not Found</h1>
        <Link to="/topics" className="text-accent no-underline">Back to Topics</Link>
      </div>
    );
  }

  const totalQuestions = drillConfig.drillLength;

  async function startDrill() {
    setQuestionIndex(0);
    setResults([]);
    attemptsRef.current = [];
    await loadQuestion(0);
  }

  async function loadQuestion(idx) {
    setLoading(true);
    try {
      const phase = drillConfig.phases[idx] || 'recall';
      const result = await generateQuestion({
        topicId,
        phase,
        difficulty: drillConfig.difficulty,
        examBoard: settings?.examBoard || 'generic',
      });

      if (result.success) {
        setCurrentQuestion(result.data);
        setCurrentResult(null);
        setStage('drilling');
        setQuestionIndex(idx);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(answer) {
    if (!currentQuestion) return;
    setLoading(true);

    try {
      const phase = drillConfig.phases[questionIndex] || 'recall';
      const markResult = await markAnswer({
        questionId: currentQuestion.questionId,
        questionPrompt: currentQuestion.prompt,
        studentAnswer: answer,
        phase,
        difficulty: currentQuestion.difficulty,
        rubric: currentQuestion.marking,
        examBoard: settings?.examBoard || 'generic',
        topicId,
      });

      if (markResult.success) {
        const result = markResult.data;
        setCurrentResult(result);
        setStage('feedback');
        setResults(prev => [...prev, result]);

        attemptsRef.current.push({
          id: generateId(),
          topicId,
          subskillIds: currentQuestion.subskillIds,
          phase,
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
    setResults(prev => [...prev, skipResult]);
  }

  async function handleNext() {
    const nextIdx = questionIndex + 1;
    if (nextIdx < totalQuestions) {
      await loadQuestion(nextIdx);
    } else {
      completeDrill();
    }
  }

  function completeDrill() {
    setStage('complete');

    // Save attempts and update mastery
    attemptsRef.current.forEach(a => saveAttempt(a));

    const correctCount = results.filter(r => r.correct).length;
    const xpEarned = correctCount * 15; // Drill XP: 15 per correct
    updateProgress(xpEarned);
    updateTopicMastery(topicId);
  }

  // ─── Intro Screen ───
  if (stage === 'intro') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Link to={`/battle/${topicId}`} className="text-text-secondary hover:text-text-primary no-underline text-sm">&larr; Back to Battle</Link>

        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-6 text-center space-y-3">
          <span className="text-4xl block">{boss?.emoji || '📘'}</span>
          <h1 className="text-xl font-bold">Targeted Drill</h1>
          <p className="text-text-secondary text-sm">{topic.name}</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {drillConfig.focusSubskills.map(s => (
              <span key={s.id} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                {s.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            {totalQuestions} quick questions targeting your weak spots. ~{drillConfig.phases.filter(p => p === 'recall').length} recall + {drillConfig.phases.filter(p => p === 'application').length} application.
          </p>
        </div>

        <button
          onClick={startDrill}
          className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-bold py-3 rounded-xl text-lg transition-colors cursor-pointer"
        >
          Start Drill
        </button>
      </div>
    );
  }

  // ─── Complete Screen ───
  if (stage === 'complete') {
    const correctCount = results.filter(r => r.correct).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalMax = results.reduce((sum, r) => sum + r.maxScore, 0);
    const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const xpEarned = correctCount * 15;

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className={`rounded-xl p-6 text-center border ${
          pct >= 70 ? 'bg-strong/5 border-strong/30' : 'bg-developing/5 border-developing/30'
        }`}>
          <span className="text-4xl block mb-2">{pct >= 70 ? '🎯' : '📝'}</span>
          <h1 className="text-2xl font-bold mb-1">Drill Complete!</h1>
          <p className="text-text-secondary text-sm">
            {correctCount}/{totalQuestions} correct ({pct}%)
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-2">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide mb-3">Results</h3>
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${r.correct ? 'text-strong' : 'text-weak'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <span className="text-sm">Q{i + 1} ({drillConfig.phases[i]})</span>
              </div>
              <span className="text-sm font-mono text-text-muted">{r.score}/{r.maxScore}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
            <span>XP Earned</span>
            <span className="text-accent font-mono">+{xpEarned} XP</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setStage('intro'); setResults([]); }}
            className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Drill Again
          </button>
          <Link
            to={`/battle/${topicId}`}
            className="flex-1 bg-bg-tertiary hover:bg-border text-text-primary font-semibold py-2.5 rounded-lg transition-colors text-center no-underline"
          >
            Full Battle
          </Link>
          <Link
            to="/"
            className="flex-1 bg-bg-tertiary hover:bg-border text-text-primary font-semibold py-2.5 rounded-lg transition-colors text-center no-underline"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  // ─── Active Drill (drilling | feedback) ───
  const phase = drillConfig.phases[questionIndex] || 'recall';

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-muted font-mono">{questionIndex + 1}/{totalQuestions}</span>
        <div className="flex-1 bg-bg-tertiary rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${((questionIndex + (stage === 'feedback' ? 1 : 0)) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs text-accent font-medium uppercase">{phase}</span>
      </div>

      <QuestionCard
        question={currentQuestion}
        phase={phase}
        questionNum={questionIndex + 1}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-6 text-center space-y-3">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          <p className="text-text-secondary text-sm">
            {stage === 'drilling' ? 'Marking your answer...' : 'Generating question...'}
          </p>
        </div>
      )}

      {!loading && stage === 'drilling' ? (
        <AnswerInput
          phase={phase}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onHint={() => {}}
          disabled={loading}
          hint={currentQuestion?.hint}
        />
      ) : !loading && stage === 'feedback' ? (
        <FeedbackPanel
          result={currentResult}
          phase={phase}
          onNext={handleNext}
        />
      ) : null}
    </div>
  );
}
