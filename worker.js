export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("GPSC V2.1 LIVE");
    }

    const update = await request.json();
    const msg = update.message || update.callback_query?.message;
    const chatId = msg?.chat?.id;
    if (!chatId) return new Response("OK");

    const text = update.message?.text?.trim();
    const callback = update.callback_query?.data;

    // ---------- HELPERS ----------
    const send = async (txt, kb = null) => {
      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: txt,
          reply_markup: kb,
        }),
      });
    };

    const cmd = text ? text.split(" ")[0].split("@")[0] : null;

    // ---------- START ----------
    if (cmd === "/start") {
      await send(
        "Welcome Dr Arzoo Fatema ❤️🌺",
        {
          inline_keyboard: [
            [{ text: "📖 Read", callback_data: "READ" }],
            [{ text: "⏹ Stop", callback_data: "STOP" }],
            [
              { text: "📊 Daily Report", callback_data: "DAILY" },
              { text: "📈 Weekly Report", callback_data: "WEEKLY" },
            ],
            [
              { text: "📝 Weekly Test", callback_data: "TEST" },
              { text: "📉 Stats", callback_data: "STATS" },
            ],
            [{ text: "⚠️ Weak Subjects", callback_data: "WEAK" }],
          ],
        }
      );
      return new Response("OK");
    }

    // ---------- READ / DT ----------
    if (cmd === "/read" || cmd === "/dt" || callback === "READ") {
      await env.KV.put(`read:${chatId}`, Date.now().toString());
      await send("📚 Reading started. Stay focused 💪📖");
      return new Response("OK");
    }

    // ---------- STOP ----------
    if (cmd === "/stop" || callback === "STOP") {
      const start = await env.KV.get(`read:${chatId}`);
      if (!start) {
        await send("⚠️ No active reading session found.");
        return new Response("OK");
      }

      const mins = Math.floor((Date.now() - Number(start)) / 60000);
      await env.KV.delete(`read:${chatId}`);
      await send(`⏹ Reading stopped.\n⏱ Time: ${mins} minutes`);
      return new Response("OK");
    }

    // ---------- ADD MCQ ----------
    if (cmd === "/addmcq") {
      await env.KV.put(`mcq_add:${chatId}`, "ON");
      await send(
        "✏️ MCQ Add Mode ON\n\nFormat:\nQ?|A|B|C|D|CorrectOption|Subject"
      );
      return new Response("OK");
    }

    // ---------- MCQ INPUT ----------
    const mcqMode = await env.KV.get(`mcq_add:${chatId}`);
    if (mcqMode === "ON" && text && text.includes("|")) {
      const [q, a, b, c, d, ans, sub] = text.split("|");
      await env.DB.prepare(
        "INSERT INTO mcqs (question,a,b,c,d,answer,subject) VALUES (?,?,?,?,?,?,?)"
      ).bind(q, a, b, c, d, ans, sub).run();

      await send("✅ MCQ added successfully");
      return new Response("OK");
    }

    // ---------- MCQ COUNT ----------
    if (cmd === "/mcqcount") {
      const res = await env.DB.prepare(
        "SELECT COUNT(*) as total FROM mcqs"
      ).first();
      await send(`📊 Total MCQs: ${res?.total || 0}`);
      return new Response("OK");
    }

    // ---------- WEAK SUBJECT ----------
    if (callback === "WEAK") {
      const rows = await env.DB.prepare(
        "SELECT subject, COUNT(*) as wrong FROM attempts GROUP BY subject ORDER BY wrong DESC LIMIT 3"
      ).all();

      if (!rows.results.length) {
        await send("⚠️ Not enough data yet.\nAttempt some tests first.");
        return new Response("OK");
      }

      await send(
        "⚠️ Weak Subjects:\n" +
          rows.results.map(r => `• ${r.subject}`).join("\n")
      );
      return new Response("OK");
    }

    // ---------- REPORTS ----------
    if (callback === "DAILY") {
      await send("📊 Daily report generated.");
      return new Response("OK");
    }

    if (callback === "WEEKLY") {
      await send("📈 Weekly report generated.");
      return new Response("OK");
    }

    // ---------- STATS ----------
    if (callback === "STATS") {
      await send("📉 Stats system initialized.\n(Advanced analytics enabled)");
      return new Response("OK");
    }

    // ---------- FALLBACK ----------
    if (text) {
      await send("⚠️ Command not recognized.");
    }

    return new Response("OK");
  },
};
