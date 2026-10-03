import { S } from '../strings.ts';
import { allBoards, boardNames, getBoard } from './alignBoardCatalog.ts';
import { AlignEngine } from './alignEngine.ts';
import { AlignAi } from './alignAi.ts';
import { clearChildren, el, labeledSelect, playQuery } from '../shared/ui.ts';
import { appendOpponentFields, renderSetupShell } from '../shared/setupCommon.ts';
import {
  HUMAN_PLAYER,
  parsePlayParams,
  resolveGameFirst,
  turnLabelText,
  scheduleCpu,
  clearCpuTimer,
} from '../shared/playCommon.ts';
import { isCpu } from '../shared/opponentMode.ts';
import { GameResult } from '../shared/gameResult.ts';
import { Player } from '../shared/player.ts';
import { markWinMessage, showResultDialog } from '../shared/resultMessages.ts';

const ai = new AlignAi();

export function renderAlignSetup(root: HTMLElement): void {
  let winSelect: HTMLSelectElement | null = null;

  const btnStart = renderSetupShell(
    root,
    S.gameAlign,
    'accent-align',
    (panel) => {
      const boards = allBoards();
      const winWrap = el('div', 'field');
      const winLab = el('label', 'field-label', S.winLength);
      winSelect = el('select', 'level-select') as HTMLSelectElement;
      winWrap.append(winLab, winSelect);

      const refreshWin = (idx: number) => {
        if (!winSelect) return;
        const def = boards[idx];
        clearChildren(winSelect);
        for (let w = def.minWin; w <= def.maxWin; w++) {
          winSelect.appendChild(el('option', undefined, String(w)));
        }
        winSelect.selectedIndex = Math.max(0, def.defaultWin - def.minWin);
      };

      const { wrap: stageWrap, select: stageSelect } = labeledSelect(S.stage, boardNames(), 0, () => {
        refreshWin(stageSelect.selectedIndex);
      });
      refreshWin(0);

      panel.append(stageWrap, winWrap);
      appendOpponentFields(panel, [S.firstCircle, S.firstCross, S.firstRandom], () => {});
    },
    {
      title: 'まるばつならべの　せつめい',
      body: 'ますを　こうごにおいて、えらんだかずだけ　〇か×を　たて・よこ・ななめにならべたほうが　かちです。',
    },
  );

  btnStart.addEventListener('click', () => {
    const panel = root.querySelector('.menu-panel');
    if (!panel) return;
    const selects = panel.querySelectorAll('select');
    const stageIdx = (selects[0] as HTMLSelectElement).selectedIndex;
    const def = allBoards()[stageIdx];
    const winIdx = (selects[1] as HTMLSelectElement).selectedIndex;
    const win = def.minWin + winIdx;
    const oppIdx = (selects[2] as HTMLSelectElement).selectedIndex;
    const diffIdx = (selects[3] as HTMLSelectElement).selectedIndex;
    const firstIdx = (selects[4] as HTMLSelectElement).selectedIndex;
    const firsts = ['CIRCLE', 'CROSS', 'RANDOM'] as const;
    const diffs = ['EASY', 'NORMAL', 'HARD'] as const;
    const q = playQuery({
      board_id: String(def.id),
      win_length: String(win),
      opponent: oppIdx === 0 ? 'TWO_PLAYER' : 'CPU',
      difficulty: diffs[diffIdx] ?? 'NORMAL',
      first: firsts[firstIdx] ?? 'CIRCLE',
    });
    window.location.hash = `#/align/play${q}`;
  });
}

export function renderAlignPlay(root: HTMLElement, query: URLSearchParams): void {
  const boardId = parseInt(query.get('board_id') ?? '1', 10);
  const winLength = parseInt(query.get('win_length') ?? '3', 10);
  const params = parsePlayParams(query);
  const def = getBoard(boardId);

  clearChildren(root);
  root.className = 'screen play-screen accent-align';

  const info = el('p', 'game-subtitle', `${def.name} ／ ${winLength}並び`);
  const turnLabel = el('p', 'turn-label', '');
  const boardEl = el('div', 'align-board');
  const actions = el('div', 'play-actions');
  const btnRestart = el('button', 'btn-secondary', S.restart);
  btnRestart.type = 'button';
  const btnSetup = el('button', 'btn-ghost', S.toSetup);
  btnSetup.type = 'button';
  btnSetup.addEventListener('click', () => {
    window.location.hash = '#/align';
  });
  actions.append(btnRestart, btnSetup);
  root.append(info, turnLabel, boardEl, actions);

  let engine: AlignEngine;
  let locked = false;
  let cpuTimer: number | undefined;

  const drawBoard = () => {
    clearChildren(boardEl);
    boardEl.style.gridTemplateColumns = `repeat(${def.cols}, 1fr)`;
    for (let r = 0; r < def.rows; r++) {
      for (let c = 0; c < def.cols; c++) {
        const cell = el('button', 'align-cell');
        cell.type = 'button';
        if (def.isInvalid(r, c)) {
          cell.classList.add('align-invalid');
          cell.disabled = true;
        } else if (def.isObstacle(r, c)) {
          cell.classList.add('align-obstacle');
          cell.disabled = true;
        } else {
          const v = engine.cells[r][c];
          if (v === Player.CIRCLE) {
            cell.classList.add('mark-circle');
            cell.textContent = '〇';
            cell.disabled = true;
          } else if (v === Player.CROSS) {
            cell.classList.add('mark-cross');
            cell.textContent = '×';
            cell.disabled = true;
          } else {
            cell.addEventListener('click', () => onTap(r, c));
          }
        }
        boardEl.appendChild(cell);
      }
    }
  };

  const updateTurn = () => {
    if (engine.result !== GameResult.ONGOING) return;
    turnLabel.textContent = turnLabelText(
      params.opponent,
      engine.current,
      S.turnCircle,
      S.turnCross,
    );
  };

  const showResult = () => {
    const msg = markWinMessage(engine.result, isCpu(params.opponent), HUMAN_PLAYER);
    showResultDialog(msg, startNew, '#/align');
  };

  const maybeCpu = () => {
    if (!isCpu(params.opponent) || engine.result !== GameResult.ONGOING) return;
    if (engine.current === HUMAN_PLAYER) return;
    locked = true;
    turnLabel.textContent = S.thinking;
    cpuTimer = scheduleCpu(400, () => {
      const move = ai.choose(engine, params.difficulty);
      if (move) engine.place(move[0], move[1]);
      locked = false;
      drawBoard();
      updateTurn();
      if (engine.result !== GameResult.ONGOING) showResult();
      else maybeCpu();
    });
  };

  const afterMove = () => {
    drawBoard();
    updateTurn();
    if (engine.result !== GameResult.ONGOING) showResult();
    else maybeCpu();
  };

  const onTap = (r: number, c: number) => {
    if (locked || engine.result !== GameResult.ONGOING) return;
    if (isCpu(params.opponent) && engine.current !== HUMAN_PLAYER) return;
    if (engine.place(r, c)) afterMove();
  };

  const startNew = () => {
    clearCpuTimer(cpuTimer);
    locked = false;
    engine = new AlignEngine(def, winLength, resolveGameFirst(params.first));
    drawBoard();
    updateTurn();
    maybeCpu();
  };

  btnRestart.addEventListener('click', startNew);
  startNew();
}
