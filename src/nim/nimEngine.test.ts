import { describe, expect, it } from 'vitest';
import { Player } from '../shared/player.ts';
import { NimEngine } from './nimEngine.ts';

describe('NimEngine', () => {
  it('nim sum for 3-4-5', () => {
    const e = new NimEngine([3, 4, 5], 0, true, false, Player.CIRCLE);
    expect(e.nimSum()).toBe(3 ^ 4 ^ 5);
  });

  it('misere last taker loses', () => {
    const e = new NimEngine([1], 3, false, true, Player.CIRCLE);
    e.take(0, 1);
    expect(e.winner).toBe(Player.CROSS);
  });
});
