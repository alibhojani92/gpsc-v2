// src/reading/reading.session.js

/**
 * Create a new reading session
 */
export function startReadingSession() {
  const now = new Date();

  return {
    startTimestamp: now.getTime(),
    startTimeText: formatTime(now),
  };
}

/**
 * End an active reading session
 */
export function stopReadingSession(session) {
  if (!session || !session.startTimestamp) {
    return null;
  }

  const end = new Date();
  const durationMs = end.getTime() - session.startTimestamp;

  return {
    startTimeText: session.startTimeText,
    endTimeText: formatTime(end),
    durationMinutes: Math.max(Math.floor(durationMs / 60000), 0),
  };
}

/**
 * Format time as HH:MM AM/PM
 */
function formatTime(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
