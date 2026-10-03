import { AlignBoardDef } from './alignBoardDef.ts';

function square(id: number, n: number): AlignBoardDef {
  const mask: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const min = 3;
  const max = Math.min(n, 5);
  const def = Math.min(n, n <= 3 ? 3 : 4);
  return new AlignBoardDef(id, `${n}×${n}`, mask, min, max, def);
}

function fromLines(
  id: number,
  name: string,
  lines: string[],
  minWin: number,
  maxWin: number,
  defWin: number,
): AlignBoardDef {
  const rows = lines.length;
  let cols = 0;
  for (const line of lines) cols = Math.max(cols, line.length);
  const mask: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    const line = lines[r];
    for (let c = 0; c < cols; c++) {
      const ch = c < line.length ? line[c] : ' ';
      if (ch === '.') row.push(0);
      else if (ch === '#') row.push(-2);
      else row.push(-1);
    }
    mask.push(row);
  }
  return new AlignBoardDef(id, name, mask, minWin, maxWin, defWin);
}

const BOARDS: AlignBoardDef[] = [
  square(1, 3),
  square(2, 4),
  square(3, 5),
  square(4, 6),
  square(5, 7),
  fromLines(6, '三角・小', ['  .  ', ' ... ', '.....'], 3, 3, 3),
  fromLines(7, '三角・中', ['   .   ', '  ...  ', ' ..... ', '.......'], 3, 4, 3),
  fromLines(8, '三角・大', ['    .    ', '   ...   ', '  .....  ', ' ....... ', '.........'], 3, 4, 4),
  fromLines(9, '五角・小', [' .. ', '....', '....', ' .. '], 3, 3, 3),
  fromLines(10, '五角・中', ['  ...  ', ' ..... ', '.......', ' ..... ', '  ...  '], 3, 4, 3),
  fromLines(11, '五角・大', ['   ...   ', '  .....  ', ' ....... ', '.........', ' ....... ', '  .....  ', '   ...   '], 3, 4, 4),
  fromLines(12, '十字', ['  ...  ', '  ...  ', '.......', '.......', '.......', '  ...  ', '  ...  '], 3, 4, 3),
  fromLines(13, 'ドーナツ', ['.....', '.###.', '.#.#.', '.###.', '.....'], 3, 3, 3),
  fromLines(14, 'コーナー欠け', [' ....', '.....', '.....', '.....', '.... '], 3, 4, 3),
  fromLines(15, '障害物・中央', ['.....', '.....', '..#..', '.....', '.....'], 3, 4, 3),
  fromLines(16, '障害物・斜め', ['.#....', '..#...', '...#..', '....#.', '.....#', '......'], 3, 4, 3),
  fromLines(17, '障害物・複数', ['.......', '..#.#..', '.......', '.#...#.', '.......', '..#.#..', '.......'], 3, 4, 4),
  fromLines(18, '菱形', ['  .  ', ' ... ', '.....', ' ... ', '  .  '], 3, 3, 3),
  fromLines(19, '砂時計', ['.....', ' ... ', '  .  ', ' ... ', '.....'], 3, 3, 3),
  fromLines(20, '迷路通路', ['.....#.', '.###.#.', '.....#.', '.#####.', '.......', '.#.###.', '.#.....'], 3, 4, 3),
];

export function allBoards(): AlignBoardDef[] {
  return BOARDS;
}

export function getBoard(id: number): AlignBoardDef {
  return BOARDS.find((d) => d.id === id) ?? BOARDS[0];
}

export function boardNames(): string[] {
  return BOARDS.map((d) => `${d.id}. ${d.name}`);
}
