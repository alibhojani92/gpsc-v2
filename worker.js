export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("OK");

    const update = await req.json();
    const TOKEN = env.BOT_TOKEN;
    const ADMIN = Number(env.ADMIN_ID);
    const GROUP = Number(env.GROUP_ID);
    const db = env.DB;

    const api = (method, body) =>
      fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    const send = (chat, text, kb = null) =>
      api("sendMessage", {
        chat_id: chat,
        text,
        parse_mode: "HTML",
        reply_markup: kb,
      });

    const isAdmin = (id) => id === ADMIN;
    const today = () => new Date().toISOString().slice(0, 10);

    /* ================= START ================= */

    if (update.message?.text) {
      const msg = update.message;
      const text = msg.text.toLowerCase();
      const uid = msg.from.id;
      const chat = msg.chat.id;

      /* -------- /start -------- */
      if (text === "/start") {
        return send(
          chat,
          "🌺 Dr. Arzoo Fatema 🌺\nWelcome ❤️\n\nChoose an option 👇",
          {
            inline_keyboard: [
              [{ text: "📖 Start Reading", callback_data: "READ" }],
              [{ text: "⏹ Stop Reading", callback_data: "STOP" }],
              [{ text: "📝 Daily Test", callback_data: "DT" }],
              [{ text: "📅 Weekly Test", callback_data: "WT" }],
              [{ text: "📊 Daily Report", callback_data: "DR" }],
              [{ text: "📈 Weekly Report", callback_data: "WR" }],
              [{ text: "📌 Stats", callback_data: "STATS" }],
              [{ text: "⚠️ Weak Subjects", callback_data: "WEAK" }],
            ],
          }
        );
      }

      /* -------- READ -------- */
      if (text === "/read") {
        if (isAdmin(uid)) return send(chat, "🛠 Admin read ignored");

        const exist = await db
          .prepare("SELECT * FROM reading_sessions WHERE user_id=?")
          .bind(uid)
          .first();

        if (exist)
          return send(
            chat,
            "🌺 Dr. Arzoo Fatema 🌺\n⚠️ Reading already running"
          );

        await db
          .prepare(
            "INSERT INTO reading_sessions (user_id,start_time) VALUES (?,?)"
          )
          .bind(uid, Date.now())
          .run();

        await send(
          chat,
          "🌺 Dr. Arzoo Fatema 🌺\n📖 Reading started\n🎯 Target: 08:00"
        );
        return send(ADMIN, "🛠 Admin\nStudent started reading");
      }

      /* -------- STOP -------- */
      if (text === "/stop") {
        if (isAdmin(uid)) return send(chat, "🛠 Admin stop ignored");

        const sess = await db
          .prepare("SELECT * FROM reading_sessions WHERE user_id=?")
          .bind(uid)
          .first();

        if (!sess)
          return send(
            chat,
            "🌺 Dr. Arzoo Fatema 🌺\n⚠️ No active reading session"
          );

        const mins = Math.floor((Date.now() - sess.start_time) / 60000);

        await db
          .prepare("DELETE FROM reading_sessions WHERE user_id=?")
          .bind(uid)
          .run();

        await db
          .prepare(
            "INSERT INTO reading_log (user_id,date,minutes) VALUES (?,?,?) \
             ON CONFLICT(user_id,date) DO UPDATE SET minutes=minutes+excluded.minutes"
          )
          .bind(uid, today(), mins)
          .run();

        await send(
          chat,
          `🌺 Dr. Arzoo Fatema 🌺\n⏹ Reading stopped\n📘 Today: ${mins} min`
        );
        return send(
          ADMIN,
          `🛠 Admin\nStudent stopped reading\nTime: ${mins} min`
        );
      }

      /* -------- REPORT -------- */
      if (text === "/report") {
        const r = await db
          .prepare(
            "SELECT SUM(minutes) as m FROM reading_log WHERE user_id=? AND date=?"
          )
          .bind(uid, today())
          .first();

        return send(
          chat,
          `🌺 Dr. Arzoo Fatema 🌺\n📊 Daily Report\n📘 Study: ${
            r?.m || 0
          } min`
        );
      }

      /* -------- STATS -------- */
      if (text === "/stats") {
        const r = await db
          .prepare(
            "SELECT SUM(minutes) as m FROM reading_log WHERE user_id=?"
          )
          .bind(uid)
          .first();

        return send(
          chat,
          `🌺 Dr. Arzoo Fatema 🌺\n📌 Overall Stats\n📘 Total Study: ${
            r?.m || 0
          } min`
        );
      }
    }

    /* ================= CALLBACKS ================= */

    if (update.callback_query) {
      const cq = update.callback_query;
      const uid = cq.from.id;
      const chat = cq.message.chat.id;
      const data = cq.data;

      if (data === "READ")
        return this.fetch(
          new Request(req.url, {
            method: "POST",
            body: JSON.stringify({ message: { text: "/read", from: { id: uid }, chat: { id: chat } } }),
          }),
          env
        );

      if (data === "STOP")
        return this.fetch(
          new Request(req.url, {
            method: "POST",
            body: JSON.stringify({ message: { text: "/stop", from: { id: uid }, chat: { id: chat } } }),
          }),
          env
        );

      if (data === "DR")
        return send(chat, "Use /report");

      if (data === "STATS")
        return send(chat, "Use /stats");
    }

    return new Response("OK");
  },
};
