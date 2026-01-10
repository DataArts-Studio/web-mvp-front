import { z } from 'zod';

import { CreateMilestoneDtoSchema, CreateMilestoneSchema, MilestoneDtoSchema, UpdateMilestoneSchema } from './schema';

export type MilestoneDTO = z.infer<typeof MilestoneDtoSchema>;
export type CreateMilestoneDTO = z.infer<typeof CreateMilestoneDtoSchema>;
export type CreateMilestone = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestone = z.infer<typeof UpdateMilestoneSchema>;

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type MilestoneStats = {
  totalCases: number;
  completedCases: number;
  progressRate: number;
  runCount: number;
};

export type MilestoneWithStats = Milestone & MilestoneStats & {
  testCases?: Array<{ id: string; caseKey: string; title: string; lastStatus: string | null }>;
  testRuns?: Array<any>;
};