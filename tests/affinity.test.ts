import { describe, expect, it } from 'vitest';
import { affinity, shadowCost, movementBudget, movementCost, type Brightness } from '../src/game/affinity';

describe('仕様書の五段階の能力補正', () => {
  it('固定移動予算と光の進入コスト、強い光の防御', () => {
    expect(movementBudget).toEqual({light:6,shadow:8});
    expect(([0,1,2,3,4] as Brightness[]).map(v=>movementCost('light',v))).toEqual([3,2,2,1,1]);
    expect(affinity.light.map(value => value.armor)).toEqual([0, 0, 0, 0, 1]);
  });
  it('影の移動コストと回避を保つ', () => {
    expect(([0, 1, 2, 3, 4] as Brightness[]).map(shadowCost)).toEqual([1, 2, 3, 3, Infinity]);
    expect(affinity.shadow.map(value => value.evade)).toEqual([.55, .30, .10, 0, 0]);
  });
});
