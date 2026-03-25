import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ShieldIcon } from '../components/Logo';

export default function SignUp() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, role, displayName);
      navigate(role === 'parent' ? '/parent' : '/onboarding');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <ShieldIcon size={48} theme={theme} />
          <h1 className="font-display text-display text-text-primary">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="text-label text-text-secondary block mb-1">Name (optional)</label>
            <input
              id="displayName"
              type="text"
              className="input-field"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-label text-text-secondary block mb-1">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-label text-text-secondary block mb-1">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-label text-text-secondary block mb-1">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <span className="text-label text-text-secondary block mb-2">I am a</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 text-button px-4 py-2 rounded-full transition-colors ${
                  role === 'student'
                    ? 'bg-accent text-bg-primary font-medium'
                    : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('parent')}
                className={`flex-1 text-button px-4 py-2 rounded-full transition-colors ${
                  role === 'parent'
                    ? 'bg-accent text-bg-primary font-medium'
                    : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                Parent
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg-primary font-medium px-4 py-2.5 rounded-lg text-button transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 text-sm">
          <p className="text-text-secondary">
            Already have an account?{' '}
            <Link to="/signin" className="text-accent hover:underline">Sign in</Link>
          </p>
          <Link to="/level-select" className="text-text-muted hover:text-text-secondary transition-colors">
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
  );
}
