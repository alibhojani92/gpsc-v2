/************************************************************
 * GPSC V2.1 — PART 0
 * Base Boilerplate (Enterprise Safe)
 * Do NOT edit this section
 ************************************************************/

/* ===================== ENV ===================== */
const BOT_TOKEN = TELEGRAM_BOT_TOKEN; // from Worker env
const ADMIN_ID = Number(ADMIN_ID_ENV);
const GROUP_ID = Number(GROUP_ID_ENV);

/* ===================== CONSTANTS ===================== */
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const JSON_HEADERS = { "content-type": "application/json" };

/* ===================== UTILITIES ===================== */

// Safe JSON parse (prevents worker crash)
async function safeJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

// Telegram API caller
async function tg(method, payload) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return res;
}

// Send text message
async function sendMessage(chatId, text, options = {}) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...options,
  });
}

// Answer callback (inline buttons)
async function answerCallback(id) {
  return tg("answerCallbackQuery", { callback_query_id: id });
}

// IST date-time helpers
function nowIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

function todayIST() {
  return nowIST().toISOString().slice(0, 10);
}

function formatTimeHM(date) {
  let h = date.getHours();
  let m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Welcome message (LOCKED)
function welcomeText() {
  return "Welcome Dr Arzoo Fatema ❤️🌺";
}

// Role helpers
function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function isGroup(chatId) {
  return chatId === GROUP_ID;
}

/* ===================== GLOBAL GUARDS ===================== */

// Never crash silently
function logError(e) {
  console.error("GPSC V2.1 ERROR:", e);
}

// Prevent duplicate webhook processing
let PROCESSING = false;

/* ===================== MAIN FETCH ===================== */
export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method !== "POST") {
        return new Response("GPSC V2.1 BOT RUNNING ✅");
      }

      const update = await safeJson(request);
      if (!update) {
        return new Response("INVALID UPDATE", { status: 200 });
      }

      // Prevent double execution
      if (PROCESSING) {
        return new Response("BUSY", { status: 200 });
      }
      PROCESSING = true;

      /* ========== ROUTING ========== */

      // MESSAGE
      if (update.message) {
        await handleMessage(update.message, env);
      }

      // CALLBACK QUERY
      if (update.callback_query) {
        await handleCallback(update.callback_query, env);
      }

      PROCESSING = false;
      return new Response("OK", { status: 200 });

    } catch (e) {
      PROCESSING = false;
      logError(e);
      return new Response("ERROR", { status: 200 });
    }
  },
};

/* ===================== HANDLERS ===================== */

// Message handler (commands / text)
async function handleMessage(msg, env) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = (msg.text || "").trim();

  // /start
  if (text === "/start") {
    await sendMessage(chatId, welcomeText(), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📖 Start Reading", callback_data: "READ_START" },
            { text: "⏹ Stop Reading", callback_data: "READ_STOP" },
          ],
          [
            { text: "📝 Daily Test", callback_data: "DT" },
            { text: "📊 Report", callback_data: "REPORT" },
          ],
        ],
      },
    });
    return;
  }

  // Other commands will be handled in next parts
}

// Callback handler (inline buttons)
async function handleCallback(cb, env) {
  const data = cb.data;
  const chatId = cb.message.chat.id;

  await answerCallback(cb.id);

  // Placeholder — real logic in next parts
  if (data === "READ_START") {
    await sendMessage(chatId, "📖 Reading feature loading…");
    return;
  }
  if (data === "READ_STOP") {
    await sendMessage(chatId, "⏹ Stop feature loading…");
    return;
  }
  if (data === "DT") {
    await sendMessage(chatId, "📝 Daily Test loading…");
    return;
  }
  if (data === "REPORT") {
    await sendMessage(chatId, "📊 Report loading…");
    return;
  }
}

/************************************************************
 * END OF PART 0
 ************************************************************/

/************************************************************
 * GPSC V2.1 — PART 1 (FIXED)
 * Storage Layer (D1 + KV)
 * Compatible with:
 *   D1 binding  : DB  (gpsc_v2_db)
 *   KV binding  : KV  (GPSC_V21_DB)
 ************************************************************/

