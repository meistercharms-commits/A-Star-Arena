import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';

// Only these emails can access the admin page
const ADMIN_EMAILS = ['chantaldempster@gmail.com'];

export default function Admin() {
  const { user, userProfile } = useAuth();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Guard: only admin emails can access
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/" replace />;
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setSearchResult(null);
    setMessage('');

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchEmail.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setMessage('No user found with that email.');
      } else {
        const userDoc = snap.docs[0];
        setSearchResult({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (err) {
      setMessage('Search failed: ' + err.message);
    }
    setLoading(false);
  }

  async function setTier(uid, tier) {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), { tier: tier || null });
      setSearchResult(prev => ({ ...prev, tier: tier || null }));
      setMessage(`Tier updated to ${tier || 'none'}.`);
    } catch (err) {
      setMessage('Update failed: ' + err.message);
    }
    setLoading(false);
  }

  async function addCredits(uid, amount) {
    setLoading(true);
    try {
      const currentCredits = searchResult?.credits || 0;
      await updateDoc(doc(db, 'users', uid), { credits: currentCredits + amount });
      setSearchResult(prev => ({ ...prev, credits: (prev.credits || 0) + amount }));
      setMessage(`Added ${amount} credits.`);
    } catch (err) {
      setMessage('Update failed: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="font-display text-display">Admin</h1>
        <p className="text-text-secondary text-sm mt-1">Manage users and assign tiers.</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card space-y-3">
        <label className="text-label block">Search by email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            placeholder="student@example.com"
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={loading || !searchEmail.trim()}
            className="text-button bg-accent text-bg-primary px-4 py-2 rounded-lg cursor-pointer border-0 disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </form>

      {/* Message */}
      {message && (
        <p className="text-sm text-accent">{message}</p>
      )}

      {/* User result */}
      {searchResult && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card space-y-4">
          <div>
            <h2 className="font-display text-title">{searchResult.displayName || 'No name'}</h2>
            <p className="text-xs text-text-muted">{searchResult.email}</p>
            <p className="text-xs text-text-muted mt-0.5">UID: {searchResult.id}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-display text-stat text-accent">{searchResult.credits || 0}</div>
              <div className="text-label text-text-muted">Credits</div>
            </div>
            <div>
              <div className="font-display text-stat" style={{ color: 'var(--color-accent-sand)' }}>
                {searchResult.tier || 'none'}
              </div>
              <div className="text-label text-text-muted">Tier</div>
            </div>
            <div>
              <div className="font-display text-stat text-text-secondary">{searchResult.role || 'student'}</div>
              <div className="text-label text-text-muted">Role</div>
            </div>
          </div>

          {/* Tier controls */}
          <div>
            <p className="text-label mb-2">Set Tier</p>
            <div className="flex flex-wrap gap-2">
              {['fellow', 'honours', 'elite', 'distinction', 'scholar', null].map(tier => (
                <button
                  key={tier || 'none'}
                  onClick={() => setTier(searchResult.id, tier)}
                  disabled={loading}
                  className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer border transition-colors ${
                    searchResult.tier === tier
                      ? 'bg-accent text-bg-primary border-accent'
                      : 'bg-bg-tertiary text-text-secondary border-border hover:border-accent/50'
                  }`}
                >
                  {tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'None'}
                </button>
              ))}
            </div>
          </div>

          {/* Credit controls */}
          <div>
            <p className="text-label mb-2">Add Credits</p>
            <div className="flex gap-2">
              {[10, 20, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => addCredits(searchResult.id, amount)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg cursor-pointer bg-bg-tertiary text-text-secondary border border-border hover:border-accent/50 transition-colors"
                >
                  +{amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
