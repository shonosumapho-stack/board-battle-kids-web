import { chooseByDifficulty } from '../ai/aiUtils.ts';
import type { AiDifficulty } from '../shared/aiDifficulty.ts';
import type { NimEngine } from './nimEngine.ts';

export class NimAi {
  private random = Math.random;

  choose(engine: NimEngine, difficulty: AiDifficulty): [number, number] | null {
    const legal = engine.legalMoves();
    if (!legal.length) return null;
    const best = this.optimalMoves(engine);
    return chooseByDifficulty(difficulty, best, legal, this.random);
  }

  private optimalMoves(engine: NimEngine): [number, number][] {
    const best: [number, number][] = [];
    if (engine.multiPile) {
      let endgame = true;
      for (const p of engine.piles) {
        if (p > 1) {
          endgame = false;
          break;
        }
      }
      if (engine.misere && endgame) {
        for (const m of engine.legalMoves()) {
          const t = engine.copy();
          t.take(m[0], m[1]);
          if (t.winner != null && t.winner === engine.current) {
            best.push(m);
          } else if (t.winner == null && t.nimSum() !== 0) {
            let ones = 0;
            for (const p of t.piles) if (p === 1) ones++;
            if (ones % 2 === 0) best.push(m);
          }
        }
        if (!best.length) {
          for (const m of engine.legalMoves()) {
            const t = engine.copy();
            t.take(m[0], m[1]);
            if (t.winner != null && t.winner === engine.current) best.push(m);
          }
        }
      } else {
        const sum = engine.nimSum();
        if (sum !== 0) {
          for (const m of engine.legalMoves()) {
            const t = engine.copy();
            t.take(m[0], m[1]);
            if (t.nimSum() === 0 || (t.winner != null && t.winner === engine.current)) {
              best.push(m);
            }
          }
        }
      }
    } else {
      const mod = engine.maxTake + 1;
      const stones = engine.piles[0];
      if (engine.misere) {
        for (const m of engine.legalMoves()) {
          const left = stones - m[1];
          if (left === 1 || (left > 1 && left % mod === 1)) best.push(m);
        }
      } else {
        for (const m of engine.legalMoves()) {
          const left = stones - m[1];
          if (left % mod === 0 || left === 0) best.push(m);
        }
      }
    }
    return best;
  }
}
