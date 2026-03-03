'use client'

import { useAccount } from 'wagmi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUserTokens } from '@/lib/domaExplorer'
import { getActivations, activateToken, Activation } from '@/lib/supabase'
import { calculateDailyXp, calculateAccruedXp } from '@/lib/xpCalculator'
import { calculateLevel } from '@/lib/levelCalculator'
import { checkAchievements, Achievement } from '@/lib/achievements'
import { checkDailyStreak, WEEKLY_STREAK_REWARDS } from '@/lib/dailyStreak'
import { WalletConnect } from '@/components/WalletConnect'
import { Loader2, TrendingUp, DollarSign, Wallet, ArrowRight, Activity, Zap, Info, X, Star, Gift, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LivingBackground } from '@/components/LivingBackground'

export default function Home() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const [tick, setTick] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [showStreakBonus, setShowStreakBonus] = useState(false)
  const [streak, setStreak] = useState(0)
  const [streakInfo, setStreakInfo] = useState({
    canClaim: false,
    streakDay: 1,
    reward: WEEKLY_STREAK_REWARDS[0]
  })
  
  // Запоминаем время начала сессии ОДИН раз, чтобы XP не сбрасывались каждую секунду
  const [sessionStartTime] = useState(() => new Date().toISOString())

  // Обновляем состояние каждую секунду для эффекта "капания" XP
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Инициализация состояния из localStorage
  useEffect(() => {
    if (isConnected && address) {
      const lastClaimed = localStorage.getItem(`lastClaimed_${address}`)
      const currentStreak = parseInt(localStorage.getItem(`currentStreak_${address}`) || '0')
      
      // Загружаем сохраненный XP (если есть)
      // В реальном приложении это должно приходить с бэкенда, но для демо сохраняем локально
      const savedXp = parseFloat(localStorage.getItem(`totalXp_${address}`) || '0')
      
      const info = checkDailyStreak(lastClaimed, currentStreak)
      setStreakInfo(info)
      setStreak(currentStreak)
    }
  }, [isConnected, address])

  // Сохраняем прогресс XP в localStorage каждые 5 секунд
  useEffect(() => {
    if (isConnected && address && totalAccruedXp > 0) {
      const interval = setInterval(() => {
        localStorage.setItem(`totalXp_${address}`, totalAccruedXp.toString())
        localStorage.setItem(`level_${address}`, levelInfo.level.toString())
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isConnected, address, totalAccruedXp, levelInfo.level])

  // Таймер обратного отсчета для следующего бонуса
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    if (!streakInfo.canClaim && address) {
      const lastClaimed = localStorage.getItem(`lastClaimed_${address}`)
      if (lastClaimed) {
        const interval = setInterval(() => {
          const now = new Date()
          const lastDate = new Date(lastClaimed)
          const nextDate = new Date(lastDate)
          nextDate.setDate(nextDate.getDate() + 1)
          
          const diff = nextDate.getTime() - now.getTime()
          
          if (diff <= 0) {
            setTimeLeft('')
            // Обновляем состояние, если время вышло
            const currentStreak = parseInt(localStorage.getItem(`currentStreak_${address}`) || '0')
            setStreakInfo(checkDailyStreak(lastClaimed, currentStreak))
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
          }
        }, 1000)
        return () => clearInterval(interval)
      }
    }
  }, [streakInfo.canClaim, address])

  const handleClaimXp = () => {
    if (!streakInfo.canClaim || !address) return;

    const now = new Date().toISOString()
    localStorage.setItem(`lastClaimed_${address}`, now)
    // Увеличиваем стрик только если это следующий день, иначе сбрасываем или оставляем 1
    const newStreak = streakInfo.streakDay
    localStorage.setItem(`currentStreak_${address}`, newStreak.toString())
    
    // Добавляем бонусный XP к сохраненному
    const currentTotalXp = parseFloat(localStorage.getItem(`totalXp_${address}`) || '0')
    localStorage.setItem(`totalXp_${address}`, (currentTotalXp + streakInfo.reward).toString())
    
    setShowStreakBonus(true)
    setStreak(newStreak)
    setStreakInfo({
      ...streakInfo,
      canClaim: false
    })

    setTimeout(() => setShowStreakBonus(false), 5000)
  }

  const { data: tokens, isLoading: isTokensLoading } = useQuery({
    queryKey: ['tokens', address],
    queryFn: () => address ? fetchUserTokens(address) : [],
    enabled: !!address,
  })

  const { data: activations, isLoading: isActivationsLoading } = useQuery({
    queryKey: ['activations', address],
    queryFn: () => address ? getActivations(address) : [],
    enabled: !!address,
  })

  const activateMutation = useMutation({
    mutationFn: activateToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activations'] })
    }
  })

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-white relative overflow-hidden bg-transparent selection:bg-blue-500/30">
        <LivingBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md w-full bg-[#111]/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
            <Wallet className="w-10 h-10 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">DomaDrip</h2>
            <p className="text-gray-400 font-medium">Connect your wallet to start farming XP across the Doma Network.</p>
          </div>
          <div className="flex justify-center pt-4 scale-110">
             <WalletConnect />
          </div>
        </motion.div>

        {/* Built on Doma Badge */}
        <div className="fixed bottom-8 left-8 z-50">
          <a 
            href="https://www.doma.xyz/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black text-gray-600 hover:text-blue-400 transition-all flex items-center gap-3 tracking-[0.3em] bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 hover:border-blue-500/20"
          >
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            BUILT ON DOMA.XYZ
          </a>
        </div>
      </div>
    )
  }

  if (isTokensLoading || isActivationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <LivingBackground />
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Merge tokens with activation data
  const mergedTokens = tokens?.map(token => {
    const activation = activations?.find(a => a.token_symbol === token.symbol)
    const isAutoActivated = token.formattedBalance > 0
    const activatedAt = activation?.activated_at || sessionStartTime
    const accruedXp = isAutoActivated ? calculateAccruedXp(activatedAt, token.dailyXp) : 0
    
    return {
      ...token,
      isActivated: isAutoActivated,
      accruedXp,
      activationDate: activatedAt
    }
  })

  // Рассчитываем общие статы
  const totalValue = mergedTokens?.reduce((acc, t) => acc + t.value, 0) || 0
  const dailyXpRate = mergedTokens?.reduce((acc, t) => acc + (t.isActivated ? t.dailyXp : 0), 0) || 0
  const totalAccruedXp = mergedTokens?.reduce((acc, t) => acc + t.accruedXp, 0) || 0

  // Расчет уровня и достижений
  const levelInfo = calculateLevel(totalAccruedXp)
  const unlockedAchievements = checkAchievements(mergedTokens || [], activations)

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans relative overflow-x-hidden selection:bg-blue-500/30">
      <LivingBackground />
      <header className="flex justify-between items-center mb-12 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <span className="font-black text-xl">D</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic">DomaDrip</h1>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://app.doma.xyz/join/puot3uu3rzm4m"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 text-sm font-black border border-blue-500/30 uppercase tracking-widest"
          >
            <ShoppingCart className="w-4 h-4" />
            Get Tokens
          </a>
          <Link 
            href="/leaderboard"
            className="px-4 py-2 hover:bg-gray-800/50 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-black border border-gray-800 uppercase tracking-widest"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Link>
          <button className="px-4 py-2 bg-gray-800/30 rounded-lg text-gray-600 text-sm font-black border border-gray-700 cursor-not-allowed flex items-center gap-2 uppercase tracking-widest">
            <Gift className="w-4 h-4" />
            Airdrop
          </button>
          <WalletConnect />
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-7xl mx-auto relative z-10">
        {/* Level Widget */}
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#111]/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 col-span-1 md:col-span-1 flex flex-col justify-between shadow-xl transition-all hover:border-blue-500/30 group"
        >
            <div>
                <div className="text-gray-400 text-[10px] mb-2 flex items-center gap-2 uppercase tracking-[0.2em] font-black group-hover:text-blue-400 transition-colors">
                    <Star className="w-4 h-4 text-yellow-400" /> Level
                </div>
                <div className="text-6xl font-black font-mono text-white group-hover:text-blue-400 transition-colors">{levelInfo.level}</div>
            </div>
            <div className="mt-6">
                <div className="flex justify-between items-end text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-bold">
                    <span>{totalAccruedXp.toFixed(0)} XP</span>
                    <span className="text-blue-400">Next: {levelInfo.xpToNextLevel.toFixed(0)} XP</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-gray-800/50">
                    <motion.div 
                        className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${levelInfo.progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </div>
            </div>
        </motion.div>

        {/* Other Stats */}
        <div className="bg-[#111]/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-8 shadow-xl">
            <motion.div whileHover={{ y: -2 }} className="flex flex-col justify-center">
                <div className="text-gray-400 text-[10px] mb-3 flex items-center gap-2 uppercase tracking-[0.2em] font-black"><DollarSign className="w-4 h-4 text-blue-400" /> Total Value</div>
                <div className="text-4xl font-black font-mono text-white leading-none">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </motion.div>
            
            <motion.div whileHover={{ y: -2 }} className="flex flex-col justify-center">
                <div className="text-gray-400 text-[10px] mb-3 flex items-center gap-2 uppercase tracking-[0.2em] font-black"><TrendingUp className="w-4 h-4 text-green-400" /> XP Rate</div>
                <div className="text-4xl font-black font-mono text-blue-400 leading-none">
                  +{dailyXpRate.toFixed(1)}
                  <span className="text-xs text-gray-500 ml-1 font-bold">/DAY</span>
                </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -2 }} className="flex flex-col justify-center">
                <div className="text-gray-400 text-[10px] mb-3 flex items-center gap-2 uppercase tracking-[0.2em] font-black"><Activity className="w-4 h-4 text-purple-400" /> Total XP</div>
                <div className="text-4xl font-black font-mono text-green-400 leading-none tabular-nums">
                    <motion.span
                        key={totalAccruedXp.toFixed(2)}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        className="drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]"
                    >
                        {totalAccruedXp.toFixed(2)}
                    </motion.span>
                </div>
            </motion.div>
            
            {/* Daily Reward Section */}
            <div className="flex flex-col justify-center border-l border-gray-800/50 pl-8">
                <div className="text-gray-400 text-[10px] mb-3 flex items-center gap-2 uppercase tracking-[0.2em] font-black">
                  <Gift className="w-4 h-4 text-pink-500" /> Streak Day {streakInfo.streakDay}
                </div>
                <button
                    disabled={!streakInfo.canClaim}
                    onClick={handleClaimXp}
                    className={cn(
                        "w-full py-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-widest group relative overflow-hidden",
                        streakInfo.canClaim 
                            ? "bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/40" 
                            : "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-800"
                    )}
                >
                    {streakInfo.canClaim ? (
                        <>
                          <span className="relative z-10">Claim {streakInfo.reward} XP</span>
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                        </>
                    ) : (
                        <div className="flex flex-col items-center leading-none">
                          <span className="opacity-50 italic text-[10px]">Next Bonus in</span>
                          <span className="font-mono text-xs text-pink-400">{timeLeft || "24h 00m"}</span>
                        </div>
                    )}
                </button>
            </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-[#111]/80 backdrop-blur-md rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900/50 to-transparent">
                <div>
                  <h2 className="text-2xl font-black tracking-tight italic">Your Assets</h2>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.2em] font-black">Farming XP across the Doma Network</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-blue-400 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/20 font-black tracking-[0.2em]">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                    LIVE DRIP ACTIVE
                </div>
            </div>
            
            {mergedTokens?.length === 0 ? (
                <div className="p-24 text-center text-gray-500">
                    <div className="w-20 h-20 bg-gray-800/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-gray-800">
                      <Wallet className="w-10 h-10 text-gray-700" />
                    </div>
                    <p className="font-black text-xl text-gray-400 italic">No supported tokens found.</p>
                    <p className="text-xs mt-2 uppercase tracking-widest font-bold">Get some Doma tokens to start farming XP.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-800/50 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] bg-gray-900/20">
                                <th className="p-6 pl-8">Token Asset</th>
                                <th className="p-6 text-right">Price</th>
                                <th className="p-6 text-right">Balance</th>
                                <th className="p-6 text-right">Value (USD)</th>
                                <th className="p-6 text-right">Daily XP</th>
                                <th className="p-6 text-right pr-8">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                            {mergedTokens?.map((token) => (
                                <tr key={token.symbol} className="hover:bg-blue-500/[0.03] transition-all group h-[100px]">
                                    <td className="p-6 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/5 flex items-center justify-center text-blue-400 text-xl font-black border border-blue-500/20 shadow-lg group-hover:scale-110 transition-transform">
                                                {token.symbol[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-black text-white text-[18px] group-hover:text-blue-400 transition-colors italic">
                                                    {token.symbol}
                                                </div>
                                                <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-0.5">Doma Network</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right font-mono text-gray-400 text-sm">
                                        ${token.price.toFixed(4)}
                                    </td>
                                    <td className="p-6 text-right font-mono text-gray-300 text-sm">
                                        {token.formattedBalance > 0 ? (
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-white text-base tracking-tight">{token.formattedBalance < 0.01 ? token.formattedBalance.toFixed(6) : token.formattedBalance.toLocaleString()}</span>
                                                <span className="text-[9px] text-gray-600 font-black tracking-[0.1em] uppercase">on-chain</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-700">0.00</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right font-mono font-black text-sm">
                                        {token.value > 0 ? (
                                            <span className="text-white bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-inner text-base">${token.value < 0.01 ? token.value.toFixed(6) : token.value.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-gray-700">$0.00</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right font-mono text-blue-400 text-sm">
                                        {token.dailyXp > 0 ? (
                                            <span className="font-black text-base">+{token.dailyXp < 0.01 ? token.dailyXp.toFixed(6) : token.dailyXp.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-gray-700">+0.00</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right pr-8">
                                        {token.isActivated ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 rounded-full border border-green-500/20">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-green-400 text-[9px] font-black uppercase tracking-[0.1em]">
                                                        Farming
                                                    </span>
                                                </div>
                                                <span className="text-lg text-blue-400 font-mono font-black tracking-tighter">
                                                    {token.accruedXp.toFixed(4)} <span className="text-[10px] text-gray-600 ml-0.5">XP</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest bg-gray-800/10 px-3 py-1.5 rounded-full border border-gray-800/50">
                                                Hold to Farm
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Achievements Section */}
        {unlockedAchievements.length > 0 && (
            <div className="mt-16">
                <h2 className="text-3xl font-black mb-8 flex items-center gap-4 italic"><Trophy className="w-8 h-8 text-yellow-400"/> Unlocked Achievements</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {unlockedAchievements.map(ach => (
                        <motion.div 
                          whileHover={{ y: -10, scale: 1.05 }}
                          key={ach.id} 
                          className="bg-[#111]/80 backdrop-blur-sm border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center aspect-square transition-all hover:border-yellow-500/50 shadow-2xl group"
                        >
                            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{ach.emoji}</div>
                            <div className="font-black text-sm text-white uppercase tracking-wider">{ach.name}</div>
                            <p className="text-[10px] text-gray-500 mt-2 leading-tight font-bold">{ach.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Built on Doma Badge */}
      <div className="fixed bottom-8 left-8 z-50">
        <a 
          href="https://www.doma.xyz/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-black text-gray-600 hover:text-blue-400 transition-all flex items-center gap-3 tracking-[0.3em] bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 hover:border-blue-500/20"
        >
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          BUILT ON DOMA.XYZ
        </a>
      </div>

      {/* Roadmap Section - Visible when connected */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto mt-32 mb-32 px-4 relative z-10"
      >
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black tracking-tighter mb-4 italic">The Vision</h2>
          <p className="text-blue-500 uppercase tracking-[0.4em] text-[10px] font-black">Strategic Development Roadmap</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-y-1/2 z-0" />

          {/* Phase 1 */}
          <motion.div 
            whileHover={{ y: -10, borderColor: 'rgba(236, 72, 153, 0.4)' }} 
            className="bg-[#111]/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-800/50 text-left relative z-10 shadow-2xl transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-pink-500/10 transition-colors" />
            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-8 border border-pink-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-pink-500" />
            </div>
            <div className="text-pink-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Phase 01</div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">Genesis</h3>
            <ul className="space-y-5 text-sm">
              <li className="flex items-center gap-4 text-gray-300 font-bold">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-[10px]">✓</div>
                XP Farming Engine
              </li>
              <li className="flex items-center gap-4 text-gray-300 font-bold">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-[10px]">✓</div>
                Leveling System
              </li>
              <li className="flex items-center gap-4 text-gray-300 font-bold">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-[10px]">✓</div>
                Daily Rewards
              </li>
            </ul>
          </motion.div>

          {/* Phase 2 */}
          <motion.div 
            whileHover={{ y: -10, borderColor: 'rgba(59, 130, 246, 0.4)' }} 
            className="bg-[#111]/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-800/50 text-left relative z-10 shadow-2xl transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-blue-500" />
            </div>
            <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Phase 02</div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">Scale</h3>
            <ul className="space-y-5 text-sm">
              <li className="flex items-center gap-4 text-gray-400 font-bold italic">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-[10px] animate-pulse">●</div>
                Season 1 Launch
              </li>
              <li className="flex items-center gap-4 text-gray-400 font-medium">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 text-[10px]">○</div>
                Asset Expansion
              </li>
              <li className="flex items-center gap-4 text-gray-400 font-medium">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 text-[10px]">○</div>
                Referral Network
              </li>
            </ul>
          </motion.div>

          {/* Phase 3 */}
          <motion.div 
            whileHover={{ y: -10, borderColor: 'rgba(168, 85, 247, 0.4)' }} 
            className="bg-[#111]/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-800/50 text-left relative z-10 shadow-2xl transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors" />
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Gift className="w-7 h-7 text-purple-500" />
            </div>
            <div className="text-purple-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Phase 03</div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">Ecosystem</h3>
            <ul className="space-y-5 text-sm">
              <li className="flex items-center gap-4 text-gray-400 font-medium">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 text-[10px]">○</div>
                $DRIP Governance
              </li>
              <li className="flex items-center gap-4 font-black text-white bg-purple-500/5 py-2 px-3 rounded-xl border border-purple-500/10 -ml-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] shadow-lg shadow-purple-500/50">★</div>
                AIRDROP EVENT
              </li>
              <li className="flex items-center gap-4 text-gray-400 font-medium">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 text-[10px]">○</div>
                DAO Integration
              </li>
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Discover Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowInfo(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-3 bg-[#111]/90 backdrop-blur-xl border border-gray-800 hover:border-blue-500/50 rounded-2xl py-2 pl-4 pr-2 transition-all group shadow-2xl"
      >
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <span className="text-sm font-black text-white uppercase tracking-widest">Guide</span>
        <div className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black group-hover:bg-blue-500 transition-colors uppercase tracking-[0.2em]">
          Discover
        </div>
      </motion.button>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-gray-800 rounded-[3rem] p-10 max-w-xl w-full relative shadow-2xl"
            >
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-8 right-8 p-3 hover:bg-gray-800 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              <h2 className="text-4xl font-black mb-10 pr-8 text-white italic tracking-tighter">System Mechanics</h2>
              
              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-6 custom-scrollbar">
                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white uppercase tracking-tight">XP Distribution</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mt-1 font-medium">
                      Every <span className="text-white font-black">$1</span> value of tokens you hold generates <span className="text-blue-400 font-black">10 XP</span> per day.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-green-500/20 group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white uppercase tracking-tight">Whale Bonus</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mt-1 font-medium">
                      Holding tokens worth <span className="text-white font-black">$50</span> or more grants a <span className="text-green-400 font-black">+20% XP boost</span>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Star className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white uppercase tracking-tight">Levels & Progression</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mt-1 font-medium">
                      Earn XP to level up! Higher levels unlock prestige on the leaderboard and special status.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                    <Trophy className="w-7 h-7 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white uppercase tracking-tight">Achievements</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mt-1 font-medium">
                      Complete milestones like becoming a Whale or holding diverse assets to unlock unique badges.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-pink-500/20 group-hover:scale-110 transition-transform">
                    <Gift className="w-7 h-7 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white uppercase tracking-tight">Daily Streak</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mt-1 font-medium">
                      Claim XP every day! Reward increases daily: <span className="text-pink-400 font-black text-base">10, 20, 30... 70 XP</span>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start group">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white uppercase tracking-tight">Live Drip</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mt-1 font-medium">
                      XP is accrued in real-time. No manual activation required—just hold tokens and watch your points grow.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-900/40 uppercase tracking-[0.2em] text-sm"
              >
                Close Protocol
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Streak Bonus Notification */}
      <AnimatePresence>
        {showStreakBonus && (
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ ease: "easeInOut", duration: 0.5 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-[2rem] p-6 shadow-[0_0_50px_rgba(37,99,235,0.3)] border border-white/20 backdrop-blur-xl"
            >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <Gift className="w-8 h-8" />
                </div>
                <div>
                    <p className="font-black text-xl italic tracking-tight">Daily Login Bonus!</p>
                    <p className="text-sm font-medium opacity-90">You earned <span className="font-black text-base">+{streakInfo.reward} XP</span> for your Day {streak} streak!</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
