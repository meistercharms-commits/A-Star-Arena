import { adminDb } from '../lib/firebaseAdmin.js';
import admin from 'firebase-admin';

const GUEST_LIMIT = 3;
const FREE_WEEKLY_LIMIT = 5;

export function checkCredits(cost = 1) {
  return async (req, res, next) => {
    // If Firebase Admin is not set up, allow all requests (development mode)
    if (!adminDb) {
      return next();
    }

    // Guest mode: require email, track in Firestore
    if (req.isGuest) {
      const guestEmail = req.headers['x-guest-email'];

      if (!guestEmail) {
        return res.status(402).json({
          success: false,
          error: 'guest_email_required',
          message: 'Enter your email to get 3 free AI battles.',
        });
      }

      const emailKey = guestEmail.trim().toLowerCase();
      const guestRef = adminDb.collection('guestTrials').doc(emailKey);

      try {
        const guestDoc = await guestRef.get();
        const used = guestDoc.exists ? (guestDoc.data().used || 0) : 0;

        if (used >= GUEST_LIMIT) {
          return res.status(402).json({
            success: false,
            error: 'guest_limit_reached',
            message: 'You have used all 3 free battles. Create a free account to continue.',
            used,
            limit: GUEST_LIMIT,
          });
        }

        await guestRef.set({ used: used + 1, email: emailKey, lastUsed: new Date().toISOString() }, { merge: true });
        req.creditSource = 'guest';
        return next();
      } catch (err) {
        console.error('Guest credit check error:', err.message);
        req.creditSource = 'error_passthrough';
        return next();
      }
    }

    // Fellow tier: unlimited access
    if (req.userProfile?.tier === 'fellow') {
      req.creditSource = 'fellow';
      return next();
    }

    // Authenticated user
    if (!req.uid || !req.userProfile) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userRef = adminDb.collection('users').doc(req.uid);

    try {
      // Use a transaction for atomic credit deduction
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const data = userDoc.data();
        const now = new Date();
        let freeUsed = data.freeAiBattlesUsedThisWeek || 0;
        const resetDate = data.freeWeekResetDate ? new Date(data.freeWeekResetDate) : new Date(0);

        // Check if free tier should reset (weekly, Monday)
        if (now >= resetDate) {
          freeUsed = 0;
          const nextMonday = getNextMonday();
          transaction.update(userRef, {
            freeAiBattlesUsedThisWeek: 0,
            freeWeekResetDate: nextMonday.toISOString(),
          });
        }

        // Try free tier first
        if (freeUsed < FREE_WEEKLY_LIMIT) {
          transaction.update(userRef, {
            freeAiBattlesUsedThisWeek: freeUsed + 1,
          });
          req.creditSource = 'free';
          return;
        }

        // Try paid credits
        const credits = data.credits || 0;
        if (credits < cost) {
          throw { code: 'insufficient_credits', credits, cost };
        }

        transaction.update(userRef, {
          credits: credits - cost,
        });

        // Log the transaction
        const txRef = adminDb.collection('creditTransactions').doc();
        transaction.set(txRef, {
          uid: req.uid,
          type: 'spend',
          amount: -cost,
          description: `AI battle (${req.body?.phase || 'unknown'} phase)`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        req.creditSource = 'paid';
      });

      next();
    } catch (err) {
      if (err.code === 'insufficient_credits') {
        return res.status(402).json({
          success: false,
          error: 'insufficient_credits',
          message: 'Not enough credits. Purchase more to continue.',
          credits: err.credits,
          cost: err.cost,
        });
      }

      console.error('Credit check error:', err.message || err);
      // On error, allow the request (don't block learning due to billing issues)
      req.creditSource = 'error_passthrough';
      next();
    }
  };
}

function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
