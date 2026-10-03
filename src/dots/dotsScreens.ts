import { S } from '../strings.ts';
import { DotsEngine } from './dotsEngine.ts';
import { DotsAi } from './dotsAi.ts';
import { labeledSelect, playQuery, clearChildren, el } from '../shared/ui.ts';
import { appendOpponentFields, renderSetupShell } from '../shared/setupCommon.ts';
import {
  HUMAN_PLAYER,
  parsePlayParams,
  resolveGameFirst,
  scheduleCpu,
  clearCpuTimer,
} from '../shared/playCommon.ts';
import { isCpu } from '../shared/opponentMode.ts';
import { Player } from '../shared/player.ts';
import { pileWinMessage, showResultDialog } from '../shared/resultMessages.ts';

const ai = new DotsAi();

export function renderDotsSetup(root: HTMLElement): void {
  const btnStart = renderSetupShell(
    root,
    S.gameDots,
    'accent-dots',
    (panel) => {
      panel.appendChild(
        labeledSelect('サイズ', ['2×2（入門）', '3×3', '4×4'], 0).wrap,
      );
      appendOpponentFields(panel, ['1P', '2P', S.firstRandom], () => {});
    },
    { title: 'ドット＆ボックスの　せつめい', body: 'てん　と　てんのあいだの　せんを　こうごにひきます。' },
  );

  btnStart.addEventListener('click', () => {
    const selects = root.querySelectorAll('select');
    const sizeIdx = (selects[0] as HTMLSelectElement).selectedIndex;
    const oppIdx = (selects[1] as HTMLSelectElement).selectedIndex;
    const diffIdx = (selects[2] as HTMLSelectElement).selectedIndex;
    const firstIdx = (selects[3] as HTMLSelectElement).selectedIndex;
    const diffs = ['EASY', 'NORMAL', 'HARD'] as const;
    const firsts = ['CIRCLE', 'CROSS', 'RANDOM'] as const;
    const q = playQuery({
      box_size: String(sizeIdx + 2),
      opponent: oppIdx === 0 ? 'TWO_PLAYER' : 'CPU',
      difficulty: diffs[diffIdx] ?? 'NORMAL',
      first: firsts[firstIdx] ?? 'CIRCLE',
    });
    window.location.hash = `#/dots/play${q}`;
  });
}

