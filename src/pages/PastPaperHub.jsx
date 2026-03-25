import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { getExamBoard } from '../lib/storage';

function readLocal(key, fallback) {
  try { const v = localStorage.getItem(`astarena:${key}`); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function writeLocal(key, data) {
  try { localStorage.setItem(`astarena:${key}`, JSON.stringify(data)); } catch {}
}
import { auth, hasConfig } from '../lib/firebase';
import { ExternalLink, FileText, ChevronDown, ChevronUp, Sparkles, CheckCircle, BookOpen } from 'lucide-react';

const linkModules = import.meta.glob('../content/pastPaperLinks/*.json', { eager: true });
const ALL_LINKS = Object.values(linkModules).map(m => m.default);

const API_BASE = import.meta.env.VITE_API_URL || '';

async function getAuthHeaders() {
  if (!hasConfig || !auth?.currentUser) return {};
  try {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch { return {}; }
}

export default function PastPaperHub() {
  const { subjectId } = useSubject();
  const { level } = useLevel();
  const examBoard = getExamBoard(subjectId);
  const [expandedYear, setExpandedYear] = useState(null);
  const [activePaper, setActivePaper] = useState(null);
  const [answers, setAnswers] = useState({});
  const [aiResults, setAiResults] = useState(null);
  const [marking, setMarking] = useState(false);
  const [showMarkScheme, setShowMarkScheme] = useState(false);

  const available = useMemo(() => {
    return ALL_LINKS.filter(d => d.subject === subjectId && d.level === level);
  }, [subjectId, level]);

  // Get previous results for a paper
  function getPaperResults(paperId) {
    const all = readLocal('pastPaperHubResults', {});
    return all[paperId] || [];
  }

  function savePaperResult(paperId, result) {
    const all = readLocal('pastPaperHubResults', {});
    const existing = all[paperId] || [];
    existing.push({ ...result, date: new Date().toISOString() });
    all[paperId] = existing;
    writeLocal('pastPaperHubResults', all);
  }

  async function handleAiMark() {
    if (!activePaper) return;
    setMarking(true);
    setAiResults(null);

    const answerList = Object.entries(answers)
      .filter(([_, v]) => v?.trim())
      .map(([qNum, answer]) => ({ questionNumber: qNum, answer }));

    if (answerList.length === 0) {
      setMarking(false);
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
      const res = await fetch(`${API_BASE}/api/claude/markPastPaperHub`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          paperId: activePaper.id,
          paperTitle: activePaper.title,
          answers: answerList,
          markSchemeUrl: activePaper.markSchemeUrl,
          examBoard: examBoard,
          subjectId,
          level,
          totalMarks: activePaper.totalMarks,
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        alert(data.message || 'Not enough credits. AI marking costs 2 credits.');
        setMarking(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAiResults(data.data);
          savePaperResult(activePaper.id, {
            type: 'ai',
            score: data.data.totalScore,
            maxMarks: activePaper.totalMarks,
            percentage: Math.round((data.data.totalScore / activePaper.totalMarks) * 100),
          });
        }
      }
    } catch (err) {
      console.error('AI marking failed:', err);
    }
    setMarking(false);
  }

  function handleSelfMark(score) {
    if (!activePaper) return;
    savePaperResult(activePaper.id, {
      type: 'self',
      score,
      maxMarks: activePaper.totalMarks,
      percentage: Math.round((score / activePaper.totalMarks) * 100),
    });
  }

  // ── Active paper answering view ──
  if (activePaper) {
    const prevResults = getPaperResults(activePaper.id);
    const lastResult = prevResults[prevResults.length - 1];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActivePaper(null); setAnswers({}); setAiResults(null); setShowMarkScheme(false); }}
            className="text-text-muted hover:text-text-primary transition-colors bg-transparent border-0 cursor-pointer"
          >
            ← Back
          </button>
          <div>
            <h1 className="font-display text-display">{activePaper.title}</h1>
            <p className="text-xs text-text-muted">{activePaper.duration} · {activePaper.totalMarks} marks</p>
          </div>
        </div>

        {/* Open PDF */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
          <p className="text-sm text-text-secondary mb-3">
            Open the question paper, complete it, then type your answers below for AI marking.
          </p>
          <div className="flex gap-2">
            <a
              href={activePaper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-button flex items-center gap-1.5 bg-accent text-bg-primary px-3 py-2 rounded-lg no-underline text-xs"
            >
              <FileText size={14} />
              Open Question Paper
            </a>
            <button
              onClick={() => setShowMarkScheme(!showMarkScheme)}
              className="text-button flex items-center gap-1.5 bg-bg-tertiary text-text-secondary px-3 py-2 rounded-lg text-xs border border-border cursor-pointer"
            >
              <BookOpen size={14} />
              {showMarkScheme ? 'Hide Mark Scheme' : 'Self-Mark (Free)'}
            </button>
          </div>
          {showMarkScheme && (
            <div className="mt-3 p-3 bg-bg-tertiary rounded-lg">
              <a
                href={activePaper.markSchemeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-accent text-sm no-underline hover:underline"
              >
                <ExternalLink size={14} />
                Open Mark Scheme PDF
              </a>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-text-muted">Enter your self-assessed score:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={activePaper.totalMarks}
                    placeholder="Score"
                    className="input-field w-24 text-center"
                    id="self-mark-score"
                  />
                  <span className="text-xs text-text-muted">/ {activePaper.totalMarks}</span>
                  <button
                    onClick={() => {
                      const input = document.getElementById('self-mark-score');
                      const score = parseInt(input?.value);
                      if (!isNaN(score) && score >= 0 && score <= activePaper.totalMarks) {
                        handleSelfMark(score);
                        alert(`Saved: ${score}/${activePaper.totalMarks}`);
                      }
                    }}
                    className="text-button bg-accent text-bg-primary px-3 py-1.5 rounded-lg text-xs cursor-pointer border-0"
                  >
                    Save Score
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Answer inputs */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card space-y-4">
          <h2 className="text-label">Your Answers (for AI Marking)</h2>
          <p className="text-xs text-text-muted">
            Type your answers for each question. You do not need to answer every question.
          </p>

          {Array.from({ length: 9 }, (_, i) => i + 1).map(qNum => (
            <div key={qNum} className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Question {qNum}</label>
              <textarea
                value={answers[qNum] || ''}
                onChange={e => setAnswers(prev => ({ ...prev, [qNum]: e.target.value }))}
                placeholder={`Type your answer for Q${qNum}...`}
                className="input-field w-full resize-none min-h-[60px]"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAiMark}
              disabled={marking || Object.values(answers).filter(a => a?.trim()).length === 0}
              className="text-button flex items-center gap-1.5 bg-accent text-bg-primary px-5 py-2.5 rounded-lg cursor-pointer border-0 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Sparkles size={14} />
              {marking ? 'Marking...' : 'AI Mark (2 credits)'}
            </button>
          </div>
        </div>

        {/* AI Results */}
        {aiResults && (
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card space-y-4 animate-slide-up">
            <div className="text-center">
              <div className="font-display text-[48px] font-semibold" style={{
                color: aiResults.percentage >= 70 ? 'var(--color-strong)' : aiResults.percentage >= 50 ? 'var(--color-developing)' : 'var(--color-weak)'
              }}>
                {aiResults.totalScore}/{activePaper.totalMarks}
              </div>
              <div className="text-label text-text-muted">{aiResults.percentage}%</div>
            </div>

            {aiResults.questionFeedback?.map((qf, i) => (
              <details key={i} className="border-b border-border pb-3 last:border-0">
                <summary className="cursor-pointer flex items-center justify-between py-1">
                  <span className="text-sm font-medium">Question {qf.questionNumber}</span>
                  <span className="font-display text-sm" style={{
                    color: qf.score > 0 ? 'var(--color-strong)' : 'var(--color-weak)'
                  }}>
                    {qf.score} marks
                  </span>
                </summary>
                <div className="mt-2 space-y-2 text-sm text-text-secondary">
                  {qf.feedback && <p>{qf.feedback}</p>}
                  {qf.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs text-accent font-medium mb-1">To improve:</p>
                      {qf.improvements.map((imp, j) => <p key={j} className="text-xs">→ {imp}</p>)}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Previous attempts */}
        {prevResults.length > 0 && !aiResults && (
          <div className="bg-bg-secondary border border-border rounded-xl p-4 shadow-card">
            <h3 className="text-label mb-2">Previous Attempts</h3>
            <div className="space-y-1.5">
              {prevResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    <span className="text-xs ml-1.5 opacity-60">{r.type === 'ai' ? '(AI marked)' : '(self-marked)'}</span>
                  </span>
                  <span className="font-display font-medium" style={{
                    color: r.percentage >= 70 ? 'var(--color-strong)' : r.percentage >= 50 ? 'var(--color-developing)' : 'var(--color-weak)'
                  }}>
                    {r.score}/{r.maxMarks} ({r.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Paper selector view ──
  if (available.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-display">Past Papers</h1>
          <p className="text-text-secondary text-sm mt-1">
            Practice with real exam board papers and get AI-powered marking.
          </p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center shadow-card">
          <FileText size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No past papers available for this subject yet.</p>
          <p className="text-xs text-text-muted mt-2">Papers are being added regularly. Try Exam Practice for exam-style questions.</p>
          <Link to="/past-papers" className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg no-underline inline-block mt-3">
            Exam Practice
          </Link>
        </div>
      </div>
    );
  }

  const spec = available[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display">Past Papers</h1>
        <p className="text-text-secondary text-sm mt-1">
          Real {spec.specName} exam papers. Open the PDF, complete it, then get AI marking or self-mark.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
        <h2 className="text-label mb-3">How it works</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex gap-3 items-start">
            <span className="font-display text-lg text-accent shrink-0">1.</span>
            <span>Open the question paper PDF (opens on the exam board's website)</span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="font-display text-lg text-accent shrink-0">2.</span>
            <span>Complete the paper under timed conditions.</span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="font-display text-lg text-accent shrink-0">3.</span>
            <span>Type your answers and choose: <strong>Self-mark</strong> (free) or <strong>AI Mark</strong> (2 credits) for detailed feedback.</span>
          </div>
        </div>
      </div>

      {/* Official resources link */}
      <a
        href={spec.resourcesUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-accent no-underline hover:underline"
      >
        <ExternalLink size={14} />
        View all papers on {spec.board.toUpperCase()} website
      </a>

      {/* Papers by year */}
      {spec.sittings.map(sitting => {
        const isExpanded = expandedYear === sitting.year;
        return (
          <div key={sitting.year} className="bg-bg-secondary border border-border rounded-xl shadow-card overflow-hidden">
            <button
              onClick={() => setExpandedYear(isExpanded ? null : sitting.year)}
              className="w-full flex items-center justify-between p-4 cursor-pointer border-0 bg-transparent text-text-primary"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-title">{sitting.session} {sitting.year}</span>
                <span className="text-xs text-text-muted">{sitting.papers.length} papers</span>
              </div>
              {isExpanded ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
            </button>

            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {sitting.papers.map(paper => {
                  const prevResults = getPaperResults(paper.id);
                  const lastResult = prevResults[prevResults.length - 1];
                  return (
                    <div key={paper.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-base font-medium">{paper.title}</h3>
                          <p className="text-xs text-text-muted mt-0.5">
                            {paper.duration} · {paper.totalMarks} marks
                            {lastResult && (
                              <span className="ml-2" style={{
                                color: lastResult.percentage >= 70 ? 'var(--color-strong)' : lastResult.percentage >= 50 ? 'var(--color-developing)' : 'var(--color-weak)'
                              }}>
                                Last: {lastResult.score}/{lastResult.maxMarks} ({lastResult.percentage}%)
                              </span>
                            )}
                          </p>
                        </div>
                        {lastResult && <CheckCircle size={16} style={{ color: 'var(--color-strong)' }} />}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-button flex items-center gap-1.5 bg-accent text-bg-primary px-3 py-2 rounded-lg no-underline text-xs"
                        >
                          <FileText size={14} />
                          Question Paper
                        </a>
                        <a
                          href={paper.markSchemeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-button flex items-center gap-1.5 bg-bg-tertiary text-text-secondary px-3 py-2 rounded-lg no-underline text-xs border border-border"
                        >
                          <FileText size={14} />
                          Mark Scheme
                        </a>
                        <button
                          onClick={() => { setActivePaper(paper); setAnswers({}); setAiResults(null); setShowMarkScheme(false); }}
                          className="text-button flex items-center gap-1.5 bg-bg-tertiary text-accent px-3 py-2 rounded-lg text-xs border border-accent/30 cursor-pointer"
                        >
                          <Sparkles size={14} />
                          Mark My Answers
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
