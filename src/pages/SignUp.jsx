import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ShieldIcon } from '../components/Logo';

// Password strength rules
const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /\d/.test(p) },
];

function getPasswordStrength(password) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (passed === 0) return { level: 0, label: '', colour: '' };
  if (passed <= 2) return { level: 1, label: 'Weak', colour: 'var(--color-weak)' };
  if (passed === 3) return { level: 2, label: 'Fair', colour: 'var(--color-developing)' };
  return { level: 3, label: 'Strong', colour: 'var(--color-strong)' };
}

export default function SignUp() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { signUp } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(password));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Please meet all password requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, role, displayName);
      setVerificationSent(true);
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err.code === 'auth/invalid-email'
        ? 'Please enter a valid email address'
        : err.message || 'Failed to create account';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Show verification sent screen
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <ShieldIcon size={48} theme={theme} />
          <h1 className="font-display text-display text-text-primary">Verify your email</h1>
          <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-card space-y-3">
            <p className="text-text-secondary text-sm">
              We've sent a verification link to <strong className="text-text-primary">{email}</strong>.
            </p>
            <p className="text-text-muted text-sm">
              Check your inbox (and spam folder) and click the link to verify your account.
            </p>
          </div>
          <button
            onClick={async () => {
              // Reload auth state to check if email is now verified
              const { currentUser } = await import('firebase/auth').then(m => ({ currentUser: m.getAuth().currentUser }));
              if (currentUser) await currentUser.reload();
              if (currentUser?.emailVerified) {
                navigate(role === 'parent' ? '/parent' : '/onboarding');
              } else {
                setError('Please verify your email first. Check your inbox and click the verification link.');
              }
            }}
            className="w-full bg-accent text-bg-primary font-medium px-4 py-2.5 rounded-lg text-button transition-opacity hover:opacity-90 cursor-pointer border-0"
          >
            I've Verified My Email
          </button>
          {error && <p className="text-weak text-xs">{error}</p>}
          <button
            onClick={async () => {
              try {
                const { getAuth, sendEmailVerification: resend } = await import('firebase/auth');
                const u = getAuth().currentUser;
                if (u) await resend(u);
                setError('');
                alert('Verification email resent. Check your inbox.');
              } catch { setError('Could not resend. Please try again in a moment.'); }
            }}
            className="text-xs text-accent bg-transparent border-0 cursor-pointer hover:underline"
          >
            Resend verification email
          </button>
        </div>
      </div>
    );
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
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {/* Strength bar */}
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        background: strength.level >= i ? strength.colour : 'var(--color-border)',
                      }}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className="text-xs font-medium" style={{ color: strength.colour }}>{strength.label}</p>
                )}
                {/* Rules checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {PASSWORD_RULES.map(rule => (
                    <p key={rule.id} className="text-xs" style={{ color: rule.test(password) ? 'var(--color-strong)' : 'var(--color-text-muted)' }}>
                      {rule.test(password) ? '✓' : '○'} {rule.label}
                    </p>
                  ))}
                </div>
              </div>
            )}
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
