// src/handlers/reading.handler.js

import { sendMessage } from "../utils/telegram.js";
import { getMasterKeyboard } from "../keyboards/master.keyboard.js";
import { ADMIN_ID } from "../env.js";

/**
 * Temporary in-memory session
 * (KV/D1 persistence added later – LOCKED PLAN)
 */
const readingSessions = {};

/**
 * START READING
 */
export async function handleStartReading(update, env) {
  const chatId = update.callback_query.message.chat.id;
  const userId = update.callback_query.from.id;

  if (readingSessions[userId]) {
    await sendMessage(
      env,
      chatId,
`📖 *Reading already running*

⏱ Stay focused Doctor 💪`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const startTime = new Date();
  readingSessions[userId] = {
    start: startTime
  };

  const timeStr = startTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  await sendMessage(
    env,
    chatId,
`📚 *Reading STARTED* ✅

🕒 *Start Time:* ${timeStr}  
🎯 *Daily Target:* 8 Hours

🔥 Keep going Doctor 💪🦷  
🌟 Consistency beats intensity!`,
    {
      parse_mode: "Markdown",
      reply_markup: getMasterKeyboard(userId, ADMIN_ID)
    }
  );
}

/**
 * STOP READING
 */
export async function handleStopReading(update, env) {
  const chatId = update.callback_query.message.chat.id;
  const userId = update.callback_query.from.id;

  const session = readingSessions[userId];

  if (!session) {
    await sendMessage(
      env,
      chatId,
`⚠️ *No active reading session found*

Start reading first 📖`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const endTime = new Date();
  const durationMs = endTime - session.start;
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  delete readingSessions[userId];

  const startStr = session.start.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const endStr = endTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const totalMinutes = minutes;
  const targetMinutes = 8 * 60;
  const remaining = Math.max(targetMinutes - totalMinutes, 0);
  const remH = Math.floor(remaining / 60);
  const remM = remaining % 60;

  await sendMessage(
    env,
    chatId,
`⏸ *Reading STOPPED* ✅

🕒 *Start:* ${startStr}  
🕒 *End:* ${endStr}  
⏱ *Duration:* ${hours}h ${mins}m

📊 *Today Total:* ${hours}h ${mins}m  
🎯 *Target Left:* ${remH}h ${remM}m

🌟 Great job Doctor! Keep the momentum 💪`,
    {
      parse_mode: "Markdown",
      reply_markup: getMasterKeyboard(userId, ADMIN_ID)
    }
  );
      }
