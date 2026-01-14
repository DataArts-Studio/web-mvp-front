import {
  CreateMilestoneDtoSchema,
  CreateMilestoneSchema,
  LifecycleStatus,
  MilestoneDtoSchema,
} from '@/entities';
import { z } from 'zod';

export type MilestoneProgressStatus = 'planned' | 'inProgress' | 'done';

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
    testRuns?: Array<any>;
  };
