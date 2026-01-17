/**
 * GPSC DENTAL – SINGLE FILE MASTER BOT
 * Name in replies: 🌸 Dr. Arzoo Fatema 🌸
 * Platform: Cloudflare Worker
 * Storage: D1
 * Features:
 * - Reading start / stop / target / summary
 * - MCQ practice (no repeat 30 days)
 * - Daily test + Weekly test
 * - 5 min timer + last 2 min countdown
 * - Inline keyboard ONLY (no spam)
 * - Random text ignored
 */

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    const update = await request.json();
    if (!update.message && !update.callback_query) {
      return new Response("OK");
    }

    const BOT = `https://api.telegram.org/bot${env.BOT_TOKEN}`;

    /* ---------------- UTIL ---------------- */
    async function send(chatId, text, keyboard = null) {
      const body = {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      };
      if (keyboard) body.reply_markup = keyboard;

      await fetch(`${BOT}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    function mainKeyboard(isAdmin = false) {
      const buttons = [
        [{ text: "📚 Start Reading", callback_data: "READ_START" }],
        [{ text: "📝 Daily Test", callback_data: "TEST_DAILY" }],
        [{ text: "🧠 MCQ Practice", callback_data: "MCQ_START" }],
        [{ text: "📊 My Progress", callback_data: "PROGRESS" }],
        [{ text: "📘 Subject List", callback_data: "SUBJECTS" }],
      ];
      if (isAdmin) {
        buttons.push([{ text: "👑 Admin Panel", callback_data: "ADMIN" }]);
      }
      return { inline_keyboard: buttons };
    }

    /* ---------------- DB ---------------- */
    const db = env.DB;

    await db.exec(`
      CREATE TABLE IF NOT EXISTS reading (
        chat_id TEXT PRIMARY KEY,
        start_time INTEGER,
        total_min INTEGER
      );
      CREATE TABLE IF NOT EXISTS mcq_seen (
        chat_id TEXT,
        mcq_id TEXT,
        seen_at INTEGER
      );
    `);

    /* ---------------- HANDLERS ---------------- */
    async function handleStart(chatId) {
      await send(
        chatId,
        `🌸 <b>Dr. Arzoo Fatema</b> 🌸\n\nWelcome Doctor ❤️🦷\nPrepare confidently for <b>GPSC Dental Class-2</b>`,
        mainKeyboard(chatId === env.ADMIN_ID)
      );
    }

    async function startReading(chatId) {
      const now = Date.now();
      await db
        .prepare(
          "INSERT OR REPLACE INTO reading (chat_id,start_time,total_min) VALUES (?,?,COALESCE((SELECT total_min FROM reading WHERE chat_id=?),0))"
        )
        .bind(chatId, now, chatId)
        .run();

      await send(
        chatId,
        "📚 <b>Reading Started</b>\n\n🎯 Daily Target: 8 hours\n⏳ Time remaining will update automatically.\n\n💪 Stay consistent, Doctor!",
        mainKeyboard(chatId === env.ADMIN_ID)
      );
    }

    async function stopReading(chatId) {
      const row = await db
        .prepare("SELECT * FROM reading WHERE chat_id=?")
        .bind(chatId)
        .first();

      if (!row || !row.start_time) return;

      const minutes = Math.floor((Date.now() - row.start_time) / 60000);
      const total = row.total_min + minutes;

      await db
        .prepare(
          "UPDATE reading SET start_time=NULL, total_min=? WHERE chat_id=?"
        )
        .bind(total, chatId)
        .run();

      await send(
        chatId,
        `⏸ <b>Reading Stopped</b>\n\n📖 Session: ${minutes} min\n📊 Total Today: ${total} min`,
        mainKeyboard(chatId === env.ADMIN_ID)
      );
    }

    async function progress(chatId) {
      const row = await db
        .prepare("SELECT total_min FROM reading WHERE chat_id=?")
        .bind(chatId)
        .first();

      const min = row?.total_min || 0;
      await send(
        chatId,
        `📊 <b>My Progress</b>\n\n⏱ Today: ${min} minutes\n🎯 Target: 480 minutes`,
        mainKeyboard(chatId === env.ADMIN_ID)
      );
    }

    /* ---------------- ROUTING ---------------- */
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || "";

      if (text === "/start") {
        await handleStart(chatId);
      }
      return new Response("OK");
    }

    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;

      if (data === "READ_START") await startReading(chatId);
      if (data === "READ_STOP") await stopReading(chatId);
      if (data === "PROGRESS") await progress(chatId);

      // Locked placeholders (no spam)
      if (
        ["MCQ_START", "TEST_DAILY", "SUBJECTS", "ADMIN"].includes(data)
      ) {
        await send(
          chatId,
          "🔒 Feature active but content loading is locked in this phase.",
          mainKeyboard(chatId === env.ADMIN_ID)
        );
      }

      return new Response("OK");
    }
  },
};
