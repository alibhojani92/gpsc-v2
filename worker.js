// ===============================
// GPSC V2.1 – ENTERPRISE CORE
// Cloudflare Worker (Telegram Bot)
// ===============================

export default {
  async fetch(req, env, ctx) {
    if (req.method !== "POST") {
      return new Response("OK");
    }

    let update;
    try {
      update = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const message =
      update.message ||
      update.edited_message ||
      update.callback_query?.message;

    if (!message) return new Response("No message");

    const chatId = message.chat.id;
    const text = message.text || "";

    const send = (text) => sendMessage(env, chatId, text);

    try {
      // ---------------- START ----------------
      if (text === "/start") {
        await send("Welcome Dr Arzoo Fatema ❤️🌺");
        return ok();
      }

      // ---------------- ADD MCQ ----------------
      if (text.startsWith("/addmcq")) {
        /*
          Format:
          /addmcq
          Q. What is ...?
          A) ...
          B) ...
          C) ...
          D) ...
          Ans: B
          Subject: Anatomy
          Explanation: ....
        */
        const body = text.replace("/addmcq", "").trim();
        if (!body) {
          await send("❌ MCQ format missing.");
          return ok();
        }

        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO mcqs (id, raw) VALUES (?, ?)`
        ).bind(id, body).run();

        await send("✅ MCQ added successfully");
        return ok();
      }

      // ---------------- MCQ COUNT ----------------
      if (text === "/mcqcount") {
        const res = await env.DB.prepare(
          "SELECT COUNT(*) as c FROM mcqs"
        ).first();
        await send(`📚 Total MCQs: ${res?.c || 0}`);
        return ok();
      }

      // ---------------- READING START ----------------
      if (text === "/read") {
        await env.KV.put(`reading:${chatId}`, Date.now().toString());
        await send("📖 Reading started. Stay focused 💪📚");
        return ok();
      }

      // ---------------- READING STOP ----------------
      if (text === "/stop") {
        const start = await env.KV.get(`reading:${chatId}`);
        if (!start) {
          await send("⚠️ No active reading session found.");
          return ok();
        }
        await env.KV.delete(`reading:${chatId}`);
        await send("✅ Reading session saved.");
        return ok();
      }

      // ---------------- STATS ----------------
      if (text === "/stats") {
        const mcqs = await env.DB.prepare(
          "SELECT COUNT(*) as c FROM mcqs"
        ).first();
        await send(
          `📊 Stats\nMCQs: ${mcqs?.c || 0}\nMore coming soon…`
        );
        return ok();
      }

      // ---------------- WEAK SUBJECT ----------------
      if (text === "/weak") {
        await send("⚠️ Weak subject analysis coming (Phase-2)");
        return ok();
      }

      // ---------------- UNKNOWN ----------------
      if (text.startsWith("/")) {
        await send("❓ Unknown command");
      }

      return ok();
    } catch (err) {
      await send("❌ Internal error. Logged.");
      console.error(err);
      return ok();
    }
  },

  // ---------------- CRON (SAFE) ----------------
  async scheduled(event, env, ctx) {
    // Placeholder for auto reports
    console.log("Cron triggered:", event.cron);
  }
};

// ===============================
// HELPERS
// ===============================

function ok() {
  return new Response("OK");
}

async function sendMessage(env, chatId, text) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}
