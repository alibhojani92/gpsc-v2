// src/reading/daily.target.js

const DEFAULT_TARGET_HOURS = 8;
const MINUTES_IN_HOUR = 60;

/**
 * Get default daily target in minutes
 */
export function getDefaultTargetMinutes() {
  return DEFAULT_TARGET_HOURS * MINUTES_IN_HOUR;
}

/**
 * Convert minutes to readable format (HH:MM)
 */
export function formatMinutes(minutes) {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  return `${hours}h ${mins}m`;
}

/**
 * Calculate remaining minutes from target
 */
export function getRemainingMinutes(targetMinutes, usedMinutes) {
  return Math.max(0, targetMinutes - usedMinutes);
}

/**
 * Get target summary object
 */
export function getTargetSummary(usedMinutes) {
  const targetMinutes = getDefaultTargetMinutes();
  const remainingMinutes = getRemainingMinutes(
    targetMinutes,
    usedMinutes
  );

  return {
    targetMinutes,
    usedMinutes,
    remainingMinutes,
    targetFormatted: formatMinutes(targetMinutes),
    usedFormatted: formatMinutes(usedMinutes),
    remainingFormatted: formatMinutes(remainingMinutes),
  };
}
