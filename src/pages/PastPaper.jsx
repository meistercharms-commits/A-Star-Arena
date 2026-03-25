import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { getExamBoard, saveAttempt } from '../lib/storage';
import { auth, hasConfig } from '../lib/firebase';
import { FileText, RotateCcw, BookOpen, ChevronDown } from 'lucide-react';

// Import all past paper files dynamically
const paperModules = import.meta.glob('../content/pastPapers/*.json', { eager: true });
const PAPER_DATA = Object.values(paperModules).map(m => m.default);

const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── localStorage helpers (raw keys, no prefix collision) ───

const RESULTS_KEY = 'astarena:pastPaperResults';

function readPaperResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePaperResults(data) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[A* Arena] Failed to write past paper results:', err);
  }
}

function savePaperResult(paperId, result) {
  const all = readPaperResults();
  const existing = all[paperId] || [];
  existing.push({
    date: new Date().toISOString(),
    score: result.totalScore,
    maxMarks: result.totalMax,
    percentage: result.percentage,
    perQuestion: result.perQuestion,
  });
  all[paperId] = existing;
  writePaperResults(all);
}

function getPaperResults(paperId) {
  const all = readPaperResults();
  return all[paperId] || [];
}

// ─── Component ───

export default function PastPaper() {
  const { subjectId } = useSubject();
  const { level } = useLevel();
  const examBoard = getExamBoard(subjectId);

  const [selectedPaper, setSelectedPaper] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [marking, setMarking] = useState(false);
  const [stage, setStage] = useState('select'); // select | answering | marking | results
  const resultsSaved = useRef(false);

  // Filter papers for current subject/level/board
  const availablePapers = useMemo(() => {
    const board = getExamBoard(subjectId);
    return PAPER_DATA
      .filter(d => d.subject === subjectId && d.level === level)
      .filter(d => board === 'generic' || d.board === board)
      .flatMap(d => d.papers);
  }, [subjectId, level]);

  // Group papers by year for browsing
  const papersByYear = useMemo(() => {
    const grouped = {};
    for (const paper of availablePapers) {
      const year = paper.year || 'Other';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(paper);
    }
    // Sort years descending
    return Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a));
  }, [availablePapers]);

  async function getAuthHeaders() {
    if (!hasConfig || !auth?.currentUser) return {};
    try {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch { return {}; }
  }

  async function markAllAnswers() {
    setStage('marking');
    setMarking(true);
    resultsSaved.current = false;
    const paper = selectedPaper;
    const newResults = {};

    for (let i = 0; i < paper.questions.length; i++) {
      const q = paper.questions[i];
      const answer = answers[i];
      if (!answer?.trim()) {
        newResults[i] = {
          score: 0,
          maxMarks: q.marks,
          matchedPoints: [],
          missedPoints: [q.markScheme],
          feedback: {
            whatYouDidWell: [],
            missingPoints: ['No answer provided'],
            howToImprove: ['Attempt the question next time'],
            modelAnswer: '',
          },
        };
        continue;
      }

      try {
        const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
        const res = await fetch(`${API_BASE}/api/claude/markPastPaper`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            questionText: q.text,
            markScheme: q.markScheme,
            studentAnswer: answer,
            marks: q.marks,
            commandWord: q.commandWord,
            examBoard: examBoard,
            subjectId,
            level,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            newResults[i] = data.data;
            continue;
          }
        }
      } catch {}

      // Fallback: no marking available
      newResults[i] = {
        score: 0,
        maxMarks: q.marks,
        feedback: {
          whatYouDidWell: [],
          missingPoints: ['Could not mark this answer'],
          howToImprove: [],
        },
      };
    }

    setResults(newResults);
    setMarking(false);
    setStage('results');
  }

  // Save results and feed mastery system when results are ready
  useEffect(() => {
    if (stage !== 'results' || !selectedPaper || resultsSaved.current) return;
    if (Object.keys(results).length === 0) return;

    resultsSaved.current = true;
    const paper = selectedPaper;
    const questions = paper.questions || [];

    const totalScore = Object.values(results).reduce((sum, r) => sum + (r.score || 0), 0);
    const totalMax = questions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    const perQuestion = questions.map((q, i) => ({
      questionNumber: q.number,
      topicId: q.topicId,
      score: results[i]?.score || 0,
      maxMarks: q.marks,
    }));

    // Save to past paper results
    savePaperResult(paper.id, { totalScore, totalMax, percentage, perQuestion });

    // Feed into mastery system via saveAttempt
    questions.forEach((q, i) => {
      const r = results[i];
      if (r && q.topicId) {
        saveAttempt({
          topicId: q.topicId,
          phase: q.marks >= 4 ? 'extended' : q.marks >= 2 ? 'application' : 'recall',
          score: r.score || 0,
          maxScore: q.marks,
          timestamp: Date.now(),
          source: 'pastPaper',
          paperId: paper.id,
        });
      }
    });
  }, [stage, results, selectedPaper]);

  // ─── Helpers ───

  function scoreColour(pct) {
    if (pct >= 70) return 'var(--color-strong)';
    if (pct >= 50) return 'var(--color-developing)';
    return 'var(--color-weak)';
  }

  function scoreBorderClass(pct) {
    if (pct >= 70) return 'border-strong/40';
    if (pct >= 50) return 'border-developing/40';
    return 'border-weak/40';
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  // ─── SELECT stage ───

  if (stage === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-display">Past Papers</h1>
          <p className="text-text-secondary text-sm mt-1">
            Practice with real exam-style questions marked against official mark schemes.
          </p>
        </div>

        {availablePapers.length === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center shadow-card">
            <p className="text-text-muted">No past papers available for this subject yet.</p>
            <p className="text-xs text-text-muted mt-2">Past papers are being added. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {papersByYear.map(([year, papers]) => (
              <div key={year}>
                <h2 className="font-display text-title text-text-secondary mb-2">{year}</h2>
                <div className="grid gap-3">
                  {papers.map(paper => {
                    const pastResults = getPaperResults(paper.id);
                    const lastResult = pastResults.length > 0 ? pastResults[pastResults.length - 1] : null;

                    return (
                      <button
                        key={paper.id}
                        onClick={() => {
                          setSelectedPaper(paper);
                          setAnswers({});
                          setResults({});
                          setCurrentIdx(0);
                          resultsSaved.current = false;
                          setStage('answering');
                        }}
                        className={`bg-bg-secondary border rounded-xl p-5 text-left cursor-pointer hover:border-accent/50 transition-colors shadow-card w-full ${
                          lastResult ? scoreBorderClass(lastResult.percentage) : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-display text-title">{paper.title}</div>
                            <div className="text-xs text-text-muted mt-1">
                              {paper.questions.length} questions · {paper.totalMarks} marks · {paper.duration}
                            </div>
                          </div>
                          {lastResult && (
                            <div className="flex items-center gap-2">
                              <RotateCcw size={12} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Redo</span>
                            </div>
                          )}
                        </div>

                        {lastResult && (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="text-xs font-medium"
                              style={{ color: scoreColour(lastResult.percentage) }}
                            >
                              Last attempt: {lastResult.score}/{lastResult.maxMarks} ({lastResult.percentage}%)
                            </span>
                            <span className="text-xs text-text-muted">
                              · {formatDate(lastResult.date)}
                            </span>
                            {pastResults.length > 1 && (
                              <span className="text-xs text-text-muted">
                                · {pastResults.length} attempts
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const paper = selectedPaper;
  const questions = paper?.questions || [];
  const currentQ = questions[currentIdx];

  // ─── ANSWERING stage ───

  if (stage === 'answering') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-display">{paper.title}</h1>
          <span className="text-xs text-text-muted">
            {Object.keys(answers).filter(k => answers[k]?.trim()).length}/{questions.length} answered
          </span>
        </div>

        {/* Question navigator */}
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((q, i) => {
            const isAnswered = answers[i]?.trim().length > 0;
            const isCurrent = i === currentIdx;
            return (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-9 h-9 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                  isCurrent
                    ? 'bg-accent text-bg-primary border-accent'
                    : isAnswered
                      ? 'bg-strong/15 text-strong border-strong/30'
                      : 'bg-bg-tertiary text-text-muted border-border'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Current question */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-label">Q{currentQ.number}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">{currentQ.commandWord}</span>
            <span className="text-xs text-text-muted">[{currentQ.marks} {currentQ.marks === 1 ? 'mark' : 'marks'}]</span>
          </div>
          <p className="text-text-primary leading-relaxed">{currentQ.text}</p>
          <textarea
            value={answers[currentIdx] || ''}
            onChange={e => setAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
            placeholder="Type your answer..."
            className="input-field w-full resize-none"
            style={{ minHeight: currentQ.marks >= 4 ? '160px' : currentQ.marks >= 2 ? '100px' : '60px' }}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="text-button px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary border-0 cursor-pointer disabled:opacity-40"
          >
            &larr; Previous
          </button>
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="text-button px-4 py-2 rounded-lg bg-accent text-bg-primary border-0 cursor-pointer"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              onClick={markAllAnswers}
              className="text-button px-6 py-2.5 rounded-lg bg-accent text-bg-primary border-0 cursor-pointer"
            >
              Submit for Marking
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── MARKING stage ───

  if (stage === 'marking') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-3 flex justify-center"><FileText size={28} className="text-text-muted" /></div>
          <p className="text-text-secondary">Marking your answers against the mark scheme...</p>
          <p className="text-xs text-text-muted mt-1">This may take a moment.</p>
        </div>
      </div>
    );
  }

  // ─── RESULTS stage ───

  const totalScore = Object.values(results).reduce((sum, r) => sum + (r.score || 0), 0);
  const totalMax = questions.reduce((sum, q) => sum + q.marks, 0);
  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  // Identify weak topics (where marks were lost)
  const weakTopics = useMemo(() => {
    const topicScores = {};
    questions.forEach((q, i) => {
      const r = results[i] || {};
      const tid = q.topicId;
      if (!tid) return;
      if (!topicScores[tid]) {
        topicScores[tid] = { topicId: tid, earned: 0, max: 0, name: tid.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
      }
      topicScores[tid].earned += r.score || 0;
      topicScores[tid].max += q.marks;
    });

    return Object.values(topicScores)
      .map(t => ({ ...t, percentage: t.max > 0 ? Math.round((t.earned / t.max) * 100) : 0, lost: t.max - t.earned }))
      .filter(t => t.lost > 0)
      .sort((a, b) => b.lost - a.lost);
  }, [questions, results]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display">{paper.title}</h1>
        <p className="text-text-secondary text-sm mt-1">Results</p>
      </div>

      {/* Score summary */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-card text-center">
        <div
          className="font-display text-[48px] font-semibold"
          style={{ color: scoreColour(pct) }}
        >
          {totalScore}/{totalMax}
        </div>
        <div className="text-label text-text-muted mt-1">{pct}%</div>
      </div>

      {/* Weak areas identified */}
      {weakTopics.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card space-y-3">
          <h2 className="font-display text-title">Weak areas identified</h2>
          <p className="text-xs text-text-muted">
            Topics where you lost marks. Use the study guides to revise before retrying.
          </p>
          <div className="space-y-2">
            {weakTopics.map(t => (
              <div key={t.topicId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: scoreColour(t.percentage) }}
                  />
                  <span className="text-sm text-text-primary">{t.name}</span>
                  <span className="text-xs text-text-muted">
                    {t.earned}/{t.max} ({t.percentage}%)
                  </span>
                </div>
                <Link
                  to={'/study-guide/' + t.topicId}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <BookOpen size={12} />
                  Study Guide
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const r = results[i] || {};
          const qPct = q.marks > 0 ? (r.score || 0) / q.marks : 0;
          return (
            <details key={i} className="bg-bg-secondary border border-border rounded-xl shadow-card">
              <summary className="p-4 cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-label">Q{q.number}</span>
                  <span className="text-xs text-text-muted">{q.commandWord}</span>
                </div>
                <span
                  className="font-display font-medium"
                  style={{ color: qPct >= 0.7 ? 'var(--color-strong)' : qPct >= 0.4 ? 'var(--color-developing)' : 'var(--color-weak)' }}
                >
                  {r.score || 0}/{q.marks}
                </span>
              </summary>
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <p className="text-sm text-text-secondary">{q.text}</p>
                {r.matchedPoints?.length > 0 && (
                  <div>
                    <p className="text-xs text-strong font-medium mb-1">Marks awarded:</p>
                    {r.matchedPoints.map((p, j) => <p key={j} className="text-xs text-text-secondary">&#10003; {p}</p>)}
                  </div>
                )}
                {r.missedPoints?.length > 0 && (
                  <div>
                    <p className="text-xs text-weak font-medium mb-1">Marks missed:</p>
                    {r.missedPoints.map((p, j) => <p key={j} className="text-xs text-text-secondary">&#10007; {p}</p>)}
                  </div>
                )}
                {r.feedback?.howToImprove?.length > 0 && (
                  <div>
                    <p className="text-xs text-accent font-medium mb-1">How to improve:</p>
                    {r.feedback.howToImprove.map((p, j) => <p key={j} className="text-xs text-text-secondary">&rarr; {p}</p>)}
                  </div>
                )}
                {q.topicId && (
                  <div className="pt-1">
                    <Link
                      to={'/study-guide/' + q.topicId}
                      className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                    >
                      <BookOpen size={11} />
                      Revise: {q.topicId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Link>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => {
            setAnswers({});
            setResults({});
            setCurrentIdx(0);
            resultsSaved.current = false;
            setStage('answering');
          }}
          className="text-button bg-bg-tertiary text-text-primary px-4 py-2.5 rounded-lg cursor-pointer border border-border inline-flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Retry this paper
        </button>
        <button
          onClick={() => {
            setStage('select');
            setSelectedPaper(null);
            setAnswers({});
            setResults({});
          }}
          className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg cursor-pointer border-0"
        >
          Try Another Paper
        </button>
      </div>
    </div>
  );
}