export function renderDotsPlay(root: HTMLElement, query: URLSearchParams): void {
  const boxSize = parseInt(query.get('box_size') ?? '2', 10);
  const params = parsePlayParams(query);

  clearChildren(root);
  root.className = 'screen play-screen accent-dots';

  const scoreLabel = el('p', 'game-subtitle', '');
  const turnLabel = el('p', 'turn-label', '');
  const grid = el('div', 'dots-grid');

  const actions = el('div', 'play-actions');
  const btnRestart = el('button', 'btn-secondary', S.restart);
  btnRestart.type = 'button';
  const btnSetup = el('button', 'btn-ghost', S.toSetup);
  btnSetup.type = 'button';
  btnSetup.addEventListener('click', () => {
    window.location.hash = '#/dots';
  });
  actions.append(btnRestart, btnSetup);
  root.append(scoreLabel, turnLabel, grid, actions);

  let engine: DotsEngine;
  let locked = false;
  let cpuTimer: number | undefined;

  const ownerClass = (bi: number) => {
    const o = engine.owners[bi];
    if (o === Player.CIRCLE) return 'box-p1';
    if (o === Player.CROSS) return 'box-p2';
    return '';
  };

  const draw = () => {
    clearChildren(grid);
    grid.style.setProperty('--dots-n', String(boxSize));
    const cellSize = 44;
    const w = (boxSize + 1) * cellSize;
    grid.style.width = `${w}px`;
    grid.style.height = `${w}px`;

    for (let r = 0; r <= boxSize; r++) {
      for (let c = 0; c <= boxSize; c++) {
        const dot = el('div', 'dots-dot');
        dot.style.left = `${c * cellSize}px`;
        dot.style.top = `${r * cellSize}px`;
        grid.appendChild(dot);
      }
    }

    for (let r = 0; r < boxSize; r++) {
      for (let c = 0; c < boxSize; c++) {
        const box = el('div', `dots-box ${ownerClass(r * boxSize + c)}`);
        box.style.left = `${c * cellSize + cellSize * 0.2}px`;
        box.style.top = `${r * cellSize + cellSize * 0.2}px`;
        box.style.width = `${cellSize * 0.6}px`;
        box.style.height = `${cellSize * 0.6}px`;
        grid.appendChild(box);
      }
    }

    for (let r = 0; r <= boxSize; r++) {
      for (let c = 0; c < boxSize; c++) {
        const idx = r * boxSize + c;
        const edge = el('button', 'dots-edge dots-edge-h');
        edge.type = 'button';
        edge.style.left = `${c * cellSize + 8}px`;
        edge.style.top = `${r * cellSize - 4}px`;
        edge.style.width = `${cellSize - 16}px`;
        if (engine.horiz[idx]) edge.classList.add('on');
        else if (!locked) {
          edge.addEventListener('click', () => onMove(0, idx));
        } else edge.disabled = true;
        grid.appendChild(edge);
      }
    }

    for (let r = 0; r < boxSize; r++) {
      for (let c = 0; c <= boxSize; c++) {
        const idx = r * (boxSize + 1) + c;
        const edge = el('button', 'dots-edge dots-edge-v');
        edge.type = 'button';
        edge.style.left = `${c * cellSize - 4}px`;
        edge.style.top = `${r * cellSize + 8}px`;
        edge.style.height = `${cellSize - 16}px`;
        if (engine.vert[idx]) edge.classList.add('on');
        else if (!locked) {
          edge.addEventListener('click', () => onMove(1, idx));
        } else edge.disabled = true;
        grid.appendChild(edge);
      }
    }
  };

  const refreshLabels = () => {
    scoreLabel.textContent = `1P ${engine.scoreCircle}  -  ${engine.scoreCross} 2P`;
    if (engine.isOver()) return;
    if (isCpu(params.opponent)) {
      turnLabel.textContent =
        engine.current === HUMAN_PLAYER ? `${S.turnP1}（あなた）` : S.thinking;
    } else {
      turnLabel.textContent = engine.current === Player.CIRCLE ? S.turnP1 : S.turnP2;
    }
  };

  const showResult = () => {
    const w = engine.winner ?? Player.NONE;
    const msg = pileWinMessage(w, isCpu(params.opponent), HUMAN_PLAYER);
    showResultDialog(msg, startNew, '#/dots');
  };

  const onMove = (type: number, index: number) => {
    if (locked || engine.isOver()) return;
    if (isCpu(params.opponent) && engine.current !== HUMAN_PLAYER) return;
    const beforeTurn = engine.current;
    const beforeScore = engine.scoreCircle + engine.scoreCross;
    engine.applyMove([type, index]);
    draw();
    refreshLabels();
    if (engine.isOver()) {
      showResult();
      return;
    }
    if (
      engine.current === beforeTurn &&
      engine.scoreCircle + engine.scoreCross > beforeScore
    ) {
      return;
    }
    maybeCpu();
  };

  const cpuStep = () => {
    if (engine.isOver() || engine.current === HUMAN_PLAYER) {
      locked = false;
      refreshLabels();
      draw();
      return;
    }
    const move = ai.choose(engine, params.difficulty);
    if (move) {
      const beforeTurn = engine.current;
      const beforeScore = engine.scoreCircle + engine.scoreCross;
      engine.applyMove(move);
      draw();
      refreshLabels();
      if (engine.isOver()) {
        locked = false;
        showResult();
        return;
      }
      if (
        engine.current === beforeTurn &&
        engine.scoreCircle + engine.scoreCross > beforeScore
      ) {
        cpuTimer = scheduleCpu(350, cpuStep);
        return;
      }
    }
    locked = false;
    refreshLabels();
    draw();
  };

  const maybeCpu = () => {
    if (!isCpu(params.opponent) || engine.isOver() || engine.current === HUMAN_PLAYER) {
      return;
    }
    locked = true;
    turnLabel.textContent = S.thinking;
    cpuTimer = scheduleCpu(350, cpuStep);
  };

  const startNew = () => {
    clearCpuTimer(cpuTimer);
    locked = false;
    engine = new DotsEngine(boxSize, resolveGameFirst(params.first));
    draw();
    refreshLabels();
    maybeCpu();
  };

  btnRestart.addEventListener('click', startNew);
  startNew();
}
