export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    const update = await request.json();

    if (update.message && update.message.text === "/start") {
      const chatId = update.message.chat.id;

      const messageText =
        "Welcome Dr Arzoo Fatema ❤️🌺\n\n" +
        "Please select an option 👇";

      const keyboard = {
        inline_keyboard: [
          [{ text: "📝 Start Exam", callback_data: "start_exam" }],
          [{ text: "📊 My Result", callback_data: "my_result" }],
          [{ text: "ℹ️ Help", callback_data: "help" }]
        ]
      };

      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          reply_markup: keyboard
        })
      });
    }

    return new Response("OK");
  }
};
