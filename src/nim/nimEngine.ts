import { otherPlayer } from '../shared/player.ts';

export class NimEngine {
  piles: number[];
  readonly maxTake: number;
  readonly multiPile: boolean;
  readonly misere: boolean;
  current: number;
  winner: number | null = null;

  constructor(
    piles: number[],
    maxTake: number,
    multiPile: boolean,
    misere: boolean,
    first: number,
  ) {
    this.piles = [...piles];
    this.maxTake = maxTake;
    this.multiPile = multiPile;
    this.misere = misere;
    this.current = first;
  }

  isOver(): boolean {
    return this.winner != null;
  }

  totalStones(): number {
    return this.piles.reduce((a, b) => a + b, 0);
  }

  canTake(pileIndex: number, count: number): boolean {
    if (this.isOver() || pileIndex < 0 || pileIndex >= this.piles.length || count < 1) {
      return false;
    }
    if (this.piles[pileIndex] < count) return false;
    if (!this.multiPile) return count <= this.maxTake;
    return true;
  }

  take(pileIndex: number, count: number): boolean {
    if (!this.canTake(pileIndex, count)) return false;
    this.piles[pileIndex] -= count;
    if (this.totalStones() === 0) {
      this.winner = this.misere ? otherPlayer(this.current) : this.current;
    } else {
      this.current = otherPlayer(this.current);
    }
    return true;
  }

  legalMoves(): [number, number][] {
    const moves: [number, number][] = [];
    for (let i = 0; i < this.piles.length; i++) {
      const limit = this.multiPile ? this.piles[i] : Math.min(this.maxTake, this.piles[i]);
      for (let c = 1; c <= limit; c++) moves.push([i, c]);
    }
    return moves;
  }

  nimSum(): number {
    return this.piles.reduce((x, p) => x ^ p, 0);
  }

  copy(): NimEngine {
    const e = new NimEngine(this.piles, this.maxTake, this.multiPile, this.misere, this.current);
    e.winner = this.winner;
    return e;
  }
}
