import { S } from '../strings.ts';
import { VARIANT_MODES, parseVariantMode } from './variantMode.ts';
import { VariantCell, VariantEngine } from './variantEngine.ts';
import { VariantAi } from './variantAi.ts';
import { labeledSelect, playQuery, clearChildren, el } from '../shared/ui.ts';
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

const ai = new VariantAi();

export function renderVariantSetup(root: HTMLElement): void {
  const btnStart = renderSetupShell(
    root,
    S.gameVariant,
    'accent-variant',
    (panel) => {
      panel.appendChild(
        labeledSelect(S.mode, VARIANT_MODES.map((m) => m.label), 0).wrap,
      );
      appendOpponentFields(panel, [S.firstCircle, S.firstCross, S.firstRandom], () => {});
    },
    { title: 'さんめバリエーションの　せつめい', body: '3つならべたら　かちです。' },
  );

  btnStart.addEventListener('click', () => {
    const selects = root.querySelectorAll('select');
    const mode = VARIANT_MODES[(selects[0] as HTMLSelectElement).selectedIndex].id;
    const oppIdx = (selects[1] as HTMLSelectElement).selectedIndex;
    const diffIdx = (selects[2] as HTMLSelectElement).selectedIndex;
    const firstIdx = (selects[3] as HTMLSelectElement).selectedIndex;
    const diffs = ['EASY', 'NORMAL', 'HARD'] as const;
    const firsts = ['CIRCLE', 'CROSS', 'RANDOM'] as const;
    const q = playQuery({
      mode_id: mode,
      opponent: oppIdx === 0 ? 'TWO_PLAYER' : 'CPU',
      difficulty: diffs[diffIdx] ?? 'NORMAL',
      first: firsts[firstIdx] ?? 'CIRCLE',
    });
    window.location.hash = `#/variant/play${q}`;
  });
}

function cellMark(v: number): string {
  if (v === Player.CIRCLE) return '〇';
  if (v === Player.CROSS) return '×';
  if (v === VariantCell.WILD) return '★';
  if (v === VariantCell.BLOCK) return '■';
  return '';
}

export function renderVariantPlay(root: HTMLElement, query: URLSearchParams): void {
  const mode = parseVariantMode(query.get('mode_id'));
  const params = parsePlayParams(query);

  clearChildren(root);
  root.className = 'screen play-screen accent-variant';

  const modeLabel = VARIANT_MODES.find((m) => m.id === mode)?.label ?? '';
  const info = el('p', 'game-subtitle', modeLabel);
  const turnLabel = el('p', 'turn-label', '');
  const layerNav = el('div', 'variant-layers');
  const boardEl = el('div', 'variant-board');

  const actions = el('div', 'play-actions');
  const btnRestart = el('button', 'btn-secondary', S.restart);
  btnRestart.type = 'button';
  const btnSetup = el('button', 'btn-ghost', S.toSetup);
  btnSetup.type = 'button';
  btnSetup.addEventListener('click', () => {
    window.location.hash = '#/variant';
  });
  actions.append(btnRestart, btnSetup);
  root.append(info, turnLabel, layerNav, boardEl, actions);

  let engine: VariantEngine;
  let locked = false;
  let cpuTimer: number | undefined;

  const drawLayerTabs = () => {
    clearChildren(layerNav);
    if (mode !== 'CUBE') {
      layerNav.style.display = 'none';
      return;
    }
    layerNav.style.display = 'flex';
    for (let layer = 0; layer < 3; layer++) {
      const btn = el('button', 'btn-ghost layer-tab', `段${layer + 1}`);
      btn.type = 'button';
      if (engine.activeLayer === layer) btn.classList.add('active');
      btn.addEventListener('click', () => {
        engine.activeLayer = layer;
        drawBoard();
        drawLayerTabs();
      });
      layerNav.appendChild(btn);
    }
  };

  const drawBoard = () => {
    clearChildren(boardEl);
    boardEl.style.gridTemplateColumns = 'repeat(3, 1fr)';
    const base = mode === 'CUBE' ? engine.activeLayer * 9 : 0;
    for (let i = 0; i < 9; i++) {
      const idx = base + i;
      const v = engine.cells[idx];
      const cell = el('button', 'variant-cell');
      cell.type = 'button';
      cell.textContent = cellMark(v);
      if (v === VariantCell.BLOCK) {
        cell.classList.add('variant-block');
        cell.disabled = true;
      } else if (v !== Player.NONE) {
        cell.disabled = true;
        if (v === Player.CIRCLE || v === VariantCell.WILD) cell.classList.add('mark-circle');
        if (v === Player.CROSS) cell.classList.add('mark-cross');
      } else {
        cell.addEventListener('click', () => onPlace(idx));
      }
      boardEl.appendChild(cell);
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
    showResultDialog(msg, startNew, '#/variant');
  };

  const maybeCpu = () => {
    if (!isCpu(params.opponent) || engine.result !== GameResult.ONGOING) return;
    if (engine.current === HUMAN_PLAYER) return;
    locked = true;
    turnLabel.textContent = S.thinking;
    cpuTimer = scheduleCpu(400, () => {
      const m = ai.choose(engine, params.difficulty);
      if (m >= 0) engine.place(m);
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

  const onPlace = (idx: number) => {
    if (locked || engine.result !== GameResult.ONGOING) return;
    if (isCpu(params.opponent) && engine.current !== HUMAN_PLAYER) return;
    if (engine.place(idx)) afterMove();
  };

  const startNew = () => {
    clearCpuTimer(cpuTimer);
    locked = false;
    engine = new VariantEngine(mode, resolveGameFirst(params.first));
    engine.activeLayer = 1;
    drawLayerTabs();
    drawBoard();
    updateTurn();
    maybeCpu();
  };

  btnRestart.addEventListener('click', startNew);
  startNew();
}
