import {
  CreateMilestoneDtoSchema,
  CreateMilestoneSchema,
  MilestoneDtoSchema,
  MilestoneProgressStatusEnum,
} from '@/entities';
import type { LifecycleStatus } from '@/shared/types';
import { z } from 'zod';

export type MilestoneProgressStatus = z.infer<typeof MilestoneProgressStatusEnum>;

export type MilestoneDTO = z.infer<typeof MilestoneDtoSchema>;
export type CreateMilestoneDTO = z.infer<typeof CreateMilestoneDtoSchema>;
export type CreateMilestone = z.infer<typeof CreateMilestoneSchema>;

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  /** 'YYYY-MM-DD'. 날짜만 있는 값이라 Date 로 바꾸지 않는다 (#381). */
  startDate: string | null;
  endDate: string | null;
  progressStatus: MilestoneProgressStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  lifecycleStatus: LifecycleStatus;
  /**
   * 이 마일스톤 케이스들의 마지막 실행 시점 (FDD-TR12 회귀 환기용).
   * test_case_runs.source_type='milestone' AND source_id=<milestone_id>, excluded_at IS NULL 의 max(executed_at).
   * 실행 이력이 없으면 null. 경과일 계산·"N일 전" 포맷은 frontend 담당.
   */
  lastExecutedAt: Date | null;
};

export type MilestoneStats = {
  totalCases: number;
  completedCases: number;
  progressRate: number;
  runCount: number;
  /** 범위 안 케이스의 최근 결과별 수. 목록 결과 막대에 쓴다. */
  passCases: number;
  failCases: number;
  blockedCases: number;
  /** 연결된 스위트 수 */
  suiteCount: number;
};

export type MilestoneWithStats = Milestone &
  MilestoneStats & {
    testCases?: Array<{
      id: string;
      caseKey: string;
      title: string;
      lastStatus: string | null;
      /** 범위에 든 스위트를 거쳐 들어온 케이스면 그 스위트, 직접 추가면 null. 상세 조회만 채운다. */
      suiteId?: string | null;
      /** 이 마일스톤 실행에서 처음 결과를 기록한 시각 */
      firstExecutedAt?: Date | null;
      /** 가장 최근 결과의 시각과 메모 */
      lastExecutedAt?: Date | null;
      lastComment?: string | null;
    }>;
    testSuites?: Array<{ id: string; title: string; description: string | null }>;
    testRuns?: Array<{
      id: string;
      name: string;
      status: string;
      createdAt?: Date;
      updatedAt: Date;
      /** 실행별 결과 수. 상세 조회만 채운다. */
      counts?: { pass: number; fail: number; blocked: number; total: number };
    }>;
  };
