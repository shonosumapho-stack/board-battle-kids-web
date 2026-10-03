import type { VariantModeId } from './variantMode.ts';
import { GameResult, winFor, type GameResultId } from '../shared/gameResult.ts';
import { Player, otherPlayer } from '../shared/player.ts';

export const VariantCell = {
  BLOCK: -2,
  WILD: -3,
} as const;

export class VariantEngine {
  readonly mode: VariantModeId;
  readonly cells: number[];
  readonly size: number;
  current: number;
  result: GameResultId = GameResult.ONGOING;
  activeLayer = 1;

  constructor(mode: VariantModeId, first: number) {
    this.mode = mode;
    this.size = mode === 'CUBE' ? 27 : 9;
    this.cells = Array(this.size).fill(Player.NONE);
    this.current = first;
    if (mode === 'BLOCKER') {
      this.cells[0] = VariantCell.BLOCK;
      this.cells[8] = VariantCell.BLOCK;
      this.cells[4] = Player.NONE;
    }
  }

  canPlace(index: number): boolean {
    return (
      this.result === GameResult.ONGOING &&
      index >= 0 &&
      index < this.size &&
      this.cells[index] === Player.NONE
    );
  }

  place(index: number): boolean {
    if (!this.canPlace(index)) return false;
    if (this.mode === 'WILD' && index === 4) {
      this.cells[index] = VariantCell.WILD;
    } else {
      this.cells[index] = this.current;
    }
    if (this.hasWin(this.current)) {
      this.result = winFor(this.current);
    } else if (this.isFull()) {
      this.result = GameResult.DRAW;
    } else {
      this.current = otherPlayer(this.current);
    }
    return true;
  }

  isFull(): boolean {
    return !this.cells.some((c) => c === Player.NONE);
  }

  legalMoves(): number[] {
    const list: number[] = [];
    for (let i = 0; i < this.size; i++) {
      if (this.canPlace(i)) list.push(i);
    }
    return list;
  }

  matches(cell: number, player: number): boolean {
    return cell === player || cell === VariantCell.WILD;
  }

  hasWin(player: number): boolean {
    if (this.mode === 'CUBE') return this.hasCubeWin(player);
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const line of lines) {
      if (
        this.matches(this.cells[line[0]], player) &&
        this.matches(this.cells[line[1]], player) &&
        this.matches(this.cells[line[2]], player) &&
        !(
          this.cells[line[0]] === VariantCell.BLOCK ||
          this.cells[line[1]] === VariantCell.BLOCK ||
          this.cells[line[2]] === VariantCell.BLOCK
        )
      ) {
        let own = 0;
        for (const idx of line) {
          if (this.cells[idx] === player) own++;
        }
        if (own >= 1 || this.mode !== 'WILD') {
          if (this.mode === 'WILD' && own === 0) continue;
          return true;
        }
      }
    }
    return false;
  }

  private hasCubeWin(player: number): boolean {
    for (let layer = 0; layer < 3; layer++) {
      const base = layer * 9;
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      for (const line of lines) {
        if (
          this.cells[base + line[0]] === player &&
          this.cells[base + line[1]] === player &&
          this.cells[base + line[2]] === player
        ) {
          return true;
        }
      }
    }
    for (let i = 0; i < 9; i++) {
      if (
        this.cells[i] === player &&
        this.cells[i + 9] === player &&
        this.cells[i + 18] === player
      ) {
        return true;
      }
    }
    const space = [
      [0, 13, 26], [2, 13, 24], [6, 13, 20], [8, 13, 18],
      [0, 10, 20], [2, 10, 18], [6, 16, 26], [8, 16, 24],
      [0, 12, 24], [6, 12, 18], [2, 14, 26], [8, 14, 20],
    ];
    for (const line of space) {
      if (
        this.cells[line[0]] === player &&
        this.cells[line[1]] === player &&
        this.cells[line[2]] === player
      ) {
        return true;
      }
    }
    return false;
  }

  copy(): VariantEngine {
    const e = new VariantEngine(this.mode, this.current);
    e.result = this.result;
    e.activeLayer = this.activeLayer;
    e.cells.splice(0, this.size, ...this.cells);
    return e;
  }
}
