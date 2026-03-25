import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function LinkStudent() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      setError('Invite code must be 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Look up the invite code
      const codeRef = doc(db, 'inviteCodes', trimmedCode);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        setError('Invalid invite code. Please check with your child.');
        setLoading(false);
        return;
      }

      const { studentUid, usedBy = [] } = codeSnap.data();

      // Check if already linked
      if (usedBy.includes(user.uid)) {
        setError('You are already linked to this student.');
        setLoading(false);
        return;
      }

      // Link: add parent to student's linkedParentUids, add student to parent's linkedStudentUids
      const studentRef = doc(db, 'users', studentUid);
      const parentRef = doc(db, 'users', user.uid);

      await updateDoc(studentRef, {
        linkedParentUids: arrayUnion(user.uid),
      });

      await updateDoc(parentRef, {
        linkedStudentUids: arrayUnion(studentUid),
      });

      // Mark code as used
      await updateDoc(codeRef, {
        usedBy: arrayUnion(user.uid),
      });

      // Refresh the parent's profile to pick up the new linkedStudentUids
      await refreshProfile();

      setSuccess(true);
      setTimeout(() => navigate('/parent'), 2000);
    } catch (err) {
      console.error('Link failed:', err);
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="font-display text-display">Link a Student</h1>
        <p className="text-text-secondary text-sm mt-1">
          Enter the 6-digit invite code from your child's Settings page.
        </p>
      </div>

      {success ? (
        <div className="bg-strong/10 border border-strong/30 rounded-xl p-6 text-center">
          <p className="text-strong font-medium text-lg">Successfully linked!</p>
          <p className="text-text-secondary text-sm mt-1">Redirecting to dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4 shadow-card">
          <div>
            <label className="text-label block mb-1.5">Invite Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. ABC123"
              className="input-field text-center text-2xl font-mono tracking-[0.3em] uppercase"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-weak text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg w-full cursor-pointer border-0 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Linking...' : 'Link Student'}
          </button>

          <p className="text-xs text-text-muted text-center">
            Your child can find their invite code in Settings → Parent Access.
          </p>
        </form>
      )}
    </div>
  );
}
