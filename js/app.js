import { TypingTest } from "./test.js";
import { averageWpm, formatDate } from "./stats.js";
import { clearHistory, getHistory, getSettings, saveSettings, saveTest } from "./storage.js";

const $ = selector => document.querySelector(selector);
const elements = { input: $("#typingInput"), display: $("#textDisplay"), timer: $("#timer"), wpm: $("#liveWpm"), accuracy: $("#liveAccuracy"), chars: $("#liveChars"), progress: $("#progressBar"), status: $("#testStatus") };
let settings = getSettings(); let history = getHistory(); let currentResult = null;
const views = { dashboard: $("#dashboardView"), test: $("#testView"), results: $("#resultsView") };

function showView(name) {
  Object.entries(views).forEach(([key, view]) => view.classList.toggle("active", key === name));
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  if (name === "dashboard") renderDashboard();
  if (name === "results") renderHistory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function renderDashboard() {
  const best = history.length ? Math.max(...history.map(item => item.wpm)) : 0;
  $("#bestWpm").textContent = best || "—"; $("#averageWpm").textContent = averageWpm(history) || "—"; $("#totalTests").textContent = history.length;
  $("#bestLabel").textContent = best ? "Your fastest session" : "Complete a test to set your record";
  $("#averageLabel").textContent = history.length ? `Across ${history.length} session${history.length === 1 ? "" : "s"}` : "No sessions yet";
  $("#streakLabel").textContent = history.length ? "Keep building your rhythm" : "Start your first session";
  const activity = $("#recentActivity");
  activity.innerHTML = history.length ? history.slice(0, 4).map(item => `<div class="activity-item"><div class="activity-main"><span class="activity-dot"></span><div><strong>${item.difficulty[0].toUpperCase() + item.difficulty.slice(1)} session</strong><small>${formatDate(item.date)} · ${item.accuracy}% accuracy</small></div></div><div class="activity-wpm">${item.wpm}<small> WPM</small></div></div>`).join("") : `<p class="empty-state">No sessions yet. Your first run will appear here.</p>`;
}
function renderHistory() {
  const list = $("#historyList");
  list.innerHTML = history.length ? `<div class="history-header"><span>Date</span><span>Speed</span><span>Accuracy</span><span>Difficulty</span><span>Duration</span></div>${history.map(item => `<div class="history-item"><span>${formatDate(item.date)}</span><strong>${item.wpm} WPM</strong><span>${item.accuracy}%</span><span>${item.difficulty}</span><span>${item.duration}s</span></div>`).join("")}` : `<p class="empty-state">No completed tests yet. Finish a session to build your history.</p>`;
}
function renderResult(result, saved, previousBest = history.length ? Math.max(...history.map(item => item.wpm)) : 0) {
  $("#finalWpm").textContent = result.wpm; $("#finalAccuracy").textContent = `${result.accuracy}%`; $("#finalCorrect").textContent = result.correct; $("#finalIncorrect").textContent = result.incorrect; $("#finalDuration").textContent = `${result.duration}s`;
  const isBest = result.wpm >= previousBest; $("#resultBadge").textContent = isBest ? "NEW PERSONAL BEST" : "SESSION COMPLETE";
  $("#resultComparison").textContent = isBest ? "A new personal best. Keep that feeling." : `${Math.max(0, previousBest - result.wpm)} WPM from your personal best.`;
  $("#resultsSubtitle").textContent = result.accuracy >= 95 ? "Accuracy and speed, working together." : "Your focus is the real score.";
  $("#miniChart").innerHTML = [...history.slice(0, 9).reverse(), result].map(item => `<span class="chart-bar" style="height:${Math.max(12, Math.min(100, item.wpm * 1.8))}%"></span>`).join("");
  if (saved) showToast(isBest ? "New personal best saved." : "Session saved to your history.");
}
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2800); }

const test = new TypingTest(elements, { getDuration: () => settings.duration, getDifficulty: () => settings.difficulty, onMistake: () => { document.body.classList.remove("mistake-shake"); void document.body.offsetWidth; document.body.classList.add("mistake-shake"); }, onFinish: result => { currentResult = result; const previousBest = history.length ? Math.max(...history.map(item => item.wpm)) : 0; history = saveTest(result).history; renderResult(result, true, previousBest); showView("results"); } });

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => { const name = button.dataset.view; if (name === "test") test.reset(); showView(name); }));
document.querySelectorAll("[data-duration]").forEach(button => button.addEventListener("click", () => { settings.duration = Number(button.dataset.duration); saveSettings(settings); document.querySelectorAll("[data-duration]").forEach(item => item.classList.toggle("selected", item === button)); test.reset(); }));
document.querySelectorAll("[data-difficulty]").forEach(button => button.addEventListener("click", () => { settings.difficulty = button.dataset.difficulty; saveSettings(settings); document.querySelectorAll("[data-difficulty]").forEach(item => item.classList.toggle("selected", item === button)); test.reset(); }));
elements.input.addEventListener("input", event => test.input(event.target.value));
elements.display.addEventListener("click", () => {
  if (!test.finished) elements.input.focus();
});
$("#restartButton").addEventListener("click", () => test.reset());
$("#retakeButton").addEventListener("click", () => { test.reset(); showView("test"); });
$("#clearHistoryButton").addEventListener("click", () => { if (history.length && window.confirm("Clear all saved test history? This cannot be undone.")) { clearHistory(); history = []; renderHistory(); renderDashboard(); showToast("History cleared."); } });
$("#mobileMenuButton").addEventListener("click", event => { const open = $(".main-nav").classList.toggle("open"); event.currentTarget.setAttribute("aria-expanded", open); });
document.addEventListener("keydown", event => { if (event.key.toLowerCase() === "r" && views.test.classList.contains("active") && document.activeElement !== elements.input) test.reset(); if (event.key === "Escape" && views.test.classList.contains("active")) test.finish(); });
document.querySelectorAll(".main-nav .nav-link").forEach(button => button.addEventListener("click", () => $(".main-nav").classList.remove("open")));

document.querySelectorAll("[data-duration]").forEach(item => item.classList.toggle("selected", Number(item.dataset.duration) === settings.duration));
document.querySelectorAll("[data-difficulty]").forEach(item => item.classList.toggle("selected", item.dataset.difficulty === settings.difficulty));
renderDashboard(); test.reset();
