import { TypingTest } from "./test.js";
import { averageWpm, formatDate } from "./stats.js";
import { ACHIEVEMENTS, LEVELS, getLevelForChallenge } from "./challenges.js";
import { getHeatClass, getKeyAccuracy, KEYBOARD_ROWS, PRACTICE_WORDS } from "./heatmap.js";
import { clearHistory, getHistory, getKeyStats, getLocalDateKey, getProgress, getSettings, getStreak, mergeKeyStats, recordStreakActivity, resetKeyStats, saveProgress, saveSettings, saveTest } from "./storage.js";

const $ = selector => document.querySelector(selector);
const elements = { input: $("#typingInput"), display: $("#textDisplay"), timer: $("#timer"), wpm: $("#liveWpm"), accuracy: $("#liveAccuracy"), chars: $("#liveChars"), progress: $("#progressBar"), status: $("#testStatus") };
let settings = getSettings(); let history = getHistory(); let progress = getProgress(); let streak = getStreak(); let keyStats = getKeyStats(); let currentResult = null; let activeChallenge = null; let activePractice = null;
const views = { dashboard: $("#dashboardView"), test: $("#testView"), challenges: $("#challengesView"), insights: $("#insightsView"), results: $("#resultsView") };

function showView(name) {
  Object.entries(views).forEach(([key, view]) => view.classList.toggle("active", key === name));
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  if (name === "dashboard") renderDashboard();
  if (name === "challenges") renderChallenges();
  if (name === "insights") renderInsights();
  if (name === "results") renderHistory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function getCompletedCount(levelKey) { return LEVELS[levelKey].challenges.filter(challenge => progress.completedChallenges.includes(challenge.id)).length; }
function isLevelUnlocked(levelKey) {
  if (levelKey === "beginner") return true;
  const previous = levelKey === "moderate" ? "beginner" : "moderate";
  return getCompletedCount(previous) >= LEVELS[levelKey].unlockAt;
}
function unlockedLevels() { return Object.keys(LEVELS).filter(isLevelUnlocked); }
function renderChallenges() {
  const total = Object.values(LEVELS).reduce((sum, level) => sum + level.challenges.length, 0);
  const completed = progress.completedChallenges.length;
  const current = unlockedLevels().slice(-1)[0] || "beginner";
  const next = current === "beginner" ? "moderate" : current === "moderate" ? "pro" : null;
  $("#playerLevel").textContent = LEVELS[current].name;
  $("#playerXp").textContent = `${progress.xp} XP`;
  $("#challengeCount").textContent = `${completed} / ${total} challenges`;
  $("#xpProgress").style.width = `${next ? Math.min(100, (getCompletedCount(current) / LEVELS[next].unlockAt) * 100) : 100}%`;
  $("#nextLevelLabel").textContent = next ? `${Math.max(0, LEVELS[next].unlockAt - getCompletedCount(current))} challenges to unlock ${LEVELS[next].name}` : "All levels unlocked. Keep chasing mastery.";
  $("#levelsContainer").innerHTML = Object.entries(LEVELS).map(([key, level]) => {
    const unlocked = isLevelUnlocked(key);
    const levelCompleted = getCompletedCount(key);
    return `<section class="level-section ${level.accent} ${unlocked ? "" : "locked"}"><div class="level-section-heading"><div><span class="level-kicker">${unlocked ? "LEVEL UNLOCKED" : "LOCKED LEVEL"}</span><h2>${level.name}</h2><p>${level.description} · ${level.duration}s · ${levelCompleted}/${level.challenges.length} complete</p></div><span class="level-requirement">${unlocked ? `${levelCompleted} complete` : `Complete ${level.unlockAt} ${key === "moderate" ? "Beginner" : "Moderate"} challenges`}</span></div><div class="challenge-grid">${level.challenges.map(challenge => {
      const done = progress.completedChallenges.includes(challenge.id);
      const available = unlocked && !done;
      return `<article class="challenge-card ${done ? "completed" : ""}"><div class="challenge-card-top"><span class="challenge-icon">${done ? "✓" : level.name[0]}</span><span class="challenge-status">${done ? "COMPLETED" : unlocked ? "AVAILABLE" : "LOCKED"}</span></div><h3>${challenge.name}</h3><p>${challenge.description}</p><div class="challenge-target">${challenge.target}</div><div class="challenge-card-footer"><strong>+${challenge.xp} XP</strong>${available ? `<button class="small-button start-challenge" data-challenge="${challenge.id}">Start →</button>` : done ? "<span class=\"done-label\">Earned</span>" : "<span class=\"lock-label\">🔒</span>"}</div></article>`;
    }).join("")}</div></section>`;
  }).join("");
  $("#achievementList").innerHTML = ACHIEVEMENTS.map(achievement => {
    const earned = progress.achievements.includes(achievement.id);
    return `<div class="achievement ${earned ? "earned" : ""}"><span>${earned ? achievement.icon : "·"}</span><div><strong>${achievement.name}</strong><small>${earned ? "Unlocked" : achievement.description}</small></div></div>`;
  }).join("");
  document.querySelectorAll(".start-challenge").forEach(button => button.addEventListener("click", () => startChallenge(button.dataset.challenge)));
}
function startChallenge(id) {
  const levelKey = getLevelForChallenge(id);
  const level = LEVELS[levelKey];
  const challenge = level.challenges.find(item => item.id === id);
  if (!challenge || !isLevelUnlocked(levelKey) || progress.completedChallenges.includes(id)) return;
  activePractice = null;
  activeChallenge = { id, levelKey, duration: level.duration, difficulty: level.difficulty, name: challenge.name };
  settings.duration = level.duration; settings.difficulty = level.difficulty; saveSettings(settings);
  document.querySelectorAll("[data-duration]").forEach(item => item.classList.toggle("selected", Number(item.dataset.duration) === settings.duration));
  document.querySelectorAll("[data-difficulty]").forEach(item => item.classList.toggle("selected", item.dataset.difficulty === settings.difficulty));
  test.reset(); showView("test"); showToast(`${challenge.name} started.`);
}
function evaluateProgress(result) {
  const totalTests = history.length;
  let xpEarned = 0;
  const completed = new Set(progress.completedChallenges);
  const levelKey = activeChallenge?.levelKey;
  const level = levelKey ? LEVELS[levelKey] : null;
  const context = { result, totalTests, completedChallenges: [...completed], completedInLevel: level ? getCompletedCount(levelKey) : 0 };
  if (activeChallenge && level) {
    const challenge = level.challenges.find(item => item.id === activeChallenge.id);
    const challengeResult = { ...result, testDuration: activeChallenge.duration };
    if (challenge && challenge.condition(challengeResult, context) && !completed.has(challenge.id)) {
      completed.add(challenge.id); progress.xp += challenge.xp; xpEarned += challenge.xp;
      showToast(`${challenge.name} complete! +${challenge.xp} XP`);
    }
  }
  progress.completedChallenges = [...completed];
  const nextUnlocked = unlockedLevels();
  const priorAchievements = new Set(progress.achievements);
  const achievementContext = { result, totalTests, completedChallenges: [...completed], unlockedLevels: nextUnlocked };
  ACHIEVEMENTS.forEach(achievement => {
    if (!priorAchievements.has(achievement.id) && achievement.condition(achievementContext)) {
      progress.achievements.push(achievement.id);
      showToast(`Achievement unlocked: ${achievement.name}`);
    }
  });
  saveProgress(progress);
  activeChallenge = null;
  return xpEarned;
}
function renderDashboard() {
  streak = getStreak();
  const best = history.length ? Math.max(...history.map(item => item.wpm)) : 0;
  $("#bestWpm").textContent = best || "—"; $("#averageWpm").textContent = averageWpm(history) || "—"; $("#totalTests").textContent = history.length;
  $("#bestLabel").textContent = best ? "Your fastest session" : "Complete a test to set your record";
  $("#averageLabel").textContent = history.length ? `Across ${history.length} session${history.length === 1 ? "" : "s"}` : "No sessions yet";
  $("#streakLabel").textContent = history.length ? "Keep building your rhythm" : "Start your first session";
  renderStreak();
  const activity = $("#recentActivity");
  activity.innerHTML = history.length ? history.slice(0, 4).map(item => `<div class="activity-item"><div class="activity-main"><span class="activity-dot"></span><div><strong>${item.difficulty[0].toUpperCase() + item.difficulty.slice(1)} session</strong><small>${formatDate(item.date)} · ${item.accuracy}% accuracy</small></div></div><div class="activity-wpm">${item.wpm}<small> WPM</small></div></div>`).join("") : `<p class="empty-state">No sessions yet. Your first run will appear here.</p>`;
}
function renderStreak() {
  const today = getLocalDateKey();
  const todayDate = new Date();
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - mondayOffset);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { date, key: getLocalDateKey(date) };
  });
  const todayComplete = streak.activityDates.includes(today);
  $("#currentStreak").textContent = streak.current;
  $("#longestStreak").textContent = streak.longest;
  $("#totalActiveDays").textContent = streak.totalActiveDays;
  $("#todayStatus").textContent = todayComplete ? "Complete" : "Pending";
  $("#streakMessage").textContent = todayComplete ? `Daily goal completed. Your streak is safe!` : streak.current > 0 ? `You're on a ${streak.current}-day streak. Keep going!` : "Complete one test to keep your streak alive.";
  $("#weekRange").textContent = `${days[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  $("#weeklyCalendar").innerHTML = days.map(({ date, key }) => {
    const completed = streak.activityDates.includes(key);
    const isToday = key === today;
    const state = completed ? "completed" : isToday ? "today" : key > today ? "future" : "missed";
    return `<div class="week-day ${state}"><span>${date.toLocaleDateString(undefined, { weekday: "short" })}</span><strong>${completed ? "✓" : ""}</strong><small>${date.getDate()}</small></div>`;
  }).join("");
}
function renderInsights() {
  keyStats = getKeyStats();
  $("#keyboardHeatmap").innerHTML = KEYBOARD_ROWS.map(row => `<div class="keyboard-row">${row.map(([key, label, size]) => `<button class="heat-key ${size || ""} ${getHeatClass(keyStats[key])}" data-heat-key="${key}" aria-label="${label} key">${label}</button>`).join("")}</div>`).join("");
  document.querySelectorAll("[data-heat-key]").forEach(button => button.addEventListener("click", () => selectHeatKey(button.dataset.heatKey)));
  const ranked = Object.entries(keyStats).filter(([, stat]) => stat.attempts >= 10);
  renderKeyRanking("#weakestKeys", ranked.sort(([, left], [, right]) => getKeyAccuracy(left) - getKeyAccuracy(right)).slice(0, 5), "No keys have 10 attempts yet.");
  renderKeyRanking("#strongestKeys", ranked.sort(([, left], [, right]) => getKeyAccuracy(right) - getKeyAccuracy(left)).slice(0, 5), "Complete more tests to see your strongest keys.");
  const totals = Object.values(keyStats).reduce((summary, stat) => ({ attempts: summary.attempts + stat.attempts, errors: summary.errors + stat.incorrect }), { attempts: 0, errors: 0 });
  $("#overallCharacters").textContent = totals.attempts;
  $("#overallErrors").textContent = totals.errors;
  $("#overallAccuracy").textContent = totals.attempts ? `${Math.round(((totals.attempts - totals.errors) / totals.attempts) * 100)}%` : "—";
  renderPractice(ranked.sort(([, left], [, right]) => getKeyAccuracy(left) - getKeyAccuracy(right)).slice(0, 5));
  selectHeatKey($("#selectedKey").dataset.key || "e");
}
function displayKey(key) {
  if (key === "SPACE") return "Space";
  if (key === "SHIFT-R" || key === "ALT-R" || key === "CTRL-R") return key.slice(0, -2);
  return key.length === 1 ? key.toUpperCase() : key;
}
function selectHeatKey(key) {
  const stat = keyStats[key] || { attempts: 0, correct: 0, incorrect: 0 };
  $("#selectedKey").textContent = displayKey(key);
  $("#selectedKey").dataset.key = key;
  $("#selectedAttempts").textContent = stat.attempts;
  $("#selectedCorrect").textContent = stat.correct;
  $("#selectedErrors").textContent = stat.incorrect;
  $("#selectedAccuracy").textContent = stat.attempts ? `${getKeyAccuracy(stat)}%` : "—";
  $("#selectedStatus").textContent = stat.attempts < 10 ? `Need ${10 - stat.attempts} more attempt${10 - stat.attempts === 1 ? "" : "s"} for a heatmap rating.` : getKeyAccuracy(stat) >= 95 ? "Excellent control." : getKeyAccuracy(stat) >= 85 ? "Solid accuracy with room to refine." : "This key is a good target for practice.";
  document.querySelectorAll("[data-heat-key]").forEach(button => button.classList.toggle("selected", button.dataset.heatKey === key));
}
function renderKeyRanking(selector, entries, emptyMessage) {
  $(selector).innerHTML = entries.length ? entries.map(([key, stat]) => `<button class="key-ranking-item" data-ranking-key="${key}"><span class="ranking-key">${displayKey(key)}</span><span class="ranking-bar"><i style="width:${getKeyAccuracy(stat)}%"></i></span><span class="ranking-value">${getKeyAccuracy(stat)}% <small>${stat.incorrect} errors</small></span></button>`).join("") : `<p class="empty-state">${emptyMessage}</p>`;
  document.querySelectorAll(`${selector} [data-ranking-key]`).forEach(button => button.addEventListener("click", () => selectHeatKey(button.dataset.rankingKey)));
}
function renderPractice(weakKeys) {
  const words = [...new Set(weakKeys.flatMap(([key]) => PRACTICE_WORDS[key] || []))].slice(0, 8);
  const practiceWords = words.length ? words : ["type", "flow", "practice"];
  const practiceText = `${practiceWords.join(" ")}. Keep your rhythm steady and practice each key with care.`;
  $("#practiceDescription").textContent = words.length ? `Focus on ${weakKeys.map(([key]) => displayKey(key)).join(", ")} with a short guided passage.` : "Start with a short baseline exercise. Recommendations will adapt after your first tests.";
  $("#practiceWords").innerHTML = practiceWords.map(word => `<span>${word}</span>`).join("");
  const button = $("#practiceButton");
  button.disabled = false;
  button.dataset.practice = practiceText;
}
function renderHistory() {
  const list = $("#historyList");
  list.innerHTML = history.length ? `<div class="history-header"><span>Date</span><span>Speed</span><span>Accuracy</span><span>Difficulty</span><span>Duration</span></div>${history.map(item => `<div class="history-item"><span>${formatDate(item.date)}</span><strong>${item.wpm} WPM</strong><span>${item.accuracy}%</span><span>${item.difficulty}</span><span>${item.duration}s</span></div>`).join("")}` : `<p class="empty-state">No completed tests yet. Finish a session to build your history.</p>`;
}
function renderResult(result, saved, previousBest = history.length ? Math.max(...history.map(item => item.wpm)) : 0, xpEarned = 0) {
  $("#finalWpm").textContent = result.wpm; $("#finalAccuracy").textContent = `${result.accuracy}%`; $("#finalCorrect").textContent = result.correct; $("#finalIncorrect").textContent = result.incorrect; $("#finalDuration").textContent = `${result.duration}s`;
  const isBest = result.wpm >= previousBest; $("#resultBadge").textContent = isBest ? "NEW PERSONAL BEST" : "SESSION COMPLETE";
  $("#resultComparison").textContent = isBest ? "A new personal best. Keep that feeling." : `${Math.max(0, previousBest - result.wpm)} WPM from your personal best.`;
  $("#resultsSubtitle").textContent = xpEarned ? `Challenge progress secured. +${xpEarned} XP earned.` : result.accuracy >= 95 ? "Accuracy and speed, working together." : "Your focus is the real score.";
  $("#miniChart").innerHTML = [...history.slice(0, 9).reverse(), result].map(item => `<span class="chart-bar" style="height:${Math.max(12, Math.min(100, item.wpm * 1.8))}%"></span>`).join("");
  if (saved) showToast(isBest ? "New personal best saved." : "Session saved to your history.");
}
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2800); }

const test = new TypingTest(elements, { getDuration: () => settings.duration, getDifficulty: () => settings.difficulty, getText: () => activePractice, onMistake: () => { document.body.classList.remove("mistake-shake"); void document.body.offsetWidth; document.body.classList.add("mistake-shake"); }, onFinish: result => { currentResult = result; const previousBest = history.length ? Math.max(...history.map(item => item.wpm)) : 0; history = saveTest(result).history; keyStats = mergeKeyStats(result.keyStats); const streakUpdate = recordStreakActivity(); streak = streakUpdate.streak; progress = getProgress(); const xpEarned = evaluateProgress(result) + streakUpdate.xpEarned; renderResult(result, true, previousBest, xpEarned); showView("results"); if (streakUpdate.milestones.length) showToast(`🔥 ${streakUpdate.milestones[streakUpdate.milestones.length - 1].days}-day streak milestone! +${streakUpdate.xpEarned} XP`); else if (streakUpdate.isNewDay) showToast(`🔥 You're on a ${streak.current}-day streak.`); } });

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => { const name = button.dataset.view; if (name === "test") { activeChallenge = null; activePractice = null; test.reset(); } showView(name); }));
document.querySelectorAll("[data-duration]").forEach(button => button.addEventListener("click", () => { if (activeChallenge) { showToast(`Challenge duration is locked to ${activeChallenge.duration}s.`); return; } settings.duration = Number(button.dataset.duration); saveSettings(settings); document.querySelectorAll("[data-duration]").forEach(item => item.classList.toggle("selected", item === button)); test.reset(); }));
document.querySelectorAll("[data-difficulty]").forEach(button => button.addEventListener("click", () => { if (activeChallenge) { showToast("Challenge difficulty is locked."); return; } settings.difficulty = button.dataset.difficulty; saveSettings(settings); document.querySelectorAll("[data-difficulty]").forEach(item => item.classList.toggle("selected", item === button)); test.reset(); }));
elements.input.addEventListener("input", event => test.input(event.target.value));
elements.display.addEventListener("click", () => {
  if (!test.finished) elements.input.focus();
});
$("#restartButton").addEventListener("click", () => test.reset());
$("#retakeButton").addEventListener("click", () => { test.reset(); showView("test"); });
$("#practiceButton").addEventListener("click", event => { if (!event.currentTarget.dataset.practice) return; activeChallenge = null; activePractice = event.currentTarget.dataset.practice; settings.duration = 30; settings.difficulty = "easy"; saveSettings(settings); test.reset(); showView("test"); showToast("Focused practice started."); });
$("#resetKeyStatsButton").addEventListener("click", () => { if (window.confirm("Reset all keyboard heatmap data? This cannot be undone.")) { resetKeyStats(); keyStats = {}; renderInsights(); showToast("Keyboard statistics reset."); } });
$("#clearHistoryButton").addEventListener("click", () => { if (history.length && window.confirm("Clear all saved test history? This cannot be undone.")) { clearHistory(); history = []; renderHistory(); renderDashboard(); showToast("History cleared."); } });
$("#mobileMenuButton").addEventListener("click", event => { const open = $(".main-nav").classList.toggle("open"); event.currentTarget.setAttribute("aria-expanded", open); });
document.addEventListener("keydown", event => { if (event.key.toLowerCase() === "r" && views.test.classList.contains("active") && document.activeElement !== elements.input) test.reset(); if (event.key === "Escape" && views.test.classList.contains("active")) test.finish(); });
document.querySelectorAll(".main-nav .nav-link").forEach(button => button.addEventListener("click", () => $(".main-nav").classList.remove("open")));

document.querySelectorAll("[data-duration]").forEach(item => item.classList.toggle("selected", Number(item.dataset.duration) === settings.duration));
document.querySelectorAll("[data-difficulty]").forEach(item => item.classList.toggle("selected", item.dataset.difficulty === settings.difficulty));
renderDashboard(); test.reset();
