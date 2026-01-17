// src/reading/reading.history.js

/**
 * Add minutes to reading history for a specific date
 */
export function addReadingMinutes(history = {}, date, minutes) {
  if (!date || minutes <= 0) return history;

  return {
    ...history,
    [date]: (history[date] || 0) + minutes,
  };
}

/**
 * Get total minutes read for a given date
 */
export function getReadingMinutesByDate(history = {}, date) {
  return history[date] || 0;
}

/**
 * Get full reading history
 */
export function getFullReadingHistory(history = {}) {
  return history;
}
