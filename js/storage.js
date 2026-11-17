const STORAGE_KEY = "typeflow-data";
const defaultData = {
  bestWpm: 0,
  history: [],
  duration: 60,
  difficulty: "easy",
  xp: 0,
  completedChallenges: [],
  achievements: [],
  keyStats: {},
  streak: {
    current: 0,
    longest: 0,
    lastActiveDate: null,
    totalActiveDays: 0,
    activityDates: [],
    rewardedMilestones: []
  }
};

const STREAK_MILESTONES = [
  { days: 3, xp: 30 },
  { days: 7, xp: 75 },
  { days: 14, xp: 150 },
  { days: 30, xp: 300 },
  { days: 60, xp: 500 },
  { days: 100, xp: 1000 }
];

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateDistance(fromKey, toKey) {
  if (!fromKey || !toKey) return 0;
  const [fromYear, fromMonth, fromDay] = fromKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toKey.split("-").map(Number);
  return Math.round((new Date(toYear, toMonth - 1, toDay) - new Date(fromYear, fromMonth - 1, fromDay)) / 86400000);
}

function normalizeStreak(streak) {
  const normalized = {
    ...defaultData.streak,
    ...(streak || {}),
    activityDates: Array.isArray(streak?.activityDates) ? [...new Set(streak.activityDates.filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item)))] : [],
    rewardedMilestones: Array.isArray(streak?.rewardedMilestones) ? [...new Set(streak.rewardedMilestones)] : []
  };
  normalized.totalActiveDays = normalized.activityDates.length;
  if (normalized.lastActiveDate && dateDistance(normalized.lastActiveDate, getLocalDateKey()) > 1) normalized.current = 0;
  return normalized;
}

function normalizeKeyStats(keyStats) {
  if (!keyStats || typeof keyStats !== "object") return {};
  return Object.fromEntries(Object.entries(keyStats).filter(([, value]) => value && Number.isFinite(value.attempts) && Number.isFinite(value.correct) && Number.isFinite(value.incorrect)).map(([key, value]) => [key, {
    attempts: Math.max(0, value.attempts),
    correct: Math.max(0, value.correct),
    incorrect: Math.max(0, value.incorrect)
  }]));
}

function readData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.history)) return { ...defaultData };
    return {
      ...defaultData,
      ...parsed,
      history: parsed.history.filter(item => item && Number.isFinite(item.wpm)),
      completedChallenges: Array.isArray(parsed.completedChallenges) ? parsed.completedChallenges : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      keyStats: normalizeKeyStats(parsed.keyStats),
      streak: normalizeStreak(parsed.streak)
    };
  } catch {
    return { ...defaultData };
  }
}

function writeData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Unable to save TypeFlow data.", error);
  }
}

export function getSettings() {
  const data = readData();
  return { duration: [30, 60, 120].includes(data.duration) ? data.duration : 60, difficulty: ["easy", "medium", "hard"].includes(data.difficulty) ? data.difficulty : "easy" };
}
export function getHistory() { return readData().history; }
export function saveSettings(settings) { const data = readData(); writeData({ ...data, ...settings }); }
export function saveTest(result) {
  const data = readData();
  const { keyStats, ...historyResult } = result;
  const history = [historyResult, ...data.history].slice(0, 50);
  writeData({ ...data, history, bestWpm: Math.max(data.bestWpm || 0, result.wpm) });
  return { ...data, history, bestWpm: Math.max(data.bestWpm || 0, result.wpm) };
}
export function clearHistory() {
  const data = readData();
  writeData({ ...defaultData, duration: data.duration, difficulty: data.difficulty, xp: data.xp, completedChallenges: data.completedChallenges, achievements: data.achievements, streak: data.streak, keyStats: data.keyStats });
}
export function getProgress() {
  const data = readData();
  return { xp: data.xp, completedChallenges: data.completedChallenges, achievements: data.achievements };
}
export function saveProgress(progress) {
  const data = readData();
  const next = { ...data, ...progress };
  writeData(next);
  return { xp: next.xp, completedChallenges: next.completedChallenges, achievements: next.achievements };
}
export function getKeyStats() {
  return readData().keyStats;
}
export function mergeKeyStats(sessionStats) {
  const data = readData();
  const keyStats = normalizeKeyStats(data.keyStats);
  Object.entries(sessionStats || {}).forEach(([key, value]) => {
    if (!value || !Number.isFinite(value.attempts)) return;
    keyStats[key] = keyStats[key] || { attempts: 0, correct: 0, incorrect: 0 };
    keyStats[key].attempts += value.attempts;
    keyStats[key].correct += value.correct || 0;
    keyStats[key].incorrect += value.incorrect || 0;
  });
  writeData({ ...data, keyStats });
  return keyStats;
}
export function resetKeyStats() {
  const data = readData();
  writeData({ ...data, keyStats: {} });
}
export function getStreak() {
  return readData().streak;
}
export function recordStreakActivity(dateKey = getLocalDateKey()) {
  const data = readData();
  const streak = normalizeStreak(data.streak);
  if (streak.lastActiveDate === dateKey) return { streak, xpEarned: 0, milestones: [], isNewDay: false };

  const nextCurrent = streak.lastActiveDate && dateDistance(streak.lastActiveDate, dateKey) === 1 ? streak.current + 1 : 1;
  streak.current = nextCurrent;
  streak.longest = Math.max(streak.longest, nextCurrent);
  streak.lastActiveDate = dateKey;
  if (!streak.activityDates.includes(dateKey)) streak.activityDates.push(dateKey);
  streak.totalActiveDays = streak.activityDates.length;

  const milestones = STREAK_MILESTONES.filter(milestone => nextCurrent >= milestone.days && !streak.rewardedMilestones.includes(milestone.days));
  milestones.forEach(milestone => streak.rewardedMilestones.push(milestone.days));
  const xpEarned = milestones.reduce((sum, milestone) => sum + milestone.xp, 0);
  writeData({ ...data, xp: (data.xp || 0) + xpEarned, streak });
  return { streak, xpEarned, milestones, isNewDay: true };
}
