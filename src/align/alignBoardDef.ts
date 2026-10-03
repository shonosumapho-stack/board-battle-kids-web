export class AlignBoardDef {
  readonly id: number;
  readonly name: string;
  readonly rows: number;
  readonly cols: number;
  /** 0 empty, -1 invalid, -2 obstacle */
  readonly mask: number[][];

  readonly minWin: number;
  readonly maxWin: number;
  readonly defaultWin: number;

  constructor(
    id: number,
    name: string,
    mask: number[][],
    minWin: number,
    maxWin: number,
    defaultWin: number,
  ) {
    this.id = id;
    this.name = name;
    this.mask = mask;
    this.rows = mask.length;
    this.cols = mask[0]?.length ?? 0;
    this.minWin = minWin;
    this.maxWin = maxWin;
    this.defaultWin = defaultWin;
  }

  isPlayable(r: number, c: number): boolean {
    return this.inBounds(r, c) && this.mask[r][c] === 0;
  }

  isObstacle(r: number, c: number): boolean {
    return this.inBounds(r, c) && this.mask[r][c] === -2;
  }

  isInvalid(r: number, c: number): boolean {
    return !this.inBounds(r, c) || this.mask[r][c] === -1;
  }

  inBounds(r: number, c: number): boolean {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  playableCount(): number {
    let n = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.mask[r][c] === 0) n++;
      }
    }
    return n;
  }
}
