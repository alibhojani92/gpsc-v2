// src/reading/reading.history.js

/**
 * Reading History Store
 * Saves date-wise reading duration
 * Storage: KV (env.READING_KV)
 */

/**
 * Generate history key per user
 */
function historyKey(userId) {
  return `reading:history:${userId}`;
}

/**
 * Add minutes to today's reading history
 */
export async function addReadingMinutes(env, userId, minutes) {
  const key = historyKey(userId);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const history =
    (await env.READING_KV.get(key, { type: "json" })) || {};

  history[today] = (history[today] || 0) + minutes;

  await env.READING_KV.put(key, JSON.stringify(history));

  return {
    date: today,
    totalMinutes: history[today],
  };
}

/**
 * Get full reading history
 */
export async function getReadingHistory(env, userId) {
  return (
    (await env.READING_KV.get(historyKey(userId), { type: "json" })) ||
    {}
  );
}

/**
 * Get reading minutes for a specific date
 */
export async function getReadingByDate(env, userId, date) {
  const history =
    (await env.READING_KV.get(historyKey(userId), { type: "json" })) ||
    {};

  return history[date] || 0;
}
