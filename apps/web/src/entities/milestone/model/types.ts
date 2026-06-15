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
  startDate: Date | null;
  endDate: Date | null;
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
};

export type MilestoneWithStats = Milestone &
  MilestoneStats & {
    testCases?: Array<{ id: string; caseKey: string; title: string; lastStatus: string | null }>;
    testSuites?: Array<{ id: string; title: string; description: string | null }>;
    testRuns?: Array<any>;
  };
