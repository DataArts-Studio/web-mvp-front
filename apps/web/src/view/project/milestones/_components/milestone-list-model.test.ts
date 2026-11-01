import type { MilestoneWithStats } from '@/entities/milestone';
import { describe, expect, it } from 'vitest';

import {
  dueHintOf,
  elapsedPercentOf,
  groupMilestones,
  milestoneHealthOf,
  milestonePhaseOf,
  passRateOf,
  projectedFinishOf,
} from './milestone-list-model';

const TODAY = '2026-10-11';

const make = (overrides: Partial<MilestoneWithStats> & { id: string }): MilestoneWithStats => ({
  projectId: 'p',
  title: overrides.id,
  startDate: null,
  endDate: null,
  progressStatus: 'planned',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  archivedAt: null,
  lifecycleStatus: 'ACTIVE',
  lastExecutedAt: null,
  totalCases: 10,
  completedCases: 0,
  progressRate: 0,
  runCount: 0,
  passCases: 0,
  failCases: 0,
  blockedCases: 0,
  suiteCount: 1,
  ...overrides,
});

describe('milestonePhaseOf', () => {
  it('저장된 상태가 아니라 기간과 진행으로 묶음을 정한다', () => {
    // 시작 전
    expect(milestonePhaseOf(make({ id: 'a', startDate: '2026-10-27' }), TODAY)).toBe('planned');
    // 날짜도 실행도 없음
    expect(milestonePhaseOf(make({ id: 'b' }), TODAY)).toBe('planned');
    // 시작일이 지났으면 실행이 없어도 진행 중
    expect(milestonePhaseOf(make({ id: 'c', startDate: '2026-10-01' }), TODAY)).toBe('inProgress');
    // 날짜는 없지만 실행이 있음
    expect(milestonePhaseOf(make({ id: 'd', runCount: 1 }), TODAY)).toBe('inProgress');
    // 모든 케이스에 결과가 있으면 완료
    expect(
      milestonePhaseOf(make({ id: 'e', startDate: '2026-10-01', completedCases: 10 }), TODAY)
    ).toBe('done');
    // 케이스가 없는 마일스톤은 완료로 보지 않는다
    expect(milestonePhaseOf(make({ id: 'f', startDate: '2026-10-01', totalCases: 0 }), TODAY)).toBe(
      'inProgress'
    );
  });
});

describe('milestoneHealthOf · dueHintOf', () => {
  it('진행 중이면서 목표일을 넘기면 지연, 남은 날은 D-n', () => {
    const late = make({ id: 'a', startDate: '2026-09-20', endDate: '2026-10-09', runCount: 1 });
    expect(milestoneHealthOf(late, TODAY)).toBe('delayed');
    expect(dueHintOf(late, TODAY)).toEqual({ text: '2일 지남', tone: 'danger' });

    const ok = make({ id: 'b', startDate: '2026-10-01', endDate: '2026-10-24' });
    expect(milestoneHealthOf(ok, TODAY)).toBe('onTrack');
    expect(dueHintOf(ok, TODAY)).toEqual({ text: 'D-13', tone: 'muted' });

    const dueToday = make({ id: 'c', startDate: '2026-10-01', endDate: TODAY });
    expect(milestoneHealthOf(dueToday, TODAY)).toBe('onTrack');
    expect(dueHintOf(dueToday, TODAY)?.text).toBe('오늘 마감');
  });

  it('지금 속도로 목표일 안에 못 끝나면 위험', () => {
    const base = { startDate: '2026-10-01', endDate: '2026-10-15', runCount: 1 };
    // 10일 동안 2건 → 남은 8건은 40일 뒤
    const slow = make({ id: 'a', ...base, completedCases: 2 });
    expect(projectedFinishOf(slow.startDate, 2, 10, TODAY)).toBe('2026-11-20');
    expect(milestoneHealthOf(slow, TODAY)).toBe('atRisk');
    // 10일 동안 8건 → 남은 2건은 3일 뒤
    expect(milestoneHealthOf(make({ id: 'b', ...base, completedCases: 8 }), TODAY)).toBe('onTrack');
    // 예상일을 직접 넘기면 그 값으로 판정한다
    expect(milestoneHealthOf(slow, TODAY, null)).toBe('onTrack');
    expect(milestoneHealthOf(slow, TODAY, '2026-10-16')).toBe('atRisk');
  });

  it('예정은 시작까지 남은 날, 완료는 문구 없음', () => {
    expect(dueHintOf(make({ id: 'a', startDate: '2026-10-27' }), TODAY)?.text).toBe('16일 뒤 시작');
    expect(dueHintOf(make({ id: 'b', startDate: '2026-10-12' }), TODAY)?.text).toBe('내일 시작');
    expect(dueHintOf(make({ id: 'c', completedCases: 10 }), TODAY)).toBeNull();
  });
});

describe('elapsedPercentOf · passRateOf', () => {
  it('기간 경과 비율은 0~100 으로 자른다', () => {
    expect(
      elapsedPercentOf(make({ id: 'a', startDate: '2026-10-01', endDate: '2026-10-21' }), TODAY)
    ).toBe(50);
    expect(
      elapsedPercentOf(make({ id: 'b', startDate: '2026-09-01', endDate: '2026-10-01' }), TODAY)
    ).toBe(100);
    expect(elapsedPercentOf(make({ id: 'c', startDate: '2026-10-01' }), TODAY)).toBeNull();
  });

  it('통과율은 결과를 남긴 케이스 기준', () => {
    expect(passRateOf(make({ id: 'a', completedCases: 4, passCases: 3, failCases: 1 }))).toBe(75);
    expect(passRateOf(make({ id: 'b' }))).toBeNull();
  });
});

describe('groupMilestones', () => {
  it('진행 중·예정은 가까운 날짜 먼저, 완료는 최근 것 먼저', () => {
    const groups = groupMilestones(
      [
        make({ id: 'p2', startDate: '2026-11-17' }),
        make({ id: 'p1', startDate: '2026-10-27' }),
        make({ id: 'i2', startDate: '2026-10-01', endDate: '2026-10-24' }),
        make({ id: 'i1', startDate: '2026-09-20', endDate: '2026-10-09' }),
        make({ id: 'd1', endDate: '2026-09-05', completedCases: 10 }),
        make({ id: 'd2', endDate: '2026-09-12', completedCases: 10 }),
      ],
      TODAY
    );
    expect(groups.inProgress.map((m) => m.id)).toEqual(['i1', 'i2']);
    expect(groups.planned.map((m) => m.id)).toEqual(['p1', 'p2']);
    expect(groups.done.map((m) => m.id)).toEqual(['d2', 'd1']);
  });
});
