import { calculateAccuracy, calculateWpm, formatTime } from "./stats.js";

const paragraphs = {
  easy: [
    "Small steps become lasting habits when you give them your full attention. Take a breath, find a steady rhythm, and let your hands move with confidence.",
    "Every morning brings a fresh chance to learn something new. Keep your mind open, your goals simple, and your focus on the next useful step."
  ],
  medium: [
    "Good typing is less about rushing and more about finding a consistent rhythm. When every finger knows where to go, clear thinking has room to lead the way.",
    "Progress rarely arrives all at once; it is built through patient practice, thoughtful corrections, and the quiet decision to try one more time."
  ],
  hard: [
    "Precision is a form of patience: navigate unfamiliar ideas, punctuation, and unexpected turns without abandoning your rhythm. The composed typist adapts before they accelerate.",
    "A thoughtful sentence can hold several competing ideas; your task is to preserve its cadence, respect every comma, and maintain accuracy when complexity starts to compound."
  ]
};

export function normalizeHeatmapKey(character) {
  if (character === " ") return "SPACE";
  return character.length === 1 ? character.toLowerCase() : character;
}

export class TypingTest {
  constructor(elements, callbacks) { this.el = elements; this.callbacks = callbacks; this.reset(); }
  reset() {
    clearInterval(this.interval); this.running = false; this.finished = false; this.startedAt = 0; this.elapsed = 0; this.remaining = this.callbacks.getDuration();
    this.lastValue = "";
    this.keyStats = {};
    const options = paragraphs[this.callbacks.getDifficulty()]; let text = options[Math.floor(Math.random() * options.length)];
    if (text === this.lastText && options.length > 1) text = options.find(item => item !== this.lastText) || text;
    this.lastText = text; this.text = text; this.renderText(""); this.el.input.value = ""; this.updateStats("");
    this.el.timer.textContent = formatTime(this.remaining); this.el.status.textContent = "Ready when you are."; this.el.input.disabled = false;
  }
  renderText(value) {
    this.el.display.innerHTML = [...this.text].map((character, index) => {
      const state = index < value.length ? (value[index] === character ? "correct" : "incorrect") : index === value.length ? "current" : "";
      return `<span class="char ${state}">${character === " " ? "&nbsp;" : character}</span>`;
    }).join("");
  }
  start() {
    if (this.running || this.finished) return;
    this.running = true; this.startedAt = Date.now(); this.el.status.textContent = "In the zone...";
    this.interval = setInterval(() => { this.remaining -= 1; this.el.timer.textContent = formatTime(this.remaining); if (this.remaining <= 0) this.finish(); }, 1000);
  }
  updateStats(value) {
    const correct = [...value].filter((character, index) => character === this.text[index]).length;
    this.correct = correct; this.incorrect = Math.max(0, value.length - correct);
    this.el.wpm.textContent = calculateWpm(correct, Math.max(this.elapsed, 1));
    this.el.accuracy.textContent = `${calculateAccuracy(correct, value.length)}%`; this.el.chars.textContent = value.length;
    this.el.progress.style.width = `${Math.min(100, (value.length / this.text.length) * 100)}%`;
  }
  recordAttempts(value) {
    let start = -1;
    if (value.startsWith(this.lastValue)) {
      start = this.lastValue.length;
    } else if (value.length === this.lastValue.length) {
      start = [...value].findIndex((character, index) => character !== this.lastValue[index]);
    }
    if (start < 0) return;
    for (let index = start; index < value.length; index += 1) {
      const expected = this.text[index];
      if (!expected) continue;
      const key = normalizeHeatmapKey(expected);
      this.keyStats[key] = this.keyStats[key] || { attempts: 0, correct: 0, incorrect: 0 };
      this.keyStats[key].attempts += 1;
      if (value[index] === expected) this.keyStats[key].correct += 1;
      else this.keyStats[key].incorrect += 1;
    }
  }
  input(value) {
    if (this.finished) return;
    if (value.length > this.text.length) {
      value = value.slice(0, this.text.length);
      this.el.input.value = value;
    }
    if (value.length > 0) this.start();
    this.recordAttempts(value);
    if (value.length > this.lastValue.length) {
      const addedText = value.slice(this.lastValue.length);
      const hasMistake = [...addedText].some((character, offset) => character !== this.text[this.lastValue.length + offset]);
      if (hasMistake) this.callbacks.onMistake();
    }
    this.lastValue = value;
    this.elapsed = this.running ? Math.max(1, Math.floor((Date.now() - this.startedAt) / 1000)) : 0;
    this.renderText(value); this.updateStats(value);
    if (value.length === this.text.length) this.finish();
  }
  finish() {
    if (this.finished) return;
    if (!this.running && !this.startedAt && !this.el.input.value) return;
    clearInterval(this.interval); this.running = false; this.finished = true;
    this.elapsed = Math.max(1, Math.min(this.callbacks.getDuration(), this.startedAt ? Math.ceil((Date.now() - this.startedAt) / 1000) : 0));
    this.el.input.disabled = true; this.el.status.textContent = "Session complete.";
    const value = this.el.input.value; this.updateStats(value);
    this.callbacks.onFinish({ wpm: calculateWpm(this.correct, this.elapsed), accuracy: calculateAccuracy(this.correct, value.length), correct: this.correct, incorrect: this.incorrect, chars: value.length, duration: this.elapsed, difficulty: this.callbacks.getDifficulty(), date: new Date().toISOString(), keyStats: this.keyStats });
  }
}
