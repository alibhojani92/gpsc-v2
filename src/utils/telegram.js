// src/utils/telegram.js
// Telegram API helper for Dental GPSC Master Bot

const TELEGRAM_API = "https://api.telegram.org";

export async function sendMessage(env, chatId, text, keyboard = null) {
  const url = `${TELEGRAM_API}/bot${env.BOT_TOKEN}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function editMessage(env, chatId, messageId, text, keyboard = null) {
  const url = `${TELEGRAM_API}/bot${env.BOT_TOKEN}/editMessageText`;

  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function answerCallback(env, callbackId, text = "") {
  const url = `${TELEGRAM_API}/bot${env.BOT_TOKEN}/answerCallbackQuery`;

  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text,
      show_alert: false,
    }),
  });
}
