import type { AlignBoardDef } from './alignBoardDef.ts';
import { GameResult, winFor, type GameResultId } from '../shared/gameResult.ts';
import { Player, otherPlayer } from '../shared/player.ts';

export class AlignEngine {
  readonly def: AlignBoardDef;
  readonly winLength: number;
  readonly cells: number[][];

  current: number;
  result: GameResultId = GameResult.ONGOING;
  moveCount = 0;

  constructor(def: AlignBoardDef, winLength: number, firstPlayer: number) {
    this.def = def;
    this.winLength = winLength;
    this.cells = Array.from({ length: def.rows }, () => Array(def.cols).fill(Player.NONE));
    this.current = firstPlayer;
  }

  canPlace(r: number, c: number): boolean {
    return (
      this.result === GameResult.ONGOING &&
      this.def.isPlayable(r, c) &&
      this.cells[r][c] === Player.NONE
    );
  }

  place(r: number, c: number): boolean {
    if (!this.canPlace(r, c)) return false;
    this.cells[r][c] = this.current;
    this.moveCount++;
    if (this.hasWin(r, c, this.current)) {
      this.result = winFor(this.current);
    } else if (this.isFull()) {
      this.result = GameResult.DRAW;
    } else {
      this.current = otherPlayer(this.current);
    }
    return true;
  }

  isFull(): boolean {
    for (let r = 0; r < this.def.rows; r++) {
      for (let c = 0; c < this.def.cols; c++) {
        if (this.def.isPlayable(r, c) && this.cells[r][c] === Player.NONE) return false;
      }
    }
    return true;
  }

  legalMoves(): [number, number][] {
    const moves: [number, number][] = [];
    for (let r = 0; r < this.def.rows; r++) {
      for (let c = 0; c < this.def.cols; c++) {
        if (this.canPlace(r, c)) moves.push([r, c]);
      }
    }
    return moves;
  }

  hasWin(r: number, c: number, player: number): boolean {
    const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
      const count =
        1 +
        this.countDir(r, c, dr, dc, player) +
        this.countDir(r, c, -dr, -dc, player);
      if (count >= this.winLength) return true;
    }
    return false;
  }

  private countDir(r: number, c: number, dr: number, dc: number, player: number): number {
    let n = 0;
    let rr = r + dr;
    let cc = c + dc;
    while (this.def.isPlayable(rr, cc) && this.cells[rr][cc] === player) {
      n++;
      rr += dr;
      cc += dc;
    }
    return n;
  }

  copy(): AlignEngine {
    const e = new AlignEngine(this.def, this.winLength, this.current);
    e.result = this.result;
    e.moveCount = this.moveCount;
    for (let r = 0; r < this.def.rows; r++) {
      e.cells[r] = [...this.cells[r]];
    }
    return e;
  }
}