/* ===================== KV HELPERS ===================== */

async function kvGet(key, def = null, env) {
  try {
    const v = await env.KV.get(key);
    return v ? JSON.parse(v) : def;
  } catch (e) {
    return def;
  }
}

async function kvSet(key, value, env, ttl = null) {
  const opt = ttl ? { expirationTtl: ttl } : {};
  await env.KV.put(key, JSON.stringify(value), opt);
}

async function kvDel(key, env) {
  await env.KV.delete(key);
}

/* ===================== D1 HELPERS ===================== */

async function dbExec(sql, params = [], env) {
  try {
    return await env.DB.prepare(sql).bind(...params).run();
  } catch (e) {
    console.error("DB ERROR:", e);
    return null;
  }
}

async function dbAll(sql, params = [], env) {
  try {
    const res = await env.DB.prepare(sql).bind(...params).all();
    return res.results || [];
  } catch (e) {
    console.error("DB ERROR:", e);
    return [];
  }
}

async function dbOne(sql, params = [], env) {
  const rows = await dbAll(sql, params, env);
  return rows.length ? rows[0] : null;
}

/* ===================== DATE (IST) ===================== */

function todayIST() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 330);
  return d.toISOString().split("T")[0];
}

/* ===================== TABLE INIT ===================== */

async function ensureTables(env) {
  await dbExec(`
    CREATE TABLE IF NOT EXISTS mcqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      question TEXT,
      opt_a TEXT,
      opt_b TEXT,
      opt_c TEXT,
      opt_d TEXT,
      correct TEXT,
      explanation TEXT,
      created_at TEXT
    )
  `, [], env);

  await dbExec(`
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      test_type TEXT,
      subject TEXT,
      total INTEGER,
      correct INTEGER,
      wrong INTEGER,
      accuracy REAL,
      created_at TEXT
    )
  `, [], env);

  await dbExec(`
    CREATE TABLE IF NOT EXISTS reading_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT,
      minutes INTEGER
    )
  `, [], env);
}

/* ===================== KV KEYS ===================== */

const readingKey = (uid) => `reading:${uid}`;
const testKey = (uid) => `test:${uid}`;

/* ===================== READING CORE ===================== */

async function startReading(uid, env) {
  const k = readingKey(uid);
  const exists = await kvGet(k, null, env);
  if (exists) return false;

  await kvSet(k, { start: Date.now() }, env);
  return true;
}

async function stopReading(uid, env) {
  const k = readingKey(uid);
  const s = await kvGet(k, null, env);
  if (!s) return null;

  await kvDel(k, env);
  return Math.floor((Date.now() - s.start) / 60000);
}

async function saveReading(uid, minutes, env) {
  const date = todayIST();
  const row = await dbOne(
    "SELECT * FROM reading_logs WHERE user_id=? AND date=?",
    [uid, date],
    env
  );

  if (row) {
    await dbExec(
      "UPDATE reading_logs SET minutes=? WHERE id=?",
      [row.minutes + minutes, row.id],
      env
    );
  } else {
    await dbExec(
      "INSERT INTO reading_logs (user_id, date, minutes) VALUES (?,?,?)",
      [uid, date, minutes],
      env
    );
  }
}

/************************************************************
 * END OF PART 1
 ************************************************************/

/************************************************************
 * GPSC V2.1 — PART 2
 * Core Telegram Bot Flow
 ************************************************************/

const TELEGRAM_API = "https://api.telegram.org/bot";

/* ===================== TELEGRAM HELPERS ===================== */

