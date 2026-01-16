/**
 * GPSC V2.1 – Enterprise Stable Worker
 * Single-file, KV + D1, webhook-safe
 * Authorised build – clean foundation
 */

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method !== "POST") {
        return new Response("GPSC V2.1 Running ✅");
      }

      const update = await request.json();
      await handleTelegramUpdate(update, env);
      return new Response("OK");
    } catch (e) {
      console.error("Worker error:", e);
      return new Response("ERR");
    }
  }
};

/* ================= CONFIG ================= */

const BOT_TOKEN = envOr("BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const ADMIN_ID = 7539477188;
const GROUP_ID = -5154292869;

/* ================= HELPERS ================= */

function envOr(name) {
  if (!globalThis[name]) throw new Error(`Missing env ${name}`);
  return globalThis[name];
}

async function tg(method, payload) {
  await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function intro() {
  return "🌺 Dr. Arzoo Fatema 🌺\n";
}

function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/* ================= MAIN ROUTER ================= */

async function handleTelegramUpdate(update, env) {
  if (update.message) {
    await handleMessage(update.message, env);
  }
  if (update.callback_query) {
    await handleCallback(update.callback_query, env);
  }
}

/* ================= MESSAGE HANDLER ================= */

async function handleMessage(msg, env) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || "";

  if (text === "/start") {
    await tg("sendMessage", {
      chat_id: chatId,
      text: intro() + "Welcome Dr Arzoo Fatema ❤️🌺",
      reply_markup: {
        keyboard: [
          ["📖 Read", "⏹ Stop"],
          ["📝 Daily Test", "📊 Report"],
          ["📅 Weekly Test", "📚 Weak Subjects"]
        ],
        resize_keyboard: true
      }
    });
    return;
  }

  if (/^\/read$/i.test(text) || text === "📖 Read") {
    await startReading(msg, env);
    return;
  }

  if (/^\/stop$/i.test(text) || text === "⏹ Stop") {
    await stopReading(msg, env);
    return;
  }

  if (/^\/dt$/i.test(text) || text === "📝 Daily Test") {
    await startTest(chatId, "DAILY", env);
    return;
  }

  if (/^\/wt$/i.test(text) || text === "📅 Weekly Test") {
    await startTest(chatId, "WEEKLY", env);
    return;
  }

  if (/^\/report$/i.test(text) || text === "📊 Report") {
    await sendReport(chatId, env);
    return;
  }

  if (/^\/addmcq$/i.test(text) && msg.from.id === ADMIN_ID) {
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        "Reply with MCQs in this format:\n\n" +
        "SUBJECT: Oral Anatomy\n" +
        "Q1. Question?\nA) A\nB) B\nC) C\nD) D\nAns: A\nExp: Explanation"
    });
    return;
  }

  if (msg.reply_to_message && msg.from.id === ADMIN_ID) {
    await bulkAddMCQ(msg.text, env, chatId);
    return;
  }
}

/* ================= READING ================= */

async function startReading(msg, env) {
  const key = `reading:${msg.from.id}`;
  const existing = await env.GPSC_KV.get(key);

  if (existing) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: intro() + "📖 Reading already running"
    });
    return;
  }

  await env.GPSC_KV.put(key, Date.now().toString());

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: intro() + "📖 Reading started\n🎯 Target: 08:00 hrs"
  });
}

async function stopReading(msg, env) {
  const key = `reading:${msg.from.id}`;
  const start = await env.GPSC_KV.get(key);

  if (!start) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: intro() + "⚠️ Reading not started"
    });
    return;
  }

  const mins = Math.floor((Date.now() - Number(start)) / 60000);
  await env.GPSC_KV.delete(key);

  const day = todayIST();
  await env.GPSC_DB.prepare(
    "INSERT INTO reading_log (user_id, day, minutes) VALUES (?, ?, ?) " +
    "ON CONFLICT(user_id, day) DO UPDATE SET minutes = minutes + ?"
  ).bind(msg.from.id, day, mins, mins).run();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      intro() +
      `⏱ Reading stopped\n📘 Today: ${Math.floor(mins / 60)}h ${mins % 60}m`
  });
}

