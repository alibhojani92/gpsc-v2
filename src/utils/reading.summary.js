// src/utils/reading.summary.js

import { getDailyTargetMinutes, getRemainingMinutes, isTargetCompleted } from "./daily.target.js";

/**
 * Convert minutes to readable object
 * @param {number} minutes
 * @returns {{ hours: number, minutes: number }}
 */
function minutesToTime(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return { hours: hrs, minutes: mins };
}

/**
 * Build today's reading summary
 * @param {number} totalReadMinutes
 * @returns {object}
 */
export function buildTodayReadingSummary(totalReadMinutes) {
  const targetMinutes = getDailyTargetMinutes();
  const remainingMinutes = getRemainingMinutes(totalReadMinutes);

  return {
    totalReadMinutes,
    totalReadTime: minutesToTime(totalReadMinutes),

    targetMinutes,
    targetTime: minutesToTime(targetMinutes),

    remainingMinutes,
    remainingTime: minutesToTime(remainingMinutes),

    completed: isTargetCompleted(totalReadMinutes),
  };
}
