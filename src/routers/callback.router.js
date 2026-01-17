// src/routers/callback.router.js

import { handleReadStart, handleReadStop } from "../handlers/reading.handler.js";
import { handleDailyTest } from "../handlers/test.handler.js";
import { handleMCQPractice } from "../handlers/mcq.handler.js";
import { handleProgress } from "../handlers/progress.handler.js";
import { handleSubjectList } from "../handlers/subject.handler.js";
import { handleAdminPanel } from "../handlers/admin.handler.js";

/**
 * Inline keyboard callback router
 */
export async function callbackRouter(update, env) {
  if (!update.callback_query) return;

  const query = update.callback_query;
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  switch (data) {
    case "READ_START":
      return handleReadStart(env, chatId, userId);

    case "READ_STOP":
      return handleReadStop(env, chatId, userId);

    case "DAILY_TEST":
      return handleDailyTest(env, chatId, userId);

    case "MCQ_PRACTICE":
      return handleMCQPractice(env, chatId, userId);

    case "MY_PROGRESS":
      return handleProgress(env, chatId, userId);

    case "SUBJECT_LIST":
      return handleSubjectList(env, chatId);

    case "ADMIN_PANEL":
      return handleAdminPanel(env, chatId, userId);

    default:
      // Unknown callback → ignore
      return;
  }
}
