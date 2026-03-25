import { adminDb } from '../lib/firebaseAdmin.js';
import admin from 'firebase-admin';

// Middleware: verify Firebase ID token
// Sets req.uid, req.userRole, req.userProfile on success
// Passes through if no token (guest mode) - sets req.uid = null, req.isGuest = true
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token = guest mode
    req.uid = null;
    req.isGuest = true;
    req.userProfile = null;
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  if (!admin.apps?.length) {
    // Firebase Admin not initialised - treat as guest
    req.uid = null;
    req.isGuest = true;
    req.userProfile = null;
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.isGuest = false;

    // Fetch user profile for credit checks
    if (adminDb) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      req.userProfile = userDoc.exists ? userDoc.data() : null;
    }

    next();
  } catch (err) {
    // Invalid token - treat as guest rather than rejecting
    console.warn('Token verification failed:', err.message);
    req.uid = null;
    req.isGuest = true;
    req.userProfile = null;
    next();
  }
}
