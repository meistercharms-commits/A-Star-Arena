export default function QuestionCard({ question, phase, questionNum }) {
  const phaseLabels = {
    recall: 'Rapid Recall',
    application: 'Application',
    extended: 'Exam Brain',
  };

  const markBadge = question?.marking?.maxScore
    ? `${question.marking.maxScore} mark${question.marking.maxScore !== 1 ? 's' : ''}`
    : null;

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded font-medium">
          {phaseLabels[phase] || phase}
        </span>
        {markBadge && (
          <span className="text-xs bg-bg-tertiary text-text-muted px-2 py-0.5 rounded">
            {markBadge}
          </span>
        )}
      </div>

      <p className="text-text-primary leading-relaxed">
        {question?.prompt || 'Loading question...'}
      </p>

      {question?.dataIncluded && (
        <div className="mt-3 bg-bg-tertiary rounded-lg p-3 text-sm text-text-secondary font-mono whitespace-pre-wrap">
          {question.dataIncluded}
        </div>
      )}
    </div>
  );
}
