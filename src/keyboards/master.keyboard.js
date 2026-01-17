// src/keyboards/master.keyboard.js

/**
 * Master Inline Keyboard
 * Used across bot (start, menu refresh, post actions)
 */

export function getMasterKeyboard(userId, adminId) {
  const keyboard = [
    [
      { text: "📚 Start Reading", callback_data: "READ_START" },
      { text: "⏸ Stop Reading", callback_data: "READ_STOP" }
    ],
    [
      { text: "📝 Daily Test", callback_data: "DAILY_TEST" },
      { text: "🧠 MCQ Practice", callback_data: "MCQ_PRACTICE" }
    ],
    [
      { text: "📊 My Progress", callback_data: "MY_PROGRESS" }
    ],
    [
      { text: "📘 Subject List", callback_data: "SUBJECT_LIST" }
    ]
  ];

  // Admin panel only for admin
  if (Number(userId) === Number(adminId)) {
    keyboard.push([
      { text: "👑 Admin Panel", callback_data: "ADMIN_PANEL" }
    ]);
  }

  return {
    inline_keyboard: keyboard
  };
  }
