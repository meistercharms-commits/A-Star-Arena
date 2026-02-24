import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveSettings, exportAllData, clearAllData, getStorageSize, getProgress, getStorageWarning, getStorageStats } from '../lib/storage';

export default function Settings() {
  const navigate = useNavigate();
  const progress = getProgress();
  const storageBytes = getStorageSize();
  const storageMB = (storageBytes / 1024 / 1024).toFixed(2);
  const storageWarning = getStorageWarning();
  const storageStats = getStorageStats();

  const initial = getSettings() || {};
  const [form, setForm] = useState({
    studentName: initial.studentName || '',
    examBoard: initial.examBoard || 'generic',
    targetGrade: initial.targetGrade || 'A*',
    timePerDayMins: initial.timePerDayMins || 30,
    bossHp: initial.bossHp || 100,
    extendedThreshold: initial.extendedThreshold || 5,
    showTimer: initial.showTimer ?? true,
    showStudentHp: initial.showStudentHp ?? false,
    lowPressureMode: initial.lowPressureMode ?? false,
    strictness: initial.strictness || 'examiner',
    explanationDepth: initial.explanationDepth || 'brief',
  });
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    saveSettings({ ...form, createdAt: initial.createdAt || new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astarena-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    clearAllData();
    setConfirmClear(false);
    navigate('/onboarding');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <Section title="Profile">
          <Field label="Name" hint="optional">
            <input
              type="text"
              value={form.studentName}
              onChange={e => setForm({ ...form, studentName: e.target.value })}
              placeholder="Enter your name"
              className="input-field"
            />
          </Field>

          <Field label="Exam Board">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'generic', label: 'Generic' },
                { value: 'aqa', label: 'AQA' },
                { value: 'ocr', label: 'OCR' },
                { value: 'edexcel', label: 'Edexcel' },
              ].map(opt => (
                <OptionButton
                  key={opt.value}
                  selected={form.examBoard === opt.value}
                  onClick={() => setForm({ ...form, examBoard: opt.value })}
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Field>

          <Field label="Target Grade">
            <div className="flex gap-2">
              {['A*', 'A'].map(grade => (
                <OptionButton
                  key={grade}
                  selected={form.targetGrade === grade}
                  onClick={() => setForm({ ...form, targetGrade: grade })}
                  className="flex-1"
                >
                  {grade}
                </OptionButton>
              ))}
            </div>
          </Field>
        </Section>

        {/* Session Preferences */}
        <Section title="Session Preferences">
          <Field label="Daily time goal">
            <RangeInput
              min={5} max={60} step={5}
              value={form.timePerDayMins}
              onChange={v => setForm({ ...form, timePerDayMins: v })}
              unit="min"
            />
          </Field>

          <Field label="Boss HP" hint="Lower = harder battles">
            <RangeInput
              min={50} max={200} step={10}
              value={form.bossHp}
              onChange={v => setForm({ ...form, bossHp: v })}
              unit="HP"
            />
          </Field>

          <Field label="Extended response threshold" hint="Score needed to defeat boss">
            <RangeInput
              min={3} max={6} step={1}
              value={form.extendedThreshold}
              onChange={v => setForm({ ...form, extendedThreshold: v })}
              unit="/6"
            />
          </Field>

          <Toggle
            label="Show timer"
            checked={form.showTimer}
            onChange={v => setForm({ ...form, showTimer: v })}
          />
          <Toggle
            label="Show student HP"
            checked={form.showStudentHp}
            onChange={v => setForm({ ...form, showStudentHp: v })}
          />
          <Toggle
            label="Low pressure mode"
            hint="Hides HP, XP, and streak"
            checked={form.lowPressureMode}
            onChange={v => setForm({ ...form, lowPressureMode: v })}
          />
        </Section>

        {/* Marking */}
        <Section title="Marking">
          <Field label="Strictness">
            <div className="flex gap-2">
              {[
                { value: 'examiner', label: 'Examiner', desc: 'Strict, exam-standard' },
                { value: 'constructive', label: 'Constructive', desc: 'Benefit of the doubt' },
              ].map(opt => (
                <OptionButton
                  key={opt.value}
                  selected={form.strictness === opt.value}
                  onClick={() => setForm({ ...form, strictness: opt.value })}
                  className="flex-1"
                >
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{opt.desc}</div>
                  </div>
                </OptionButton>
              ))}
            </div>
          </Field>

          <Field label="Explanation depth">
            <div className="flex gap-2">
              {['brief', 'detailed'].map(depth => (
                <OptionButton
                  key={depth}
                  selected={form.explanationDepth === depth}
                  onClick={() => setForm({ ...form, explanationDepth: depth })}
                  className="flex-1 capitalize"
                >
                  {depth}
                </OptionButton>
              ))}
            </div>
          </Field>
        </Section>

        {/* Data */}
        <Section title="Data">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Total sessions</span>
              <span className="font-mono">{progress.totalSessions}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Total XP</span>
              <span className="font-mono">{progress.totalXP.toLocaleString()}</span>
            </div>
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Storage used</span>
                <span className="font-mono">{storageMB} MB / 5 MB ({storageStats.percentage}%)</span>
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    storageStats.percentage >= 90 ? 'bg-weak' :
                    storageStats.percentage >= 75 ? 'bg-developing' :
                    storageStats.percentage >= 50 ? 'bg-developing' : 'bg-accent'
                  }`}
                  style={{ width: `${Math.max(2, storageStats.percentage)}%` }}
                />
              </div>
              {storageWarning && (
                <p className={`text-xs ${
                  storageWarning.level === 'critical' ? 'text-weak' :
                  storageWarning.level === 'warning' ? 'text-developing' : 'text-text-muted'
                }`}>
                  {storageWarning.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-text-muted py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Export as JSON
            </button>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex-1 bg-bg-tertiary border border-weak/30 text-weak hover:bg-weak/10 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Clear all data
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 bg-weak/20 border border-weak text-weak font-semibold py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Confirm clear?
              </button>
            )}
          </div>
        </Section>

        {/* Save */}
        <div className="flex gap-3">
          <button
            type="submit"
            className={`flex-1 font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer ${
              saved
                ? 'bg-strong/20 text-strong border border-strong'
                : 'bg-accent hover:bg-accent-hover text-bg-primary'
            }`}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Sub-components ---

function Section({ title, children }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-base">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {hint && <span className="text-text-muted font-normal ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function OptionButton({ selected, onClick, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 px-3 rounded-lg text-sm transition-colors cursor-pointer border text-left ${
        selected
          ? 'bg-accent/15 border-accent text-accent'
          : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-muted'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-sm">{label}</span>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-accent' : 'bg-bg-tertiary'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function RangeInput({ min, max, step, value, onChange, unit }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-accent h-2 bg-bg-tertiary rounded-lg cursor-pointer"
      />
      <span className="text-sm font-mono text-accent w-16 text-right">
        {value}{unit}
      </span>
    </div>
  );
}
