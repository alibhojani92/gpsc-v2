/**
 * GPSC DENTAL – READING BOT
 * Single-file engine
 * Author: Locked Spec
 */

const BOT_TOKEN = "8350086915:AAGtzNoCW-zqJEZlnS8cnEiszDFaaWy3KVM";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const DAILY_TARGET_MIN = 8 * 60;

// In-memory store (fine for 1–2 months)
const readingSessions = {};
const readingTotals = {};

async function sendMessage(chatId, text, keyboard = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };
  if (keyboard) payload.reply_markup = keyboard;

  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📚 Start Reading", callback_data: "START_READING" }],
      [{ text: "⏸ Stop Reading", callback_data: "STOP_READING" }],
      [{ text: "📊 Today Progress", callback_data: "TODAY_PROGRESS" }],
    ],
  };
}

function minutesToHM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export default {
  async fetch(req) {
    if (req.method !== "POST") {
      return new Response("Reading Bot Active ✅");
    }

    const update = await req.json();

    /* ===== TEXT COMMANDS ===== */
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text?.toLowerCase() || "";

      if (text === "/start") {
        await sendMessage(
          chatId,
`🌺 *Dr. Arzoo Fatema* 🌺

Welcome Doctor ❤️🦷  
This bot helps you build  
*consistent reading habit* for  
🎯 *GPSC Dental Class-2*

🎯 Daily Target: *8 Hours*

Use buttons below 👇`,
          mainKeyboard()
        );
        return new Response("ok");
      }

      if (text === "/startreading") {
        update.callback_query = {
          message: { chat: { id: chatId } },
          data: "START_READING",
        };
      }

      if (text === "/stopreading") {
        update.callback_query = {
          message: { chat: { id: chatId } },
          data: "STOP_READING",
        };
      }

      // Ignore random chat
      return new Response("ok");
    }

    /* ===== INLINE BUTTONS ===== */
    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const action = update.callback_query.data;

      const now = Date.now();
      const today = new Date().toISOString().slice(0, 10);

      if (!readingTotals[today]) readingTotals[today] = 0;

      // START READING
      if (action === "START_READING") {
        if (readingSessions[chatId]) {
          await sendMessage(
            chatId,
"📖 Reading already running ✅\nStay focused 💪"
          );
          return new Response("ok");
        }

        readingSessions[chatId] = now;

        await sendMessage(
          chatId,
`📚 *Reading STARTED* ✅

🕒 Start Time: ${new Date(now).toLocaleTimeString()}
🎯 Daily Target: 8 Hours

🔥 Keep going Doctor 💪🦷`,
          mainKeyboard()
        );
        return new Response("ok");
      }

      // STOP READING
      if (action === "STOP_READING") {
        if (!readingSessions[chatId]) {
          await sendMessage(
            chatId,
"⚠️ Reading not started yet."
          );
          return new Response("ok");
        }

        const start = readingSessions[chatId];
        delete readingSessions[chatId];

        const sessionMin = Math.floor((now - start) / 60000);
        readingTotals[today] += sessionMin;

        const left = Math.max(
          DAILY_TARGET_MIN - readingTotals[today],
          0
        );

        await sendMessage(
          chatId,
`⏸ *Reading STOPPED* ✅

🕒 Start: ${new Date(start).toLocaleTimeString()}
🕒 End: ${new Date(now).toLocaleTimeString()}
⏱ Duration: ${minutesToHM(sessionMin)}

📊 *Today Total:* ${minutesToHM(readingTotals[today])}
🎯 *Target Left:* ${minutesToHM(left)}

🌟 Consistency beats intensity!`,
          mainKeyboard()
        );
        return new Response("ok");
      }

      // TODAY PROGRESS
      if (action === "TODAY_PROGRESS") {
        await sendMessage(
          chatId,
`📊 *Today's Reading*

📘 Total: ${minutesToHM(readingTotals[today] || 0)}
🎯 Target: 8 Hours`,
          mainKeyboard()
        );
        return new Response("ok");
      }
    }

    return new Response("ok");
  },
};
