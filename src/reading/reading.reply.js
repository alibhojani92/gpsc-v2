// src/reading/reading.reply.js

import { formatMinutes, getRemainingMinutes } from "./daily.target.js";

/**
 * Reply when reading starts
 */
export function buildReadingStartReply({
  startTime,
  dailyTargetMinutes,
}) {
  return (
`📚 Reading STARTED ✅

🕒 Start Time: ${startTime}
🎯 Daily Target: ${formatMinutes(dailyTargetMinutes)}

🔥 Keep going Doctor 💪🦷
Consistency beats intensity.`
  );
}

/**
 * Reply when reading stops
 */
export function buildReadingStopReply({
  startTime,
  endTime,
  durationMinutes,
  todayTotalMinutes,
  dailyTargetMinutes,
}) {
  const remaining = getRemainingMinutes(
    dailyTargetMinutes,
    todayTotalMinutes
  );

  return (
`⏸ Reading STOPPED ✅

🕒 Start: ${startTime}
🕒 End: ${endTime}
⏱ Duration: ${formatMinutes(durationMinutes)}

📊 Today Total: ${formatMinutes(todayTotalMinutes)}
🎯 Target Left: ${formatMinutes(remaining)}

🌟 Small steps every day lead to big ranks!`
  );
}

/**
 * Reply if reading already active
 */
export function buildAlreadyReadingReply(startTime) {
  return (
`⚠️ Reading already in progress

🕒 Started at: ${startTime}

📖 Stay focused, Doctor!`
  );
}

/**
 * Reply if stop requested without start
 */
export function buildNoActiveReadingReply() {
  return (
`⚠️ No active reading session found

📚 Start reading first to track progress.`
  );
}
