export type OpponentMode = 'TWO_PLAYER' | 'CPU';

export function isCpu(mode: OpponentMode): boolean {
  return mode === 'CPU';
}
