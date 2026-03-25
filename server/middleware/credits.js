import { adminDb } from '../lib/firebaseAdmin.js';
import admin from 'firebase-admin';

// In-memory guest usage tracking (simple, resets on server restart)
const guestUsage = new Map(); // IP -> count
const GUEST_LIMIT = 3;
const FREE_WEEKLY_LIMIT = 5;

export function checkCredits(cost = 1) {
  return async (req, res, next) => {
    // If Firebase Admin is not set up, allow all requests (development mode)
    if (!adminDb) {
      return next();
    }

    // Guest mode: track by IP
    if (req.isGuest) {
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const used = guestUsage.get(ip) || 0;

      if (used >= GUEST_LIMIT) {
        return res.status(402).json({
          success: false,
          error: 'guest_limit_reached',
          message: 'Create a free account to continue using AI battles',
          used: used,
          limit: GUEST_LIMIT,
        });
      }

      guestUsage.set(ip, used + 1);
      req.creditSource = 'guest';
      return next();
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
