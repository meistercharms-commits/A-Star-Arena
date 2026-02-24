import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { generateQuestion as claudeGenerateQuestion, markAnswer as claudeMarkAnswer } from '../lib/claudeClient';
import { getSettings, saveSession, saveAttempt, updateProgress, getMasteryCache } from '../lib/storage';
import { updateTopicMastery } from '../lib/mastery';
import { getRankedTopics } from '../lib/recommend';
import { generateId, getMasteryCategory, formatDuration } from '../lib/utils';
import { useSubject } from '../contexts/SubjectContext';
import QuestionCard from '../components/QuestionCard';
import FeedbackPanel from '../components/FeedbackPanel';

// ─── Exam Config ───
const EXAM_DURATION = 15 * 60; // 15 minutes in seconds
const QUESTION_PLAN = [
  { phase: 'recall', count: 2 },
  { phase: 'application', count: 3 },
  { phase: 'extended', count: 1 },
];
const TOTAL_QUESTIONS = QUESTION_PLAN.reduce((sum, p) => sum + p.count, 0);

// ─── Helper: select topics for exam ───
function selectExamTopics(topics, bosses) {
  const ranked = getRankedTopics(topics, bosses);
  // Pick the 3-4 weakest/most-urgent topics
  const weakTopics = ranked.slice(0, 4).map(r => r.topicId);
  // If fewer than 4 practised, fill with random untested
  if (weakTopics.length < 3) {
    const all = topics.map(t => t.id);
    for (const id of all) {
      if (!weakTopics.includes(id)) weakTopics.push(id);
      if (weakTopics.length >= 4) break;
    }
  }
  return weakTopics;
}

// ─── Helper: generate all exam questions up front (async) ───
async function generateExamQuestions(examTopics, examBoard, topics) {
  const questions = [];
  let topicIdx = 0;

  for (const { phase, count } of QUESTION_PLAN) {
    for (let i = 0; i < count; i++) {
      const topicId = examTopics[topicIdx % examTopics.length];
      topicIdx++;
      const result = await claudeGenerateQuestion({
        topicId,
        phase,
        difficulty: phase === 'extended' ? 4 : 3,
        examBoard,
        topics,
      });
      if (result.success) {
        questions.push({ ...result.data, examPhase: phase });
      }
    }
  }
  return questions;
}

// ─── Grade Estimate ───
function estimateGrade(percentage) {
  if (percentage >= 90) return { grade: 'A*', colour: 'text-strong' };
  if (percentage >= 80) return { grade: 'A', colour: 'text-strong' };
  if (percentage >= 70) return { grade: 'B', colour: 'text-developing' };
  if (percentage >= 60) return { grade: 'C', colour: 'text-developing' };
  if (percentage >= 50) return { grade: 'D', colour: 'text-weak' };
  return { grade: 'U', colour: 'text-weak' };
}

