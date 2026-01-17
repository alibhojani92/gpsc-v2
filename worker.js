export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Bot is running ✅", { status: 200 });
    }

    const update = await request.json();
    const BOT_TOKEN = env.BOT_TOKEN;
    const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

    // helper: send message
    async function send(chatId, text, keyboard = null) {
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      };
      if (keyboard) payload.reply_markup = keyboard;

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    // inline keyboard
    const mainKeyboard = {
      inline_keyboard: [
        [{ text: "📚 Start Reading", callback_data: "READ_START" }],
        [{ text: "⏸ Stop Reading", callback_data: "READ_STOP" }],
        [{ text: "📊 My Progress", callback_data: "PROGRESS" }],
      ],
    };

    /* ---------------- MESSAGE ---------------- */
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || "";

      if (text === "/start") {
        await send(
          chatId,
          "🌺 <b>Dr. Arzoo Fatema</b> 🌺\n\n" +
            "Welcome Doctor ❤️🦷\n" +
            "🎯 GPSC Dental Class-2 Preparation Bot\n\n" +
            "Use buttons below 👇",
          mainKeyboard
        );
      }
    }

    /* ---------------- CALLBACK ---------------- */
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message.chat.id;

      if (cq.data === "READ_START") {
        await send(
          chatId,
          "📚 <b>Reading STARTED</b> ✅\n\n" +
            "🕒 Start Time recorded\n" +
            "🎯 Daily Target: 8 Hours\n\n" +
            "🔥 Keep going Doctor 💪🦷"
        );
      }

      if (cq.data === "READ_STOP") {
        await send(
          chatId,
          "⏸ <b>Reading STOPPED</b> ✅\n\n" +
            "⏱ Session saved\n" +
            "🌟 Consistency beats intensity!"
        );
      }

      if (cq.data === "PROGRESS") {
        await send(
          chatId,
          "📊 <b>Today's Progress</b>\n\n" +
            "📘 Reading: 0h 0m\n" +
            "🎯 Target: 8h\n\n" +
            "💡 Start reading to build momentum!"
        );
      }

      // answer callback (remove loading)
      await fetch(`${API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: cq.id }),
      });
    }

    return new Response("ok", { status: 200 });
  },
};
