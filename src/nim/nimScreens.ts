import { S } from '../strings.ts';
import { allPatterns, getPattern, patternNames } from './nimPattern.ts';
import { NimEngine } from './nimEngine.ts';
import { NimAi } from './nimAi.ts';
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
import { pileWinMessage, showResultDialog } from '../shared/resultMessages.ts';

const ai = new NimAi();

export function renderNimSetup(root: HTMLElement): void {
  const btnStart = renderSetupShell(
    root,
    S.gameNim,
    'accent-nim',
    (panel) => {
      panel.appendChild(labeledSelect(S.pattern, patternNames(), 0).wrap);
      panel.appendChild(
        labeledSelect(
          'ルール',
          ['最後に取った方が負け（ミスール）', '最後に取った方が勝ち'],
          0,
        ).wrap,
      );
      appendOpponentFields(panel, ['1P / 〇', '2P / ×', S.firstRandom], () => {});
    },
    { title: 'いしとり・にむの　せつめい', body: 'やまにある　いしを　こうごにとります。' },
  );

  btnStart.addEventListener('click', () => {
    const selects = root.querySelectorAll('select');
    const pattern = allPatterns()[(selects[0] as HTMLSelectElement).selectedIndex];
    const misere = (selects[1] as HTMLSelectElement).selectedIndex === 0;
    const oppIdx = (selects[2] as HTMLSelectElement).selectedIndex;
    const diffIdx = (selects[3] as HTMLSelectElement).selectedIndex;
    const firstIdx = (selects[4] as HTMLSelectElement).selectedIndex;
    const diffs = ['EASY', 'NORMAL', 'HARD'] as const;
    const firsts = ['CIRCLE', 'CROSS', 'RANDOM'] as const;
    const q = playQuery({
      pattern_id: String(pattern.id),
      misere: misere ? '1' : '0',
      opponent: oppIdx === 0 ? 'TWO_PLAYER' : 'CPU',
      difficulty: diffs[diffIdx] ?? 'NORMAL',
      first: firsts[firstIdx] ?? 'CIRCLE',
    });
    window.location.hash = `#/nim/play${q}`;
  });
}

