import { S } from '../strings.ts';
import { GameResult, type GameResultId } from './gameResult.ts';
import { Player } from './player.ts';
export function markWinMessage(
  result: GameResultId,
  vsCpu: boolean,
  humanPlayer: number,
): string {
  if (result === GameResult.DRAW) return S.draw;
  const winner = result === GameResult.CIRCLE_WIN ? Player.CIRCLE : Player.CROSS;
  if (vsCpu) {
    return winner === humanPlayer ? S.youWin : S.cpuWin;
  }
  return winner === Player.CIRCLE ? S.circleWin : S.crossWin;
}

export function pileWinMessage(winner: number, vsCpu: boolean, humanPlayer: number): string {
  if (winner === Player.NONE) return S.draw;
  if (vsCpu) {
    return winner === humanPlayer ? S.youWin : S.cpuWin;
  }
  return winner === Player.CIRCLE ? S.p1Win : S.p2Win;
}

export function showResultDialog(
  message: string,
  onRestart: () => void,
  setupHash: string,
): void {
  const overlay = document.createElement('div');
  overlay.className = 'result-overlay';
  const box = document.createElement('div');
  box.className = 'result-box';
  const msg = document.createElement('p');
  msg.className = 'result-message';
  msg.textContent = message;
  const actions = document.createElement('div');
  actions.className = 'result-actions';

  const btnRestart = document.createElement('button');
  btnRestart.type = 'button';
  btnRestart.className = 'btn-primary';
  btnRestart.textContent = S.restart;
  btnRestart.addEventListener('click', () => {
    overlay.remove();
    onRestart();
  });

  const btnSetup = document.createElement('button');
  btnSetup.type = 'button';
  btnSetup.className = 'btn-secondary';
  btnSetup.textContent = S.toSetup;
  btnSetup.addEventListener('click', () => {
    overlay.remove();
    window.location.hash = setupHash;
  });

  const btnHome = document.createElement('button');
  btnHome.type = 'button';
  btnHome.className = 'btn-ghost';
  btnHome.textContent = S.toHome;
  btnHome.addEventListener('click', () => {
    overlay.remove();
    window.location.hash = '#/';
  });

  actions.append(btnRestart, btnSetup, btnHome);
  box.append(msg, actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
