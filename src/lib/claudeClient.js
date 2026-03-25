/**
 * Claude API Client — calls Express proxy, falls back to mock on failure.
 *
 * Usage: import { generateQuestion, markAnswer } from './claudeClient';
 * These have the SAME return shape as mockGenerateQuestion / mockMarkAnswer.
 */

import { mockGenerateQuestion, mockMarkAnswer, mockGenerateStudyGuide } from './mockClaude';
import { getCurrentSubject, getCurrentLevel } from './storage';

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

let _apiCache = { available: null, checkedAt: 0 };
const API_CACHE_TTL = 5 * 60 * 1000; // Re-check every 5 minutes

/**
 * Check if the Claude API is available (key configured, server running).
 * Caches the result with a TTL so it re-checks periodically.
 */
export async function isApiAvailable() {
  const now = Date.now();
  if (_apiCache.available !== null && (now - _apiCache.checkedAt) < API_CACHE_TTL) {
    return _apiCache.available;
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 3000);
    const data = await res.json();
    _apiCache = { available: data.claudeEnabled === true, checkedAt: now };
  } catch {
    _apiCache = { available: false, checkedAt: now };
  }
  return _apiCache.available;
}

/** Get current API status without re-checking (for UI indicators) */
export function getApiStatus() {
  return _apiCache.available;
}

/** Reset the cached availability (e.g., after changing API key in settings) */
export function resetApiCache() {
  _apiCache = { available: null, checkedAt: 0 };
}

// ─── Generate Question ───

export async function generateQuestion({ topicId, phase, difficulty = 3, examBoard = 'generic', topics = [], previousPrompts = [] }) {
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
          subjectId: getCurrentSubject(),
          level: getCurrentLevel(),
          subskills: topic?.subskills?.map(s => s.name) || [],
          misconceptions: topic?.commonMisconceptions || [],
          previousPrompts: previousPrompts.slice(-10), // Send last 10 to avoid huge payloads
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
  const result = mockGenerateQuestion({ topicId, phase, difficulty, examBoard, previousPrompts });
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
          subjectId: getCurrentSubject(),
          level: getCurrentLevel(),
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

// ─── Generate Study Guide ───

export async function generateStudyGuide({ topicId, topicName, subskills = [], examBoard = 'generic', masteryScore, weakSubskills = [], errorPatterns = [] }) {
  const available = await isApiAvailable();
  if (available) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/claude/generateStudyGuide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          topicName,
          subskills,
          examBoard,
          subjectId: getCurrentSubject(),
          level: getCurrentLevel(),
          masteryScore,
          weakSubskills,
          errorPatterns,
        }),
      }, 25000); // Higher timeout — study guides take longer

      const data = await res.json();
      if (data.success) {
        return { success: true, data: data.data, source: 'claude' };
      }
      console.warn('Claude generateStudyGuide failed, using mock:', data.error);
    } catch (err) {
      console.warn('Claude generateStudyGuide error, using mock:', err.message);
    }
  }

  // Fallback to mock
  const result = mockGenerateStudyGuide({ topicId, topicName, subskills, examBoard, masteryScore, weakSubskills, errorPatterns });
  return { ...result, source: 'mock' };
}
