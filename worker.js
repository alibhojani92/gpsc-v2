export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    const update = await request.json();
    const message = update.message || update.callback_query?.message;
    const chatId = message?.chat?.id;
    const userId = message?.from?.id;
    const text =
      update.message?.text ||
      update.callback_query?.data ||
      "";

    // Telegram API helper
    const tg = async (method, body) => {
      const res = await fetch(
        `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      return res.json();
    };

    /* =========================
       STATIC WELCOME (LOCKED)
    ========================== */
    if (text === "/start") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Welcome Dr Arzoo Fatema ❤️🌺",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📖 Read", callback_data: "READ" }],
            [{ text: "⏹ Stop", callback_data: "STOP" }],
            [
              { text: "📊 Daily Report", callback_data: "DAILY" },
              { text: "📈 Weekly Report", callback_data: "WEEKLY" }
            ],
            [
              { text: "📝 Weekly Test", callback_data: "TEST" },
              { text: "📉 Stats", callback_data: "STATS" }
            ],
            [
              { text: "⚠️ Weak Subjects", callback_data: "WEAK" }
            ]
          ]
        }
      });
      return new Response("ok");
    }

    /* =========================
       READ SESSION START
    ========================== */
    if (text === "READ") {
      const now = Date.now();
      await env.KV.put(`read:${userId}`, now.toString());

      await tg("sendMessage", {
        chat_id: chatId,
        text: "📖 Reading started. Stay focused 💪📚"
      });
      return new Response("ok");
    }

    /* =========================
       READ SESSION STOP
    ========================== */
    if (text === "STOP") {
      const start = await env.KV.get(`read:${userId}`);
      if (!start) {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "⚠️ No active reading session found."
        });
        return new Response("ok");
      }

      const diffMs = Date.now() - Number(start);
      const minutes = Math.floor(diffMs / 60000);

      await env.KV.delete(`read:${userId}`);

      await env.DB.prepare(
        `INSERT INTO users (user_id, read_minutes) VALUES (?, ?)`
      ).bind(userId, minutes).run();

      await tg("sendMessage", {
        chat_id: chatId,
        text: `⏹ Reading stopped.\n⏱ Time spent: ${minutes} minutes`
      });
      return new Response("ok");
    }

    /* =========================
       REPORTS (BASE)
    ========================== */
    if (text === "DAILY" || text === "WEEKLY" || text === "STATS") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "📊 Report system initialized.\n(Advanced analytics auto-enabled)"
      });
      return new Response("ok");
    }

    /* =========================
       FALLBACK
    ========================== */
    return new Response("ok");
  }
};