async function tg(method, payload, env) {
  const res = await fetch(
    `${TELEGRAM_API}${env.BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
  return res.json();
}

async function sendMessage(chatId, text, env, extra = {}) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra
  }, env);
}

/* ===================== KEYBOARD ===================== */

function mainKeyboard() {
  return {
    keyboard: [
      [{ text: "📖 Read" }, { text: "⏹ Stop" }],
      [{ text: "📊 Daily Report" }, { text: "📈 Weekly Report" }],
      [{ text: "📝 Weekly Test" }, { text: "📉 Stats" }],
      [{ text: "⚠️ Weak Subjects" }]
    ],
    resize_keyboard: true
  };
}

/* ===================== COMMAND HANDLER ===================== */

if (await handleMCQCommands(text, chatId, env)) return;
async function handleCommand(text, chat, from, env) {
  const uid = from.id;
  const chatId = chat.id;

  /* -------- /start -------- */
  if (text === "/start") {
    await sendMessage(
      chatId,
      "Welcome Dr Arzoo Fatema ❤️🌺",
      env,
      { reply_markup: mainKeyboard() }
    );
    return;
  }

  /* -------- /read -------- */
  if (text === "/read" || text === "📖 Read") {
    const ok = await startReading(uid, env);
    if (!ok) {
      await sendMessage(chatId, "⚠️ Reading already active.", env);
      return;
    }
    await sendMessage(
      chatId,
      "📖 Reading started. Stay focused 💪📚",
      env
    );
    return;
  }

  /* -------- /stop -------- */
  if (text === "/stop" || text === "⏹ Stop") {
    const mins = await stopReading(uid, env);
    if (!mins) {
      await sendMessage(chatId, "⚠️ No active reading session found.", env);
      return;
    }
    await saveReading(uid, mins, env);
    await sendMessage(
      chatId,
      `⏱ Reading stopped.\nTotal today: <b>${mins} min</b>`,
      env
    );
    return;
  }

  /* -------- REPORTS (TEMP RESPONSES) -------- */

  if (text.includes("Daily Report")) {
    await sendMessage(chatId, "📊 Daily report initialized.", env);
    return;
  }

  if (text.includes("Weekly Report")) {
    await sendMessage(chatId, "📈 Weekly report initialized.", env);
    return;
  }

  if (text.includes("Weekly Test")) {
    await sendMessage(chatId, "📝 Weekly test module loading...", env);
    return;
  }

  if (text.includes("Stats")) {
    await sendMessage(chatId, "📉 Stats engine initialized.", env);
    return;
  }

  if (text.includes("Weak")) {
    await sendMessage(chatId, "⚠️ Weak subject analytics loading...", env);
    return;
  }
}

/* ===================== FETCH ENTRY ===================== */

export default {
  async fetch(req, env) {
    if (req.method !== "POST") {
      return new Response("OK");
    }

    const update = await req.json();

    if (!update.message) {
      return new Response("OK");
    }

    const msg = update.message;
    const text = msg.text || "";

    try {
      await handleCommand(text, msg.chat, msg.from, env);
    } catch (e) {
      console.error("BOT ERROR:", e);
      await sendMessage(
        msg.chat.id,
        "❌ Internal error. Please try again.",
        env
      );
    }

    return new Response("OK");
  }
};

/************************************************************
 * END OF PART 2
 ************************************************************/

/************************************************************
 * GPSC V2.1 — PART 3
 * MCQ SYSTEM (ADD / COUNT / SUBJECT / EXPLANATION)
 ************************************************************/

/* ===================== MCQ PARSER ===================== */

function parseMCQs(text) {
  const blocks = text.split(/\n\s*\n/);
  const mcqs = [];

  for (const block of blocks) {
    const qMatch = block.match(/^(Q\.?\d*\s*)?(.*)/i);
    const a = block.match(/A[\).]\s*(.*)/i);
    const b = block.match(/B[\).]\s*(.*)/i);
    const c = block.match(/C[\).]\s*(.*)/i);
    const d = block.match(/D[\).]\s*(.*)/i);
    const ans = block.match(/Ans[:\-]?\s*([A-D])/i);
    const exp = block.match(/Explanation[:\-]?\s*(.*)/i);
    const sub = block.match(/Subject[:\-]?\s*(.*)/i);

    if (!a || !b || !c || !d || !ans) continue;

    mcqs.push({
      question: qMatch ? qMatch[2].trim() : "",
      a: a[1].trim(),
      b: b[1].trim(),
      c: c[1].trim(),
      d: d[1].trim(),
      correct: ans[1].toUpperCase(),
      explanation: exp ? exp[1].trim() : "",
      subject: sub ? sub[1].trim() : "General"
    });
  }
  return mcqs;
}

/* ===================== MCQ COMMANDS ===================== */

async function handleMCQCommands(text, chatId, env) {

  /* -------- /addmcq -------- */
  if (text.startsWith("/addmcq")) {
    const content = text.replace("/addmcq", "").trim();
    if (!content) {
      await sendMessage(chatId, "❌ Send MCQ content after /addmcq", env);
      return true;
    }

    const mcqs = parseMCQs(content);
    if (mcqs.length === 0) {
      await sendMessage(chatId, "❌ Invalid MCQ format.", env);
      return true;
    }

    const stmt = env.DB.prepare(
      `INSERT INTO mcqs 
      (question, option_a, option_b, option_c, option_d, correct, explanation, subject, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const m of mcqs) {
      await stmt.bind(
        m.question,
        m.a,
        m.b,
        m.c,
        m.d,
        m.correct,
        m.explanation,
        m.subject,
        Date.now()
      ).run();
    }

    await sendMessage(
      chatId,
      `✅ ${mcqs.length} MCQ(s) added successfully.`,
      env
    );
    return true;
  }

  /* -------- /mcqcount -------- */
  if (text === "/mcqcount") {
    const res = await env.DB.prepare(
      "SELECT COUNT(*) as total FROM mcqs"
    ).first();

    await sendMessage(
      chatId,
      `📚 Total MCQs: <b>${res.total}</b>`,
      env
    );
    return true;
  }

  return false;
}

