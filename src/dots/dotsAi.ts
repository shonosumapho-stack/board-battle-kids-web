import { chooseByDifficulty, pickRandom } from '../ai/aiUtils.ts';
import type { AiDifficulty } from '../shared/aiDifficulty.ts';
import { Player } from '../shared/player.ts';
import type { DotsEngine } from './dotsEngine.ts';

export class DotsAi {
  private random = Math.random;

  choose(engine: DotsEngine, difficulty: AiDifficulty): [number, number] | null {
    const legal = engine.legalMoves();
    if (!legal.length) return null;

    const scoring: [number, number][] = [];
    const safe: [number, number][] = [];
    for (const m of legal) {
      const t = engine.copy();
      const before = t.scoreCircle + t.scoreCross;
      const turn = t.current;
      t.applyMove(m);
      const after = t.scoreCircle + t.scoreCross;
      if (after > before && t.current === turn) scoring.push(m);
      else if (!this.givesBox(engine, m)) safe.push(m);
    }
    if (scoring.length) return chooseByDifficulty(difficulty, scoring, legal, this.random);
    if (safe.length && difficulty !== 'EASY') {
      return chooseByDifficulty(difficulty, safe, legal, this.random);
    }
    return pickRandom(legal, this.random);
  }

  private givesBox(engine: DotsEngine, move: [number, number]): boolean {
    const t = engine.copy();
    t.applyMove(move);
    for (let r = 0; r < t.boxSize; r++) {
      for (let c = 0; c < t.boxSize; c++) {
        const bi = r * t.boxSize + c;
        if (t.owners[bi] !== Player.NONE) continue;
        let sides = 0;
        if (t.horiz[r * t.boxSize + c]) sides++;
        if (t.horiz[(r + 1) * t.boxSize + c]) sides++;
        if (t.vert[r * (t.boxSize + 1) + c]) sides++;
        if (t.vert[r * (t.boxSize + 1) + (c + 1)]) sides++;
        if (sides === 3) return true;
      }
    }
    return false;
  }
}
