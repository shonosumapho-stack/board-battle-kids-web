import { Player } from './player.ts';

export const GameResult = {
  ONGOING: 'ONGOING',
  CIRCLE_WIN: 'CIRCLE_WIN',
  CROSS_WIN: 'CROSS_WIN',
  DRAW: 'DRAW',
} as const;

export type GameResultId = (typeof GameResult)[keyof typeof GameResult];

export function winFor(player: number): GameResultId {
  return player === Player.CIRCLE ? GameResult.CIRCLE_WIN : GameResult.CROSS_WIN;
}
