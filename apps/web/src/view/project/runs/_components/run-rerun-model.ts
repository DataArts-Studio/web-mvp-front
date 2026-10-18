import type { RunComparison, TestCaseRunDetail } from '@/entities/test-run';
import { RUN_NAME_MAX_LENGTH } from '@/entities/test-run/model/schema';

import { type Transition, transitionOf, transitionTabsOf } from './run-complete-model';

export interface RerunGroup {
  value: Transition;
  label: string;
  hint: string | null;
  cases: TestCaseRunDetail[];
}

/** 시안 순서: 다시 볼 이유가 큰 묶음부터 */
const GROUP_ORDER: Transition[] = [
  'newFail',
  'stillFail',
  'blocked',
  'untested',
  'recovered',
  'stillPass',
];

/** 처음 열 때 고르는 묶음. 통과한 케이스는 사람이 골라 넣는다. */
export const DEFAULT_RERUN_GROUPS: Transition[] = ['newFail', 'stillFail', 'blocked', 'untested'];

const HINTS: Partial<Record<Transition, string>> = {
  recovered: '고친 게 맞는지 한 번 더 확인할 때',
  untested: '이번 실행에서 보지 못한 케이스',
};

/** 결과 요약과 같은 기준으로 케이스를 묶는다. 빈 묶음은 뺀다. */
export const buildRerunGroups = (
  cases: TestCaseRunDetail[],
  comparison: RunComparison | undefined
): RerunGroup[] => {
  const labels = new Map(
    transitionTabsOf(Boolean(comparison?.previous)).map((tab) => [tab.value, tab.label])
  );
  return GROUP_ORDER.flatMap((value) => {
    const label = labels.get(value);
    const groupCases = cases.filter((tc) => transitionOf(tc, comparison) === value);
    if (!label || groupCases.length === 0) return [];
    const reasons = new Set(
      groupCases.map((tc) => tc.comment?.trim()).filter((reason): reason is string => !!reason)
    );
    const hint = value === 'blocked' && reasons.size > 0 ? `사유 ${reasons.size}종` : HINTS[value];
    return [{ value, label, hint: hint ?? null, cases: groupCases }];
  });
};

/** "회귀 - 2차" 처럼 끝이 N차면 다음 차수로, 아니면 뒤에 "재실행"을 붙인다. */
export const nextRunNameOf = (name: string): string => {
  const trimmed = name.trim();
  const match = trimmed.match(/(\d+)\s*차$/);
  const next = match
    ? `${trimmed.slice(0, match.index)}${Number(match[1]) + 1}차`
    : `${trimmed} 재실행`;
  return next.slice(0, RUN_NAME_MAX_LENGTH);
};
