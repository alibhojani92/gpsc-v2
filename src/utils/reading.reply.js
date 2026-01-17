// src/utils/reading.reply.js

import { buildTodayReadingSummary } from "./reading.summary.js";

/**
 * Format HH:MM from Date
 */
function formatTime(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format duration text
 */
function formatDuration(hours, minutes) {
  let text = "";
  if (hours > 0) text += `${hours}h `;
  if (minutes > 0) text += `${minutes}m`;
  return text.trim() || "0m";
}

/**
 * Reading START reply
 */
export function buildReadingStartReply(startTime) {
  return (
`📚 *Reading STARTED* ✅

🕒 Start Time: ${formatTime(startTime)}
🎯 Daily Target: 8 Hours

🔥 Keep going Doctor 💪🦷
Consistency today = Rank tomorrow 🌟`
  );
}

/**
 * Reading STOP reply
 */
export function buildReadingStopReply(startTime, endTime, totalReadMinutes) {
  const summary = buildTodayReadingSummary(totalReadMinutes);

  const durationText = formatDuration(
    summary.totalReadTime.hours,
    summary.totalReadTime.minutes
  );

  const remainingText = formatDuration(
    summary.remainingTime.hours,
    summary.remainingTime.minutes
  );

  const completionLine = summary.completed
    ? "🏆 *Target Completed!* Excellent discipline 👏"
    : "🎯 Keep pushing, target is within reach 💪";

  return (
`⏸ *Reading STOPPED* ✅

🕒 Start: ${formatTime(startTime)}
🕒 End: ${formatTime(endTime)}
⏱ Duration: ${durationText}

📊 *Today Total:* ${durationText}
🎯 *Target Left:* ${remainingText}

${completionLine}
🌱 Consistency beats intensity.`
  );
    }
