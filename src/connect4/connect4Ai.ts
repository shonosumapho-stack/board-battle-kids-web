import { chooseByDifficulty, pickRandom } from '../ai/aiUtils.ts';
import type { AiDifficulty } from '../shared/aiDifficulty.ts';
import { GameResult, winFor } from '../shared/gameResult.ts';
import { Player, otherPlayer } from '../shared/player.ts';
import type { Connect4Engine } from './connect4Engine.ts';

export class Connect4Ai {
  private random = Math.random;

  choose(engine: Connect4Engine, difficulty: AiDifficulty): number {
    const legal = engine.legalColumns();
    if (!legal.length) return -1;
    const me = engine.current;
    const opp = otherPlayer(me);

    const wins: number[] = [];
    for (const c of legal) {
      const t = engine.copy();
      t.drop(c);
      if (t.result === winFor(me)) wins.push(c);
    }
    if (wins.length) {
      const pick = chooseByDifficulty(difficulty, wins, legal, this.random);
      return pick ?? legal[0];
    }

    const blocks: number[] = [];
    for (const c of legal) {
      const t = engine.copy();
      t.current = opp;
      let row = 0;
      while (row < t.config.rows && t.cells[row][c] !== Player.NONE) row++;
      if (row < t.config.rows) {
        t.cells[row][c] = opp;
        if (t.hasWin(row, c, opp)) blocks.push(c);
      }
    }
    if (blocks.length && difficulty !== 'EASY') {
      const pick = chooseByDifficulty(difficulty, blocks, legal, this.random);
      return pick ?? legal[0];
    }

    if (difficulty === 'HARD') {
      const bestCol = this.minimaxCol(engine, 4);
      if (bestCol >= 0) return bestCol;
    }

    const center: number[] = [];
    const mid = (engine.config.cols - 1) / 2;
    for (const c of legal) {
      if (Math.abs(c - mid) <= 1.5) center.push(c);
    }
    const pick = chooseByDifficulty(difficulty, center, legal, this.random);
    return pick ?? legal[0];
  }

  private minimaxCol(engine: Connect4Engine, depth: number): number {
    const me = engine.current;
    let bestScore = Number.MIN_SAFE_INTEGER;
    const best: number[] = [];
    for (const c of engine.legalColumns()) {
      const t = engine.copy();
      t.drop(c);
      const score = this.minimax(t, depth - 1, false, me, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      if (score > bestScore) {
        bestScore = score;
        best.length = 0;
        best.push(c);
      } else if (score === bestScore) {
        best.push(c);
      }
    }
    const pick = pickRandom(best, this.random);
    return pick ?? -1;
  }

  private minimax(
    e: Connect4Engine,
    depth: number,
    maxing: boolean,
    me: number,
    alpha: number,
    beta: number,
  ): number {
    if (e.result !== GameResult.ONGOING) {
      if (e.result === GameResult.DRAW) return 0;
      return e.result === winFor(me) ? 1000 + depth : -1000 - depth;
    }
    if (depth === 0) return this.eval(e, me);

    if (maxing) {
      let best = Number.MIN_SAFE_INTEGER;
      for (const c of e.legalColumns()) {
        const t = e.copy();
        t.drop(c);
        best = Math.max(best, this.minimax(t, depth - 1, false, me, alpha, beta));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Number.MAX_SAFE_INTEGER;
    for (const c of e.legalColumns()) {
      const t = e.copy();
      t.drop(c);
      best = Math.min(best, this.minimax(t, depth - 1, true, me, alpha, beta));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  private eval(e: Connect4Engine, me: number): number {
    const opp = otherPlayer(me);
    let score = 0;
    const mid = (e.config.cols - 1) / 2;
    for (let r = 0; r < e.config.rows; r++) {
      for (let c = 0; c < e.config.cols; c++) {
        if (e.cells[r][c] === me) score += 2 - Math.abs(c - mid);
        else if (e.cells[r][c] === opp) score -= 2 - Math.abs(c - mid);
      }
    }
    return score;
  }
}
