import { describe, expect, it } from 'vitest';

import { MAX_TC_IDS_PER_PR, parseTcIds } from './parse-tc-ids';

describe('parseTcIds', () => {
  it('제목·본문의 TC 키를 대소문자 구분 없이 중복 없이 뽑는다', () => {
    expect(parseTcIds('Fix TC-001, tc-002 and TC-001 again')).toEqual([1, 2]);
  });

  it('세 자리 미만 숫자는 TC 키로 보지 않는다', () => {
    expect(parseTcIds('TC-12 is not a key')).toEqual([]);
  });

  it('int4 범위를 넘는 값은 버린다', () => {
    expect(parseTcIds('TC-2147483647 TC-2147483648 TC-99999999999999999999')).toEqual([2147483647]);
  });

  it(`중복 제거 후 최대 ${MAX_TC_IDS_PER_PR}개까지만 돌려준다`, () => {
    const text = Array.from({ length: 200 }, (_, i) => `TC-${String(i + 100)}`).join(' ');
    const ids = parseTcIds(`TC-100 TC-100 ${text}`);
    expect(ids).toHaveLength(MAX_TC_IDS_PER_PR);
    expect(ids[0]).toBe(100);
    expect(ids[1]).toBe(101);
  });
});
