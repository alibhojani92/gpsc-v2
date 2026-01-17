// src/reading/reading.summary.js

import { getRemainingMinutes, getDailyTargetMinutes } from "./daily.target.js";

/**
 * Build reading summary object
 */
export function buildReadingSummary({
  startTime,
  endTime,
  sessionMinutes = 0,
  todayTotalMinutes = 0,
}) {
  const targetMinutes = getDailyTargetMinutes();
  const remainingMinutes = getRemainingMinutes(todayTotalMinutes);

  return {
    startTime,
    endTime,
    sessionMinutes,
    todayTotalMinutes,
    targetMinutes,
    remainingMinutes,
    isTargetCompleted: todayTotalMinutes >= targetMinutes,
  };
}

/**
 * Format minutes into H M string
 */
export function formatMinutes(minutes = 0) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
