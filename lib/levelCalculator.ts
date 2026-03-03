export const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 1000 },
  { level: 3, xp: 2500 },
  { level: 4, xp: 5000 },
  { level: 5, xp: 10000 },
  { level: 6, xp: 20000 },
  { level: 7, xp: 40000 },
  { level: 8, xp: 80000 },
  { level: 9, xp: 150000 },
  { level: 10, xp: 300000 },
];

export function calculateLevel(totalXp: number) {
  let currentLevel = 1;
  let xpForNextLevel = LEVELS[1].xp;
  let xpForCurrentLevel = 0;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp) {
      currentLevel = LEVELS[i].level;
      xpForCurrentLevel = LEVELS[i].xp;
      xpForNextLevel = i < LEVELS.length - 1 ? LEVELS[i + 1].xp : Infinity;
      break;
    }
  }

  const progress = xpForNextLevel === Infinity ? 100 : 
    ((totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  return {
    level: currentLevel,
    progress: Math.min(100, progress),
    xpToNextLevel: xpForNextLevel === Infinity ? 0 : xpForNextLevel - totalXp,
  };
}
