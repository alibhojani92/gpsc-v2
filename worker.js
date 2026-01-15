export default {
  async fetch(request, env) {
    // Only accept Telegram POST requests
    if (request.method !== "POST") {
      return new Response("OK");
    }

    const update = await request.json();

    if (!update.message || !update.message.text) {
      return new Response("OK");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;

    // /start command
    if (text === "/start") {
      const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;

      const payload = {
        chat_id: chatId,
        text: "✅ GPSC V2 Bot is LIVE!\nWelcome 👋",
      };

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    return new Response("OK");
  },
};
