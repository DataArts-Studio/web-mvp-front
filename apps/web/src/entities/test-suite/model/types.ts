import type { LifecycleStatus } from '@/shared/types';

export type TestSuite = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  lifecycleStatus: LifecycleStatus;
  /**
   * 이 스위트 케이스들의 마지막 실행 시점 (FDD-TR12 회귀 환기용).
   * test_case_runs.source_type='suite' AND source_id=<suite_id>, excluded_at IS NULL 의 max(executed_at).
   * 실행 이력이 없으면 null. 경과일 계산·"N일 전" 포맷은 frontend 담당.
   */
  lastExecutedAt: Date | null;
};

export type SuiteTagTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type RunStatus = 'passed' | 'failed' | 'blocked' | 'running' | 'not_run';

export type TestSuiteCard = TestSuite & {
  tag: {
    label: string;
    tone: SuiteTagTone;
  };

  /** 출처: 요구사항(기능) 분석서에서 파생된 스위트면 분석서 ID, 아니면 null */
  requirementAnalysisId?: string | null;
  /** 출처: 특정 시나리오에서 파생된 스위트면 시나리오 ID, 아니면 null */
  testScenarioId?: string | null;

  includedPaths: string[];
  caseCount: number;

  linkedMilestone?: {
    id: string;
    title: string;
    versionLabel: string;
  };

  lastRun?: {
    runId: string;
    runAt: Date;
    status: RunStatus;
    counts: {
      passed: number;
      failed: number;
      blocked: number;
      skipped: number;
    };
    total: number;
  };

  executionHistoryCount: number;

  recentRuns: Array<{
    runId: string;
    runAt: Date;
    status: RunStatus;
    failed: number;
    blocked: number;
    passed: number;
    total: number;
  }>;
};
