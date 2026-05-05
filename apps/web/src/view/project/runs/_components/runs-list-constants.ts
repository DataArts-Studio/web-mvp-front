export const PAGE_SIZE = 10;
export const MAX_VISIBLE_SUITES = 2;

export type RunStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type RunSourceType = 'SUITE' | 'MILESTONE' | 'ADHOC';
export type RunStatusFilter = 'ALL' | RunStatus;
export type RunSortOption = 'UPDATED' | 'NAME';

export interface ITestRun {
  id: string;
  name: string;
  sourceType: RunSourceType;
  sourceName: string;
  status: RunStatus;
  updatedAt: Date;
  stats: {
    totalCases: number;
    completedCases: number;
    progressPercent: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
  };
}

export const getStatusFilterLabel = (filter: RunStatusFilter): string => {
  switch (filter) {
    case 'ALL': return '전체 상태';
    case 'COMPLETED': return '완료됨';
    case 'IN_PROGRESS': return '진행 중';
    case 'NOT_STARTED': return '시작 전';
  }
};
