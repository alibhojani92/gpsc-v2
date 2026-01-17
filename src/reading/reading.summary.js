// src/reading/reading.summary.js

import { formatMinutes } from "./daily.target.js";

/**
 * Safely add minutes to existing total
 */
export function addMinutes(existingMinutes, newMinutes) {
  const safeExisting = Number(existingMinutes) || 0;
  const safeNew = Number(newMinutes) || 0;

  return Math.max(0, safeExisting + safeNew);
}

/**
 * Build a normalized daily summary
 */
export function buildDailySummary({
  date,
  totalMinutes,
  sessionsCount,
}) {
  const safeTotal = Number(totalMinutes) || 0;
  const safeSessions = Number(sessionsCount) || 0;

  return {
    date,
    totalMinutes: safeTotal,
    sessionsCount: safeSessions,
    totalFormatted: formatMinutes(safeTotal),
  };
}

/**
 * Initialize empty daily summary
 */
export function createEmptySummary(date) {
  return {
    date,
    totalMinutes: 0,
    sessionsCount: 0,
    totalFormatted: formatMinutes(0),
  };
}
