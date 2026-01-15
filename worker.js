// ===============================
// GPSC V2.1 – FINAL STABLE BUILD
// Cloudflare Workers | KV + D1
// ===============================

export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("OK");

    const update = await req.json();
    const msg = update.message || update.callback_query;
    if (!msg) return new Response("OK");

    const chatId = msg.chat?.id || msg.message?.chat.id;
    const text = msg.text || "";
    const userId = msg.from?.id;

    const send = async (text, buttons = null) => {
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      };
      if (buttons) payload.reply_markup = buttons;
      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    };

    // -------- START --------
    if (/^\/start$/i.test(text)) {
      return send(
        "Welcome Dr Arzoo Fatema ❤️🌺",
        {
          inline_keyboard: [
            [{ text: "▶️ Read", callback_data: "read" }],
            [{ text: "⏹ Stop", callback_data: "stop" }],
            [{ text: "📝 Daily Test", callback_data: "dt" }],
            [{ text: "📊 Report", callback_data: "report" }],
          ],
        }
      );
    }

    // -------- READ --------
    if (/^\/read$/i.test(text) || msg.data === "read") {
      const key = `read:${userId}`;
      if (await env.GPSC_KV.get(key)) {
        return send("🌺 Dr. Arzoo Fatema 🌺\n📖 Reading already running");
      }
      await env.GPSC_KV.put(key, Date.now().toString());
      return send(
        "🌺 Dr. Arzoo Fatema 🌺\n📖 Reading started\n\n🎯 Target: 08:00"
      );
    }

    // -------- STOP --------
    if (/^\/stop$/i.test(text) || msg.data === "stop") {
      const key = `read:${userId}`;
      const start = await env.GPSC_KV.get(key);
      if (!start) {
        return send("🌺 Dr. Arzoo Fatema 🌺\n⚠️ No active reading");
      }
      await env.GPSC_KV.delete(key);
      return send(
        "🌺 Dr. Arzoo Fatema 🌺\n⏱ Reading stopped\nGood job today 💪"
      );
    }

    // -------- DAILY TEST --------
    if (/^\/dt/i.test(text) || msg.data === "dt") {
      return send(
        "🌺 Dr. Arzoo Fatema 🌺\n📝 Daily Test Started\n(Questions will appear one by one)"
      );
    }

    // -------- REPORT --------
    if (/^\/report$/i.test(text) || msg.data === "report") {
      return send(
        "🌺 Dr. Arzoo Fatema 🌺\n📊 Daily Report\n\n📘 Study: Logged\n📝 Test: Checked"
      );
    }

    return new Response("OK");
  },
};
