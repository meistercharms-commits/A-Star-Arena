import { Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { getCurrentSubject } from '../lib/storage';
import { getPracticals, hasPracticals, getSubjectInfo } from '../content/subjects';

export default function Practicals() {
  const { topics } = useSubject();
  const subjectId = getCurrentSubject();
  const subject = getSubjectInfo(subjectId);
  const practicals = getPracticals(subjectId);
  const available = hasPracticals(subjectId);

  if (!available) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Required Practicals</h1>
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
          <span className="text-4xl block mb-3">🔬</span>
          <p className="text-text-secondary text-sm">
            Required practicals for {subject?.name || 'this subject'} are coming soon.
          </p>
          <Link to="/topics" className="text-accent hover:text-accent-hover no-underline text-sm font-medium mt-2 inline-block">
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Required Practicals</h1>
        <p className="text-text-secondary text-sm mt-1">
          {subject?.emoji} {subject?.name} — {practicals.length} practical{practicals.length !== 1 ? 's' : ''}
        </p>
      </div>

      {practicals.map(p => {
        const linkedTopicName = topics.find(t => t.id === p.linkedTopic)?.name || p.linkedTopic;
        return (
          <details key={p.id} className="bg-bg-secondary border border-border rounded-xl group">
            <summary className="p-5 cursor-pointer select-none list-none flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm">{p.title}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Linked: {linkedTopicName}
                </p>
              </div>
              <span className="text-text-muted group-open:rotate-90 transition-transform text-sm shrink-0">▶</span>
            </summary>

            <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
              {/* Method */}
              <div>
                <h4 className="text-xs font-medium text-accent uppercase tracking-wide mb-2">Method</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  {p.method.map((step, i) => (
                    <li key={i} className="text-sm text-text-secondary">{step}</li>
                  ))}
                </ol>
              </div>

              {/* Variables */}
              <div>
                <h4 className="text-xs font-medium text-accent uppercase tracking-wide mb-2">Variables</h4>
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-sm">
                    <span className="text-strong font-medium shrink-0 w-28">Independent:</span>
                    <span className="text-text-secondary">{p.variables.independent}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-developing font-medium shrink-0 w-28">Dependent:</span>
                    <span className="text-text-secondary">{p.variables.dependent}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-text-muted font-medium shrink-0 w-28">Controlled:</span>
                    <span className="text-text-secondary">{p.variables.controlled.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div>
                <h4 className="text-xs font-medium text-accent uppercase tracking-wide mb-2">Equipment</h4>
                <div className="flex flex-wrap gap-1.5">
                  {p.equipment.map((eq, i) => (
                    <span key={i} className="text-xs bg-bg-tertiary text-text-secondary px-2 py-1 rounded">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Safety */}
              <div>
                <h4 className="text-xs font-medium text-weak uppercase tracking-wide mb-2">Safety</h4>
                <ul className="space-y-1">
                  {p.safety.map((s, i) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="text-weak shrink-0">!</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Calculations */}
              <div>
                <h4 className="text-xs font-medium text-accent uppercase tracking-wide mb-2">Calculations</h4>
                <p className="text-sm text-text-secondary bg-bg-tertiary rounded-lg p-3">{p.calculations}</p>
              </div>

              {/* Exam Tips */}
              {p.examTips?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-developing uppercase tracking-wide mb-2">Exam Tips</h4>
                  <ul className="space-y-1">
                    {p.examTips.map((tip, i) => (
                      <li key={i} className="text-sm text-text-secondary flex gap-2">
                        <span className="text-developing shrink-0">*</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Link to battle */}
              <Link
                to={`/battle/${p.linkedTopic}`}
                className="inline-block text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-lg no-underline transition-colors font-medium"
              >
                Battle: {linkedTopicName}
              </Link>
            </div>
          </details>
        );
      })}

      <Link
        to="/topics"
        className="block text-center text-sm text-text-secondary hover:text-text-primary no-underline"
      >
        Back to Topics
      </Link>
    </div>
  );
}
