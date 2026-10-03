export class Connect4Config {
  readonly id: number;
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly winLength: number;

  constructor(id: number, name: string, cols: number, rows: number, winLength: number) {
    this.id = id;
    this.name = name;
    this.cols = cols;
    this.rows = rows;
    this.winLength = winLength;
  }
}

const CONFIGS: Connect4Config[] = [
  new Connect4Config(1, '標準 7×6（4並び）', 7, 6, 4),
  new Connect4Config(2, 'コンパクト 5×5（3並び）', 5, 5, 3),
  new Connect4Config(3, 'ワイド 8×7（5並び）', 8, 7, 5),
  new Connect4Config(4, '縦長 6×8（4並び）', 6, 8, 4),
  new Connect4Config(5, 'ミニ 4×4（3並び）', 4, 4, 3),
];

export function allConfigs(): Connect4Config[] {
  return CONFIGS;
}

export function getConfig(id: number): Connect4Config {
  return CONFIGS.find((c) => c.id === id) ?? CONFIGS[0];
}

export function configNames(): string[] {
  return CONFIGS.map((c) => `${c.id}. ${c.name}`);
}
