import { v4 as uuidv4 } from 'uuid';

export function generateId() {
  return uuidv4();
}

export function formatDate(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getMasteryCategory(mastery) {
  if (mastery >= 0.80) return { label: 'Strong', colour: 'strong', emoji: '🟢' };
  if (mastery >= 0.55) return { label: 'Developing', colour: 'developing', emoji: '🟡' };
  if (mastery >= 0.30) return { label: 'Weak', colour: 'weak', emoji: '🔴' };
  return { label: 'Untested', colour: 'untested', emoji: '⚫' };
}

export function getMasteryColourClass(mastery) {
  if (mastery >= 0.80) return 'text-strong';
  if (mastery >= 0.55) return 'text-developing';
  if (mastery >= 0.30) return 'text-weak';
  return 'text-untested';
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getDaysSince(isoString) {
  if (!isoString) return Infinity;
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000);
}
