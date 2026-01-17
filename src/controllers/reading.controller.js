// src/controllers/reading.controller.js

import {
  getReadingData,
  saveReadingSession,
  getTodaySummary
} from "../stores/reading.store.js";

const DAILY_TARGET_MINUTES = 8 * 60; // 8 hours

export async function startReadingController(env, userId) {
  const now = new Date().toISOString();

  // Save active session marker in KV (separate key)
  if (env.READING_KV) {
    await env.READING_KV.put(
      `reading:active:${userId}`,
      JSON.stringify({ start: now })
    );
  }

  return {
    startTime: now,
    targetMinutes: DAILY_TARGET_MINUTES
  };
}

export async function stopReadingController(env, userId) {
  if (!env.READING_KV) return null;

  const activeKey = `reading:active:${userId}`;
  const active = await env.READING_KV.get(activeKey, { type: "json" });

  if (!active || !active.start) {
    return { error: "NO_ACTIVE_SESSION" };
  }

  const start = new Date(active.start);
  const end = new Date();

  const diffMs = end - start;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  // Save completed session
  await saveReadingSession(env, userId, {
    start: start.toISOString(),
    end: end.toISOString(),
    minutes
  });

  // Clear active marker
  await env.READING_KV.delete(activeKey);

  const summary = await getTodaySummary(env, userId);
  const remaining = Math.max(
    DAILY_TARGET_MINUTES - summary.totalMinutes,
    0
  );

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes: minutes,
    todayTotalMinutes: summary.totalMinutes,
    remainingMinutes: remaining
  };
    }
