const STORAGE_KEY = "typeflow-data";
const defaultData = { bestWpm: 0, history: [], duration: 60, difficulty: "easy" };

function readData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.history)) return { ...defaultData };
    return { ...defaultData, ...parsed, history: parsed.history.filter(item => item && Number.isFinite(item.wpm)) };
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
  const history = [result, ...data.history].slice(0, 50);
  writeData({ ...data, history, bestWpm: Math.max(data.bestWpm || 0, result.wpm) });
  return { ...data, history, bestWpm: Math.max(data.bestWpm || 0, result.wpm) };
}
export function clearHistory() { writeData({ ...defaultData }); }
