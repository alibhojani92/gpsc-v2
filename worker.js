export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    const update = await request.json();
    const token = env.BOT_TOKEN;
    const adminId = Number(env.ADMIN_ID);

    const sendMessage = async (chatId, text, replyMarkup = null) => {
      const body = {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      };
      if (replyMarkup) body.reply_markup = replyMarkup;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    };

    const now = Date.now();

    /* =====================
       IN-MEMORY STORE
       (Later D1 replace)
    ===================== */
    globalThis.reading ??= {};
    const reading = globalThis.reading;

    /* =====================
       CALLBACK BUTTONS
    ===================== */
    if (update.callback_query) {
      const cq = update.callback_query;
      const userId = cq.from.id;
      const chatId = cq.message.chat.id;
      const data = cq.data;

      if (userId === adminId) {
        await sendMessage(chatId, "🛠 Admin action ignored");
        return new Response("OK");
      }

      if (data === "START_READ") {
        if (reading[userId]) {
          await sendMessage(
            chatId,
            "🌺 Dr. Arzoo Fatema 🌺\n⚠️ Reading already running\nUse Stop when finished"
          );
        } else {
          reading[userId] = now;
          await sendMessage(
            chatId,
            "🌺 Dr. Arzoo Fatema 🌺\n📖 Reading started\n\n🎯 Target: 08:00\nStay focused 💪"
          );
          await sendMessage(
            adminId,
            "🛠 Admin Panel\nStudent started reading"
          );
        }
      }

      if (data === "STOP_READ") {
        if (!reading[userId]) {
          await sendMessage(
            chatId,
            "🌺 Dr. Arzoo Fatema 🌺\n⚠️ No active reading session"
          );
        } else {
          const mins = Math.floor((now - reading[userId]) / 60000);
          delete reading[userId];

          await sendMessage(
            chatId,
            `🌺 Dr. Arzoo Fatema 🌺\n⏹ Reading stopped\n\n📘 Today: ${mins} min\n⏳ Remaining: ${Math.max(480 - mins, 0)} min`
          );
          await sendMessage(
            adminId,
            `🛠 Admin Panel\nStudent stopped reading\nTime logged: ${mins} min`
          );
        }
      }

      return new Response("OK");
    }

    /* =====================
       TEXT MESSAGES
    ===================== */
    if (!update.message || !update.message.text) {
      return new Response("OK");
    }

    const msg = update.message;
    const text = msg.text.toLowerCase();
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    /* ===== /start ===== */
    if (text === "/start") {
      await sendMessage(
        chatId,
        "🌺 Dr. Arzoo Fatema 🌺\nWelcome ❤️\n\nChoose an option 👇",
        {
          inline_keyboard: [
            [{ text: "📖 Start Reading", callback_data: "START_READ" }],
            [{ text: "⏹ Stop Reading", callback_data: "STOP_READ" }],
            [{ text: "📝 Daily Test", callback_data: "DAILY_TEST" }],
            [{ text: "📊 Report", callback_data: "REPORT" }],
          ],
        }
      );
    }

    /* ===== /read ===== */
    if (text === "/read") {
      if (userId === adminId) {
        await sendMessage(chatId, "🛠 Admin read ignored");
        return new Response("OK");
      }

      if (reading[userId]) {
        await sendMessage(
          chatId,
          "🌺 Dr. Arzoo Fatema 🌺\n⚠️ Reading already running\nUse Stop when finished"
        );
      } else {
        reading[userId] = now;
        await sendMessage(
          chatId,
          "🌺 Dr. Arzoo Fatema 🌺\n📖 Reading started\n\n🎯 Target: 08:00\nStay focused 💪"
        );
        await sendMessage(
          adminId,
          "🛠 Admin Panel\nStudent started reading"
        );
      }
    }

    /* ===== /stop ===== */
    if (text === "/stop") {
      if (userId === adminId) {
        await sendMessage(chatId, "🛠 Admin stop ignored");
        return new Response("OK");
      }

      if (!reading[userId]) {
        await sendMessage(
          chatId,
          "🌺 Dr. Arzoo Fatema 🌺\n⚠️ No active reading session"
        );
      } else {
        const mins = Math.floor((now - reading[userId]) / 60000);
        delete reading[userId];

        await sendMessage(
          chatId,
          `🌺 Dr. Arzoo Fatema 🌺\n⏹ Reading stopped\n\n📘 Today: ${mins} min\n⏳ Remaining: ${Math.max(480 - mins, 0)} min`
        );
        await sendMessage(
          adminId,
          `🛠 Admin Panel\nStudent stopped reading\nTime logged: ${mins} min`
        );
      }
    }

    return new Response("OK");
  },
};
