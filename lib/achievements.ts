import { EnrichedToken } from './domaExplorer';

export type AchievementID = 'whale' | 'diversifier' | 'early_bird' | 'diamond_hands';

export interface Achievement {
  id: AchievementID;
  name: string;
  description: string;
  emoji: string;
  isUnlocked: (tokens: EnrichedToken[], activations?: any[]) => boolean;
}

export const ACHIEVEMENTS: Record<AchievementID, Achievement> = {
  whale: {
    id: 'whale',
    name: 'Whale',
    description: 'Hold tokens worth $50 or more in a single asset.',
    emoji: '🐋',
    isUnlocked: (tokens) => tokens.some(t => t.value >= 50),
  },
  diversifier: {
    id: 'diversifier',
    name: 'Diversifier',
    description: 'Hold 5 or more different types of tokens.',
    emoji: '🌐',
    isUnlocked: (tokens) => tokens.filter(t => t.formattedBalance > 0).length >= 5,
  },
  diamond_hands: {
    id: 'diamond_hands',
    name: 'Diamond Hands',
    description: 'Hold any token for more than 30 days.',
    emoji: '💎',
    // Placeholder: This would require storing activation dates and checking them.
    // For now, we can mock it or leave it for a DB implementation.
    isUnlocked: (tokens, activations) => {
        if (!activations) return false;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return activations.some((a: any) => new Date(a.activated_at).getTime() < thirtyDaysAgo);
    },
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Be one of the first 100 users.',
    emoji: '🐦',
    // Placeholder: This requires knowing the user's signup order.
    // We can mock this for now.
    isUnlocked: (tokens, activations) => {
        // Mock logic: if wallet address ends with a number 0-4
        const lastChar = tokens[0]?.contractAddress.slice(-1) || 'z';
        return /[0-4]/.test(lastChar);
    },
  },
};

export function checkAchievements(tokens: EnrichedToken[], activations?: any[]): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(ach => ach.isUnlocked(tokens, activations));
}
