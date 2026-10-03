import { chooseByDifficulty, pickRandom } from '../ai/aiUtils.ts';
import type { AiDifficulty } from '../shared/aiDifficulty.ts';
import { GameResult, winFor } from '../shared/gameResult.ts';
import { otherPlayer } from '../shared/player.ts';
import { VariantCell, type VariantEngine } from './variantEngine.ts';

export class VariantAi {
  private random = Math.random;

  choose(engine: VariantEngine, difficulty: AiDifficulty): number {
    const legal = engine.legalMoves();
    if (!legal.length) return -1;
    const me = engine.current;
    const opp = otherPlayer(me);

    const wins: number[] = [];
    for (const m of legal) {
      const t = engine.copy();
      t.place(m);
      if (t.result === winFor(me)) wins.push(m);
    }
    if (wins.length) {
      const p = chooseByDifficulty(difficulty, wins, legal, this.random);
      return p ?? legal[0];
    }

    const blocks: number[] = [];
    for (const m of legal) {
      const t = engine.copy();
      if (engine.mode === 'WILD' && m === 4) {
        t.cells[m] = VariantCell.WILD;
      } else {
        t.cells[m] = opp;
      }
      if (t.hasWin(opp)) blocks.push(m);
    }
    if (blocks.length && difficulty !== 'EASY') {
      const p = chooseByDifficulty(difficulty, blocks, legal, this.random);
      return p ?? legal[0];
    }

    if (difficulty === 'HARD') {
      const best = this.minimaxMove(engine, engine.mode === 'CUBE' ? 3 : 6);
      if (best >= 0) return best;
    }

    const p = pickRandom(legal, this.random);
    return p ?? legal[0];
  }

  private minimaxMove(engine: VariantEngine, depth: number): number {
    const me = engine.current;
    let bestScore = Number.MIN_SAFE_INTEGER;
    const best: number[] = [];
    for (const m of engine.legalMoves()) {
      const t = engine.copy();
      t.place(m);
      const score = this.minimax(t, depth - 1, false, me, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      if (score > bestScore) {
        bestScore = score;
        best.length = 0;
        best.push(m);
      } else if (score === bestScore) {
        best.push(m);
      }
    }
    const p = pickRandom(best, this.random);
    return p ?? -1;
  }

  private minimax(
    e: VariantEngine,
    depth: number,
    maxing: boolean,
    me: number,
    alpha: number,
    beta: number,
  ): number {
    if (e.result !== GameResult.ONGOING) {
      if (e.result === GameResult.DRAW) return 0;
      return e.result === winFor(me) ? 100 + depth : -100 - depth;
    }
    if (depth === 0) return 0;

    if (maxing) {
      let best = Number.MIN_SAFE_INTEGER;
      for (const m of e.legalMoves()) {
        const t = e.copy();
        t.place(m);
        best = Math.max(best, this.minimax(t, depth - 1, false, me, alpha, beta));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Number.MAX_SAFE_INTEGER;
    for (const m of e.legalMoves()) {
      const t = e.copy();
      t.place(m);
      best = Math.min(best, this.minimax(t, depth - 1, true, me, alpha, beta));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}
