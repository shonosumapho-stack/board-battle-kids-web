export type AiDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export const AI_DIFFICULTIES: AiDifficulty[] = ['EASY', 'NORMAL', 'HARD'];

export function parseDifficulty(s: string | null): AiDifficulty {
  if (s === 'EASY' || s === 'NORMAL' || s === 'HARD') return s;
  return 'NORMAL';
}
