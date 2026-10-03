import { S } from '../strings.ts';
import { Player } from './player.ts';
import type { OpponentMode } from './opponentMode.ts';
import { isCpu } from './opponentMode.ts';
import type { AiDifficulty } from './aiDifficulty.ts';
import { parseDifficulty } from './aiDifficulty.ts';
import { parseFirstPlayer, resolveFirst } from './firstPlayer.ts';

export const HUMAN_PLAYER = Player.CIRCLE;

export type PlayParams = {
  opponent: OpponentMode;
  difficulty: AiDifficulty;
  first: ReturnType<typeof parseFirstPlayer>;
};

export function parsePlayParams(query: URLSearchParams): PlayParams {
  const opp = query.get('opponent');
  return {
    opponent: opp === 'TWO_PLAYER' ? 'TWO_PLAYER' : 'CPU',
    difficulty: parseDifficulty(query.get('difficulty')),
    first: parseFirstPlayer(query.get('first')),
  };
}

export function resolveGameFirst(first: PlayParams['first']): number {
  return resolveFirst(first, () => Math.random() < 0.5);
}

export function turnLabelText(
  opponent: OpponentMode,
  current: number,
  circleLabel: string,
  crossLabel: string,
  youSuffix = '（あなた）',
): string {
  if (isCpu(opponent)) {
    return current === HUMAN_PLAYER ? `${circleLabel}${youSuffix}` : S.thinking;
  }
  return current === Player.CIRCLE ? circleLabel : crossLabel;
}

export function scheduleCpu(delayMs: number, fn: () => void): number {
  return window.setTimeout(fn, delayMs);
}

export function clearCpuTimer(id: number | undefined): void {
  if (id != null) window.clearTimeout(id);
}
