export const Player = {
  NONE: 0,
  CIRCLE: 1,
  CROSS: 2,
} as const;

export type PlayerId = (typeof Player)[keyof typeof Player];

export function otherPlayer(player: number): number {
  return player === Player.CIRCLE ? Player.CROSS : Player.CIRCLE;
}

export function playerLabel(player: number): string {
  if (player === Player.CIRCLE) return '〇';
  if (player === Player.CROSS) return '×';
  return '';
}
