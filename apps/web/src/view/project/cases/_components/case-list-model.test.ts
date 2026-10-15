import { describe, expect, it } from 'vitest';

import { RECENT_SLOTS, groupCasesBySection, recentSlotsOf } from './case-list-model';

describe('recentSlotsOf', () => {
  it('결과가 모자라면 왼쪽을 비우고 가장 최근 결과를 오른쪽 끝에 둔다', () => {
    expect(recentSlotsOf(['fail', 'pass'])).toEqual([null, null, null, 'fail', 'pass']);
  });

  it('기록이 없으면 모두 빈 칸', () => {
    expect(recentSlotsOf(undefined)).toEqual(Array(RECENT_SLOTS).fill(null));
    expect(recentSlotsOf([])).toEqual(Array(RECENT_SLOTS).fill(null));
  });

  it('칸보다 많으면 최근 것만 남긴다', () => {
    expect(recentSlotsOf(['blocked', 'pass', 'pass', 'fail', 'pass', 'pass'])).toEqual([
      'pass',
      'pass',
      'fail',
      'pass',
      'pass',
    ]);
  });
});

describe('groupCasesBySection', () => {
  const sections = [
    { id: 's-login', name: '로그인', caseCount: 5 },
    { id: 's-mfa', name: 'MFA', caseCount: 2 },
    { id: 's-empty-here', name: '세션', caseCount: 3 },
    { id: null, name: '', caseCount: 1 },
  ];

  it('섹션 순서대로 묶고 이 페이지에 없는 섹션은 뺀다', () => {
    const groups = groupCasesBySection(
      [
        { id: 'a', sectionId: 's-login' },
        { id: 'b', sectionId: 's-login' },
        { id: 'c', sectionId: 's-mfa' },
        { id: 'd', sectionId: null },
      ],
      sections
    );
    expect(groups.map((g) => [g.section?.name, g.items.map((i) => i.id)])).toEqual([
      ['로그인', ['a', 'b']],
      ['MFA', ['c']],
      ['', ['d']],
    ]);
  });

  it('섹션 정보가 없으면 머리줄 없는 한 묶음', () => {
    const items = [{ id: 'a', sectionId: 's-login' }];
    expect(groupCasesBySection(items, undefined)).toEqual([{ section: null, items }]);
  });
});
