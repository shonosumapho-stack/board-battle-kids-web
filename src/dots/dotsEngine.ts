import { Player, otherPlayer } from '../shared/player.ts';

export class DotsEngine {
  readonly boxSize: number;
  readonly horiz: boolean[];
  readonly vert: boolean[];
  readonly owners: number[];
  current: number;
  winner: number | null = null;
  scoreCircle = 0;
  scoreCross = 0;

  constructor(boxSize: number, first: number) {
    this.boxSize = boxSize;
    this.horiz = Array((boxSize + 1) * boxSize).fill(false);
    this.vert = Array(boxSize * (boxSize + 1)).fill(false);
    this.owners = Array(boxSize * boxSize).fill(Player.NONE);
    this.current = first;
  }

  isOver(): boolean {
    return this.winner != null;
  }

  canDrawH(index: number): boolean {
    return !this.isOver() && index >= 0 && index < this.horiz.length && !this.horiz[index];
  }

  canDrawV(index: number): boolean {
    return !this.isOver() && index >= 0 && index < this.vert.length && !this.vert[index];
  }

  drawHorizontal(index: number): boolean {
    if (!this.canDrawH(index)) return false;
    this.horiz[index] = true;
    return this.afterEdge();
  }

  drawVertical(index: number): boolean {
    if (!this.canDrawV(index)) return false;
    this.vert[index] = true;
    return this.afterEdge();
  }

  private afterEdge(): boolean {
    const gained = this.claimBoxes();
    if (gained === 0) {
      this.current = otherPlayer(this.current);
    }
    if (this.allBoxesOwned()) {
      if (this.scoreCircle > this.scoreCross) this.winner = Player.CIRCLE;
      else if (this.scoreCross > this.scoreCircle) this.winner = Player.CROSS;
      else this.winner = Player.NONE;
    }
    return true;
  }

  private claimBoxes(): number {
    let gained = 0;
    for (let r = 0; r < this.boxSize; r++) {
      for (let c = 0; c < this.boxSize; c++) {
        const bi = r * this.boxSize + c;
        if (this.owners[bi] !== Player.NONE) continue;
        const top = r * this.boxSize + c;
        const bottom = (r + 1) * this.boxSize + c;
        const left = r * (this.boxSize + 1) + c;
        const right = r * (this.boxSize + 1) + (c + 1);
        if (this.horiz[top] && this.horiz[bottom] && this.vert[left] && this.vert[right]) {
          this.owners[bi] = this.current;
          gained++;
          if (this.current === Player.CIRCLE) this.scoreCircle++;
          else this.scoreCross++;
        }
      }
    }
    return gained;
  }

  private allBoxesOwned(): boolean {
    return !this.owners.some((o) => o === Player.NONE);
  }

  legalMoves(): [number, number][] {
    const moves: [number, number][] = [];
    for (let i = 0; i < this.horiz.length; i++) {
      if (!this.horiz[i]) moves.push([0, i]);
    }
    for (let i = 0; i < this.vert.length; i++) {
      if (!this.vert[i]) moves.push([1, i]);
    }
    return moves;
  }

  applyMove(move: [number, number]): void {
    if (move[0] === 0) this.drawHorizontal(move[1]);
    else this.drawVertical(move[1]);
  }

  copy(): DotsEngine {
    const e = new DotsEngine(this.boxSize, this.current);
    for (let i = 0; i < this.horiz.length; i++) e.horiz[i] = this.horiz[i];
    for (let i = 0; i < this.vert.length; i++) e.vert[i] = this.vert[i];
    for (let i = 0; i < this.owners.length; i++) e.owners[i] = this.owners[i];
    e.scoreCircle = this.scoreCircle;
    e.scoreCross = this.scoreCross;
    e.winner = this.winner;
    return e;
  }
}
