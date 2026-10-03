export class NimPattern {
  readonly id: number;
  readonly name: string;
  readonly piles: number[];
  readonly maxTake: number;
  readonly multiPile: boolean;

  constructor(id: number, name: string, piles: number[], maxTake: number, multiPile: boolean) {
    this.id = id;
    this.name = name;
    this.piles = piles;
    this.maxTake = maxTake;
    this.multiPile = multiPile;
  }

  copyPiles(): number[] {
    return [...this.piles];
  }
}

const PATTERNS: NimPattern[] = [
  new NimPattern(1, '単山・石13（上限3）', [13], 3, false),
  new NimPattern(2, '単山・石20（上限4）', [20], 4, false),
  new NimPattern(3, '単山・石15（上限5）', [15], 5, false),
  new NimPattern(4, '単山・石21（上限3）', [21], 3, false),
  new NimPattern(5, '2山・3-5', [3, 5], 0, true),
  new NimPattern(6, '3山・3-4-5', [3, 4, 5], 0, true),
  new NimPattern(7, '3山・2-3-7', [2, 3, 7], 0, true),
  new NimPattern(8, '4山・1-3-5-7', [1, 3, 5, 7], 0, true),
  new NimPattern(9, '4山・2-3-5-7', [2, 3, 5, 7], 0, true),
  new NimPattern(10, '3山・4-5-6', [4, 5, 6], 0, true),
];

export function allPatterns(): NimPattern[] {
  return PATTERNS;
}

export function getPattern(id: number): NimPattern {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
}

export function patternNames(): string[] {
  return PATTERNS.map((p) => `${p.id}. ${p.name}`);
}
