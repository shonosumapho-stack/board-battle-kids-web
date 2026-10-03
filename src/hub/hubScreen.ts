import { S } from '../strings.ts';
import { clearChildren, el } from '../shared/ui.ts';

export function renderHub(root: HTMLElement): void {
  clearChildren(root);
  root.className = 'screen hub-screen';

  const title = el('h1', 'hub-title', S.appName);
  const sub = el('p', 'hub-subtitle', S.hubSubtitle);

  const games = [
    { hash: '#/align', label: S.gameAlign, className: 'hub-btn hub-btn-align' },
    { hash: '#/nim', label: S.gameNim, className: 'hub-btn hub-btn-nim' },
    { hash: '#/connect4', label: S.gameConnect4, className: 'hub-btn hub-btn-connect4' },
    { hash: '#/variant', label: S.gameVariant, className: 'hub-btn hub-btn-variant' },
    { hash: '#/dots', label: S.gameDots, className: 'hub-btn hub-btn-dots' },
  ];

  const nav = el('div', 'hub-nav');
  for (const g of games) {
    const btn = el('a', g.className, g.label);
    btn.href = g.hash;
    nav.appendChild(btn);
  }

  root.append(title, sub, nav);
}
