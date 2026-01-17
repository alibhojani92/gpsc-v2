// src/reading/daily.target.js

/**
 * Daily Reading Target Utilities
 */

export const DAILY_TARGET_HOURS = 8;
export const DAILY_TARGET_MINUTES = DAILY_TARGET_HOURS * 60;

/**
 * Get total daily target in minutes
 */
export function getDailyTargetMinutes() {
  return DAILY_TARGET_MINUTES;
}

/**
 * Calculate remaining minutes from target
 */
export function getRemainingMinutes(spentMinutes = 0) {
  return Math.max(DAILY_TARGET_MINUTES - spentMinutes, 0);
}

/**
 * Check if daily target completed
 */
export function isTargetCompleted(spentMinutes = 0) {
  return spentMinutes >= DAILY_TARGET_MINUTES;
}
