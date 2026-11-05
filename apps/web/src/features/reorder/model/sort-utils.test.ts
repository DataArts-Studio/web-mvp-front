import { describe, expect, it } from 'vitest';

import { placeCaseInOrder } from './sort-utils';

describe('placeCaseInOrder (#380)', () => {
  const ids = ['a', 'b', 'c', 'd'];

  it('앞 이웃이 있으면 그 바로 뒤에 둔다', () => {
    expect(placeCaseInOrder(ids, 'a', { beforeId: 'c', afterId: 'd' })).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
  });

  it('맨 앞으로 옮기면 뒤 이웃 바로 앞에 둔다', () => {
    expect(placeCaseInOrder(ids, 'd', { beforeId: null, afterId: 'a' })).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
  });

  it('보기에서 걸러진 케이스가 사이에 있어도 이웃 기준으로 자리를 잡는다', () => {
    // 스위트 보기에서 a, c 만 보이는 상태로 a 를 c 뒤로 옮기면 b 는 그대로 앞에 남는다.
    expect(placeCaseInOrder(ids, 'a', { beforeId: 'c', afterId: null })).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
  });

  it('옮길 케이스나 이웃이 순서에 없으면 null', () => {
    expect(placeCaseInOrder(ids, 'x', { beforeId: 'a' })).toBeNull();
    expect(placeCaseInOrder(ids, 'a', { beforeId: 'x' })).toBeNull();
    expect(placeCaseInOrder(ids, 'a', {})).toBeNull();
  });
});
