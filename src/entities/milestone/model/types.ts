import { z } from 'zod';
import { CreateMilestoneSchema, MilestoneSchema } from './schema';

export type MilestoneDTO = z.infer<typeof MilestoneSchema>;
export type CreateMilestoneDTO = z.infer<typeof CreateMilestoneSchema>;