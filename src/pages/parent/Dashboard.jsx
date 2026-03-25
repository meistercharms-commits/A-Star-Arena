import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ParentDashboard() {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      if (!userProfile?.linkedStudentUids?.length) {
        setLoading(false);
        return;
      }

      try {
        const studentData = await Promise.all(
          userProfile.linkedStudentUids.map(async (uid) => {
            const userSnap = await getDoc(doc(db, 'users', uid));
            const progressSnap = await getDoc(doc(db, 'users', uid, 'progress', 'main'));

            return {
              uid,
              name: userSnap.exists() ? userSnap.data().displayName || userSnap.data().email : 'Unknown',
              email: userSnap.exists() ? userSnap.data().email : '',
              progress: progressSnap.exists() ? progressSnap.data() : null,
              level: userSnap.exists() ? userSnap.data().qualificationLevel : null,
            };
          })
        );
        setStudents(studentData);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }
      setLoading(false);
    }

    fetchStudents();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display">Parent Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">
          Monitor your child's revision progress and identify areas for support.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center shadow-card">
          <p className="text-text-secondary mb-4">No students linked yet.</p>
          <p className="text-text-muted text-sm mb-4">
            Ask your child to generate an invite code from their Settings page, then link their account.
          </p>
          <Link
            to="/parent/link"
            className="text-button bg-accent text-bg-primary px-4 py-2.5 rounded-lg no-underline inline-block"
          >
            Link a Student
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map(student => (
            <Link
              key={student.uid}
              to={`/parent/student/${student.uid}`}
              className="bg-bg-secondary border border-border rounded-xl p-5 no-underline hover:border-accent/50 transition-colors shadow-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-title text-text-primary">{student.name}</h2>
                  <p className="text-xs text-text-muted mt-0.5">{student.email}</p>
                  {student.level && (
                    <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-md mt-1.5 inline-block">
                      {student.level === 'gcse' ? 'GCSE' : 'A-Level'}
                    </span>
                  )}
                </div>
                {student.progress && (
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="font-display text-stat text-accent">{student.progress.totalXP || 0}</div>
                      <div className="text-label text-text-muted">Total XP</div>
                    </div>
                    <div>
                      <div className="font-display text-stat" style={{ color: 'var(--color-accent-sand)' }}>{student.progress.totalSessions || 0}</div>
                      <div className="text-label text-text-muted">Sessions</div>
                    </div>
                    <div>
                      <div className="font-display text-stat" style={{ color: 'var(--color-developing)' }}>{student.progress.streak || 0}</div>
                      <div className="text-label text-text-muted">Streak</div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
