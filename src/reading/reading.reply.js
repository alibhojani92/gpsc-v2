// src/reading/reading.reply.js

import { formatMinutes } from "./reading.summary.js";

/**
 * Reading start reply
 */
export function readingStartedReply({ startTime, targetMinutes }) {
  return (
    `📚 *Reading STARTED* ✅\n\n` +
    `🕒 Start Time: ${startTime}\n` +
    `🎯 Daily Target: ${formatMinutes(targetMinutes)}\n\n` +
    `🔥 Keep going Doctor 💪🦷\n` +
    `Consistency beats intensity 🌱`
  );
}

/**
 * Reading stop reply
 */
export function readingStoppedReply({
  startTime,
  endTime,
  sessionMinutes,
  todayTotalMinutes,
  remainingMinutes,
}) {
  return (
    `⏸ *Reading STOPPED* ✅\n\n` +
    `🕒 Start: ${startTime}\n` +
    `🕒 End: ${endTime}\n` +
    `⏱ Duration: ${formatMinutes(sessionMinutes)}\n\n` +
    `📊 Today Total: ${formatMinutes(todayTotalMinutes)}\n` +
    `🎯 Target Left: ${formatMinutes(remainingMinutes)}\n\n` +
    `🌟 Great work Doctor! Stay consistent 🦷`
  );
}
