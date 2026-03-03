import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { getCurrentSubject } from '../lib/storage';
import { getMCQQuestions } from '../content/subjects';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MCQ() {
  const { topicId } = useParams();
  const { topics } = useSubject();
  const topic = topics.find(t => t.id === topicId);
  const subjectId = getCurrentSubject();

  const allQuestions = getMCQQuestions(subjectId, topicId);
  const questions = useMemo(() => shuffle(allQuestions).slice(0, 10), [topicId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null); // index of selected option
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!topic || questions.length === 0) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">MCQ Drill</h1>
        <p className="text-text-secondary">No MCQ questions available for this topic.</p>
        <Link to="/topics" className="text-accent no-underline">Back to Topics</Link>
      </div>
    );
  }

  const q = questions[currentIndex];

  function handleSelect(idx) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.answer) setScore(s => s + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  // Summary screen
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className={`rounded-xl p-6 text-center border ${
          pct >= 80 ? 'bg-strong/5 border-strong/30' : pct >= 50 ? 'bg-developing/5 border-developing/30' : 'bg-weak/5 border-weak/30'
        }`}>
          <span className="text-5xl block mb-2">{pct >= 80 ? '🎯' : pct >= 50 ? '📝' : '📖'}</span>
          <h1 className="text-2xl font-bold mb-1">MCQ Complete</h1>
          <p className="text-text-secondary text-sm">{topic.name}</p>
          <div className={`text-4xl font-bold font-mono mt-3 ${
            pct >= 80 ? 'text-strong' : pct >= 50 ? 'text-developing' : 'text-weak'
          }`}>
            {score}/{questions.length}
          </div>
          <p className="text-text-muted text-sm mt-1">{pct}%</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setCurrentIndex(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); }}
            className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Link
            to="/topics"
            className="flex-1 bg-bg-tertiary hover:bg-border text-text-primary font-semibold py-2.5 rounded-lg transition-colors text-center no-underline"
          >
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">MCQ Drill</h1>
          <p className="text-text-muted text-xs">{topic.name}</p>
        </div>
        <span className="text-sm text-text-muted font-mono">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-bg-tertiary rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5">
        <p className="text-sm font-medium leading-relaxed">{q.q}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let borderClass = 'border-border hover:border-text-muted';
          let bgClass = 'bg-bg-secondary';

          if (answered) {
            if (idx === q.answer) {
              borderClass = 'border-strong';
              bgClass = 'bg-strong/10';
            } else if (idx === selected) {
              borderClass = 'border-weak';
              bgClass = 'bg-weak/10';
            } else {
              borderClass = 'border-border opacity-50';
            }
          } else if (idx === selected) {
            borderClass = 'border-accent';
            bgClass = 'bg-accent/10';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`w-full text-left rounded-xl p-4 border transition-colors cursor-pointer ${borderClass} ${bgClass} ${
                answered ? 'cursor-default' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                  answered && idx === q.answer ? 'bg-strong border-strong text-bg-primary' :
                  answered && idx === selected ? 'bg-weak border-weak text-bg-primary' :
                  'border-text-muted text-text-muted'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm">{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div className={`rounded-xl p-4 border animate-slide-up ${
          selected === q.answer ? 'bg-strong/5 border-strong/30' : 'bg-weak/5 border-weak/30'
        }`}>
          <p className={`text-sm font-semibold mb-1 ${selected === q.answer ? 'text-strong' : 'text-weak'}`}>
            {selected === q.answer ? 'Correct!' : 'Incorrect'}
          </p>
          <p className="text-sm text-text-secondary">{q.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button
          onClick={handleNext}
          className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
        </button>
      )}

      {/* Score tracker */}
      <div className="text-center">
        <span className="text-xs text-text-muted">Score: {score}/{currentIndex + (answered ? 1 : 0)}</span>
      </div>
    </div>
  );
}