export default function Exam() {
  const navigate = useNavigate();
  const { topics, bosses } = useSubject();
  const settings = getSettings() || {};

  const [stage, setStage] = useState('setup'); // setup | loading | exam | marking | review | results
  const [examTopics, setExamTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { idx: answer_text }
  const [markResults, setMarkResults] = useState({}); // { idx: result }
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);

  const sessionIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  // Initialise exam topics on mount
  useEffect(() => {
    setExamTopics(selectExamTopics(topics, bosses));
  }, [topics, bosses]);

  // Timer
  useEffect(() => {
    if (!timerRunning) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // Auto-submit when timer hits 0
  const submitExam = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setTimerRunning(false);
    setStage('marking'); // show marking screen while waiting

    // Mark all answers (sequentially to avoid rate limits)
    const results = {};
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const answer = answers[idx] || '';
      const markResult = await claudeMarkAnswer({
        questionId: q.questionId,
        questionPrompt: q.prompt,
        studentAnswer: answer,
        phase: q.examPhase,
        difficulty: q.difficulty,
        rubric: q.marking,
        examBoard: settings.examBoard || 'generic',
        topicId: q.topicId,
      });
      if (markResult.success) {
        results[idx] = markResult.data;
      }
    }
    setMarkResults(results);

    // Save attempts
    questions.forEach((q, idx) => {
      const r = results[idx];
      if (r) {
        saveAttempt({
          id: generateId(),
          topicId: q.topicId,
          subskillIds: q.subskillIds,
          phase: q.examPhase,
          questionId: q.questionId,
          prompt: q.prompt,
          studentAnswer: answers[idx] || '',
          score: r.score,
          maxScore: r.maxScore,
          correct: r.correct,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Calculate totals
    const totalScore = Object.values(results).reduce((s, r) => s + r.score, 0);
    const totalMax = Object.values(results).reduce((s, r) => s + r.maxScore, 0);
    const correctCount = Object.values(results).filter(r => r.correct).length;
    const xpEarned = correctCount * 25; // Exam XP: 25 per correct
    const elapsed = Math.max(1, EXAM_DURATION - timeLeft);

    // Build phase summaries
    const recallQs = questions.map((q, i) => ({ q, r: results[i] })).filter(x => x.q.examPhase === 'recall');
    const appQs = questions.map((q, i) => ({ q, r: results[i] })).filter(x => x.q.examPhase === 'application');
    const extQs = questions.map((q, i) => ({ q, r: results[i] })).filter(x => x.q.examPhase === 'extended');

    // Save session
    const session = {
      id: sessionIdRef.current,
      type: 'exam',
      topicId: 'mixed',
      topicIds: [...new Set(questions.map(q => q.topicId))],
      startedAt: startTimeRef.current,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsed,
      totalScore,
      totalMaxScore: totalMax,
      correctCount,
      totalQuestions: questions.length,
      xpEarned,
      bossDefeated: totalScore >= totalMax * 0.7,
      phases: {
        recall: {
          correct: recallQs.filter(x => x.r?.correct).length,
          total: recallQs.length,
        },
        application: {
          correct: appQs.filter(x => x.r?.correct).length,
          total: appQs.length,
        },
        extended: {
          score: extQs.reduce((s, x) => s + (x.r?.score || 0), 0),
          maxScore: extQs.reduce((s, x) => s + (x.r?.maxScore || 0), 0),
        },
      },
    };
    saveSession(session);
    updateProgress(xpEarned);

    // Update mastery for each tested topic
    const testedTopics = [...new Set(questions.map(q => q.topicId))];
    testedTopics.forEach(tid => updateTopicMastery(tid, topics));

    setStage('results');
  }, [questions, answers, timeLeft, topics]);

  // Auto-submit on time expiry
  useEffect(() => {
    if (timeLeft === 0 && timerRunning) {
      submitExam();
    }
  }, [timeLeft, timerRunning, submitExam]);

  // ─── Start Exam ───
  async function startExam() {
    setStage('loading'); // show loading screen while generating questions
    try {
      const qs = await generateExamQuestions(examTopics, settings.examBoard || 'generic', topics);
      setQuestions(qs);
      setCurrentIdx(0);
      setAnswers({});
      setMarkResults({});
      setTimeLeft(EXAM_DURATION);
      hasSubmittedRef.current = false;
      sessionIdRef.current = generateId();
      startTimeRef.current = new Date().toISOString();
      setTimerRunning(true);
      setStage('exam');
    } catch (err) {
      console.error('Failed to generate exam questions:', err);
      setStage('setup');
    }
  }

  // ─── Loading Screen (generating questions) ───
  if (stage === 'loading') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-10 text-center space-y-4">
          <div className="animate-spin inline-block w-10 h-10 border-3 border-accent border-t-transparent rounded-full" />
          <h2 className="text-xl font-bold">Preparing Your Exam</h2>
          <p className="text-text-secondary text-sm">Generating {TOTAL_QUESTIONS} questions from Claude AI...</p>
          <p className="text-xs text-text-muted">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // ─── Marking Screen (marking answers) ───
  if (stage === 'marking') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-10 text-center space-y-4">
          <div className="animate-spin inline-block w-10 h-10 border-3 border-accent border-t-transparent rounded-full" />
          <h2 className="text-xl font-bold">Marking Your Exam</h2>
          <p className="text-text-secondary text-sm">Claude is marking {TOTAL_QUESTIONS} answers...</p>
          <p className="text-xs text-text-muted">This may take a moment</p>
        </div>
      </div>
    );
  }

  // ─── Setup Screen ───
  if (stage === 'setup') {
    const topicDetails = examTopics.map(id => {
      const t = topics.find(x => x.id === id);
      const b = bosses.find(x => x.topicId === id);
      const cache = getMasteryCache();
      const mastery = cache[id]?.topicMastery ?? 0;
      return { id, name: t?.name || id, emoji: b?.emoji || '📘', mastery };
    });

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Exam Brain Simulator</h1>
          <p className="text-text-muted text-sm">
            15-minute timed mini-exam mixing your weakest topics
          </p>
        </div>

        <div className="bg-bg-secondary border border-accent/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <h2 className="font-semibold">Exam Overview</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-bg-tertiary rounded-lg p-3">
              <div className="text-xl font-bold font-mono">{TOTAL_QUESTIONS}</div>
              <div className="text-xs text-text-muted">Questions</div>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-3">
              <div className="text-xl font-bold font-mono">15:00</div>
              <div className="text-xs text-text-muted">Time Limit</div>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-3">
              <div className="text-xl font-bold font-mono">Mixed</div>
              <div className="text-xs text-text-muted">Topics</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Question Breakdown</h3>
            <div className="flex gap-2 text-xs">
              <span className="bg-accent/10 text-accent px-2 py-1 rounded">2× Recall</span>
              <span className="bg-accent/10 text-accent px-2 py-1 rounded">3× Application</span>
              <span className="bg-accent/10 text-accent px-2 py-1 rounded">1× Extended</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Topics Selected</h3>
          <p className="text-xs text-text-muted">Based on your weakest areas:</p>
          <div className="space-y-2">
            {topicDetails.map(t => {
              const cat = getMasteryCategory(t.mastery);
              return (
                <div key={t.id} className="flex items-center gap-3 py-1.5">
                  <span>{t.emoji}</span>
                  <span className="text-sm flex-1">{t.name}</span>
                  <span className={`text-xs font-mono text-${cat.colour}`}>
                    {cat.emoji} {Math.round(t.mastery * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">Exam Conditions</h3>
          <ul className="text-xs text-text-muted space-y-1">
            <li>• Global 15-minute timer — manage your time wisely</li>
            <li>• Navigate between questions freely</li>
            <li>• Auto-submit when time runs out</li>
            <li>• Unanswered questions score 0</li>
            <li>• Full feedback after submission</li>
          </ul>
        </div>

        <button
          onClick={startExam}
          className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-bold py-3 rounded-xl text-lg transition-colors cursor-pointer"
        >
          Start Exam
        </button>
      </div>
    );
  }

  // ─── Active Exam ───
  if (stage === 'exam') {
    const q = questions[currentIdx];
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const isLow = timeLeft <= 120;
    const isCritical = timeLeft <= 30;

    const answeredCount = Object.keys(answers).filter(k => answers[k] !== '').length;

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Exam Header */}
        <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎓</span>
            <span className="text-sm font-semibold">Exam</span>
          </div>
          <div className={`font-mono text-lg font-bold tabular-nums ${
            isCritical ? 'text-weak animate-pulse' : isLow ? 'text-developing' : 'text-accent'
          }`}>
            {mins}:{secs.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-text-muted">
            {answeredCount}/{TOTAL_QUESTIONS} answered
          </div>
        </div>

        {/* Question Navigator */}
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, idx) => {
            const isActive = idx === currentIdx;
            const isAnswered = answers[idx] !== undefined && answers[idx] !== '';
            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-accent text-bg-primary border-accent font-bold'
                    : isAnswered
                      ? 'bg-strong/20 text-strong border-strong/30'
                      : 'bg-bg-tertiary text-text-muted border-border hover:border-accent/50'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Topic Tag */}
        {q && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>{bosses.find(b => b.topicId === q.topicId)?.emoji || '📘'}</span>
            <span>{topics.find(t => t.id === q.topicId)?.name || q.topicId}</span>
            <span className="text-accent uppercase font-medium">{q.examPhase}</span>
          </div>
        )}

        {/* Question */}
        {q && (
          <QuestionCard
            question={q}
            phase={q.examPhase}
            questionNum={currentIdx + 1}
          />
        )}

        {/* Answer Input */}
        {q && (
          <ExamAnswerInput
            key={currentIdx}
            phase={q.examPhase}
            initialValue={answers[currentIdx] || ''}
            onSave={(val) => setAnswers(prev => ({ ...prev, [currentIdx]: val }))}
          />
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="flex-1 bg-bg-tertiary hover:bg-border text-text-secondary py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="flex-1 bg-bg-tertiary hover:bg-border text-text-secondary py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={submitExam}
              className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Submit Exam
            </button>
          )}
        </div>

        {/* Early Submit */}
        {currentIdx < questions.length - 1 && (
          <button
            onClick={submitExam}
            className="w-full text-xs text-text-muted hover:text-weak py-2 transition-colors cursor-pointer bg-transparent border-0"
          >
            Submit early →
          </button>
        )}
      </div>
    );
  }

  // ─── Review (after marking, navigable feedback) ───
  if (stage === 'review') {
    const q = questions[reviewIdx];
    const r = markResults[reviewIdx];
    const topic = topics.find(t => t.id === q?.topicId);
    const boss = bosses.find(b => b.topicId === q?.topicId);

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Review: Q{reviewIdx + 1}/{questions.length}</h2>
          <button
            onClick={() => setStage('results')}
            className="text-xs text-accent hover:underline cursor-pointer bg-transparent border-0"
          >
            Back to Results
          </button>
        </div>

        {/* Question Navigator */}
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, idx) => {
            const isActive = idx === reviewIdx;
            const res = markResults[idx];
            return (
              <button
                key={idx}
                onClick={() => setReviewIdx(idx)}
                className={`w-8 h-8 rounded text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-accent text-bg-primary border-accent font-bold'
                    : res?.correct
                      ? 'bg-strong/20 text-strong border-strong/30'
                      : 'bg-weak/20 text-weak border-weak/30'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{boss?.emoji || '📘'}</span>
          <span>{topic?.name || q?.topicId}</span>
          <span className="text-accent uppercase font-medium">{q?.examPhase}</span>
          <span className={`ml-auto font-mono ${r?.correct ? 'text-strong' : 'text-weak'}`}>
            {r?.score}/{r?.maxScore}
          </span>
        </div>

        <QuestionCard question={q} phase={q?.examPhase} questionNum={reviewIdx + 1} />

        {/* Student Answer */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <h4 className="text-xs text-text-muted uppercase tracking-wide mb-2">Your Answer</h4>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {answers[reviewIdx] || <span className="text-text-muted italic">No answer submitted</span>}
          </p>
        </div>

        {r && <FeedbackPanel result={r} phase={q?.examPhase} onNext={() => {
          if (reviewIdx < questions.length - 1) setReviewIdx(reviewIdx + 1);
          else setStage('results');
        }} />}

        <div className="flex gap-3">
          <button
            onClick={() => setReviewIdx(Math.max(0, reviewIdx - 1))}
            disabled={reviewIdx === 0}
            className="flex-1 bg-bg-tertiary hover:bg-border text-text-secondary py-2 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => {
              if (reviewIdx < questions.length - 1) setReviewIdx(reviewIdx + 1);
              else setStage('results');
            }}
            className="flex-1 bg-bg-tertiary hover:bg-border text-text-secondary py-2 rounded-lg cursor-pointer transition-colors"
          >
            {reviewIdx < questions.length - 1 ? 'Next →' : 'Back to Results'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Results Screen ───
  if (stage === 'results') {
    const totalScore = Object.values(markResults).reduce((s, r) => s + r.score, 0);
    const totalMax = Object.values(markResults).reduce((s, r) => s + r.maxScore, 0);
    const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const grade = estimateGrade(pct);
    const correctCount = Object.values(markResults).filter(r => r.correct).length;
    const elapsed = EXAM_DURATION - timeLeft;
    const xpEarned = correctCount * 25;

    // Breakdown by phase
    const phaseBreakdown = {};
    for (const { phase } of QUESTION_PLAN) {
      if (!phaseBreakdown[phase]) {
        phaseBreakdown[phase] = { score: 0, max: 0, correct: 0, total: 0 };
      }
    }
    questions.forEach((q, idx) => {
      const r = markResults[idx];
      if (r && phaseBreakdown[q.examPhase]) {
        phaseBreakdown[q.examPhase].score += r.score;
        phaseBreakdown[q.examPhase].max += r.maxScore;
        phaseBreakdown[q.examPhase].total += 1;
        if (r.correct) phaseBreakdown[q.examPhase].correct += 1;
      }
    });

    // Breakdown by topic
    const topicBreakdown = {};
    questions.forEach((q, idx) => {
      const r = markResults[idx];
      if (!r) return;
      if (!topicBreakdown[q.topicId]) {
        topicBreakdown[q.topicId] = { score: 0, max: 0, correct: 0, total: 0 };
      }
      topicBreakdown[q.topicId].score += r.score;
      topicBreakdown[q.topicId].max += r.maxScore;
      topicBreakdown[q.topicId].total += 1;
      if (r.correct) topicBreakdown[q.topicId].correct += 1;
    });

    // Weak areas
    const weakAreas = Object.entries(topicBreakdown)
      .filter(([, v]) => v.max > 0 && v.score / v.max < 0.7)
      .map(([tid, v]) => ({
        topicId: tid,
        name: topics.find(t => t.id === tid)?.name || tid,
        emoji: bosses.find(b => b.topicId === tid)?.emoji || '📘',
        pct: Math.round((v.score / v.max) * 100),
      }));

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        {/* Grade Banner */}
        <div className={`rounded-xl p-6 text-center border ${
          pct >= 70 ? 'bg-strong/5 border-strong/30' : pct >= 50 ? 'bg-developing/5 border-developing/30' : 'bg-weak/5 border-weak/30'
        }`}>
          <span className="text-5xl block mb-2">🎓</span>
          <h1 className="text-2xl font-bold mb-1">Exam Complete</h1>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div>
              <div className="text-3xl font-bold font-mono">{pct}%</div>
              <div className="text-xs text-text-muted">Score</div>
            </div>
            <div className="text-3xl text-text-muted">·</div>
            <div>
              <div className={`text-3xl font-bold font-mono ${grade.colour}`}>{grade.grade}</div>
              <div className="text-xs text-text-muted">Grade Est.</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox label="Score" value={`${totalScore}/${totalMax}`} />
          <StatBox label="Correct" value={`${correctCount}/${questions.length}`} />
          <StatBox label="Time" value={formatDuration(elapsed)} />
          <StatBox label="XP" value={`+${xpEarned}`} accent />
        </div>

        {/* Phase Breakdown */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Skill Breakdown</h3>
          {Object.entries(phaseBreakdown).map(([phase, data]) => {
            const p = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
            const label = phase === 'recall' ? 'Recall' : phase === 'application' ? 'Application' : 'Extended';
            return (
              <div key={phase}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{label}</span>
                  <span className={`font-mono ${p >= 70 ? 'text-strong' : p >= 50 ? 'text-developing' : 'text-weak'}`}>
                    {data.score}/{data.max} ({p}%)
                  </span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      p >= 70 ? 'bg-strong' : p >= 50 ? 'bg-developing' : 'bg-weak'
                    }`}
                    style={{ width: `${Math.max(2, p)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Topic Breakdown */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Topic Breakdown</h3>
          {Object.entries(topicBreakdown).map(([tid, data]) => {
            const t = topics.find(x => x.id === tid);
            const b = bosses.find(x => x.topicId === tid);
            const p = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
            return (
              <div key={tid} className="flex items-center gap-3">
                <span>{b?.emoji || '📘'}</span>
                <span className="text-sm flex-1 truncate">{t?.name || tid}</span>
                <span className={`text-sm font-mono ${p >= 70 ? 'text-strong' : p >= 50 ? 'text-developing' : 'text-weak'}`}>
                  {p}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <div className="bg-bg-secondary border border-weak/30 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-weak uppercase tracking-wide">Areas to Improve</h3>
            <div className="flex flex-wrap gap-2">
              {weakAreas.map(w => (
                <Link
                  key={w.topicId}
                  to={`/battle/${w.topicId}`}
                  className="text-xs bg-weak/10 text-weak hover:bg-weak/20 px-3 py-1.5 rounded-lg no-underline transition-colors"
                >
                  {w.emoji} {w.name} ({w.pct}%)
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Per-question results */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Question Results</h3>
            <button
              onClick={() => { setReviewIdx(0); setStage('review'); }}
              className="text-xs text-accent hover:underline cursor-pointer bg-transparent border-0"
            >
              Review All →
            </button>
          </div>
          {questions.map((q, idx) => {
            const r = markResults[idx];
            const t = topics.find(x => x.id === q.topicId);
            return (
              <button
                key={idx}
                onClick={() => { setReviewIdx(idx); setStage('review'); }}
                className="w-full flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer bg-transparent text-left hover:bg-bg-tertiary/50 rounded transition-colors px-1"
                style={{ border: 'none', borderBottom: '1px solid var(--color-border)' }}
              >
                <span className={`text-sm font-mono w-6 ${r?.correct ? 'text-strong' : 'text-weak'}`}>
                  {r?.correct ? '✓' : '✗'}
                </span>
                <span className="text-xs text-text-muted w-16 uppercase">{q.examPhase}</span>
                <span className="text-sm flex-1 truncate text-text-primary">{t?.name || q.topicId}</span>
                <span className="text-xs font-mono text-text-muted">{r?.score}/{r?.maxScore}</span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStage('setup');
              setQuestions([]);
              setAnswers({});
              setMarkResults({});
              setTimeLeft(EXAM_DURATION);
              hasSubmittedRef.current = false;
              setExamTopics(selectExamTopics(topics, bosses));
            }}
            className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            New Exam
          </button>
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

  return null;
}

// ─── Sub-components ───

function ExamAnswerInput({ phase, initialValue, onSave }) {
  const [value, setValue] = useState(initialValue);
  const isExtended = phase === 'extended' || phase === 'application';
  const savedRef = useRef(initialValue);

  // Save on blur or when navigating away
  useEffect(() => {
    return () => {
      if (value !== savedRef.current) {
        onSave(value);
      }
    };
  }, [value, onSave]);

  function handleChange(newVal) {
    setValue(newVal);
    savedRef.current = newVal;
    onSave(newVal);
  }

  if (isExtended) {
    return (
      <div>
        <textarea
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="Type your answer..."
          className="w-full bg-bg-secondary border border-border rounded-xl p-4 text-text-primary placeholder-text-muted text-sm resize-y min-h-[120px] focus:border-accent focus:outline-none transition-colors"
          rows={5}
        />
        <div className="text-xs text-text-muted mt-1 text-right">
          {value.split(/\s+/).filter(Boolean).length} words
        </div>
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={e => handleChange(e.target.value)}
      placeholder="Type your answer..."
      className="w-full bg-bg-secondary border border-border rounded-xl p-4 text-text-primary placeholder-text-muted text-sm focus:border-accent focus:outline-none transition-colors"
    />
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 text-center">
      <div className={`text-lg font-bold font-mono ${accent ? 'text-accent' : ''}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}
