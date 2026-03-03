export const WEEKLY_STREAK_REWARDS = [10, 20, 30, 40, 50, 60, 70];

export interface StreakInfo {
  canClaim: boolean;
  streakDay: number;
  reward: number;
}

// Проверяет, может ли пользователь получить ежедневный бонус
export const checkDailyStreak = (lastClaimed: string | null, currentStreak: number): StreakInfo => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastClaimed) {
    // Никогда не получал, может получить за 1-й день
    return { canClaim: true, streakDay: 1, reward: WEEKLY_STREAK_REWARDS[0] };
  }

  const lastClaimDate = new Date(lastClaimed);
  lastClaimDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastClaimDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Уже получал сегодня
    return { canClaim: false, streakDay: currentStreak, reward: WEEKLY_STREAK_REWARDS[currentStreak -1] };
  } else if (diffDays === 1) {
    // Продолжает стрик, следующий день
    const nextStreakDay = currentStreak % 7 + 1;
    return { canClaim: true, streakDay: nextStreakDay, reward: WEEKLY_STREAK_REWARDS[nextStreakDay - 1] };
  } else {
    // Стрик прерван, начинает заново
    return { canClaim: true, streakDay: 1, reward: WEEKLY_STREAK_REWARDS[0] };
  }
};
