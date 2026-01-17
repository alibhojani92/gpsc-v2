// src/reading/reading.guard.js

/**
 * Check if reading can be started
 */
export function canStartReading(session) {
  if (!session) return true;
  if (session && session.active === true) return false;
  return true;
}

/**
 * Check if reading can be stopped
 */
export function canStopReading(session) {
  if (!session) return false;
  if (session && session.active === true) return true;
  return false;
}
