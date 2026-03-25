import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const linkModules = import.meta.glob('../content/pastPaperLinks/*.json', { eager: true });
const ALL_LINKS = Object.values(linkModules).map(m => m.default);

export default function PastPaperHub() {
  const { subjectId } = useSubject();
  const { level } = useLevel();
  const [expandedYear, setExpandedYear] = useState(null);

  const available = useMemo(() => {
    return ALL_LINKS.filter(d => d.subject === subjectId && d.level === level);
  }, [subjectId, level]);

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
          Real {spec.specName} exam papers. Open the PDF, complete it under timed conditions, then self-mark using the mark scheme.
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
            <span>Complete the paper under timed conditions. Write your answers on paper.</span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="font-display text-lg text-accent shrink-0">3.</span>
            <span>Open the mark scheme and self-mark your answers.</span>
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
                {sitting.papers.map(paper => (
                  <div key={paper.id} className="p-4 space-y-3">
                    <div>
                      <h3 className="font-display text-base font-medium">{paper.title}</h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {paper.duration} · {paper.totalMarks} marks
                      </p>
                    </div>

                    <div className="flex gap-2">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
