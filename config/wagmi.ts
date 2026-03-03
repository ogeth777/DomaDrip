import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'

export const doma = defineChain({
  id: 97477,
  name: 'Doma Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.doma.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Doma Explorer', url: 'https://explorer.doma.xyz' },
  },
  testnet: false,
})

export const config = createConfig({
  chains: [doma],
  connectors: [injected()],
  transports: {
    [doma.id]: http(),
  },
  ssr: true,
})
