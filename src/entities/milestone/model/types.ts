import { z } from 'zod';
import { CreateMilestoneSchema, MilestoneSchema } from './schema';

export type MilestoneDTO = z.infer<typeof MilestoneSchema>;
export type CreateMilestoneDTO = z.infer<typeof CreateMilestoneSchema>;

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
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

export type MilestoneWithStats = Milestone & MilestoneStats;

export type CreateMilestone = {
  projectId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: string;
};