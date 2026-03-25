import { useNavigate } from 'react-router-dom';
import { useLevel } from '../contexts/LevelContext';
import { useTheme } from '../contexts/ThemeContext';
import { hasCompletedOnboarding } from '../lib/storage';
import { ShieldIcon } from '../components/Logo';
import { GraduationCap, BookOpen } from 'lucide-react';

export default function LevelSelect() {
  const navigate = useNavigate();
  const { setLevel } = useLevel();
  const { theme } = useTheme();

  function handleSelect(level) {
    setLevel(level);
    // If user has already onboarded for this level, go to dashboard
    // Otherwise, go to onboarding
    if (hasCompletedOnboarding()) {
      navigate('/');
    } else {
      navigate('/onboarding');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <ShieldIcon size={64} theme={theme} />
          </div>
          <div className="space-y-2">
            <p className="text-text-secondary text-lg">Welcome to</p>
            <h1 className="font-display text-display tracking-tight">
              A<span className="text-accent">*</span> Arena
            </h1>
            <p className="text-text-secondary">
              Choose your qualification level to get started
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* A-Level Card */}
          <button
            onClick={() => handleSelect('alevel')}
            className="group bg-bg-secondary border border-border rounded-xl p-6 text-left transition-all hover:border-accent/50 hover:bg-bg-secondary/80 cursor-pointer shadow-card"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GraduationCap size={28} />
                <h2 className="font-display text-title">A-Level</h2>
              </div>
              <p className="text-text-secondary text-sm">
                For A-Level students aiming for top marks. Rigorous, exam-focused revision across Biology, Chemistry, and Mathematics.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">🧬 Biology</span>
                <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">⚗️ Chemistry</span>
                <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">📐 Mathematics</span>
              </div>
              <div className="text-xs text-text-muted">
                Target grades: A* and A
              </div>
            </div>
            <div className="mt-4 w-full py-2.5 rounded-lg font-ui text-button text-center transition-colors bg-bg-tertiary text-text-secondary group-hover:bg-accent group-hover:text-bg-primary group-hover:shadow-button">
              Select A-Level
            </div>
          </button>

          {/* GCSE Card */}
          <button
            onClick={() => handleSelect('gcse')}
            className="group bg-bg-secondary border border-border rounded-xl p-6 text-left transition-all hover:border-accent/50 hover:bg-bg-secondary/80 cursor-pointer shadow-card"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen size={28} />
                <h2 className="font-display text-title">GCSE</h2>
              </div>
              <p className="text-text-secondary text-sm">
                Your GCSE revision companion. Supportive, clear, and built to help you achieve the grades you deserve.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">📝 English</span>
                <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">🔢 Maths</span>
                <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">🔬 Science</span>
                <span className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-muted">+9 more</span>
              </div>
              <div className="text-xs text-text-muted">
                12 subjects &middot; Target grades: 9, 8, 7
              </div>
            </div>
            <div className="mt-4 w-full py-2.5 rounded-lg font-ui text-button text-center transition-colors bg-bg-tertiary text-text-secondary group-hover:bg-accent group-hover:text-bg-primary group-hover:shadow-button">
              Select GCSE
            </div>
          </button>
        </div>

        <p className="text-center text-text-muted text-xs">
          You can switch between levels at any time from Settings.
        </p>
      </div>
    </div>
  );
}