/* ================= MCQ ================= */

async function bulkAddMCQ(text, env, chatId) {
  const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : "General";

  const blocks = text.split(/\n(?=Q\d+\.|Q\.)/i);
  let added = 0;

  for (const block of blocks) {
    const q = block.match(/Q\d*\.?\s*(.+)/i)?.[1];
    const A = block.match(/A\)\s*(.+)/i)?.[1];
    const B = block.match(/B\)\s*(.+)/i)?.[1];
    const C = block.match(/C\)\s*(.+)/i)?.[1];
    const D = block.match(/D\)\s*(.+)/i)?.[1];
    const ans = block.match(/Ans:\s*([ABCD])/i)?.[1];
    const exp = block.match(/Exp:\s*(.+)/i)?.[1] || "";

    if (q && A && B && C && D && ans) {
      await env.GPSC_DB.prepare(
        "INSERT INTO mcqs (subject, question, A, B, C, D, answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(subject, q, A, B, C, D, ans, exp).run();
      added++;
    }
  }

  await tg("sendMessage", {
    chat_id: chatId,
    text: `🛠 Admin\n✅ MCQs added: ${added}`
  });
}

/* ================= TEST ================= */

async function startTest(chatId, type, env) {
  const limit = type === "DAILY" ? 20 : 50;

  const { results } = await env.GPSC_DB.prepare(
    "SELECT * FROM mcqs ORDER BY RANDOM() LIMIT ?"
  ).bind(limit).all();

  if (!results.length) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: intro() + "❌ No MCQs available"
    });
    return;
  }

  await env.GPSC_KV.put(`test:${chatId}`, JSON.stringify({
    index: 0,
    score: 0,
    list: results
  }));

  await sendQuestion(chatId, env);
}

async function sendQuestion(chatId, env) {
  const data = JSON.parse(await env.GPSC_KV.get(`test:${chatId}`));
  const q = data.list[data.index];

  await tg("sendMessage", {
    chat_id: chatId,
    text:
      intro() +
      `Q${data.index + 1}. ${q.question}\n\n` +
      `A) ${q.A}\nB) ${q.B}\nC) ${q.C}\nD) ${q.D}`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "A", callback_data: "A" },
         { text: "B", callback_data: "B" }],
        [{ text: "C", callback_data: "C" },
         { text: "D", callback_data: "D" }]
      ]
    }
  });
}

/* ================= CALLBACK ================= */

async function handleCallback(cb, env) {
  const chatId = cb.message.chat.id;
  const data = JSON.parse(await env.GPSC_KV.get(`test:${chatId}`));
  const q = data.list[data.index];

  if (cb.data === q.answer) data.score++;

  await tg("sendMessage", {
    chat_id: chatId,
    text:
      (cb.data === q.answer ? "✅ Correct\n" : "❌ Wrong\n") +
      `✔ ${q.answer}\n💡 ${q.explanation}`
  });

  data.index++;

  if (data.index >= data.list.length) {
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        intro() +
        `📊 Test Finished\nScore: ${data.score}/${data.list.length}`
    });
    await env.GPSC_KV.delete(`test:${chatId}`);
  } else {
    await env.GPSC_KV.put(`test:${chatId}`, JSON.stringify(data));
    await sendQuestion(chatId, env);
  }
}

/* ================= REPORT ================= */

async function sendReport(chatId, env) {
  const day = todayIST();
  const row = await env.GPSC_DB.prepare(
    "SELECT minutes FROM reading_log WHERE day = ?"
  ).bind(day).first();

  await tg("sendMessage", {
    chat_id: chatId,
    text:
      intro() +
      `📊 Daily Report\n📘 Study: ${row?.minutes || 0} minutes`
  });
}
