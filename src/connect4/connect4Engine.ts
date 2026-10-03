import type { Connect4Config } from './connect4Config.ts';
import { GameResult, winFor, type GameResultId } from '../shared/gameResult.ts';
import { Player, otherPlayer } from '../shared/player.ts';

export class Connect4Engine {
  readonly config: Connect4Config;
  readonly cells: number[][];

  current: number;
  result: GameResultId = GameResult.ONGOING;
  lastRow = -1;
  lastCol = -1;

  constructor(config: Connect4Config, first: number) {
    this.config = config;
    this.cells = Array.from({ length: config.rows }, () => Array(config.cols).fill(Player.NONE));
    this.current = first;
  }

  canDrop(col: number): boolean {
    return (
      this.result === GameResult.ONGOING &&
      col >= 0 &&
      col < this.config.cols &&
      this.cells[this.config.rows - 1][col] === Player.NONE
    );
  }

  drop(col: number): boolean {
    if (!this.canDrop(col)) return false;
    let row = 0;
    while (row < this.config.rows && this.cells[row][col] !== Player.NONE) row++;
    this.cells[row][col] = this.current;
    this.lastRow = row;
    this.lastCol = col;
    if (this.hasWin(row, col, this.current)) {
      this.result = winFor(this.current);
    } else if (this.isFull()) {
      this.result = GameResult.DRAW;
    } else {
      this.current = otherPlayer(this.current);
    }
    return true;
  }

  isFull(): boolean {
    for (let c = 0; c < this.config.cols; c++) {
      if (this.cells[this.config.rows - 1][c] === Player.NONE) return false;
    }
    return true;
  }

  legalColumns(): number[] {
    const list: number[] = [];
    for (let c = 0; c < this.config.cols; c++) {
      if (this.canDrop(c)) list.push(c);
    }
    return list;
  }

  hasWin(r: number, c: number, player: number): boolean {
    const need = this.config.winLength;
    const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
      const count =
        1 +
        this.countDir(r, c, dr, dc, player) +
        this.countDir(r, c, -dr, -dc, player);
      if (count >= need) return true;
    }
    return false;
  }

  private countDir(r: number, c: number, dr: number, dc: number, player: number): number {
    let n = 0;
    let rr = r + dr;
    let cc = c + dc;
    while (
      rr >= 0 &&
      rr < this.config.rows &&
      cc >= 0 &&
      cc < this.config.cols &&
      this.cells[rr][cc] === player
    ) {
      n++;
      rr += dr;
      cc += dc;
    }
    return n;
  }

  copy(): Connect4Engine {
    const e = new Connect4Engine(this.config, this.current);
    e.result = this.result;
    for (let r = 0; r < this.config.rows; r++) {
      e.cells[r] = [...this.cells[r]];
    }
    return e;
  }
}