/* ===================== PATCH INTO MAIN HANDLER ===================== */
/*  ADD THIS INSIDE handleCommand() CALL FLOW  */

/************************************************************
 * GPSC V2.1 — PART 4
 * TEST ENGINE + ANALYTICS CORE
 ************************************************************/

/* ===================== TEST GENERATOR ===================== */

async function generateTest(env, limit = 10) {
  const res = await env.DB.prepare(
    "SELECT * FROM mcqs ORDER BY RANDOM() LIMIT ?"
  ).bind(limit).all();

  return res.results || [];
}

/* ===================== START TEST ===================== */

async function startTest(chatId, userId, type, env) {
  const questions = await generateTest(env, type === "dt" ? 5 : 10);

  if (!questions.length) {
    await sendMessage(chatId, "❌ No MCQs available.", env);
    return;
  }

  await env.KV.put(
    `test:${userId}`,
    JSON.stringify({ index: 0, score: 0, questions, type })
  );

  await askQuestion(chatId, userId, env);
}

/* ===================== ASK QUESTION ===================== */

async function askQuestion(chatId, userId, env) {
  const data = JSON.parse(await env.KV.get(`test:${userId}`));
  const q = data.questions[data.index];

  if (!q) {
    await finishTest(chatId, userId, env);
    return;
  }

  const msg =
`📝 Question ${data.index + 1}

${q.question}

A) ${q.option_a}
B) ${q.option_b}
C) ${q.option_c}
D) ${q.option_d}

Reply with A / B / C / D`;

  await sendMessage(chatId, msg, env);
}

/* ===================== ANSWER HANDLER ===================== */

