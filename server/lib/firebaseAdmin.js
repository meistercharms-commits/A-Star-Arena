import admin from 'firebase-admin';

let adminApp = null;
let adminDb = null;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccount) {
  try {
    const parsed = typeof serviceAccount === 'string' ? JSON.parse(serviceAccount) : serviceAccount;
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(parsed),
    });
    adminDb = admin.firestore();
    console.log('Firebase Admin initialised');
  } catch (err) {
    console.warn('Firebase Admin init failed:', err.message);
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT not set — Firebase features disabled');
}

export { adminApp, adminDb };
export default admin;
