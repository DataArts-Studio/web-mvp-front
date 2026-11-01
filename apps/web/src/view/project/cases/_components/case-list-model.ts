import type { CaseListSectionGroup, TestCaseResultStatus } from '@/entities/test-case';

/** 최근 결과 칸 수. 서버가 돌려주는 최대 개수와 같다. */
export const RECENT_SLOTS = 5;

/** 오래된 것부터 온 결과를 오른쪽 끝(가장 최근)에 맞춰 칸에 채운다. 빈 칸은 null. */
export const recentSlotsOf = (
  results: TestCaseResultStatus[] | undefined
): (TestCaseResultStatus | null)[] => {
  const recent = (results ?? []).slice(-RECENT_SLOTS);
  return [...Array<null>(RECENT_SLOTS - recent.length).fill(null), ...recent];
};

/** 묶음 키. 섹션 없는 케이스는 ''. */
export const groupKey = (sectionId: string | null | undefined) => sectionId ?? '';

/**
 * 한 페이지의 케이스를 서버가 준 섹션 순서대로 묶는다. 이 페이지에 케이스가 없는 섹션은 뺀다.
 * 섹션 정보가 없으면(묶지 않는 보기) 머리줄 없는 한 묶음을 돌려준다.
 */
export const groupCasesBySection = <T extends { sectionId?: string | null }>(
  items: T[],
  sections: CaseListSectionGroup[] | undefined
): { section: CaseListSectionGroup | null; items: T[] }[] => {
  if (!sections) return [{ section: null, items }];
  return sections
    .map((section) => ({
      section,
      items: items.filter((item) => groupKey(item.sectionId) === groupKey(section.id)),
    }))
    .filter((group) => group.items.length > 0);
};
