import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, getDocs, serverTimestamp } from 'firebase/firestore';

const CREDIT_PACKS = [
  { id: '20', name: 'Scholar', amount: 20, price: '£1.99', perCredit: '10p each', colour: 'var(--color-accent)' },
  { id: '50', name: 'Distinction', amount: 50, price: '£3.99', perCredit: '8p each', popular: true, colour: 'var(--color-strong)' },
  { id: '100', name: 'A* Elite', amount: 100, price: '£6.99', perCredit: '7p each', colour: 'var(--color-accent-sand)' },
];

export default function StudentView() {
  const { uid } = useParams();
  const { userProfile } = useAuth();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStudentData() {
      // Verify this parent is linked to this student
      if (!userProfile?.linkedStudentUids?.includes(uid)) {
        setError('You are not linked to this student.');
        setLoading(false);
        return;
      }

      try {
        // Fetch student profile
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          setStudent(userSnap.data());
        }

        // Fetch progress
        const progressSnap = await getDoc(doc(db, 'users', uid, 'progress', 'main'));
        if (progressSnap.exists()) {
          setProgress(progressSnap.data());
        }

        // Fetch subject data
        const subjectsSnap = await getDocs(collection(db, 'users', uid, 'subjects'));
        const subjectData = [];
        subjectsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const id = docSnap.id; // e.g. "alevel:biology"

          // Extract mastery data
          const masteryEntries = {};
          const sessionCount = Object.keys(data).filter(k => k.startsWith('sessions_')).length;

          Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith('mastery_')) {
              const topicId = key.replace('mastery_', '');
              masteryEntries[topicId] = value;
            }
          });

          if (Object.keys(masteryEntries).length > 0 || sessionCount > 0) {
            subjectData.push({
              id,
              level: id.split(':')[0],
              subject: id.split(':')[1],
              mastery: masteryEntries,
              sessionCount,
            });
          }
        });
        setSubjects(subjectData);
      } catch (err) {
        console.error('Failed to fetch student data:', err);
        setError('Failed to load student data.');
      }

      setLoading(false);
    }

    fetchStudentData();
  }, [uid, userProfile]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-text-muted">Loading...</div></div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-weak mb-4">{error}</p>
        <Link to="/parent" className="text-accent no-underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const avgMastery = subjects.length > 0
    ? subjects.reduce((sum, s) => {
        const masteryValues = Object.values(s.mastery).map(m => m.topicMastery || 0);
        return sum + (masteryValues.length > 0 ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length : 0);
      }, 0) / subjects.length
    : 0;

  // Find weak topics across all subjects
  const weakTopics = subjects.flatMap(s =>
    Object.entries(s.mastery)
      .filter(([_, m]) => (m.category === 'weak' || m.category === 'untested') && m.topicMastery !== undefined)
      .map(([topicId, m]) => ({
        topicId,
        subject: s.subject,
        mastery: m.topicMastery,
        category: m.category,
      }))
  ).sort((a, b) => a.mastery - b.mastery).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/parent" className="text-text-muted hover:text-text-primary transition-colors no-underline">←</Link>
        <div>
          <h1 className="font-display text-display">{student?.displayName || 'Student'}</h1>
          <p className="text-text-muted text-sm">{student?.email}</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total XP', value: progress?.totalXP || 0, colour: 'var(--color-accent)' },
          { label: 'Sessions', value: progress?.totalSessions || 0, colour: 'var(--color-accent-sand)' },
          { label: 'Streak', value: `${progress?.streak || 0} days`, colour: 'var(--color-developing)' },
          { label: 'Avg Mastery', value: `${Math.round(avgMastery * 100)}%`, colour: avgMastery >= 0.7 ? 'var(--color-strong)' : avgMastery >= 0.4 ? 'var(--color-developing)' : 'var(--color-weak)' },
        ].map(stat => (
          <div key={stat.label} className="bg-bg-secondary border border-border rounded-xl p-4 text-center shadow-card">
            <div className="font-display text-stat" style={{ color: stat.colour }}>{stat.value}</div>
            <div className="text-label text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Subject breakdown */}
      {subjects.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
          <h2 className="text-label mb-3">Subject Progress</h2>
          <div className="space-y-3">
            {subjects.map(s => {
              const masteryValues = Object.values(s.mastery).map(m => m.topicMastery || 0);
              const avg = masteryValues.length > 0 ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length : 0;
              const strong = Object.values(s.mastery).filter(m => m.category === 'strong').length;
              const weak = Object.values(s.mastery).filter(m => m.category === 'weak' || m.category === 'untested').length;

              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-28 capitalize">{s.subject}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(avg * 100)}%`,
                        background: avg >= 0.7 ? 'var(--color-strong)' : avg >= 0.4 ? 'var(--color-developing)' : 'var(--color-weak)',
                      }}
                    />
                  </div>
                  <span className="font-display text-base font-medium w-12 text-right">{Math.round(avg * 100)}%</span>
                  <span className="text-xs text-text-muted w-20 text-right">{strong}✓ {weak}✗</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
          <h2 className="text-label mb-3" style={{ color: 'var(--color-weak)' }}>Areas Needing Attention</h2>
          <div className="space-y-2">
            {weakTopics.map(t => (
              <div key={`${t.subject}-${t.topicId}`} className="flex items-center justify-between text-sm">
                <span>
                  <span className="capitalize text-text-muted">{t.subject}</span>
                  <span className="mx-1.5 text-text-muted">›</span>
                  <span className="text-text-primary">{t.topicId.replace(/_/g, ' ')}</span>
                </span>
                <span className="font-display font-medium" style={{ color: 'var(--color-weak)' }}>
                  {Math.round(t.mastery * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy credits for student */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label">Revision Credits</h2>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-sm">Balance:</span>
            <span className="font-display text-xl font-medium text-accent">{student?.credits || 0}</span>
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Credits let {student?.displayName || 'your child'} use AI-powered revision battles and video lessons.
          They get 5 free AI battles each week; credits are for when they want to do more.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {CREDIT_PACKS.map(pack => (
            <button
              key={pack.id}
              onClick={() => {
                // Stripe checkout will be wired in Phase 4, targeting the student's UID
                alert('Stripe payments coming soon!');
              }}
              className={`relative text-center p-4 rounded-xl cursor-pointer border transition-colors hover:opacity-90 ${
                pack.popular ? 'border-strong' : 'border-border bg-bg-tertiary'
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: pack.colour, color: 'var(--color-bg-primary)' }}>
                  Most Popular
                </span>
              )}
              <div className="font-display text-base italic mb-1" style={{ color: pack.colour }}>{pack.name}</div>
              <div className="font-display text-2xl font-medium text-text-primary">{pack.amount}</div>
              <div className="text-label text-text-muted">Credits</div>
              <div className="font-display text-base text-text-primary mt-1">{pack.price}</div>
              <div className="text-xs text-text-muted">{pack.perCredit}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Last active */}
      {progress?.lastSessionDate && (
        <p className="text-xs text-text-muted text-center">
          Last active: {new Date(progress.lastSessionDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      )}
    </div>
  );
}
