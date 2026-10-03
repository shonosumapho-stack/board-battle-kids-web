import { S } from '../strings.ts';
import { clearChildren, el, labeledSelect } from './ui.ts';
import type { OpponentMode } from './opponentMode.ts';
import type { AiDifficulty } from './aiDifficulty.ts';
import type { FirstPlayer } from './firstPlayer.ts';

const OPP_LABELS = [S.opponentTwo, S.opponentCpu];
const DIFF_LABELS = [S.diffEasy, S.diffNormal, S.diffHard];

export type SetupCommonState = {
  opponent: OpponentMode;
  difficulty: AiDifficulty;
  first: FirstPlayer;
};

export function appendOpponentFields(
  panel: HTMLElement,
  firstLabels: string[],
  onOpponentChange: (cpu: boolean) => void,
): {
  getOpponent: () => OpponentMode;
  getDifficulty: () => AiDifficulty;
  getFirst: () => FirstPlayer;
  firstValues: FirstPlayer[];
} {
  const { wrap: oppWrap, select: oppSelect } = labeledSelect(S.opponent, OPP_LABELS, 1, () => {
    onOpponentChange(oppSelect.selectedIndex === 1);
  });

  const diffWrap = el('div', 'field cpu-only');
  const diffLab = el('label', 'field-label', S.difficulty);
  const diffSelect = el('select', 'level-select') as HTMLSelectElement;
  for (const d of DIFF_LABELS) {
    diffSelect.appendChild(el('option', undefined, d));
  }
  diffSelect.selectedIndex = 1;
  diffWrap.append(diffLab, diffSelect);

  const firstValues: FirstPlayer[] = ['CIRCLE', 'CROSS', 'RANDOM'];
  const { wrap: firstWrap, select: firstSelect } = labeledSelect(S.firstPlayer, firstLabels, 0);

  panel.append(oppWrap, diffWrap, firstWrap);

  const setCpuVisible = (cpu: boolean) => {
    diffWrap.style.display = cpu ? '' : 'none';
  };
  setCpuVisible(true);
  onOpponentChange(true);

  oppSelect.addEventListener('change', () => {
    setCpuVisible(oppSelect.selectedIndex === 1);
    onOpponentChange(oppSelect.selectedIndex === 1);
  });

  return {
    getOpponent: () => (oppSelect.selectedIndex === 0 ? 'TWO_PLAYER' : 'CPU'),
    getDifficulty: () => {
      const idx = diffSelect.selectedIndex;
      return idx === 0 ? 'EASY' : idx === 2 ? 'HARD' : 'NORMAL';
    },
    getFirst: () => firstValues[firstSelect.selectedIndex] ?? 'CIRCLE',
    firstValues,
  };
}

export function renderSetupShell(
  root: HTMLElement,
  title: string,
  accentClass: string,
  buildPanel: (panel: HTMLElement) => void,
  help?: { title: string; body: string },
): HTMLButtonElement {
  clearChildren(root);
  root.className = `screen setup-screen ${accentClass}`;

  const panel = el('div', 'menu-panel');
  const h1 = el('h1', 'game-title', title);
  panel.appendChild(h1);
  buildPanel(panel);

  const btnStart = el('button', 'btn-primary', S.start);
  btnStart.type = 'button';
  panel.appendChild(btnStart);

  if (help) {
    const btnHelp = el('button', 'btn-ghost', S.help);
    btnHelp.type = 'button';
    btnHelp.addEventListener('click', () => {
      alert(`${help.title}\n\n${help.body}`);
    });
    panel.appendChild(btnHelp);
  }

  const btnBack = el('button', 'btn-ghost', S.back);
  btnBack.type = 'button';
  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });
  panel.appendChild(btnBack);

  root.appendChild(panel);
  return btnStart;
}
