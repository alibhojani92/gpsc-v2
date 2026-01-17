// src/routers/command.router.js

import { sendMessage } from "../utils/telegram.js";
import { masterKeyboard } from "../keyboards/master.keyboard.js";

import { handleStart } from "../handlers/start.handler.js";
import { handleReadStart, handleReadStop } from "../handlers/reading.handler.js";
import { handleDailyTest } from "../handlers/test.handler.js";
import { handleMCQPractice } from "../handlers/mcq.handler.js";
import { handleProgress } from "../handlers/progress.handler.js";
import { handleSubjectList } from "../handlers/subject.handler.js";
import { handleAdminPanel } from "../handlers/admin.handler.js";

/**
 * Main command router
 */
export async function commandRouter(update, env) {
  if (!update.message || !update.message.text) return;

  const text = update.message.text.trim();
  const chatId = update.message.chat.id;
  const userId = update.message.from.id;

  // Normalize command (capital/small safe)
  const command = text.split(" ")[0].toLowerCase();

  switch (command) {
    case "/start":
      return handleStart(env, chatId, userId);

    case "/read":
      return handleReadStart(env, chatId, userId);

    case "/stop":
      return handleReadStop(env, chatId, userId);

    case "/dt":
      return handleDailyTest(env, chatId, userId, text);

    case "/mcq":
      return handleMCQPractice(env, chatId, userId, text);

    case "/progress":
      return handleProgress(env, chatId, userId);

    case "/subjects":
      return handleSubjectList(env, chatId);

    case "/admin":
      return handleAdminPanel(env, chatId, userId);

    default:
      // ❌ Ignore random messages (NO SPAM BOT)
      return;
  }
}
