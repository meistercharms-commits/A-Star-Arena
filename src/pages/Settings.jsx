import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSettings, saveSettings, exportAllData, clearAllData, getStorageSize, getProgress, getStorageWarning, getStorageStats, getCurrentLevel } from '../lib/storage';
import { useLevel } from '../contexts/LevelContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getSubjectsForLevel } from '../content/subjects';
import { getLevelMeta } from '../lib/qualificationLevel';

export default function Settings() {
  const navigate = useNavigate();
  const { level } = useLevel();
  const { user, userProfile, isStudent, isGuest, refreshProfile, hasFirebase } = useAuth();
  const levelMeta = getLevelMeta(level);
  const subjects = getSubjectsForLevel(level);
  const isGCSE = level === 'gcse';

  const progress = getProgress();
  const storageBytes = getStorageSize();
  const storageMB = (storageBytes / 1024 / 1024).toFixed(2);
  const storageWarning = getStorageWarning();
  const storageStats = getStorageStats();

  const initial = getSettings() || {};

  // Get level-scoped exam boards, with fallback to old flat structure
  const levelBoards = initial.examBoards?.[level] || {};
  const flatBoards = initial.examBoards || {};
  const fallbackBoard = initial.examBoard || 'generic';

  // Build initial board state for current level's subjects
  const initExamBoards = {};
  subjects.forEach(s => {
    initExamBoards[s.id] = levelBoards[s.id]
      || (typeof flatBoards[s.id] === 'string' ? flatBoards[s.id] : fallbackBoard);
  });

  const targetGradeKey = `targetGrade_${level}`;
  const [form, setForm] = useState({
    studentName: initial.studentName || '',
    examBoards: initExamBoards,
    targetGrade: initial[targetGradeKey] || initial.targetGrade || (isGCSE ? '9' : 'A*'),
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

  // Accessibility state
  const [textSize, setTextSize] = useState(() => localStorage.getItem('astarena:textSize') || 'standard');
  const [dyslexiaFont, setDyslexiaFont] = useState(() => localStorage.getItem('astarena:dyslexiaFont') === 'true');

  // Apply accessibility settings on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize);
    document.documentElement.setAttribute('data-dyslexia', dyslexiaFont ? 'true' : 'false');
  }, []);

  function handleTextSizeChange(value) {
    setTextSize(value);
    localStorage.setItem('astarena:textSize', value);
    document.documentElement.setAttribute('data-text-size', value);
  }

  function handleDyslexiaFontChange(value) {
    setDyslexiaFont(value);
    localStorage.setItem('astarena:dyslexiaFont', String(value));
    document.documentElement.setAttribute('data-dyslexia', value ? 'true' : 'false');
  }

  function handleSave(e) {
    e.preventDefault();
    const existing = getSettings() || {};
    saveSettings({
      ...existing,
      studentName: form.studentName,
      examBoards: {
        ...(existing.examBoards || {}),
        [level]: form.examBoards,
      },
      [targetGradeKey]: form.targetGrade,
      targetGrade: form.targetGrade,
      timePerDayMins: form.timePerDayMins,
      bossHp: form.bossHp,
      extendedThreshold: form.extendedThreshold,
      showTimer: form.showTimer,
      showStudentHp: form.showStudentHp,
      lowPressureMode: form.lowPressureMode,
      strictness: form.strictness,
      explanationDepth: form.explanationDepth,
      createdAt: existing.createdAt || new Date().toISOString(),
    });
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
    navigate('/level-select');
  }

  async function regenerateInviteCode() {
    if (!user || !isStudent) return;

    // Delete old code if exists
    if (userProfile?.inviteCode) {
      try {
        await deleteDoc(doc(db, 'inviteCodes', userProfile.inviteCode));
      } catch {}
    }

    // Generate new code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 6; i++) {
      newCode += chars[Math.floor(Math.random() * chars.length)];
    }

    // Save to user doc and inviteCodes collection
    await updateDoc(doc(db, 'users', user.uid), { inviteCode: newCode });
    await setDoc(doc(db, 'inviteCodes', newCode), {
      studentUid: user.uid,
      createdAt: serverTimestamp(),
      usedBy: [],
    });

    await refreshProfile();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Qualification Level */}
        <Section title="Qualification Level">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{levelMeta.label}</p>
              <p className="text-xs text-text-muted">{subjects.length} subjects available</p>
            </div>
            <Link
              to="/level-select"
              className="text-xs px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:border-text-muted transition-colors no-underline"
            >
              Switch Level
            </Link>
          </div>
        </Section>

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

          <Field label="Exam Boards">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {subjects.map(({ id, name }) => (
                <div key={id}>
                  <span className="block text-xs text-text-muted mb-1">{name}</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: 'generic', label: 'Generic' },
                      { value: 'aqa', label: 'AQA' },
                      { value: 'ocr', label: 'OCR' },
                      { value: 'edexcel', label: 'Edexcel' },
                    ].map(opt => (
                      <OptionButton
                        key={opt.value}
                        selected={form.examBoards[id] === opt.value}
                        onClick={() => setForm({ ...form, examBoards: { ...form.examBoards, [id]: opt.value } })}
                      >
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Target Grade">
            <div className="flex gap-2">
              {levelMeta.topTargetGrades.map(grade => (
                <OptionButton
                  key={grade}
                  selected={form.targetGrade === grade}
                  onClick={() => setForm({ ...form, targetGrade: grade })}
                  className="flex-1"
                >
                  {isGCSE ? `Grade ${grade}` : grade}
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

        {/* Parent Access */}
        {hasFirebase && isStudent && !isGuest && (
          <Section title="Parent Access">
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Share this invite code with a parent or guardian so they can monitor your revision progress.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-bg-tertiary border border-border rounded-lg px-4 py-3 text-center">
                  <span className="font-mono text-2xl tracking-[0.3em] text-accent font-semibold">
                    {userProfile?.inviteCode || '------'}
                  </span>
                </div>
                <button
                  onClick={regenerateInviteCode}
                  className="text-button bg-bg-tertiary text-text-secondary hover:text-text-primary px-3 py-2.5 rounded-lg cursor-pointer border border-border transition-colors"
                >
                  New Code
                </button>
              </div>
              <p className="text-xs text-text-muted">
                Parents can only view your progress. They cannot start battles or change your settings.
              </p>
            </div>
          </Section>
        )}

        {/* Accessibility */}
        <Section title="Accessibility">
          <Field label="Text Size">
            <div className="flex gap-2">
              {[
                { value: 'standard', label: 'Standard' },
                { value: 'large', label: 'Large' },
                { value: 'xlarge', label: 'Extra Large' },
              ].map(opt => (
                <OptionButton
                  key={opt.value}
                  selected={textSize === opt.value}
                  onClick={() => handleTextSizeChange(opt.value)}
                  className="flex-1"
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Field>

          <Toggle
            label="Dyslexia-friendly font"
            hint="Uses OpenDyslexic for improved readability"
            checked={dyslexiaFont}
            onChange={handleDyslexiaFontChange}
          />
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
            className={`flex-1 font-ui text-button py-2.5 px-4 rounded-lg transition-colors cursor-pointer ${
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
    <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 shadow-card">
      <h2 className="font-display text-title">{title}</h2>
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
