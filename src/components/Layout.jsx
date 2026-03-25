import { Link, useLocation } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getSubjectsForLevel, isSubjectAvailable } from '../content/subjects';
import { getLevelMeta } from '../lib/qualificationLevel';
import { LogoLockup, ShieldIcon } from './Logo';
import CreditBadge from './CreditBadge';

const navItems = [
  { path: '/', label: 'Home', icon: '⚡' },
  { path: '/topics', label: 'Topics', icon: '📚' },
  { path: '/exams', label: 'Exams', icon: '📅' },
  { path: '/video-lesson', label: 'Video', icon: '🎬' },
  { path: '/exam', label: 'Timed', icon: '🎓' },
  { path: '/history', label: 'History', icon: '📊' },
  { path: '/credits', label: 'Credits', icon: '💎' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { subjectId, setSubjectId } = useSubject();
  const { level } = useLevel();
  const { theme, toggleTheme } = useTheme();
  const { user, isGuest, signOut: handleSignOut } = useAuth();

  const levelMeta = getLevelMeta(level);
  const subjects = getSubjectsForLevel(level);

  // Disable subject switching on active battle/drill/exam pages
  const isInSession = /^\/(battle|drill|exam)/.test(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Skip to content — keyboard accessibility */}
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Header */}
      <header className="border-b border-border px-4 py-3 bg-bg-secondary shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="no-underline">
              <LogoLockup theme={theme} />
            </Link>
            <Link
              to="/level-select"
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/15 text-accent no-underline hover:bg-accent/25 transition-colors"
            >
              {levelMeta.shortLabel}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex gap-1" aria-label="Main navigation">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-nav no-underline transition-colors ${
                    location.pathname === item.path
                      ? 'bg-bg-tertiary text-accent shadow-subtle'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-border transition-colors cursor-pointer border-0"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <CreditBadge />
            {isGuest ? (
              <Link to="/signin" className="text-button px-3 py-1.5 rounded-lg bg-accent text-bg-primary no-underline transition-colors hover:opacity-90">
                Sign In
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                className="text-button px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors cursor-pointer border-0"
              >
                Sign Out
              </button>
            )}
          </div>
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
                className={`text-button px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-accent text-bg-primary font-semibold shadow-button'
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
      <nav className="md:hidden border-t border-border bg-bg-secondary flex justify-around py-2 safe-area-bottom shadow-subtle" aria-label="Mobile navigation">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            aria-current={location.pathname === item.path ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 no-underline transition-colors ${
              location.pathname === item.path
                ? 'text-accent'
                : 'text-text-secondary'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
