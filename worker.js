/**
 * GPSC Exam 2.0 – Phase 1 Core Stable Bot
 * Platform: Cloudflare Workers
 * Webhook-based Telegram bot
 * Author: Locked build – Phase 1
 */

/* ================== ENV BINDINGS ================== */
/*
Required bindings (set in Cloudflare dashboard):

BOT_TOKEN   = Telegram Bot Token
ADMIN_ID    = 7539477188
GROUP_ID    = -5154292869

D1 Database Binding:
DB          = gpsc_v2_db

KV Namespace Binding:
KV          = GPSC_V21_DB
*/

/* ================== CONSTANTS ================== */

const TELEGRAM_API = "https://api.telegram.org/bot";
const WELCOME_TEXT = "🌺 Welcome Dr Arzoo Fatema ❤️🌺";

/* ================== UTILS ================== */

async function sendMessage(token, chatId, text) {
  const url = `${TELEGRAM_API}${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text,
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function isCommand(text, cmd) {
  if (!text) return false;
  return text.trim().toLowerCase() === cmd;
}

/* ================== MAIN HANDLER ================== */

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    let update;
    try {
      update = await request.json();
    } catch (err) {
      console.error("Invalid JSON", err);
      return new Response("Bad Request", { status: 400 });
    }

    if (!update.message) {
      return new Response("No message", { status: 200 });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from?.id;
    const text = message.text || "";

    /* ===== Security: Group Lock ===== */
    if (chatId !== Number(env.GROUP_ID) && chatId > 0) {
      // Ignore private chats for Phase-1
      return new Response("Ignored", { status: 200 });
    }

    /* ===== /start ===== */
    if (isCommand(text, "/start")) {
      await sendMessage(env.BOT_TOKEN, chatId, WELCOME_TEXT);
      return new Response("OK", { status: 200 });
    }

    /* ===== /ping ===== */
    if (isCommand(text, "/ping")) {
      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        "✅ Bot is alive and running smoothly"
      );
      return new Response("OK", { status: 200 });
    }

    /* ===== /help ===== */
    if (isCommand(text, "/help")) {
      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        "ℹ️ Available Commands:\n/start\n/ping\n/help"
      );
      return new Response("OK", { status: 200 });
    }

    /* ===== Unknown Command ===== */
    if (text.startsWith("/")) {
      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        "⚠️ Unknown command. Use /help"
      );
    }

    return new Response("OK", { status: 200 });
  },
};
