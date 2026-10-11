/**
 * 간격 기반 (Gap-based) sort_order 유틸리티
 *
 * - 초기 할당: 1000 간격
 * - 이동 시 중간값 계산
 * - 간격 소진 시 전체 재정렬
 */

export const SORT_ORDER_GAP = 1000;
export const MIN_GAP = 1;

/**
 * 두 sort_order 값 사이의 중간값 계산
 * before가 없으면 after 앞에 배치, after가 없으면 before 뒤에 배치
 */
export function calculateMiddleSortOrder(before: number | null, after: number | null): number {
  if (before == null && after == null) return SORT_ORDER_GAP;
  if (before == null) return Math.floor(after! / 2);
  if (after == null) return before + SORT_ORDER_GAP;

  const middle = Math.floor((before + after) / 2);
  // 간격 소진: middle이 before와 같으면 rebalance 필요
  if (middle <= before) return -1; // sentinel: rebalance needed
  return middle;
}

/**
 * 재정렬용 sort_order 배열 생성
 * @param ids - 현재 정렬된 아이템 ID 배열
 * @returns id → newSortOrder 매핑
 */
export function generateRebalancedOrders(ids: string[]): Map<string, number> {
  const map = new Map<string, number>();
  ids.forEach((id, index) => {
    map.set(id, (index + 1) * SORT_ORDER_GAP);
  });
  return map;
}

/**
 * 케이스를 이웃 바로 뒤(beforeId), 이웃이 없으면 바로 앞(afterId)에 둔 새 순서를 만든다.
 * 옮길 케이스나 이웃이 순서에 없으면 null.
 */
export function placeCaseInOrder(
  ids: string[],
  caseId: string,
  neighbor: { beforeId?: string | null; afterId?: string | null }
): string[] | null {
  if (!ids.includes(caseId)) return null;
  const rest = ids.filter((id) => id !== caseId);
  const anchorId = neighbor.beforeId ?? neighbor.afterId;
  if (!anchorId || anchorId === caseId) return null;
  const anchorIndex = rest.indexOf(anchorId);
  if (anchorIndex === -1) return null;
  const insertAt = neighbor.beforeId ? anchorIndex + 1 : anchorIndex;
  return [...rest.slice(0, insertAt), caseId, ...rest.slice(insertAt)];
}

/**
 * 배열에서 아이템을 oldIndex에서 newIndex로 이동
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
}
