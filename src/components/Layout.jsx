import { Link, useLocation } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { getSubjectsForLevel, isSubjectAvailable } from '../content/subjects';
import { getLevelMeta } from '../lib/qualificationLevel';

const navItems = [
  { path: '/', label: 'Home', icon: '⚡' },
  { path: '/topics', label: 'Topics', icon: '📚' },
  { path: '/exams', label: 'Exams', icon: '📅' },
  { path: '/exam', label: 'Timed', icon: '🎓' },
  { path: '/history', label: 'History', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { subjectId, setSubjectId } = useSubject();
  const { level } = useLevel();

  const levelMeta = getLevelMeta(level);
  const subjects = getSubjectsForLevel(level);

  // Disable subject switching on active battle/drill/exam pages
  const isInSession = /^\/(battle|drill|exam)/.test(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Skip to content — keyboard accessibility */}
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Header */}
      <header className="border-b border-border px-4 py-3 bg-bg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold tracking-tight no-underline text-text-primary">
              A<span className="text-accent">*</span> Arena
            </Link>
            <Link
              to="/level-select"
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/15 text-accent no-underline hover:bg-accent/25 transition-colors"
            >
              {levelMeta.shortLabel}
            </Link>
          </div>
          <nav className="hidden md:flex gap-1" aria-label="Main navigation">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                  location.pathname === item.path
                    ? 'bg-bg-tertiary text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Subject switcher */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto">
          {subjects.map(subject => {
            const available = isSubjectAvailable(subject.id, level);
            const isActive = subjectId === subject.id;
            return (
              <button
                key={subject.id}
                onClick={() => available && !isInSession && setSubjectId(subject.id)}
                disabled={!available || isInSession}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-accent text-bg-primary font-semibold'
                    : available
                      ? 'bg-bg-tertiary text-text-secondary hover:text-text-primary cursor-pointer'
                      : 'bg-bg-tertiary text-text-muted opacity-50 cursor-not-allowed'
                }`}
              >
                {subject.emoji} {subject.name}
                {!available && <span className="ml-1 text-[10px]">Soon</span>}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full animate-fade-in">
        {children}
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden border-t border-border bg-bg-secondary flex justify-around py-2 safe-area-bottom" aria-label="Mobile navigation">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            aria-current={location.pathname === item.path ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 text-xs no-underline transition-colors ${
              location.pathname === item.path
                ? 'text-accent'
                : 'text-text-secondary'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
