import { renderHub } from './hub/hubScreen.ts';
import { renderAlignSetup, renderAlignPlay } from './align/alignScreens.ts';
import { renderNimSetup, renderNimPlay } from './nim/nimScreens.ts';
import { renderConnect4Setup, renderConnect4Play } from './connect4/connect4Screens.ts';
import { renderVariantSetup, renderVariantPlay } from './variant/variantScreens.ts';
import { renderDotsSetup, renderDotsPlay } from './dots/dotsScreens.ts';
import { S } from './strings.ts';

function parseQuery(hash: string): URLSearchParams {
  const q = hash.indexOf('?');
  if (q < 0) return new URLSearchParams();
  return new URLSearchParams(hash.slice(q + 1));
}

function routePath(hash: string): string {
  const base = hash.replace(/^#/, '').split('?')[0];
  return base || '/';
}

export function navigate(root: HTMLElement): void {
  const hash = window.location.hash || '#/';
  const path = routePath(hash);
  const query = parseQuery(hash);

  if (path === '/' || path === '') {
    renderHub(root);
    document.title = S.appName;
    return;
  }
  if (path === '/align') {
    renderAlignSetup(root);
    document.title = S.gameAlign;
    return;
  }
  if (path === '/align/play') {
    renderAlignPlay(root, query);
    document.title = S.gameAlign;
    return;
  }
  if (path === '/nim') {
    renderNimSetup(root);
    document.title = S.gameNim;
    return;
  }
  if (path === '/nim/play') {
    renderNimPlay(root, query);
    document.title = S.gameNim;
    return;
  }
  if (path === '/connect4') {
    renderConnect4Setup(root);
    document.title = S.gameConnect4;
    return;
  }
  if (path === '/connect4/play') {
    renderConnect4Play(root, query);
    document.title = S.gameConnect4;
    return;
  }
  if (path === '/variant') {
    renderVariantSetup(root);
    document.title = S.gameVariant;
    return;
  }
  if (path === '/variant/play') {
    renderVariantPlay(root, query);
    document.title = S.gameVariant;
    return;
  }
  if (path === '/dots') {
    renderDotsSetup(root);
    document.title = S.gameDots;
    return;
  }
  if (path === '/dots/play') {
    renderDotsPlay(root, query);
    document.title = S.gameDots;
    return;
  }

  window.location.hash = '#/';
}

export function startRouter(root: HTMLElement): void {
  window.addEventListener('hashchange', () => navigate(root));
  navigate(root);
}
