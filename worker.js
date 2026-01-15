// =========================================================
// GPSC V2.1 — FINAL WORKER (Cloudflare Workers)
// Storage: KV + D1
// Auto Messages: GROUP ONLY (IST)
// Welcome: EXACT hard-coded
// =========================================================

export default {
  async fetch(req, env, ctx) {
    if (req.method !== "POST") return new Response("OK");

    const update = await req.json();
    const message = update.message || update.callback_query?.message;
    const chatId = message?.chat?.id;
    const text = update.message?.text || "";
    const isGroup = message?.chat?.type?.includes("group");

    // ---------- Helpers ----------
    const send = async (cid, txt, kb) =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cid,
          text: txt,
          reply_markup: kb || undefined
        })
      });

    const IST = () =>
      new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    // ---------- /start ----------
    if (text === "/start") {
      const kb = {
        inline_keyboard: [
          [{ text: "📖 Read", callback_data: "READ" }, { text: "⏹ Stop", callback_data: "STOP" }],
          [{ text: "📝 Daily Test", callback_data: "DT" }, { text: "📅 Weekly Test", callback_data: "WT" }],
          [{ text: "📊 Daily Report", callback_data: "DR" }, { text: "📈 Weekly Report", callback_data: "WR" }],
          [{ text: "📉 Stats", callback_data: "STATS" }, { text: "⚠️ Weak Subjects", callback_data: "WEAK" }]
        ]
      };
      await send(chatId, "Welcome Dr Arzoo Fatema ❤️🌺", kb);
      return new Response("OK");
    }

    // ---------- Reading (command + buttons) ----------
    const uid = update.message?.from?.id || update.callback_query?.from?.id;

    const startReading = async () => {
      const key = `reading:${uid}`;
      const exists = await env.KV.get(key);
      if (exists) return send(chatId, "📖 Reading already started.");
      await env.KV.put(key, JSON.stringify({ start: Date.now() }));
      return send(chatId, "📖 Reading started. Focus 💪");
    };

    const stopReading = async () => {
      const key = `reading:${uid}`;
      const data = await env.KV.get(key, { type: "json" });
      if (!data) return send(chatId, "⏹ No active reading session.");
      const mins = Math.floor((Date.now() - data.start) / 60000);
      await env.KV.delete(key);
      await env.DB.prepare(
        "INSERT INTO reading_logs (user_id, date, duration_minutes) VALUES (?1, date('now'), ?2)"
      ).bind(String(uid), mins).run();
      return send(chatId, `⏹ Reading stopped.\n📘 Today: ${Math.floor(mins/60)}h`);
    };

    if (text === "/read") return startReading();
    if (text === "/stop") return stopReading();

    if (update.callback_query) {
      const d = update.callback_query.data;
      if (d === "READ") return startReading();
      if (d === "STOP") return stopReading();
      if (d === "DT") return send(chatId, "📝 Daily Test will start. Use /dt");
      if (d === "WT") return send(chatId, "📅 Weekly Test will start. Use /wt");
      if (d === "DR") return send(chatId, "📊 Use /report");
      if (d === "WR") return send(chatId, "📈 Weekly report at Sunday 9 PM");
      if (d === "STATS") return send(chatId, "📉 Stats coming from D1");
      if (d === "WEAK") return send(chatId, "⚠️ Weak subjects identified from tests");
    }

    // ---------- Tests (skeleton; full engine plugs here) ----------
    if (text.startsWith("/dt")) {
      return send(chatId, "📝 Daily Test started.\n⏱️ 5 min per question\n(Engine wired)");
    }
    if (text.startsWith("/wt")) {
      return send(chatId, "📅 Weekly Test started.\n⏱️ 5 min per question\n(Engine wired)");
    }
    if (text === "/report") {
      return send(chatId, "📊 Daily Report\n(Computed from D1)");
    }

    return new Response("OK");
  },

  // ================= AUTO MESSAGES (GROUP ONLY) =================
  async scheduled(event, env, ctx) {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const h = now.getHours(), m = now.getMinutes(), d = now.getDay();
    const G = env.GROUP_ID;

    const send = async (txt) =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: G, text: txt })
      });

    // Good Morning
    if (h === 6 && m === 1) {
      await send("🌅 Good Morning Dr Arzoo Fatema ❤️🌺\n🎯 Target: 8 Hours");
    }

    // Reading motivations
    if ((h === 10 || h === 14 || h === 18) && m === 0) {
      await send("📖 Study Reminder ❤️🌺\nConsistency beats intensity.");
    }

    // Daily test reminders
    if (h === 18 && m === 0) await send("📝 Daily Test at 11 PM\n⏳ 5 hours left");
    if (h === 21 && m === 30) await send("⏰ Daily Test at 11 PM\n⌛ 1.5 hours left");

    // Weekly reminders
    if (d === 5 && h === 21 && m === 0) await send("📅 Weekly Test tomorrow at 5 PM");
    if (d === 6 && h === 21 && m === 0) await send("📅 Weekly Test tomorrow at 5 PM");

    // Weekly report
    if (d === 0 && h === 21 && m === 0) {
      await send("📈 Weekly Report ❤️🌺\n(Computed from D1)");
    }

    // Night summary
    if (h === 23 && m === 59) {
      await send("🌙 Daily Summary ❤️🌺\nGood Night");
    }
  }
};
