export function calculateDailyXp(balance: number, price: number): number {
  const value = balance * price
  let dailyXp = value * 10 // 1$ = 10 XP/day
  
  // Whale Bonus: +20% if total value > $50
  if (value >= 50) {
    dailyXp *= 1.2
  }
  
  return dailyXp
}

export function calculateAccruedXp(activatedAt: string, dailyRate: number): number {
  const start = new Date(activatedAt).getTime()
  const now = new Date().getTime()
  const diffMs = now - start
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  if (diffDays < 0) return 0
  
  return diffDays * dailyRate
}
