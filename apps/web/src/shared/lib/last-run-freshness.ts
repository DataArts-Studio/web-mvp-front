/**
 * 마지막 실행 경과 라벨 (FDD-TR12 회귀 반복 실행 유도).
 *
 * 스위트/마일스톤의 `lastExecutedAt` 을 받아 사람이 읽을 상대시간 라벨과
 * 환기 강조 여부(임계일 초과)를 계산한다. 순수 함수이므로 React 의존 없음.
 */

/** 회귀 환기 임계일 (일). 이 값을 초과하면 강조 처리한다. */
export const LAST_RUN_STALE_THRESHOLD_DAYS = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface LastRunFreshness {
  /** 표시할 라벨 (예: '마지막 실행 어제', '실행 이력 없음') */
  label: string;
  /** 실행 이력이 있는지 여부 */
  hasRun: boolean;
  /** 임계일 초과로 환기 강조가 필요한지 여부 */
  isStale: boolean;
  /** 경과일 (실행 이력이 없으면 null) */
  daysSince: number | null;
}

function toDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/** 날짜 경계 기준 경과일 계산 (오늘=0, 어제=1) */
function diffInDays(from: Date, now: Date): number {
  const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((startOfNow - startOfFrom) / MS_PER_DAY));
}

/**
 * 마지막 실행 경과 정보를 계산한다.
 *
 * - 이력 없음(null): `실행 이력 없음`
 * - 오늘: `마지막 실행 오늘`
 * - 어제: `마지막 실행 어제`
 * - 그 외: `마지막 실행 N일 전`
 * - 임계일(기본 30일) 초과 시 `isStale = true`
 */
export function getLastRunFreshness(
  lastExecutedAt: Date | string | null | undefined,
  thresholdDays: number = LAST_RUN_STALE_THRESHOLD_DAYS,
  now: Date = new Date()
): LastRunFreshness {
  const date = toDate(lastExecutedAt);

  if (!date) {
    return { label: '실행 이력 없음', hasRun: false, isStale: false, daysSince: null };
  }

  const days = diffInDays(date, now);

  let relative: string;
  if (days <= 0) relative = '오늘';
  else if (days === 1) relative = '어제';
  else relative = `${days}일 전`;

  return {
    label: `마지막 실행 ${relative}`,
    hasRun: true,
    isStale: days > thresholdDays,
    daysSince: days,
  };
}
