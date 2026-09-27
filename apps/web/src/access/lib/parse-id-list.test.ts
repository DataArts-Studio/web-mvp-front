import { describe, expect, it, vi } from 'vitest';

import { parseIdList } from './project-scope';

vi.mock('@testea/db', () => ({ getDatabase: vi.fn() }));

const A = '0199a000-0000-7000-8000-00000000000a';
const B = '0199a000-0000-7000-8000-00000000000b';

describe('parseIdList', () => {
  it('UUID 배열을 중복 없이 돌려준다', () => {
    expect(parseIdList([A, B, A])).toEqual([A, B]);
  });

  it('빈 배열·배열 아님·UUID 아님이 하나라도 있으면 null', () => {
    expect(parseIdList([])).toBeNull();
    expect(parseIdList('x')).toBeNull();
    expect(parseIdList(undefined)).toBeNull();
    expect(parseIdList([A, 'not-a-uuid'])).toBeNull();
  });

  it('너무 긴 배열은 거부한다', () => {
    const many = Array.from(
      { length: 1001 },
      (_, i) => `0199a000-0000-7000-8000-${String(i).padStart(12, '0')}`
    );
    expect(parseIdList(many)).toBeNull();
  });
});