async function handleAnswer(text, chatId, userId, env) {
  const key = `test:${userId}`;
  const data = await env.KV.get(key);
  if (!data) return false;

  const session = JSON.parse(data);
  const q = session.questions[session.index];

  const answer = text.trim().toUpperCase();
  if (!["A","B","C","D"].includes(answer)) return true;

  if (answer === q.correct) session.score++;

  await env.DB.prepare(
    `INSERT INTO exam_answers
    (user_id, mcq_id, selected, correct, subject, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    userId,
    q.id,
    answer,
    q.correct,
    q.subject,
    Date.now()
  ).run();

  session.index++;
  await env.KV.put(key, JSON.stringify(session));
  await askQuestion(chatId, userId, env);
  return true;
}

/* ===================== FINISH TEST ===================== */

async function finishTest(chatId, userId, env) {
  const data = JSON.parse(await env.KV.get(`test:${userId}`));
  await env.KV.delete(`test:${userId}`);

  await env.DB.prepare(
    `INSERT INTO attempts (user_id, test_type, score, total, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    userId,
    data.type,
    data.score,
    data.questions.length,
    Date.now()
  ).run();

  await sendMessage(
    chatId,
    `✅ Test Finished!\nScore: ${data.score}/${data.questions.length}`,
    env
  );
}

/* ===================== WEAK SUBJECT ===================== */

async function weakSubjects(chatId, userId, env) {
  const res = await env.DB.prepare(
    `SELECT subject,
     SUM(correct = selected) as correct,
     COUNT(*) as total
     FROM exam_answers
     WHERE user_id = ?
     GROUP BY subject`
  ).bind(userId).all();

  if (!res.results.length) {
    await sendMessage(chatId, "⚠️ No data yet.", env);
    return;
  }

  let msg = "⚠️ Weak Subjects:\n";
  for (const r of res.results) {
    const acc = Math.round((r.correct / r.total) * 100);
    if (acc < 60) msg += `• ${r.subject} (${acc}%)\n`;
  }

  await sendMessage(chatId, msg || "🎯 No weak subjects!", env);
}

/* ===================== COMMAND ROUTER ===================== */

async function handleTestCommands(text, chatId, userId, env) {

  if (["/dt","/wt","/mt"].includes(text)) {
    await startTest(chatId, userId, text.replace("/",""), env);
    return true;
  }

  if (text === "Weak Subjects" || text === "/weak") {
    await weakSubjects(chatId, userId, env);
    return true;
  }

  return false;
}

/* ===================== PATCH INTO MAIN FLOW ===================== */
/* ADD ABOVE MESSAGE HANDLER */

async function saveTestResult(env, data) {
  const {
    userId,
    testType,        // daily / weekly
    subject,
    correct,
    total,
    wrong,
    dateISO
  } = data;

  await env.DB.prepare(`
    INSERT INTO test_attempts
    (user_id, test_type, subject, correct, wrong, total, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    testType,
    subject,
    correct,
    wrong,
    total,
    dateISO
  ).run();
}

async function getSubjectAccuracy(env, userId, days = 30) {
  const since = new Date(Date.now() - days * 86400000)
    .toISOString()
    .slice(0, 10);

  const res = await env.DB.prepare(`
    SELECT subject,
           SUM(correct) as correct,
           SUM(total) as total
    FROM test_attempts
    WHERE user_id = ?
      AND date >= ?
    GROUP BY subject
  `).bind(userId, since).all();

  return res.results.map(r => ({
    subject: r.subject,
    accuracy: r.total ? Math.round((r.correct / r.total) * 100) : 0
  }));
}

async function getWeakSubjects(env, userId) {
  const acc = await getSubjectAccuracy(env, userId, 30);
  return acc
    .filter(s => s.accuracy < 60)
    .map(s => s.subject);
}

async function buildDailyReport(env, userId, dateISO) {
  const read = await env.DB.prepare(`
    SELECT SUM(minutes) as mins
    FROM reading_logs
    WHERE user_id = ? AND date = ?
  `).bind(userId, dateISO).first();

  const test = await env.DB.prepare(`
    SELECT SUM(correct) as c, SUM(total) as t
    FROM test_attempts
    WHERE user_id = ? AND date = ?
  `).bind(userId, dateISO).first();

  return {
    readingMinutes: read?.mins || 0,
    testAccuracy: test?.t
      ? Math.round((test.c / test.t) * 100)
      : null
  };
}

async function buildWeeklyReport(env, userId) {
  const since = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  const rows = await env.DB.prepare(`
    SELECT subject,
           SUM(correct) as c,
           SUM(total) as t
    FROM test_attempts
    WHERE user_id = ? AND date >= ?
    GROUP BY subject
  `).bind(userId, since).all();

  return rows.results.map(r => ({
    subject: r.subject,
    accuracy: r.t ? Math.round((r.c / r.t) * 100) : 0
  }));
}

async function buildMonthlyReport(env, userId) {
  const since = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10);

  const read = await env.DB.prepare(`
    SELECT SUM(minutes) as mins
    FROM reading_logs
    WHERE user_id = ? AND date >= ?
  `).bind(userId, since).first();

  const test = await env.DB.prepare(`
    SELECT SUM(correct) as c, SUM(total) as t
    FROM test_attempts
    WHERE user_id = ? AND date >= ?
  `).bind(userId, since).first();

  return {
    readingMinutes: read?.mins || 0,
    accuracy: test?.t
      ? Math.round((test.c / test.t) * 100)
      : null
  };
}

function generateAdvice(accuracy, weakSubjects) {
  if (!accuracy) return "📘 Start attempting tests regularly.";

  if (accuracy >= 80)
    return "🔥 Excellent consistency. Keep revising weak areas lightly.";

  if (accuracy >= 60)
    return `⚠️ Focus more on: ${weakSubjects.join(", ")}`;

  return "🚨 Accuracy low. Revise basics + solve topic-wise MCQs.";
}

function istNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

function istHM() {
  const d = istNow();
  return { h: d.getHours(), m: d.getMinutes(), d };
}

let TEST_RUNNING = false;
let PENDING_MESSAGES = [];

async function safeGroupSend(env, text) {
  if (TEST_RUNNING) {
    PENDING_MESSAGES.push(text);
    return;
  }
  await sendGroup(env, text);
}

const MOTIVATIONS = [
  "🦷 Today’s discipline builds tomorrow’s rank.",
  "📘 Dental concepts repeated daily never fail.",
  "🔥 One strong subject today = confidence tomorrow.",
  "⏳ GPSC rewards consistency, not shortcuts.",
  "💪 Read today so exams feel lighter tomorrow."
];

async function runAutomation(env) {
  const { h, m } = istHM();

  // 06:01 — Good Morning
  if (h === 6 && m === 1) {
    await safeGroupSend(
      env,
      "🌅 *Good Morning Dr. Arzoo Fatema* ❤️🌺\n\n🎯 Today’s Target: 08:00 hrs\n📘 Start reading strong!"
    );
  }

  // 10:00 — Motivation
  if (h === 10 && m === 0) {
    await safeGroupSend(
      env,
      "💡 *Reading Reminder*\n" +
      MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]
    );
  }

  // 14:00 — Weak subjects reminder
  if (h === 14 && m === 0) {
    const weak = await getWeakSubjects(env, STUDENT_ID);
    if (weak.length) {
      await safeGroupSend(
        env,
        "⚠️ *Weak Subjects Alert*\nFocus today on:\n• " +
        weak.join("\n• ")
      );
    }
  }

  // 18:00 — Daily test reminder
  if (h === 18 && m === 0) {
    await safeGroupSend(
      env,
      "📝 *Daily Test Reminder*\nToday’s test at *11:00 PM* ⏳"
    );
  }

  // 21:30 — Final reminder
  if (h === 21 && m === 30) {
    await safeGroupSend(
      env,
      "⏰ *Final Reminder*\nDaily test at 11:00 PM\n1.5 hours left!"
    );
  }

  // 23:59 — Daily summary
  if (h === 23 && m === 59) {
    const report = await buildDailyReport(
      env,
      STUDENT_ID,
      new Date().toISOString().slice(0, 10)
    );

    await safeGroupSend(
      env,
      `🌙 *Good Night Dr. Arzoo Fatema* ❤️🌺\n\n📘 Study: ${Math.floor(report.readingMinutes/60)}h ${report.readingMinutes%60}m\n📊 Accuracy: ${report.testAccuracy ?? "N/A"}%\n\n💡 ${MOTIVATIONS[Math.floor(Math.random()*MOTIVATIONS.length)]}`
    );
  }
}

async function flushPending(env) {
  for (const msg of PENDING_MESSAGES) {
    await sendGroup(env, msg);
  }
  PENDING_MESSAGES = [];
}

export default {
  async fetch(req, env, ctx) {
    if (req.method !== "POST") {
      return new Response("OK");
    }

    const update = await req.json();

    if (update.message) {
      await handleMessage(update.message, env);
    }

    if (update.callback_query) {
      await handleCallback(update.callback_query, env);
    }

    // Automation runs every minute (cron via fetch)
    await runAutomation(env);

    return new Response("OK");
  }
};

async function handleMessage(msg, env) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const lower = text.toLowerCase();

  // ===== START =====
  if (lower === "/start") {
    await send(chatId,
      "🌺 *Welcome Dr Arzoo Fatema* ❤️🌺\n\n" +
      "📘 /read – Start reading\n" +
      "⏹️ /stop – Stop reading\n" +
      "📝 /dt – Daily Test\n" +
      "📊 /report – Daily Report\n" +
      "📅 /mr – Monthly Report\n"
    );
    return;
  }

  // ===== READING =====
  if (lower === "/read") {
    await startReading(env, msg.from.id, chatId);
    return;
  }

  if (lower === "/stop") {
    await stopReading(env, msg.from.id, chatId);
    return;
  }

  // ===== TEST COMMANDS =====
  if (lower.startsWith("/dt")) {
    const subject = text.replace("/dt", "").trim();
    await startTest(env, "daily", subject || null);
    return;
  }

  if (lower === "/wt") {
    await startTest(env, "weekly", null);
    return;
  }

  // ===== REPORTS =====
  if (lower === "/report") {
    const rep = await buildDailyReport(
      env,
      msg.from.id,
      new Date().toISOString().slice(0, 10)
    );
    await send(chatId,
      `📊 *Daily Report*\n\n📘 Study: ${rep.readingMinutes} min\n📈 Accuracy: ${rep.testAccuracy ?? "N/A"}%`
    );
    return;
  }

  if (lower === "/mr") {
    const rep = await buildMonthlyReport(env, msg.from.id);
    await send(chatId,
      `📅 *Monthly Report*\n\n📘 Total Reading: ${rep.readingMinutes} min\n📈 Accuracy: ${rep.accuracy ?? "N/A"}%`
    );
    return;
  }

  // ===== ADMIN MCQ ADD =====
  if (lower === "/addmcq" && msg.from.id === ADMIN_ID) {
    await send(chatId,
      "🛠️ *MCQ Add Mode*\nPaste MCQs in bulk format now."
    );
    await env.KV.put("ADD_MCQ_MODE", "1");
    return;
  }

  // ===== MCQ BULK INPUT =====
  const mcqMode = await env.KV.get("ADD_MCQ_MODE");
  if (mcqMode === "1" && msg.from.id === ADMIN_ID) {
    await parseAndSaveMCQs(env, text);
    await env.KV.delete("ADD_MCQ_MODE");
    await send(chatId, "✅ MCQs saved successfully");
    return;
  }
}

async function handleCallback(cb, env) {
  const data = cb.data;
  const userId = cb.from.id;

  if (!TEST_RUNNING) return;

  await processAnswer(env, userId, data);
}

async function send(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown"
    })
  });
}

async function sendGroup(env, text) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: GROUP_ID,
      text,
      parse_mode: "Markdown"
    })
  });
}

async function startReading(env, userId, chatId) {
  const key = `READING_${userId}`;
  const existing = await env.KV.get(key);

  if (existing) {
    await send(chatId, "📘 Reading already running.\nUse /stop");
    return;
  }

  await env.KV.put(key, Date.now().toString());
  await send(chatId,
    "📖 *Reading Started*\n\n🎯 Target: 08:00 hrs\n⏳ Time counting started"
  );

  // Notify admin
  if (userId === STUDENT_ID) {
    await send(ADMIN_ID, "🟢 Student started reading");
  }
}

async function stopReading(env, userId, chatId) {
  const key = `READING_${userId}`;
  const start = await env.KV.get(key);

  if (!start) {
    await send(chatId, "⚠️ No active reading session");
    return;
  }

  const mins = Math.floor((Date.now() - Number(start)) / 60000);
  await env.KV.delete(key);

  const today = new Date().toISOString().slice(0, 10);

  await env.DB.prepare(`
    INSERT INTO reading_logs (user_id, date, minutes)
    VALUES (?, ?, ?)
  `).bind(userId, today, mins).run();

  await send(chatId,
    `⏹️ *Reading Stopped*\n\n📘 Studied: ${Math.floor(mins/60)}h ${mins%60}m\n🎯 Target: 08:00 hrs`
  );

  if (userId === STUDENT_ID) {
    await send(ADMIN_ID, `🔴 Student stopped reading (${mins} min)`);
  }
}

let CURRENT_TEST = null;

function endTest(env) {
  TEST_RUNNING = false;
  CURRENT_TEST = null;
  return flushPending(env);
}
async function startTest(env, type, subject) {
  if (TEST_RUNNING) {
    await sendGroup(env, "⚠️ Test already running");
    return;
  }

  TEST_RUNNING = true;

  const pool = await getRandomMCQs(env, subject, type === "weekly" ? 50 : 20);

  if (!pool.length) {
    TEST_RUNNING = false;
    await sendGroup(env, "❌ No MCQs available");
    return;
  }

  CURRENT_TEST = {
    type,
    subject,
    questions: pool,
    index: 0,
    correct: 0,
    wrong: 0,
    userId: STUDENT_ID
  };

  await sendGroup(env,
    `📝 *${type.toUpperCase()} TEST STARTED*\n` +
    (subject ? `📚 Subject: ${subject}\n` : "") +
    `Questions: ${pool.length}`
  );

  await askNextQuestion(env);
}

async function askNextQuestion(env) {
  const t = CURRENT_TEST;
  if (!t || t.index >= t.questions.length) {
    await finishTest(env);
    return;
  }

  const q = t.questions[t.index];
  t.deadline = Date.now() + 5 * 60 * 1000;

  await sendGroup(env,
`Q${t.index + 1}. ${q.question}

A) ${q.A}
B) ${q.B}
C) ${q.C}
D) ${q.D}

