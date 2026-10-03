import { S } from '../strings.ts';
import { allConfigs, configNames, getConfig } from './connect4Config.ts';
import { Connect4Engine } from './connect4Engine.ts';
import { Connect4Ai } from './connect4Ai.ts';
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
import { GameResult } from '../shared/gameResult.ts';
import { Player } from '../shared/player.ts';
import { markWinMessage, showResultDialog } from '../shared/resultMessages.ts';

const ai = new Connect4Ai();

export function renderConnect4Setup(root: HTMLElement): void {
  const btnStart = renderSetupShell(
    root,
    S.gameConnect4,
    'accent-connect4',
    (panel) => {
      panel.appendChild(labeledSelect(S.pattern, configNames(), 0).wrap);
      appendOpponentFields(panel, ['黄', '赤', S.firstRandom], () => {});
    },
    { title: 'よんめならべふうの　せつめい', body: 'れつをタップすると、こまが　そのれつの　いちばんしたまで　おちます。' },
  );

  btnStart.addEventListener('click', () => {
    const selects = root.querySelectorAll('select');
    const cfg = allConfigs()[(selects[0] as HTMLSelectElement).selectedIndex];
    const oppIdx = (selects[1] as HTMLSelectElement).selectedIndex;
    const diffIdx = (selects[2] as HTMLSelectElement).selectedIndex;
    const firstIdx = (selects[3] as HTMLSelectElement).selectedIndex;
    const diffs = ['EASY', 'NORMAL', 'HARD'] as const;
    const firsts = ['CIRCLE', 'CROSS', 'RANDOM'] as const;
    const q = playQuery({
      pattern_id: String(cfg.id),
      opponent: oppIdx === 0 ? 'TWO_PLAYER' : 'CPU',
      difficulty: diffs[diffIdx] ?? 'NORMAL',
      first: firsts[firstIdx] ?? 'CIRCLE',
    });
    window.location.hash = `#/connect4/play${q}`;
  });
}

export function renderConnect4Play(root: HTMLElement, query: URLSearchParams): void {
  const config = getConfig(parseInt(query.get('pattern_id') ?? '1', 10));
  const params = parsePlayParams(query);

  clearChildren(root);
  root.className = 'screen play-screen accent-connect4';

  const info = el('p', 'game-subtitle', config.name);
  const turnLabel = el('p', 'turn-label', '');
  const boardEl = el('div', 'c4-board');

  const actions = el('div', 'play-actions');
  const btnRestart = el('button', 'btn-secondary', S.restart);
  btnRestart.type = 'button';
  const btnSetup = el('button', 'btn-ghost', S.toSetup);
  btnSetup.type = 'button';
  btnSetup.addEventListener('click', () => {
    window.location.hash = '#/connect4';
  });
  actions.append(btnRestart, btnSetup);
  root.append(info, turnLabel, boardEl, actions);

  let engine: Connect4Engine;
  let locked = false;
  let cpuTimer: number | undefined;

  const pieceClass = (v: number) =>
    v === Player.CIRCLE ? 'c4-yellow' : v === Player.CROSS ? 'c4-red' : '';

  const draw = () => {
    clearChildren(boardEl);
    boardEl.style.gridTemplateColumns = `repeat(${config.cols}, var(--c4-cell-size))`;
    boardEl.style.gridTemplateRows = `auto repeat(${config.rows}, var(--c4-cell-size))`;

    for (let c = 0; c < config.cols; c++) {
      const btn = el('button', 'c4-col-btn', '▼');
      btn.type = 'button';
      btn.disabled = locked || !engine.canDrop(c);
      btn.addEventListener('click', () => onDrop(c));
      boardEl.appendChild(btn);
    }

    for (let r = config.rows - 1; r >= 0; r--) {
      for (let c = 0; c < config.cols; c++) {
        const cell = el('div', `c4-cell ${pieceClass(engine.cells[r][c])}`);
        boardEl.appendChild(cell);
      }
    }
  };

  const updateTurn = () => {
    if (engine.result !== GameResult.ONGOING) return;
    if (isCpu(params.opponent)) {
      turnLabel.textContent =
        engine.current === HUMAN_PLAYER ? '黄の番（あなた）' : S.thinking;
    } else {
      turnLabel.textContent = engine.current === Player.CIRCLE ? '黄の番' : '赤の番';
    }
  };

  const showResult = () => {
    const msg = markWinMessage(engine.result, isCpu(params.opponent), HUMAN_PLAYER);
    showResultDialog(msg, startNew, '#/connect4');
  };

  const maybeCpu = () => {
    if (!isCpu(params.opponent) || engine.result !== GameResult.ONGOING) return;
    if (engine.current === HUMAN_PLAYER) return;
    locked = true;
    turnLabel.textContent = S.thinking;
    cpuTimer = scheduleCpu(400, () => {
      const col = ai.choose(engine, params.difficulty);
      if (col >= 0) engine.drop(col);
      locked = false;
      draw();
      updateTurn();
      if (engine.result !== GameResult.ONGOING) showResult();
      else maybeCpu();
    });
  };

  const afterMove = () => {
    draw();
    updateTurn();
    if (engine.result !== GameResult.ONGOING) showResult();
    else maybeCpu();
  };

  const onDrop = (c: number) => {
    if (locked || engine.result !== GameResult.ONGOING) return;
    if (isCpu(params.opponent) && engine.current !== HUMAN_PLAYER) return;
    if (engine.drop(c)) afterMove();
  };

  const startNew = () => {
    clearCpuTimer(cpuTimer);
    locked = false;
    engine = new Connect4Engine(config, resolveGameFirst(params.first));
    draw();
    updateTurn();
    maybeCpu();
  };

  btnRestart.addEventListener('click', startNew);
  startNew();
}
