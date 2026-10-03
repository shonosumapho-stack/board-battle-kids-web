import type { AiDifficulty } from '../shared/aiDifficulty.ts';

export function pickRandom<T>(items: T[], random: () => number): T | null {
  if (!items.length) return null;
  return items[Math.floor(random() * items.length)] ?? null;
}

/** Easy: random. Normal: 70% best. Hard: always best. */
export function chooseByDifficulty<T>(
  difficulty: AiDifficulty,
  bestMoves: T[],
  allMoves: T[],
  random: () => number,
): T | null {
  if (!allMoves.length) return null;
  if (!bestMoves.length) return pickRandom(allMoves, random);
  if (difficulty === 'EASY') {
    if (random() < 0.25) return pickRandom(bestMoves, random);
    return pickRandom(allMoves, random);
  }
  if (difficulty === 'NORMAL') {
    if (random() < 0.7) return pickRandom(bestMoves, random);
    return pickRandom(allMoves, random);
  }
  return pickRandom(bestMoves, random);
}