export function renderNimPlay(root: HTMLElement, query: URLSearchParams): void {
  const pattern = getPattern(parseInt(query.get('pattern_id') ?? '1', 10));
  const misere = query.get('misere') !== '0';
  const params = parsePlayParams(query);

  clearChildren(root);
  root.className = 'screen play-screen accent-nim';

  const info = el(
    'p',
    'game-subtitle',
    `${pattern.name} ／ ${misere ? '最後に取った方が負け' : '最後に取った方が勝ち'}`,
  );
  const turnLabel = el('p', 'turn-label', '');
  const pilesEl = el('div', 'nim-piles');
  const takeRow = el('div', 'nim-take-row');
  const countSelect = el('select', 'level-select') as HTMLSelectElement;
  const btnTake = el('button', 'btn-primary', 'とる');
  btnTake.type = 'button';
  takeRow.append(countSelect, btnTake);

  const actions = el('div', 'play-actions');
  const btnRestart = el('button', 'btn-secondary', S.restart);
  btnRestart.type = 'button';
  const btnSetup = el('button', 'btn-ghost', S.toSetup);
  btnSetup.type = 'button';
  btnSetup.addEventListener('click', () => {
    window.location.hash = '#/nim';
  });
  actions.append(btnRestart, btnSetup);
  root.append(info, turnLabel, pilesEl, takeRow, actions);

  let engine: NimEngine;
  let selectedPile = 0;
  let locked = false;
  let cpuTimer: number | undefined;
  /** 直前の手で消す石（アニメ用・表示個数は piles + remove） */
  let stoneRemovalAnim: { pile: number; remove: number } | null = null;

  const refreshCountOptions = () => {
    clearChildren(countSelect);
    const limit = pattern.multiPile
      ? engine.piles[selectedPile]
      : Math.min(pattern.maxTake, engine.piles[selectedPile]);
    for (let c = 1; c <= limit; c++) {
      countSelect.appendChild(el('option', undefined, String(c)));
    }
  };

  const drawPiles = () => {
    clearChildren(pilesEl);
    for (let i = 0; i < engine.piles.length; i++) {
      const count = engine.piles[i];
      const anim =
        stoneRemovalAnim?.pile === i ? stoneRemovalAnim.remove : 0;
      const visualCount = count + anim;

      const pile = el('div', 'nim-pile');
      if (selectedPile === i) pile.classList.add('selected');

      const header = el('div', 'nim-pile-header');
      const label = el('span', 'nim-pile-label', `山 ${i + 1}`);
      const badge = el('span', 'nim-pile-count', `${count} 個`);
      if (selectedPile === i) {
        label.appendChild(el('span', 'nim-pile-hint', ' 選択中'));
      }
      header.append(label, badge);
      pile.appendChild(header);

      const stonesWrap = el('div', 'nim-stones');
      if (visualCount === 0) {
        stonesWrap.appendChild(el('span', 'nim-stones-empty', '（なし）'));
      } else {
        // 左から並べ、取るときは右端（末尾）の石だけ消す
        for (let s = 0; s < visualCount; s++) {
          const stone = el('span', 'nim-stone');
          stone.setAttribute('aria-hidden', 'true');
          if (anim > 0 && s >= count) {
            stone.classList.add('nim-stone--leaving');
          }
          stonesWrap.appendChild(stone);
        }
      }
      pile.appendChild(stonesWrap);

      const idx = i;
      pile.addEventListener('click', () => {
        if (locked || engine.isOver() || stoneRemovalAnim) return;
        selectedPile = idx;
        refreshCountOptions();
        drawPiles();
      });
      pilesEl.appendChild(pile);
    }
    refreshCountOptions();
  };

  const updateTurn = () => {
    if (engine.isOver()) return;
    turnLabel.textContent = turnLabelText(
      params.opponent,
      engine.current,
      S.turnP1,
      S.turnP2,
    );
  };

  const showResult = () => {
    if (engine.winner == null) return;
    const msg = pileWinMessage(engine.winner, isCpu(params.opponent), HUMAN_PLAYER);
    showResultDialog(msg, startNew, '#/nim');
  };

  const finishAfterAnim = () => {
    stoneRemovalAnim = null;
    drawPiles();
    updateTurn();
    if (engine.isOver()) showResult();
    else maybeCpu();
  };

  const afterMove = () => {
    drawPiles();
    if (stoneRemovalAnim) {
      locked = true;
      window.setTimeout(() => {
        locked = false;
        finishAfterAnim();
      }, 320);
      return;
    }
    updateTurn();
    if (engine.isOver()) showResult();
    else maybeCpu();
  };

  const applyTake = (pile: number, count: number): boolean => {
    if (!engine.canTake(pile, count)) return false;
    stoneRemovalAnim = { pile, remove: count };
    if (!engine.take(pile, count)) {
      stoneRemovalAnim = null;
      return false;
    }
    afterMove();
    return true;
  };

  const humanTake = () => {
    if (locked || engine.isOver() || stoneRemovalAnim) return;
    if (isCpu(params.opponent) && engine.current !== HUMAN_PLAYER) return;
    const count = parseInt(countSelect.value, 10);
    applyTake(selectedPile, count);
  };

  const maybeCpu = () => {
    if (!isCpu(params.opponent) || engine.isOver() || engine.current === HUMAN_PLAYER) return;
    locked = true;
    turnLabel.textContent = S.thinking;
    cpuTimer = scheduleCpu(400, () => {
      const move = ai.choose(engine, params.difficulty);
      locked = false;
      if (move) applyTake(move[0], move[1]);
      else afterMove();
    });
  };

  const startNew = () => {
    clearCpuTimer(cpuTimer);
    locked = false;
    stoneRemovalAnim = null;
    selectedPile = 0;
    engine = new NimEngine(
      pattern.copyPiles(),
      pattern.maxTake,
      pattern.multiPile,
      misere,
      resolveGameFirst(params.first),
    );
    drawPiles();
    updateTurn();
    maybeCpu();
  };

  btnTake.addEventListener('click', humanTake);
  btnRestart.addEventListener('click', startNew);
  startNew();
}
