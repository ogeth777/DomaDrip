import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

export interface Activation {
  wallet: string
  token_symbol: string
  activated_at: string
  balance_at_activation: number
  price_at_activation: number
  last_claimed_at?: string
  current_xp: number
}

export async function getActivations(wallet: string) {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
        .from('activations')
        .select('*')
        .eq('wallet', wallet)
    
    if (error) {
        return []
    }
    return data as Activation[]
  } catch (e) {
      return []
  }
}

export async function activateToken(activation: Omit<Activation, 'current_xp' | 'activated_at'>) {
    if (!supabase) return null
    // Check if user exists, if not create
    const { error: userError } = await supabase
        .from('users')
        .upsert({ wallet: activation.wallet, nickname: activation.wallet }, { onConflict: 'wallet' })
    
    if (userError) console.error('Error creating user:', userError)

    const { data, error } = await supabase
        .from('activations')
        .insert([{
            ...activation,
            activated_at: new Date().toISOString(),
            current_xp: 0
        }])
        .select()
    
    if (error) throw error
    return data
}

export async function getAllActivations() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('activations')
      .select('*')
    
    if (error) {
      return []
    }
    return data
  } catch (e) {
    return []
  }
}


