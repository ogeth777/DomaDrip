import { formatUnits, getAddress, parseAbi } from 'viem'
import { calculateDailyXp } from './xpCalculator'
import { config, doma } from '@/config/wagmi'
import { readContract, multicall } from '@wagmi/core'

export interface Token {
  symbol: string
  balance: string
  contractAddress: string
  decimals: string
  name: string
  type: string
}

export interface EnrichedToken extends Token {
  formattedBalance: number
  price: number
  value: number
  dailyXp: number
}

export const TOP_TOKEN_PRICES: Record<string, number> = {
  'brag.com': 0.504,
  'software.ai': 0.285,
  'boner.com': 0.179,
  'wines.xyz': 0.0328,
  'swimsuits.ai': 0.0314,
  'depin.ai': 0.0296,
  'investors.xyz': 0.0208,
  'terabytes.ai': 0.00987,
  'foundations.xyz': 0.0082,
  'hightech.xyz': 0.0051,
}

// Addresses provided by user
const MOCK_CONTRACT_ADDRESSES: Record<string, string> = {
  'brag.com': '0xa1000000006E7B861b62233823062DA63c75C408', 
  'software.ai': '0xa100000000000d6E18bc155F425685E4BadfE11c',
  'boner.com': '0xA1000000009A7A132488B2D48235B7024A843039',
  'wines.xyz': '0xA1000000002145Ae8f85E00a549417287A306ba3',
  'swimsuits.ai': '0xA100000000f5626fF6eA97bF1106D9712BdB3a61',
  'depin.ai': '0xa100000000D1FE638a664bff1AE1D5ba1AD77444',
  'investors.xyz': '0xA100000000d0eD9BAB4641BD7A5245d7aEFD4420',
  'terabytes.ai': '0x6264716d886713c22AE826D7112871E82922199c',
  'foundations.xyz': '0xA100000000BA20CC1e85c6D557d758a64fbB9e09',
  'hightech.xyz': '0xA100000000f5B8B5267929ca39e610fd36162561'
}

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
])

const DEFAULT_PRICE = 0.01

export async function fetchUserTokens(address: string): Promise<EnrichedToken[]> {
  let userTokens: Token[] = []
  
  try {
    const apiUrl = `https://explorer.doma.xyz/api?module=account&action=tokenlist&address=${address}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(apiUrl, { cache: 'no-store', signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (response.ok) {
        const data = await response.json()
        if (data.status === "1" && Array.isArray(data.result)) {
            userTokens = data.result
        }
    }
  } catch (error) {
    // console.warn("Explorer API failed, relying on direct blockchain reads")
  }

  try {
    const userBalanceMap = new Map<string, Token>()
    userTokens.forEach(t => userBalanceMap.set(t.symbol, t))

    const symbols = Object.keys(TOP_TOKEN_PRICES)

    // Читаем балансы индивидуально через readContract, так как Multicall может не поддерживаться RPC
    const supportedTokens = await Promise.all(symbols.map(async symbol => {
        const userToken = userBalanceMap.get(symbol)
        const price = TOP_TOKEN_PRICES[symbol]
        const contractAddress = userToken?.contractAddress || MOCK_CONTRACT_ADDRESSES[symbol] || ""
        
        let rawBalance = BigInt(0)
        let decimals = 18

        if (contractAddress && address) {
            try {
                // console.log(`Attempting direct read for ${symbol} at ${contractAddress} for owner ${address}`)
                
                // Читаем баланс напрямую
                const balance = await readContract(config, {
                    address: getAddress(contractAddress),
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [getAddress(address)]
                }) as bigint
                
                rawBalance = balance
                // console.log(`Balance for ${symbol}: ${rawBalance.toString()}`)

                // Если в API нет данных, читаем decimals тоже
                if (userToken) {
                    decimals = parseInt(userToken.decimals)
                } else {
                    try {
                        const d = await readContract(config, {
                            address: getAddress(contractAddress),
                            abi: ERC20_ABI,
                            functionName: 'decimals'
                        }) as number
                        decimals = d
                    } catch (e) {
                        decimals = 18
                    }
                }
                
                if (rawBalance > 0) {
                    console.log(`[OK] Token ${symbol} found! Balance: ${rawBalance.toString()}, Decimals: ${decimals}`)
                } else {
                    // console.log(`[EMPTY] Token ${symbol} balance is 0 at ${contractAddress}`)
                }
            } catch (e) {
                console.warn(`[ERROR] Direct read failed for ${symbol} at ${contractAddress}:`, e)
                // Fallback to API if blockchain read failed
                if (userToken) {
                    rawBalance = BigInt(userToken.balance)
                    decimals = parseInt(userToken.decimals)
                }
            }
        } else if (userToken) {
             rawBalance = BigInt(userToken.balance)
             decimals = parseInt(userToken.decimals)
        }

        const formattedBalance = parseFloat(formatUnits(rawBalance, decimals))
        const value = formattedBalance * price
        const dailyXp = calculateDailyXp(formattedBalance, price)

        return {
            symbol,
            name: userToken?.name || symbol,
            balance: rawBalance.toString(),
            decimals: decimals.toString(),
            contractAddress,
            type: "ERC-20",
            formattedBalance,
            price,
            value,
            dailyXp
        }
    }))
    
    const otherTokens = userTokens.filter(t => 
        !TOP_TOKEN_PRICES[t.symbol] &&
        t.symbol.includes('.') && 
        ['.com', '.ai', '.xyz'].some(ext => t.symbol.endsWith(ext))
    ).map(token => {
        const price = DEFAULT_PRICE
        const decimals = parseInt(token.decimals) || 18
        const formattedBalance = parseFloat(formatUnits(BigInt(token.balance), decimals))
        const value = formattedBalance * price
        const dailyXp = calculateDailyXp(formattedBalance, price)
        
        return {
            ...token,
            formattedBalance,
            price,
            value,
            dailyXp
        }
    })

    return [...supportedTokens, ...otherTokens].sort((a, b) => b.price - a.price)
  } catch (error) {
    console.error("Error processing tokens:", error)
    return symbols.map(symbol => ({
        symbol,
        name: symbol,
        balance: "0",
        decimals: "18",
        contractAddress: MOCK_CONTRACT_ADDRESSES[symbol] || "",
        type: "ERC-20",
        formattedBalance: 0,
        price: TOP_TOKEN_PRICES[symbol],
        value: 0,
        dailyXp: 0
    }))
  }
}


