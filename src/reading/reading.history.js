// src/reading/reading.history.js

/**
 * Adds reading minutes to a specific date
 */
export async function addReadingMinutes(store, userId, date, minutes) {
  const key = `reading:${userId}:${date}`;
  const existing = (await store.get(key)) || 0;
  const total = Number(existing) + Number(minutes);

  await store.put(key, total);
  return total;
}

/**
 * Get total reading minutes for a date
 */
export async function getReadingMinutes(store, userId, date) {
  const key = `reading:${userId}:${date}`;
  const val = await store.get(key);
  return Number(val || 0);
}

/**
 * Get reading history for multiple dates
 */
export async function getReadingHistory(store, userId, dates = []) {
  const result = {};

  for (const date of dates) {
    result[date] = await getReadingMinutes(store, userId, date);
  }

  return result;
}

/**
 * Get last N days reading (for weekly/monthly reports)
 */
export async function getLastNDays(store, userId, n = 7) {
  const data = {};
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    data[dateKey] = await getReadingMinutes(store, userId, dateKey);
  }

  return data;
}
