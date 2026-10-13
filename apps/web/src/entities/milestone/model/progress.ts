import type { TestCaseResultStatus } from '@/shared/types';

export type MilestoneProgress = {
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  untested: number;
  completed: number;
  progressPercent: number;
};

/**
 * 마일스톤 진행률은 범위 안 케이스마다 가장 최근 실행 결과 하나로 센다 (#418).
 * 실행이 몇 개든 케이스는 한 번만 세고, 결과가 없는 케이스는 미실행이다.
 * 목록·상세·대시보드가 모두 이 함수로 계산해 같은 값을 보인다.
 */
export function summarizeMilestoneProgress(
  caseIds: Iterable<string>,
  latestStatuses: ReadonlyMap<string, TestCaseResultStatus>
): MilestoneProgress {
  let total = 0;
  let pass = 0;
  let fail = 0;
  let blocked = 0;
  for (const caseId of new Set(caseIds)) {
    total++;
    const status = latestStatuses.get(caseId);
    if (status === 'pass') pass++;
    else if (status === 'fail') fail++;
    else if (status === 'blocked') blocked++;
  }
  const completed = pass + fail + blocked;
  return {
    total,
    pass,
    fail,
    blocked,
    untested: total - completed,
    completed,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
