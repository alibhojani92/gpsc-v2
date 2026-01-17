// src/reading/reading.session.js

/**
 * Reading Session Manager
 * Handles active reading start / stop
 * Storage: KV (env.READING_KV)
 */

/**
 * Generate KV key for user session
 */
function sessionKey(userId) {
  return `reading:session:${userId}`;
}

/**
 * Start reading session
 */
export async function startReadingSession(env, userId) {
  const key = sessionKey(userId);

  const existing = await env.READING_KV.get(key, { type: "json" });
  if (existing) {
    return {
      ok: false,
      reason: "ALREADY_RUNNING",
      startedAt: existing.startedAt,
    };
  }

  const startedAt = Date.now();

  await env.READING_KV.put(
    key,
    JSON.stringify({
      userId,
      startedAt,
    })
  );

  return {
    ok: true,
    startedAt,
  };
}

/**
 * Stop reading session
 */
export async function stopReadingSession(env, userId) {
  const key = sessionKey(userId);

  const session = await env.READING_KV.get(key, { type: "json" });
  if (!session) {
    return {
      ok: false,
      reason: "NO_ACTIVE_SESSION",
    };
  }

  const endedAt = Date.now();
  const durationMs = endedAt - session.startedAt;

  await env.READING_KV.delete(key);

  return {
    ok: true,
    startedAt: session.startedAt,
    endedAt,
    durationMs,
  };
}

/**
 * Check if reading is active
 */
export async function isReadingActive(env, userId) {
  const key = sessionKey(userId);
  const session = await env.READING_KV.get(key);
  return !!session;
  }
