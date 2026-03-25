import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { saveSettings, getSettings, hasSelectedLevel } from '../lib/storage';
import { useLevel } from '../contexts/LevelContext';
import { useTheme } from '../contexts/ThemeContext';
import { ShieldIcon } from '../components/Logo';
import { getSubjectsForLevel } from '../content/subjects';
import { getLevelMeta } from '../lib/qualificationLevel';
import { mockGenerateQuestion, mockMarkAnswer } from '../lib/mockClaude';

export default function Onboarding() {
  const navigate = useNavigate();
  const { level } = useLevel();
  const { theme } = useTheme();
  const levelMeta = getLevelMeta(level);
  const subjects = getSubjectsForLevel(level);
  const isGCSE = level === 'gcse';

  const [step, setStep] = useState('welcome');
  const [tryQuestion, setTryQuestion] = useState(null);
  const [tryAnswer, setTryAnswer] = useState('');
  const [tryFeedback, setTryFeedback] = useState(null);
  const [tryLoading, setTryLoading] = useState(false);
  const [trySubmitted, setTrySubmitted] = useState(false);

  // Redirect to level select if no level chosen
  if (!hasSelectedLevel()) {
    return <Navigate to="/level-select" replace />;
  }

  // Build default exam boards for current level's subjects
  const defaultBoards = {};
  subjects.forEach(s => { defaultBoards[s.id] = 'generic'; });

  const existingSettings = getSettings();
  const [form, setForm] = useState({
    studentName: existingSettings?.studentName || '',
    examBoards: existingSettings?.examBoards?.[level] || defaultBoards,
    targetGrade: isGCSE ? '9' : 'A*',
    timePerDayMins: existingSettings?.timePerDayMins || 30,
  });

  function handleSubmit(e) {
    e.preventDefault();
    const existing = getSettings() || {};
    const existingOnboarded = existing.onboardedLevels || (existing.createdAt ? ['alevel'] : []);

    // Default all subjects to 'generic' exam board
    const examBoards = {};
    const allSubjects = getSubjectsForLevel(level);
    allSubjects.forEach(s => { examBoards[s.id] = 'generic'; });

    saveSettings({
      ...existing,
      studentName: form.studentName,
      examBoards: {
        ...(existing.examBoards || {}),
        [level]: examBoards,
      },
      [`targetGrade_${level}`]: form.targetGrade,
      targetGrade: form.targetGrade,
      timePerDayMins: form.timePerDayMins,
      onboardedLevels: [...new Set([...existingOnboarded, level])],
      createdAt: existing.createdAt || new Date().toISOString(),
    });
    navigate('/');
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <ShieldIcon size={64} theme={theme} />
            </div>
            <h1 className="font-display text-display tracking-tight">
              A<span className="text-accent">*</span> Arena
            </h1>
            <p className="text-text-secondary text-lg">
              {isGCSE
                ? 'Your GCSE revision companion'
                : 'Your A-Level revision companion'}
            </p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-6 text-left space-y-4 shadow-card">
            {isGCSE ? (
              <>
                <FeatureItem icon="⚔️" title="Topic Battles" description="Structured practice across recall, application, and longer responses" />
                <FeatureItem icon="📊" title="Track Your Progress" description="See exactly where you are strong and where to focus next" />
                <FeatureItem icon="🎯" title="Exam-Style Questions" description="Practise with questions aligned to AQA, Edexcel, and OCR" />
              </>
            ) : (
              <>
                <FeatureItem icon="⚔️" title="Boss Battles" description="Three-phase battles: recall, application, and 6-mark extended responses" />
                <FeatureItem icon="📊" title="Adaptive Mastery" description="Tracks your strengths and weaknesses across core topics" />
                <FeatureItem icon="🎯" title="Exam-Aligned Marking" description="Marked against AQA, OCR, and Edexcel rubrics — like a real examiner" />
              </>
            )}
          </div>

          <button
            onClick={() => {
              // Generate a sample question
              const sampleTopic = level === 'gcse' ? 'fractions_decimals_percentages' : 'biological_molecules';
              const result = mockGenerateQuestion({ topicId: sampleTopic, phase: 'recall', difficulty: 2 });
              setTryQuestion(result.success ? result.data : null);
              setStep('tryit');
            }}
            className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-ui text-button py-3 px-6 rounded-lg transition-colors cursor-pointer text-lg"
          >
            Get Started
          </button>
          <div className="flex justify-center gap-4 mt-3">
            <button
              onClick={() => setStep('form')}
              className="text-text-muted text-xs bg-transparent border-0 cursor-pointer hover:text-text-secondary"
            >
              Skip to setup →
            </button>
            <Link to="/level-select" className="text-text-muted text-xs no-underline hover:text-text-secondary">
              Change level
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'tryit') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="max-w-lg w-full space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="font-display text-display">Try a question</h2>
            <p className="text-text-secondary text-sm mt-1">
              This is what revision looks like in A* Arena. Give it a go.
            </p>
          </div>

          {tryQuestion && (
            <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-card space-y-4">
              <p className="text-text-primary leading-relaxed">{tryQuestion.prompt}</p>

              {!trySubmitted ? (
                <>
                  <textarea
                    value={tryAnswer}
                    onChange={e => setTryAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="input-field w-full min-h-[80px] resize-none"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (!tryAnswer.trim()) return;
                      setTryLoading(true);
                      const markResult = mockMarkAnswer({
                        questionId: tryQuestion.questionId,
                        studentAnswer: tryAnswer,
                        phase: 'recall',
                        rubric: { keywords: tryQuestion.marking.keywords, maxScore: tryQuestion.marking.maxScore },
                      });
                      setTryFeedback(markResult.success ? markResult.data : null);
                      setTrySubmitted(true);
                      setTryLoading(false);
                    }}
                    disabled={tryLoading || !tryAnswer.trim()}
                    className="text-button bg-accent text-bg-primary px-5 py-2.5 rounded-lg cursor-pointer border-0 transition-opacity hover:opacity-90 disabled:opacity-50 w-full"
                  >
                    {tryLoading ? 'Checking...' : 'Submit Answer'}
                  </button>
                </>
              ) : tryFeedback && (
                <div className="space-y-3 animate-slide-up">
                  {/* Result indicator */}
                  <div className={`flex items-center gap-2 text-lg font-medium ${tryFeedback.correct ? 'text-strong' : 'text-developing'}`}>
                    <span>{tryFeedback.correct ? '✓' : '✗'}</span>
                    <span>{tryFeedback.correct ? 'Nice work!' : 'Good attempt!'}</span>
                  </div>

                  {/* Brief feedback */}
                  {tryFeedback.feedback?.whatYouDidWell?.[0] && (
                    <p className="text-sm text-text-secondary">
                      <span className="text-strong">+</span> {tryFeedback.feedback.whatYouDidWell[0]}
                    </p>
                  )}
                  {tryFeedback.feedback?.missingPoints?.[0] && (
                    <p className="text-sm text-text-secondary">
                      <span className="text-weak">-</span> {tryFeedback.feedback.missingPoints[0]}
                    </p>
                  )}

                  {/* Model answer */}
                  {tryFeedback.feedback?.modelAnswer && (
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-label mb-1">Model Answer</p>
                      <p className="text-sm text-text-secondary">{tryFeedback.feedback.modelAnswer}</p>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="pt-2 space-y-2">
                    <p className="text-text-secondary text-sm text-center">
                      That's how A* Arena works. AI-powered questions, instant feedback, real exam practice.
                    </p>
                    <button
                      onClick={() => setStep('form')}
                      className="text-button bg-accent text-bg-primary px-5 py-2.5 rounded-lg cursor-pointer border-0 transition-opacity hover:opacity-90 w-full"
                    >
                      Set Up Your Profile
                    </button>
                    <button
                      onClick={() => setStep('form')}
                      className="text-xs text-text-muted block mx-auto bg-transparent border-0 cursor-pointer hover:text-text-secondary"
                    >
                      Skip to setup →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Back link */}
          <button
            onClick={() => setStep('welcome')}
            className="text-xs text-text-muted block mx-auto bg-transparent border-0 cursor-pointer hover:text-text-secondary"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h1 className="font-display text-display">
            A<span className="text-accent">*</span> Arena
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Set up your {levelMeta.shortLabel} profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-xl p-6 space-y-5 shadow-card">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Name <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.studentName}
              onChange={e => setForm({ ...form, studentName: e.target.value })}
              placeholder="Enter your name"
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Target Grade */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Target Grade</label>
            <div className="flex gap-2">
              {levelMeta.topTargetGrades.map(grade => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setForm({ ...form, targetGrade: grade })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                    form.targetGrade === grade
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-muted'
                  }`}
                >
                  {isGCSE ? `Grade ${grade}` : grade}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted">You can set your exam board for each subject in Settings.</p>
          </div>

          {/* Time per day */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Daily revision goal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={form.timePerDayMins}
                onChange={e => setForm({ ...form, timePerDayMins: Number(e.target.value) })}
                className="flex-1 accent-accent h-2 bg-bg-tertiary rounded-lg cursor-pointer"
              />
              <span className="text-sm font-mono text-accent w-16 text-right">
                {form.timePerDayMins} min
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {form.timePerDayMins <= 15
                ? 'Quick sessions — perfect for busy days'
                : form.timePerDayMins <= 30
                  ? 'Solid revision — 1-2 battles per session'
                  : 'Deep revision — multiple battles and drills'}
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('tryit')}
              className="px-4 py-2.5 rounded-lg text-sm text-text-secondary bg-bg-tertiary border border-border hover:border-text-muted transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-ui text-button py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Start Revising
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-2xl mt-0.5">{icon}</span>
      <div>
        <h3 className="font-display text-sm">{title}</h3>
        <p className="text-text-muted text-xs">{description}</p>
      </div>
    </div>
  );
}