⏳ Time: 5 minutes`,
  {
    reply_markup: {
      inline_keyboard: [
        [{ text: "A", callback_data: "A" }, { text: "B", callback_data: "B" }],
        [{ text: "C", callback_data: "C" }, { text: "D", callback_data: "D" }]
      ]
    }
  });

  // timeout
  setTimeout(async () => {
    if (CURRENT_TEST && CURRENT_TEST.index === t.index) {
      t.wrong++;
      await sendGroup(env,
        `⏰ Time Up!\n✔️ Correct: ${q.answer}\n💡 ${q.explanation}`
      );
      t.index++;
      await askNextQuestion(env);
    }
  }, 5 * 60 * 1000);
}

async function processAnswer(env, userId, answer) {
  const t = CURRENT_TEST;
  if (!t || userId !== STUDENT_ID) return;

  const q = t.questions[t.index];

  if (answer === q.answer) {
    t.correct++;
    await sendGroup(env, "✅ Correct!");
  } else {
    t.wrong++;
    await sendGroup(env,
      `❌ Wrong\n✔️ ${q.answer}\n💡 ${q.explanation}`
    );
  }

  t.index++;
  setTimeout(() => askNextQuestion(env), 2000);
}

async function finishTest(env) {
  const t = CURRENT_TEST;

  await saveTestResult(env, {
    userId: t.userId,
    testType: t.type,
    subject: t.subject || "Mixed",
    correct: t.correct,
    wrong: t.wrong,
    total: t.questions.length,
    dateISO: new Date().toISOString().slice(0, 10)
  });

  const acc = Math.round((t.correct / t.questions.length) * 100);
  const weak = await getWeakSubjects(env, t.userId);
  const advice = generateAdvice(acc, weak);

  await sendGroup(env,
`📊 *Test Result*

✅ Correct: ${t.correct}
❌ Wrong: ${t.wrong}
🎯 Accuracy: ${acc}%

💡 ${advice}`
  );

  await endTest(env);
}

async function getRandomMCQs(env, subject, limit) {
  let sql = `
    SELECT * FROM mcqs
    WHERE last_used IS NULL
       OR last_used < date('now','-30 day')
  `;

  const binds = [];

  if (subject) {
    sql += " AND subject = ?";
    binds.push(subject);
  }

  sql += " ORDER BY RANDOM() LIMIT ?";

  binds.push(limit);

  const res = await env.DB.prepare(sql).bind(...binds).all();

  return res.results;
}

self.addEventListener("unhandledrejection", e => {
  console.error("Unhandled:", e.reason);
});

