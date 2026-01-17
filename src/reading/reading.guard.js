// src/reading/reading.guard.js

/**
 * Check if reading session already exists
 */
export function canStartReading(activeSession) {
  if (activeSession && activeSession.startedAt) {
    return false;
  }
  return true;
}

/**
 * Check if reading session can be stopped
 */
export function canStopReading(activeSession) {
  if (!activeSession || !activeSession.startedAt) {
    return false;
  }
  return true;
}

/**
 * Validate session object structure
 */
export function isValidSession(session) {
  if (!session) return false;

  if (!session.startedAt) return false;
  if (typeof session.startedAt !== "number") return false;

  return true;
}
