import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams, saveExam, removeExam, getExamCountdown, getCurrentLevel } from '../lib/storage';
import { getSubjectsForLevel, getSubjectContent } from '../content/subjects';
import { getLevelMeta } from '../lib/qualificationLevel';
import { getExamCoverage, generateRevisionPlan } from '../lib/examPlanner';
import { useLevel } from '../contexts/LevelContext';
import { generateId } from '../lib/utils';

export default function ExamPlanner() {
  const { level } = useLevel();
  const levelMeta = getLevelMeta(level);
  const subjects = getSubjectsForLevel(level);

  const [exams, setExams] = useState(() => getExams());
  const [showForm, setShowForm] = useState(false);
  const [expandedExam, setExpandedExam] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    level,
    subjectId: subjects[0]?.id || '',
    examBoard: 'generic',
    title: '',
    date: '',
    paperNumber: '',
  });

  const upcomingExams = exams
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastExams = exams
    .filter(e => new Date(e.date) <= new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  function handleAddExam(e) {
    e.preventDefault();
    const subject = subjects.find(s => s.id === form.subjectId);
    const title = form.title || `${levelMeta.shortLabel} ${subject?.name || form.subjectId}${form.paperNumber ? ` Paper ${form.paperNumber}` : ''}`;

    const exam = {
      id: generateId(),
      level: form.level,
      subjectId: form.subjectId,
      examBoard: form.examBoard,
      title,
      date: new Date(form.date).toISOString(),
      paperNumber: form.paperNumber || null,
      createdAt: new Date().toISOString(),
    };

    saveExam(exam);
    setExams(getExams());
    setShowForm(false);
    setForm({ ...form, title: '', date: '', paperNumber: '' });
  }

  function handleDeleteExam(id) {
    removeExam(id);
    setExams(getExams());
    setConfirmDelete(null);
    setExpandedExam(null);
  }

  function getCountdownBadge(date) {
    const { days, urgent } = getExamCountdown(date);
    if (days <= 0) return { text: 'Today!', colour: 'bg-weak text-white' };
    if (days <= 7) return { text: `${days}d`, colour: 'bg-weak text-white' };
    if (days <= 14) return { text: `${days}d`, colour: 'bg-weak/80 text-white' };
    if (days <= 28) return { text: `${Math.ceil(days / 7)}w`, colour: 'bg-developing text-bg-primary' };
    return { text: `${Math.ceil(days / 7)}w`, colour: 'bg-strong/80 text-white' };
  }

  function getExamSubjectInfo(exam) {
    const allSubjects = getSubjectsForLevel(exam.level);
    return allSubjects.find(s => s.id === exam.subjectId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display">My Exams</h1>
          <p className="text-text-muted text-sm">Track your exams and get targeted revision plans</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent hover:bg-accent-hover text-bg-primary font-ui text-button py-2 px-4 rounded-lg transition-colors cursor-pointer"
        >
          {showForm ? 'Cancel' : '+ Add Exam'}
        </button>
      </div>

      {/* Add Exam Form */}
      {showForm && (
        <form onSubmit={handleAddExam} className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 animate-slide-up shadow-elevated">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Level</label>
              <select
                value={form.level}
                onChange={e => {
                  const newLevel = e.target.value;
                  const newSubjects = getSubjectsForLevel(newLevel);
                  setForm({ ...form, level: newLevel, subjectId: newSubjects[0]?.id || '' });
                }}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="alevel">A-Level</option>
                <option value="gcse">GCSE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Subject</label>
              <select
                value={form.subjectId}
                onChange={e => setForm({ ...form, subjectId: e.target.value })}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {getSubjectsForLevel(form.level).map(s => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Exam Date</label>
              <input
                type="date"
                required
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Paper (optional)</label>
              <input
                type="text"
                value={form.paperNumber}
                onChange={e => setForm({ ...form, paperNumber: e.target.value })}
                placeholder="e.g. Paper 1"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Exam Board</label>
            <div className="flex gap-2">
              {['generic', 'aqa', 'ocr', 'edexcel'].map(board => (
                <button
                  key={board}
                  type="button"
                  onClick={() => setForm({ ...form, examBoard: board })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    form.examBoard === board
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-muted'
                  }`}
                >
                  {board === 'generic' ? 'Generic' : board.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Title (auto-generated if blank)</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder={`${getLevelMeta(form.level).shortLabel} ${getSubjectsForLevel(form.level).find(s => s.id === form.subjectId)?.name || ''}${form.paperNumber ? ` Paper ${form.paperNumber}` : ''}`}
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={!form.date}
            className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Exam
          </button>
        </form>
      )}

      {/* Upcoming Exams */}
      {upcomingExams.length === 0 && !showForm && (
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center shadow-card">
          <span className="text-4xl block mb-3">📅</span>
          <h2 className="font-semibold mb-1">No exams added yet</h2>
          <p className="text-text-muted text-sm mb-4">Add your upcoming exams to get targeted revision plans and countdown reminders.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2 px-6 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Add your first exam
          </button>
        </div>
      )}

      {upcomingExams.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-ui text-label">Upcoming</h2>
          {upcomingExams.map(exam => {
            const badge = getCountdownBadge(exam.date);
            const subjectInfo = getExamSubjectInfo(exam);
            const isExpanded = expandedExam === exam.id;
            const examLevelMeta = getLevelMeta(exam.level);

            // Get coverage for this exam's subject
            const { topics } = getSubjectContent(exam.subjectId, exam.level);
            const coverage = getExamCoverage(topics);
            const { days } = getExamCountdown(exam.date);

            return (
              <div key={exam.id} className="bg-bg-secondary border border-border rounded-xl overflow-hidden shadow-card">
                <button
                  onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
                  className="w-full p-4 text-left cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subjectInfo?.emoji || '📘'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm truncate">{exam.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.colour}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-text-muted text-xs">
                        {examLevelMeta.shortLabel} {subjectInfo?.name} {exam.examBoard !== 'generic' ? `(${exam.examBoard.toUpperCase()})` : ''}
                        {' '}&middot;{' '}
                        {new Date(exam.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-stat text-accent">{coverage.percentage}%</div>
                      <div className="text-[10px] text-text-muted">covered</div>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4 animate-slide-up">
                    {/* Coverage breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-strong/10 rounded-lg p-2">
                        <div className="font-display text-stat text-strong">{coverage.covered}</div>
                        <div className="font-ui text-label">Covered</div>
                      </div>
                      <div className="bg-developing/10 rounded-lg p-2">
                        <div className="font-display text-stat text-developing">{coverage.partial}</div>
                        <div className="font-ui text-label">Partial</div>
                      </div>
                      <div className="bg-weak/10 rounded-lg p-2">
                        <div className="font-display text-stat text-weak">{coverage.notCovered}</div>
                        <div className="font-ui text-label">Not covered</div>
                      </div>
                    </div>

                    {/* Topic heatmap */}
                    <div>
                      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Topic Coverage</h3>
                      <div className="flex flex-wrap gap-1">
                        {coverage.topicDetails.map(t => (
                          <Link
                            key={t.topicId}
                            to={`/battle/${t.topicId}`}
                            className={`text-[10px] px-2 py-1 rounded-md no-underline transition-colors ${
                              t.status === 'covered' ? 'bg-strong/20 text-strong hover:bg-strong/30' :
                              t.status === 'partial' ? 'bg-developing/20 text-developing hover:bg-developing/30' :
                              'bg-weak/20 text-weak hover:bg-weak/30'
                            }`}
                            title={`${t.name}: ${Math.round(t.mastery * 100)}%`}
                          >
                            {t.name.length > 20 ? t.name.slice(0, 18) + '...' : t.name}
                            {t.highYield && ' *'}
                          </Link>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">* = high-yield topic. Click any topic to start a battle.</p>
                    </div>

                    {/* Recommended next action */}
                    {coverage.notCovered > 0 || coverage.partial > 0 ? (
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                        <h3 className="text-xs font-medium text-accent uppercase tracking-wide mb-1">
                          {days <= 7 ? 'Triage Mode' : days <= 14 ? 'Urgent Focus' : 'Recommended Next'}
                        </h3>
                        {(() => {
                          const priority = coverage.topicDetails
                            .filter(t => t.status !== 'covered')
                            .sort((a, b) => {
                              if (a.highYield !== b.highYield) return b.highYield - a.highYield;
                              return a.mastery - b.mastery;
                            })[0];
                          if (!priority) return null;
                          return (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{priority.name}</p>
                                <p className="text-xs text-text-muted">
                                  {priority.status === 'not_covered' ? 'Not started yet' : `${Math.round(priority.mastery * 100)}% mastery`}
                                  {priority.highYield ? ' (high-yield)' : ''}
                                </p>
                              </div>
                              <Link
                                to={`/battle/${priority.topicId}`}
                                className="bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-1.5 px-4 rounded-lg text-xs transition-colors no-underline"
                              >
                                Start
                              </Link>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="bg-strong/5 border border-strong/20 rounded-lg p-3 text-center">
                        <p className="text-sm text-strong font-medium">All topics covered!</p>
                        <p className="text-xs text-text-muted">Focus on reviewing weak areas and timed practice.</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to="/topics"
                        className="flex-1 bg-bg-tertiary hover:bg-border text-text-primary text-center py-2 rounded-lg text-xs font-medium transition-colors no-underline"
                      >
                        Browse Topics
                      </Link>
                      <Link
                        to="/exam"
                        className="flex-1 bg-bg-tertiary hover:bg-border text-text-primary text-center py-2 rounded-lg text-xs font-medium transition-colors no-underline"
                      >
                        Timed Exam
                      </Link>
                      {confirmDelete === exam.id ? (
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="px-4 py-2 bg-weak/20 border border-weak text-weak text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(exam.id)}
                          className="px-4 py-2 bg-bg-tertiary border border-border text-text-muted text-xs rounded-lg cursor-pointer hover:border-weak hover:text-weak transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-ui text-label">Past</h2>
          {pastExams.map(exam => {
            const subjectInfo = getExamSubjectInfo(exam);
            return (
              <div key={exam.id} className="bg-bg-secondary border border-border rounded-xl p-4 opacity-60 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{subjectInfo?.emoji || '📘'}</span>
                  <div className="flex-1">
                    <span className="font-semibold text-sm">{exam.title}</span>
                    <p className="text-text-muted text-xs">
                      {new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
