/**
 * Claude API Client — calls Express proxy, falls back to mock on failure.
 *
 * Usage: import { generateQuestion, markAnswer } from './claudeClient';
 * These have the SAME return shape as mockGenerateQuestion / mockMarkAnswer.
 */

import { mockGenerateQuestion, mockMarkAnswer } from './mockClaude';
import topics from '../content/topics.json';

// In production (Vercel), API routes are at /api/* on the same origin.
// In dev, Vite's proxy forwards /api/* to localhost:3001.
const API_BASE = '/api';
const TIMEOUT_MS = 15000; // 15 second timeout

// ─── Helpers ───

async function fetchWithTimeout(url, options, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

let _apiAvailable = null; // null = unknown, true/false = cached

/**
 * Check if the Claude API is available (key configured, server running).
 * Caches the result for the session.
 */
export async function isApiAvailable() {
  if (_apiAvailable !== null) return _apiAvailable;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 3000);
    const data = await res.json();
    _apiAvailable = data.claudeEnabled === true;
  } catch {
    _apiAvailable = false;
  }
  return _apiAvailable;
}

/** Reset the cached availability (e.g., after changing API key in settings) */
export function resetApiCache() {
  _apiAvailable = null;
}

// ─── Generate Question ───

export async function generateQuestion({ topicId, phase, difficulty = 3, examBoard = 'generic' }) {
  // Try real API first
  const available = await isApiAvailable();
  if (available) {
    try {
      const topic = topics.find(t => t.id === topicId);
      const res = await fetchWithTimeout(`${API_BASE}/claude/generateQuestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          topicName: topic?.name || topicId,
          phase,
          difficulty,
          examBoard,
          subskills: topic?.subskills?.map(s => s.name) || [],
          misconceptions: topic?.commonMisconceptions || [],
        }),
      });

      const data = await res.json();
      if (data.success) {
        return { success: true, data: data.data, source: 'claude' };
      }
      // API returned error — fall through to mock
      console.warn('Claude generateQuestion failed, using mock:', data.error);
    } catch (err) {
      console.warn('Claude generateQuestion error, using mock:', err.message);
    }
  }

  // Fallback to mock
  const result = mockGenerateQuestion({ topicId, phase, difficulty, examBoard });
  return { ...result, source: 'mock' };
}

// ─── Mark Answer ───

export async function markAnswer({ questionId, questionPrompt, studentAnswer, phase, difficulty = 3, rubric, examBoard = 'generic', topicId }) {
  const available = await isApiAvailable();
  if (available) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/claude/markAnswer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          questionPrompt,
          studentAnswer,
          phase,
          difficulty,
          rubric,
          examBoard,
          topicId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        return { success: true, data: data.data, source: 'claude' };
      }
      console.warn('Claude markAnswer failed, using mock:', data.error);
    } catch (err) {
      console.warn('Claude markAnswer error, using mock:', err.message);
    }
  }

  // Fallback to mock
  const result = mockMarkAnswer({ questionId, studentAnswer, phase, difficulty, rubric });
  return { ...result, source: 'mock' };
}
