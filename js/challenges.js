export const LEVELS = {
  beginner: {
    name: "Beginner",
    description: "Build a steady foundation.",
    duration: 30,
    difficulty: "easy",
    accent: "beginner",
    unlockAt: 0,
    challenges: [
      { id: "beginner-first-steps", name: "First Steps", description: "Complete a 30-second test.", target: "Finish a 30s test", xp: 50, condition: result => result.testDuration >= 30 },
      { id: "beginner-accuracy", name: "Accuracy Matters", description: "Keep your keystrokes precise.", target: "Reach 90% accuracy", xp: 50, condition: result => result.accuracy >= 90 },
      { id: "beginner-rhythm", name: "Finding Rhythm", description: "Find your first reliable pace.", target: "Reach 20 WPM", xp: 50, condition: result => result.wpm >= 20 },
      { id: "beginner-consistency", name: "Consistency", description: "Show up and practice three times.", target: "Complete 3 typing tests", xp: 50, condition: (_result, context) => context.totalTests >= 3 },
      { id: "beginner-champion", name: "Beginner Champion", description: "Complete every beginner challenge.", target: "Complete the other 4 challenges", xp: 100, condition: (_result, context) => context.completedInLevel >= 4 }
    ]
  },
  moderate: {
    name: "Moderate",
    description: "Turn practice into momentum.",
    duration: 60,
    difficulty: "medium",
    accent: "moderate",
    unlockAt: 4,
    challenges: [
      { id: "moderate-speed", name: "Speed Builder", description: "Push beyond your warm-up pace.", target: "Reach 35 WPM", xp: 50, condition: result => result.wpm >= 35 },
      { id: "moderate-precision", name: "Precision Typist", description: "Keep control as speed rises.", target: "Reach 93% accuracy", xp: 50, condition: result => result.accuracy >= 93 },
      { id: "moderate-pace", name: "Keep the Pace", description: "Complete a full moderate session.", target: "Finish a 60s test", xp: 50, condition: result => result.testDuration >= 60 },
      { id: "moderate-word-master", name: "Word Master", description: "Make varied vocabulary feel natural.", target: "Reach 40 WPM", xp: 50, condition: result => result.wpm >= 40 },
      { id: "moderate-champion", name: "Moderate Champion", description: "Complete every moderate challenge.", target: "Complete the other 4 challenges", xp: 100, condition: (_result, context) => context.completedInLevel >= 4 }
    ]
  },
  pro: {
    name: "Pro",
    description: "Test speed, endurance, and precision.",
    duration: 120,
    difficulty: "hard",
    accent: "pro",
    unlockAt: 4,
    challenges: [
      { id: "pro-speed", name: "Speed Demon", description: "Break into high-speed territory.", target: "Reach 55 WPM", xp: 50, condition: result => result.wpm >= 55 },
      { id: "pro-precision", name: "Perfect Precision", description: "Stay accurate under pressure.", target: "Reach 97% accuracy", xp: 50, condition: result => result.accuracy >= 97 },
      { id: "pro-endurance", name: "Endurance Test", description: "Hold your focus through a long session.", target: "Finish a 120s test", xp: 50, condition: result => result.testDuration >= 120 },
      { id: "pro-elite", name: "Elite Typist", description: "Join the fastest flow state.", target: "Reach 65 WPM", xp: 50, condition: result => result.wpm >= 65 },
      { id: "pro-champion", name: "Pro Champion", description: "Complete every pro challenge.", target: "Complete the other 4 challenges", xp: 100, condition: (_result, context) => context.completedInLevel >= 4 }
    ]
  }
};

export const ACHIEVEMENTS = [
  { id: "first-test", name: "First Test", description: "Complete your first typing test.", icon: "01", condition: context => context.totalTests >= 1 },
  { id: "speed-starter", name: "Speed Starter", description: "Reach 30 WPM in any test.", icon: "↗", condition: context => context.result.wpm >= 30 },
  { id: "accuracy-expert", name: "Accuracy Expert", description: "Reach 95% accuracy in any test.", icon: "◎", condition: context => context.result.accuracy >= 95 },
  { id: "ten-tests", name: "10 Tests Completed", description: "Complete ten typing tests.", icon: "10", condition: context => context.totalTests >= 10 },
  { id: "challenge-master", name: "Challenge Master", description: "Complete five challenges.", icon: "★", condition: context => context.completedChallenges.length >= 5 },
  { id: "pro-unlocked", name: "Pro Unlocked", description: "Unlock the Pro level.", icon: "◆", condition: context => context.unlockedLevels.includes("pro") }
];

export function getLevelForChallenge(id) {
  return Object.entries(LEVELS).find(([, level]) => level.challenges.some(challenge => challenge.id === id))?.[0] || null;
}
