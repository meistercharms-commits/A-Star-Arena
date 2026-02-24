import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSettings } from '../lib/storage';

const STEPS = ['welcome', 'form'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome');
  const [form, setForm] = useState({
    studentName: '',
    examBoard: 'generic',
    targetGrade: 'A*',
    timePerDayMins: 30,
  });

  function handleSubmit(e) {
    e.preventDefault();
    saveSettings({
      ...form,
      createdAt: new Date().toISOString(),
    });
    navigate('/');
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">
              A<span className="text-accent">*</span> Arena
            </h1>
            <p className="text-text-secondary text-lg">
              Your A-level revision companion
            </p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">⚔️</span>
              <div>
                <h3 className="font-semibold text-sm">Boss Battles</h3>
                <p className="text-text-muted text-xs">Three-phase battles: recall, application, and 6-mark extended responses</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">📊</span>
              <div>
                <h3 className="font-semibold text-sm">Adaptive Mastery</h3>
                <p className="text-text-muted text-xs">Tracks your strengths and weaknesses across 12 core topics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🎯</span>
              <div>
                <h3 className="font-semibold text-sm">Exam-Aligned Marking</h3>
                <p className="text-text-muted text-xs">Marked against AQA, OCR, and Edexcel rubrics — like a real examiner</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('form')}
            className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer text-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            A<span className="text-accent">*</span> Arena
          </h1>
          <p className="text-text-secondary text-sm mt-1">Set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-xl p-6 space-y-5">
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

          {/* Exam Board */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Exam Board</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'generic', label: 'Generic' },
                { value: 'aqa', label: 'AQA' },
                { value: 'ocr', label: 'OCR' },
                { value: 'edexcel', label: 'Edexcel' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, examBoard: opt.value })}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                    form.examBoard === opt.value
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Grade */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Target Grade</label>
            <div className="flex gap-2">
              {['A*', 'A'].map(grade => (
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
                  {grade}
                </button>
              ))}
            </div>
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
              onClick={() => setStep('welcome')}
              className="px-4 py-2.5 rounded-lg text-sm text-text-secondary bg-bg-tertiary border border-border hover:border-text-muted transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Start Revising
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
