import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ShieldIcon } from '../../components/Logo';
import { BarChart3, LinkIcon, Sun, Moon } from 'lucide-react';

const parentNav = [
  { path: '/parent', label: 'Dashboard', Icon: BarChart3 },
  { path: '/parent/link', label: 'Link Student', Icon: LinkIcon },
];

export default function ParentLayout() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <header className="border-b border-border px-4 py-3 bg-bg-secondary shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldIcon size={28} theme={theme} />
            <span className="font-display text-lg font-semibold tracking-[0.02em]">
              A<span className="text-accent">*</span> Arena
            </span>
            <span className="text-label text-text-muted">Parent View</span>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1">
              {parentNav.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-nav px-3 py-1.5 rounded-lg no-underline transition-colors ${
                    location.pathname === item.path
                      ? 'bg-bg-tertiary text-accent shadow-subtle'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <item.Icon size={16} className="inline-block" /> {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors cursor-pointer border-0"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={signOut}
              className="text-button px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors cursor-pointer border-0"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
