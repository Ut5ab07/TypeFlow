export function calculateWpm(correctChars, elapsedSeconds) {
  if (!elapsedSeconds || elapsedSeconds <= 0) return 0;
  return Math.max(0, Math.round((correctChars / 5) / (elapsedSeconds / 60)));
}
export function calculateAccuracy(correctChars, totalChars) {
  if (!totalChars) return 100;
  return Math.max(0, Math.min(100, Math.round((correctChars / totalChars) * 100)));
}
export function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
export function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
export function averageWpm(history) { return history.length ? Math.round(history.reduce((sum, item) => sum + item.wpm, 0) / history.length) : 0; }
