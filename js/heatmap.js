export const KEYBOARD_ROWS = [
  [["`", "`"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["0", "0"], ["-", "-"], ["=", "="], ["BACKSPACE", "⌫", "wide"]],
  [["TAB", "Tab", "wide"], ["q", "Q"], ["w", "W"], ["e", "E"], ["r", "R"], ["t", "T"], ["y", "Y"], ["u", "U"], ["i", "I"], ["o", "O"], ["p", "P"], ["[", "["], ["]", "]"], ["\\", "\\"]],
  [["CAPS", "Caps", "wider"], ["a", "A"], ["s", "S"], ["d", "D"], ["f", "F"], ["g", "G"], ["h", "H"], ["j", "J"], ["k", "K"], ["l", "L"], [";", ";"], ["'", "'"], ["ENTER", "Enter", "wide"]],
  [["SHIFT", "Shift", "widest"], ["z", "Z"], ["x", "X"], ["c", "C"], ["v", "V"], ["b", "B"], ["n", "N"], ["m", "M"], [",", ","], [".", "."], ["/", "/"], ["SHIFT-R", "Shift", "wider"]],
  [["CTRL", "Ctrl", "wide"], ["ALT", "Alt", "wide"], ["SPACE", "Space", "space"], ["ALT-R", "Alt", "wide"], ["CTRL-R", "Ctrl", "wide"]]
];

export function getKeyAccuracy(stat) {
  return stat && stat.attempts ? Math.round((stat.correct / stat.attempts) * 100) : 0;
}

export function getHeatClass(stat) {
  if (!stat || stat.attempts < 10) return "heat-neutral";
  const accuracy = getKeyAccuracy(stat);
  if (accuracy >= 95) return "heat-green";
  if (accuracy >= 85) return "heat-yellow";
  if (accuracy >= 70) return "heat-orange";
  return "heat-red";
}

export const PRACTICE_WORDS = {
  a: ["adapt", "data", "steady"], b: ["basic", "bright", "habit"], c: ["focus", "practice", "accuracy"],
  d: ["daily", "decide", "dedicate"], e: ["excellent", "steady", "exercise"], f: ["flow", "focus", "fresh"],
  g: ["good", "goal", "growth"], h: ["habit", "health", "rhythm"], i: ["improve", "inspire", "typing"],
  j: ["just", "join", "enjoy"], k: ["keep", "keyboard", "skill"], l: ["learn", "level", "little"],
  m: ["master", "moment", "rhythm"], n: ["new", "next", "consistent"], o: ["one", "open", "correct"],
  p: ["practice", "pace", "progress"], q: ["quick", "equal", "quality"], r: ["rhythm", "ready", "correct"],
  s: ["speed", "skill", "session"], t: ["type", "test", "steady"], u: ["useful", "focus", "unique"],
  v: ["move", "every", "improve"], w: ["work", "words", "flow"], x: ["exact", "extra", "text"],
  y: ["your", "daily", "steady"], z: ["zero", "size", "organize"]
};
