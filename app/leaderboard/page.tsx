'use client'

import { useQuery } from '@tanstack/react-query'
import { getAllActivations, getActivations } from '@/lib/supabase'
import { calculateAccruedXp, calculateDailyXp } from '@/lib/xpCalculator'
import { calculateLevel } from '@/lib/levelCalculator'
import { Loader2, Search, Trophy, ArrowLeft, User, Star, Gift } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { fetchUserTokens } from '@/lib/domaExplorer'
import { useState, useEffect } from 'react'
import { LivingBackground } from '@/components/LivingBackground'

export default function Leaderboard() {
  const { address, isConnected } = useAccount()
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')

  // Обновляем каждую секунду для реалтайм XP
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const { data: allActivations, isLoading: isAllLoading } = useQuery({
    queryKey: ['all-activations'],
    queryFn: getAllActivations,
  })

  // Получаем токены текущего юзера для расчета его XP в реальном времени
  const { data: userTokens } = useQuery({
    queryKey: ['tokens', address],
    queryFn: () => address ? fetchUserTokens(address) : [],
    enabled: !!address,
  })

  // Group by wallet and sum up XP
  const leaderboardData = allActivations ? Object.entries(
    allActivations.reduce((acc, curr) => {
      const dailyRate = calculateDailyXp(curr.balance_at_activation, curr.price_at_activation)
      const xp = calculateAccruedXp(curr.activated_at, dailyRate)
      acc[curr.wallet] = (acc[curr.wallet] || 0) + xp
      return acc
    }, {} as Record<string, number>)
  ).map(([wallet, xp]) => {
    // Explicitly cast xp to number to avoid 'unknown' error
    const xpValue = xp as number
    const levelInfo = calculateLevel(xpValue)
    return {
      wallet,
      xp: xpValue,
      level: levelInfo.level
    }
  }) : []

  // Добавляем текущего пользователя, если его нет в списке из БД (локальный расчет)
  if (address && isConnected) {
    const userIndex = leaderboardData.findIndex(item => item.wallet.toLowerCase() === address.toLowerCase())
    
    // Рассчитываем текущий XP пользователя из его токенов
    const userCurrentXp = userTokens?.reduce((acc, token) => {
        if (token.formattedBalance > 0) {
            // Считаем от начала сессии (как на Dashboard)
            const sessionStart = new Date().toISOString() // Упрощенно для лидерборда
            return acc + calculateAccruedXp(sessionStart, token.dailyXp)
        }
        return acc
    }, 0) || 0

    if (userIndex === -1) {
        const levelInfo = calculateLevel(userCurrentXp)
        leaderboardData.push({ wallet: address, xp: userCurrentXp, level: levelInfo.level })
    } else {
        // Если он есть в БД, прибавляем то что накапало сейчас (для демо)
        leaderboardData[userIndex].xp += userCurrentXp
        leaderboardData[userIndex].level = calculateLevel(leaderboardData[userIndex].xp).level
    }
  }

  // Сортируем после всех манипуляций
  const sortedData = [...leaderboardData]
    .filter(item => item.wallet.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.xp - a.xp)

  if (isAllLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <LivingBackground />
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans relative overflow-x-hidden selection:bg-blue-500/30">
      <LivingBackground />
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header with Search and Season */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tighter italic">Leaderboard</h1>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.2em] font-black">Updates every 24 hours</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-gray-800/30 rounded-lg text-gray-600 text-sm font-black border border-gray-700 cursor-not-allowed flex items-center gap-2 uppercase tracking-widest">
                <Gift className="w-4 h-4" />
                Airdrop
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Search wallet..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-[#111] border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 w-full font-mono placeholder:text-gray-700 text-gray-300"
                      />
                  </div>
                  <button className="px-4 py-2 bg-[#111] border border-gray-800 rounded-lg text-sm font-black text-gray-300 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap uppercase tracking-widest">
                      Season 0
                  </button>
              </div>
            </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#111]/80 backdrop-blur-md rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800/50 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] bg-gray-900/20">
                  <th className="p-6 pl-8">Rank</th>
                  <th className="p-6">Wallet</th>
                  <th className="p-6">Level</th>
                  <th className="p-6 text-right pr-8">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {sortedData.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-20 text-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-800/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                              <Trophy className="w-8 h-8 text-gray-700" />
                            </div>
                            <p className="font-bold text-lg text-gray-400">No token farmers yet.</p>
                            <p className="text-sm mt-1 text-gray-600 uppercase tracking-widest font-black">Be the first!</p>
                        </td>
                    </tr>
                ) : (
                    sortedData.slice(0, 50).map((entry, index) => {
                      const isCurrentUser = address && entry.wallet.toLowerCase() === address.toLowerCase();
                      
                      return (
                        <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            key={entry.wallet} 
                            className={cn(
                                "transition-all group h-[80px]",
                                isCurrentUser ? "bg-blue-500/[0.08] border-l-4 border-blue-500" : "hover:bg-blue-500/[0.03]"
                            )}
                        >
                            <td className="p-6 pl-8">
                              <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center font-mono text-base font-black transition-transform group-hover:scale-110 shadow-lg",
                                  index === 0 ? "text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 shadow-yellow-500/10" :
                                  index === 1 ? "text-gray-300 bg-gray-300/10 border border-gray-300/20 shadow-gray-300/10" :
                                  index === 2 ? "text-orange-500 bg-orange-500/10 border border-orange-500/20 shadow-orange-500/10" :
                                  "text-gray-600 bg-gray-800/20 border border-gray-800/50"
                              )}>
                                  {index + 1}
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                    <User className="w-4 h-4 text-gray-500" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={cn(
                                        "font-mono text-[15px] group-hover:text-white transition-colors tracking-tight",
                                        isCurrentUser ? "text-blue-400 font-black" : "text-gray-300 font-bold"
                                    )}>
                                        {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                                    </span>
                                    {isCurrentUser && (
                                        <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest mt-0.5">
                                            YOU (CURRENT)
                                        </span>
                                    )}
                                  </div>
                              </div>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center gap-2 font-mono text-sm">
                                    <div className="w-6 h-6 rounded-lg bg-yellow-500/5 flex items-center justify-center border border-yellow-500/10">
                                      <Star className="w-3 h-3 text-yellow-500/70"/>
                                    </div>
                                    <span className={cn("font-black text-lg", isCurrentUser ? "text-white" : "text-gray-400")}>{entry.level}</span>
                                </div>
                            </td>
                            <td className="p-6 text-right pr-8 font-mono font-black text-xl text-blue-400 tabular-nums tracking-tighter">
                              {entry.xp > 1000000 
                                ? `${(entry.xp / 1000000).toFixed(2)}M` 
                                : entry.xp > 1000 
                                  ? `${(entry.xp / 1000).toFixed(2)}K` 
                                  : entry.xp.toFixed(2)}
                              <span className="text-[10px] text-gray-600 ml-1 font-bold uppercase tracking-widest">XP</span>
                            </td>
                        </motion.tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
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
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
