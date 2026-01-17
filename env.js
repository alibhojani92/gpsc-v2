// env.js
// Central environment config for Dental GPSC Master Bot

export function getEnv(env) {
  return {
    // Telegram
    BOT_TOKEN: env.BOT_TOKEN,
    BOT_NAME: "🌺 Dr. Arzoo Fatema 🌺",

    // Admin & Group
    ADMIN_ID: Number(env.ADMIN_ID),        // Telegram user ID of admin
    GROUP_ID: Number(env.GROUP_ID),        // Main Telegram group ID

    // Timezone & Targets
    TIMEZONE: "Asia/Kolkata",
    DAILY_READING_TARGET_MINUTES: 480,     // 8 hours

    // Cloudflare Storage
    KV: env.DENTAL_KV,                     // KV Namespace
    DB: env.DENTAL_DB,                     // D1 Database

    // App Meta
    APP_NAME: "Dental GPSC Master Bot",
    VERSION: "v1.0.0",

    // Safety Flags
    IGNORE_RANDOM_CHAT: true,              // Ignore hi/hello/spam
    INLINE_KEYBOARD_ONLY: true,             // All features via buttons

    // Feature Locks
    FEATURES: {
      READING: true,
      MCQ: true,
      DAILY_TEST: true,
      WEEKLY_TEST: true,
      REPORTS: true,
      ADMIN_PANEL: true,
      SUBJECT_MAPPING_DP18: true,
    }
  };
}
