// src/routes/reading.routes.js

import {
  startReadingController,
  stopReadingController
} from "../controllers/reading.controller.js";

/**
 * Route reading actions based on command or callback
 * @param {Object} env - Cloudflare environment bindings
 * @param {number} userId - Telegram user ID
 * @param {string} action - "start" | "stop"
 */
export async function handleReadingRoute(env, userId, action) {
  if (action === "start") {
    return await startReadingController(env, userId);
  }

  if (action === "stop") {
    return await stopReadingController(env, userId);
  }

  return { error: "INVALID_READING_ACTION" };
}
