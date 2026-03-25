import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function GuestEmailGate({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    localStorage.setItem('astarena:guestEmail', trimmed);
    onSubmit(trimmed);
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-card space-y-4 max-w-sm mx-auto">
      <div className="text-center">
        <Sparkles size={28} className="text-accent mx-auto mb-2" />
        <h3 className="font-display text-title">3 Free AI Battles</h3>
        <p className="text-xs text-text-muted mt-1">
          Enter your email to try 3 AI-powered battles for free. No account needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="your.email@school.ac.uk"
          className="input-field w-full"
          autoFocus
        />
        {error && <p className="text-weak text-xs">{error}</p>}
        <button
          type="submit"
          disabled={!email.trim()}
          className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg w-full cursor-pointer border-0 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Start Free Trial
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-text-muted">
          Already have an account?{' '}
          <Link to="/signin" className="text-accent no-underline hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
