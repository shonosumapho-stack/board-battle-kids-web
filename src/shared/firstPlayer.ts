import { Player } from './player.ts';

export type FirstPlayer = 'CIRCLE' | 'CROSS' | 'RANDOM';

export function resolveFirst(first: FirstPlayer, random: () => boolean): number {
  if (first === 'CIRCLE') return Player.CIRCLE;
  if (first === 'CROSS') return Player.CROSS;
  return random() ? Player.CIRCLE : Player.CROSS;
}

export function parseFirstPlayer(s: string | null): FirstPlayer {
  if (s === 'CIRCLE' || s === 'CROSS' || s === 'RANDOM') return s;
  return 'CIRCLE';
}
