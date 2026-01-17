// src/utils/daily.target.js

const DEFAULT_TARGET_HOURS = 8;
const MINUTES_IN_HOUR = 60;

/**
 * Get daily reading target in minutes
 * @returns {number}
 */
export function getDailyTargetMinutes() {
  return DEFAULT_TARGET_HOURS * MINUTES_IN_HOUR;
}

/**
 * Calculate remaining minutes from target
 * @param {number} totalReadMinutes
 * @returns {number}
 */
export function getRemainingMinutes(totalReadMinutes) {
  const target = getDailyTargetMinutes();
  const remaining = target - totalReadMinutes;
  return remaining > 0 ? remaining : 0;
}

/**
 * Check whether daily target is completed
 * @param {number} totalReadMinutes
 * @returns {boolean}
 */
export function isTargetCompleted(totalReadMinutes) {
  return totalReadMinutes >= getDailyTargetMinutes();
}
