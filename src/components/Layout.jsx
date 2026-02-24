import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home', icon: '⚡' },
  { path: '/topics', label: 'Topics', icon: '📚' },
  { path: '/exam', label: 'Exam', icon: '🎓' },
  { path: '/history', label: 'History', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Skip to content — keyboard accessibility */}
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-bg-secondary">
        <Link to="/" className="text-xl font-bold tracking-tight no-underline text-text-primary">
          A<span className="text-accent">*</span> Arena
        </Link>
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
