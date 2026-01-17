// src/handlers/start.handler.js

import { sendMessage } from "../utils/telegram.js";
import { getMasterKeyboard } from "../keyboards/master.keyboard.js";
import { ADMIN_ID } from "../env.js";

/**
 * /start command handler
 */
export async function handleStart(update, env) {
  const chatId = update.message.chat.id;
  const userId = update.message.from.id;

  const introText =
`🌺 Dr. Arzoo Fatema 🌺

Welcome Doctor ❤️🦷  
This bot will help you prepare for  
🎯 *GPSC Dental Class-2 Exam*

📌 Use the buttons below to:
• Track daily reading
• Practice MCQs
• Attempt tests
• Analyze performance

💪 Let’s build consistency, not stress`;

  await sendMessage(
    env,
    chatId,
    introText,
    {
      parse_mode: "Markdown",
      reply_markup: getMasterKeyboard(userId, ADMIN_ID)
    }
  );
}
