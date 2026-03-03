'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Loader2, AlertCircle } from 'lucide-react'
import { doma } from '@/config/wagmi'
import { useEffect } from 'react'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const chainId = useChainId()

  const isWrongChain = isConnected && chainId !== doma.id

  if (isConnected) {
    if (isWrongChain) {
      return (
        <div className="flex items-center gap-4">
          <button
            onClick={() => switchChain({ chainId: doma.id })}
            disabled={isSwitching}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-900/20 animate-pulse"
          >
            {isSwitching ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            Wrong Network: Switch to Doma
          </button>
          <button
            onClick={() => disconnect()}
            className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium border border-gray-700"
          >
            Disconnect
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-xs font-mono text-blue-400">Doma Mainnet</span>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-400">
            {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
            onClick={() => disconnect()}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-xs font-medium border border-gray-700"
            >
            Disconnect
            </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-900/20"
    >
      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
      Connect Wallet
    </button>
  )
}
