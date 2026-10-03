import { chooseByDifficulty, pickRandom } from '../ai/aiUtils.ts';
import type { AiDifficulty } from '../shared/aiDifficulty.ts';
import { GameResult, winFor } from '../shared/gameResult.ts';
import { otherPlayer } from '../shared/player.ts';
import type { AlignEngine } from './alignEngine.ts';

export class AlignAi {
  private random = Math.random;

  choose(engine: AlignEngine, difficulty: AiDifficulty): [number, number] | null {
    const legal = engine.legalMoves();
    if (!legal.length) return null;
    const me = engine.current;
    const opp = otherPlayer(me);

    const wins: [number, number][] = [];
    for (const m of legal) {
      const trial = engine.copy();
      trial.place(m[0], m[1]);
      if (trial.result === winFor(me)) wins.push(m);
    }
    if (wins.length) return chooseByDifficulty(difficulty, wins, legal, this.random);

    const blocks: [number, number][] = [];
    for (const m of legal) {
      const trial = engine.copy();
      trial.current = opp;
      trial.cells[m[0]][m[1]] = opp;
      if (trial.hasWin(m[0], m[1], opp)) blocks.push(m);
    }
    if (blocks.length && difficulty !== 'EASY') {
      return chooseByDifficulty(difficulty, blocks, legal, this.random);
    }

    if (difficulty === 'HARD' && engine.def.playableCount() <= 25) {
      const best = this.minimaxMove(engine, 4);
      if (best) return best;
    }

    const centerish: [number, number][] = [];
    const cr = (engine.def.rows - 1) / 2;
    const cc = (engine.def.cols - 1) / 2;
    for (const m of legal) {
      const dist = Math.abs(m[0] - cr) + Math.abs(m[1] - cc);
      if (dist <= 2) centerish.push(m);
    }
    return chooseByDifficulty(difficulty, centerish, legal, this.random);
  }

  private minimaxMove(engine: AlignEngine, depth: number): [number, number] | null {
    let bestScore = Number.MIN_SAFE_INTEGER;
    const best: [number, number][] = [];
    const me = engine.current;
    for (const m of engine.legalMoves()) {
      const trial = engine.copy();
      trial.place(m[0], m[1]);
      const score = this.minimax(trial, depth - 1, false, me, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      if (score > bestScore) {
        bestScore = score;
        best.length = 0;
        best.push(m);
      } else if (score === bestScore) {
        best.push(m);
      }
    }
    return pickRandom(best, this.random);
  }

  private minimax(
    e: AlignEngine,
    depth: number,
    maximizing: boolean,
    me: number,
    alpha: number,
    beta: number,
  ): number {
    if (e.result !== GameResult.ONGOING) {
      if (e.result === GameResult.DRAW) return 0;
      if (e.result === winFor(me)) return 1000 + depth;
      return -1000 - depth;
    }
    if (depth === 0) return this.evaluate(e, me);

    if (maximizing) {
      let best = Number.MIN_SAFE_INTEGER;
      for (const m of e.legalMoves()) {
        const t = e.copy();
        t.place(m[0], m[1]);
        best = Math.max(best, this.minimax(t, depth - 1, false, me, alpha, beta));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Number.MAX_SAFE_INTEGER;
    for (const m of e.legalMoves()) {
      const t = e.copy();
      t.place(m[0], m[1]);
      best = Math.min(best, this.minimax(t, depth - 1, true, me, alpha, beta));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  private evaluate(e: AlignEngine, me: number): number {
    const opp = otherPlayer(me);
    let score = 0;
    const cr = (e.def.rows - 1) / 2;
    const cc = (e.def.cols - 1) / 2;
    for (let r = 0; r < e.def.rows; r++) {
      for (let c = 0; c < e.def.cols; c++) {
        if (e.cells[r][c] === me) score += 3 - (Math.abs(r - cr) + Math.abs(c - cc));
        else if (e.cells[r][c] === opp) score -= 3 - (Math.abs(r - cr) + Math.abs(c - cc));
      }
    }
    return score;
  }
}
