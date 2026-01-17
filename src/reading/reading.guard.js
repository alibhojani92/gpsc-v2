// src/reading/reading.guard.js

/**
 * Reading Guard
 * Validates reading session state
 */

/**
 * Check if reading session exists
 */
export function hasActiveSession(session) {
  return Boolean(session && session.startTime);
}

/**
 * Ensure reading can be started
 */
export function canStartReading(session) {
  return !hasActiveSession(session);
}

/**
 * Ensure reading can be stopped
 */
export function canStopReading(session) {
  return hasActiveSession(session);
}
