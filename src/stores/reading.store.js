// src/stores/reading.store.js

/**
 * READING STORE
 * ------------------
 * Handles persistence for reading data
 * KV Namespace expected: env.READING_KV
 *
 * Data Model:
 * key: reading:{userId}:{YYYY-MM-DD}
 * value:
 * {
 *   sessions: [
 *     { start: ISOString, end: ISOString, minutes: number }
 *   ],
 *   totalMinutes: number
 * }
 */

function todayKey() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export async function getReadingData(env, userId) {
  try {
    if (!env.READING_KV) return null;

    const key = `reading:${userId}:${todayKey()}`;
    const data = await env.READING_KV.get(key, { type: "json" });

    return data || {
      sessions: [],
      totalMinutes: 0
    };
  } catch (err) {
    console.error("getReadingData error", err);
    return null;
  }
}

export async function saveReadingSession(env, userId, session) {
  try {
    if (!env.READING_KV) return;

    const key = `reading:${userId}:${todayKey()}`;
    const existing = await getReadingData(env, userId) || {
      sessions: [],
      totalMinutes: 0
    };

    existing.sessions.push(session);
    existing.totalMinutes += session.minutes;

    await env.READING_KV.put(key, JSON.stringify(existing));
  } catch (err) {
    console.error("saveReadingSession error", err);
  }
}

export async function clearTodayReading(env, userId) {
  try {
    if (!env.READING_KV) return;

    const key = `reading:${userId}:${todayKey()}`;
    await env.READING_KV.delete(key);
  } catch (err) {
    console.error("clearTodayReading error", err);
  }
}

export async function getTodaySummary(env, userId) {
  const data = await getReadingData(env, userId);
  if (!data) return null;

  const totalMinutes = data.totalMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return {
    totalMinutes,
    hours,
    mins,
    sessions: data.sessions || []
  };
      }
