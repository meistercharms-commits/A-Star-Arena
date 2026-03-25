import { useState, useMemo } from 'react';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { getExamBoard } from '../lib/storage';
import { auth, hasConfig } from '../lib/firebase';

// Import available past paper data
import aqaBioAlevel from '../content/pastPapers/aqa-biology-alevel.json';

const PAPER_DATA = [aqaBioAlevel];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  // Filter papers for current subject/level/board
  const availablePapers = useMemo(() => {
    return PAPER_DATA
      .filter(d => d.subject === subjectId && d.level === level)
      .flatMap(d => d.papers);
  }, [subjectId, level]);

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
    const paper = selectedPaper;
    const newResults = {};

    for (let i = 0; i < paper.questions.length; i++) {
      const q = paper.questions[i];
      const answer = answers[i];
      if (!answer?.trim()) {
        newResults[i] = { score: 0, maxMarks: q.marks, matchedPoints: [], missedPoints: [q.markScheme], feedback: { whatYouDidWell: [], missingPoints: ['No answer provided'], howToImprove: ['Attempt the question next time'], modelAnswer: '' } };
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
      newResults[i] = { score: 0, maxMarks: q.marks, feedback: { whatYouDidWell: [], missingPoints: ['Could not mark this answer'], howToImprove: [] } };
    }

    setResults(newResults);
    setMarking(false);
    setStage('results');
  }

  // SELECT stage
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
          <div className="grid gap-3">
            {availablePapers.map(paper => (
              <button
                key={paper.id}
                onClick={() => { setSelectedPaper(paper); setAnswers({}); setResults({}); setCurrentIdx(0); setStage('answering'); }}
                className="bg-bg-secondary border border-border rounded-xl p-5 text-left cursor-pointer hover:border-accent/50 transition-colors shadow-card w-full"
              >
                <div className="font-display text-title">{paper.title}</div>
                <div className="text-xs text-text-muted mt-1">
                  {paper.questions.length} questions · {paper.totalMarks} marks · {paper.duration}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const paper = selectedPaper;
  const questions = paper?.questions || [];
  const currentQ = questions[currentIdx];

  // ANSWERING stage
  if (stage === 'answering') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-display">{paper.title}</h1>
          <span className="text-xs text-text-muted">{Object.keys(answers).filter(k => answers[k]?.trim()).length}/{questions.length} answered</span>
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
                  isCurrent ? 'bg-accent text-bg-primary border-accent'
                  : isAnswered ? 'bg-strong/15 text-strong border-strong/30'
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

  // MARKING stage
  if (stage === 'marking') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-3xl mb-3">📝</div>
          <p className="text-text-secondary">Marking your answers against the mark scheme...</p>
          <p className="text-xs text-text-muted mt-1">This may take a moment.</p>
        </div>
      </div>
    );
  }

  // RESULTS stage
  const totalScore = Object.values(results).reduce((sum, r) => sum + (r.score || 0), 0);
  const totalMax = questions.reduce((sum, q) => sum + q.marks, 0);
  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display">{paper.title}</h1>
        <p className="text-text-secondary text-sm mt-1">Results</p>
      </div>

      {/* Score summary */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-card text-center">
        <div className="font-display text-[48px] font-semibold" style={{ color: pct >= 70 ? 'var(--color-strong)' : pct >= 50 ? 'var(--color-developing)' : 'var(--color-weak)' }}>
          {totalScore}/{totalMax}
        </div>
        <div className="text-label text-text-muted mt-1">{pct}%</div>
      </div>

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
                <span className="font-display font-medium" style={{ color: qPct >= 0.7 ? 'var(--color-strong)' : qPct >= 0.4 ? 'var(--color-developing)' : 'var(--color-weak)' }}>
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
              </div>
            </details>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => { setStage('select'); setSelectedPaper(null); setAnswers({}); setResults({}); }}
          className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg cursor-pointer border-0"
        >
          Try Another Paper
        </button>
      </div>
    </div>
  );
}
