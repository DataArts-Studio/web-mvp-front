import type { FetchedTestRun } from '@/entities/test-run';

export const PAGE_SIZE = 10;
export const MAX_VISIBLE_SUITES = 2;

export type RunStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type RunSourceType = 'SUITE' | 'MILESTONE' | 'ADHOC';
export type RunStatusFilter = 'ALL' | RunStatus;
/** 목록 탭. 시작 전 실행도 진행 중 탭에 넣는다. */
export type RunListTab = 'ALL' | 'OPEN' | 'COMPLETED';
export type RunSortOption = 'UPDATED' | 'NAME';

export type ITestRun = FetchedTestRun;

export const getStatusFilterLabel = (filter: RunStatusFilter): string => {
  switch (filter) {
    case 'ALL':
      return '전체 상태';
    case 'COMPLETED':
      return '완료됨';
    case 'IN_PROGRESS':
      return '진행 중';
    case 'NOT_STARTED':
      return '시작 전';
  }
};
