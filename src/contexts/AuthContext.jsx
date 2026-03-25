import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db, hasConfig } from '../lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(hasConfig); // Only loading if Firebase is configured

  // Listen to auth state
  useEffect(() => {
    if (!hasConfig) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
            // Update last login
            await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          } else {
            // Profile will be created during sign-up
            setUserProfile(null);
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password, role = 'student', displayName = '') => {
    if (!hasConfig) throw new Error('Firebase not configured');

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Create user profile in Firestore
    const profile = {
      email,
      displayName: displayName || email.split('@')[0],
      role,
      credits: 0,
      freeAiBattlesUsedThisWeek: 0,
      freeWeekResetDate: getNextMonday(),
      inviteCode: role === 'student' ? generateInviteCode() : null,
      linkedParentUids: [],
      linkedStudentUids: [],
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', uid), profile);

    // If student, also create the invite code lookup document
    if (role === 'student' && profile.inviteCode) {
      await setDoc(doc(db, 'inviteCodes', profile.inviteCode), {
        studentUid: uid,
        createdAt: serverTimestamp(),
        usedBy: [],
      });
    }

    setUserProfile(profile);
    return credential.user;
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!hasConfig) throw new Error('Firebase not configured');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }, []);

  const signOutUser = useCallback(async () => {
    if (!hasConfig) return;
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!hasConfig) throw new Error('Firebase not configured');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user || !hasConfig) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, [user]);

  const isGuest = !user;
  const isParent = userProfile?.role === 'parent';
  const isStudent = userProfile?.role === 'student';

  const value = useMemo(() => ({
    user,
    userProfile,
    isGuest,
    isParent,
    isStudent,
    loading,
    hasFirebase: hasConfig,
    signUp,
    signIn,
    signOut: signOutUser,
    resetPassword,
    refreshProfile,
  }), [user, userProfile, isGuest, isParent, isStudent, loading, signUp, signIn, signOutUser, resetPassword, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Helpers
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O/0/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}
