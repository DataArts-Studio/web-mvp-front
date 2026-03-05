import { z } from 'zod';
import {
  CreateTestRunSchema,
  TestRunSchema,
  TestRunStatusEnum,
} from './schema';

export type TestRunDTO = z.infer<typeof TestRunSchema>;
export type CreateTestRunDTO = z.infer<typeof CreateTestRunSchema>;
export type CreateTestRunInput = z.infer<typeof CreateTestRunSchema>;
export type TestRunStatus = z.infer<typeof TestRunStatusEnum>;
export type TestRunSourceType = 'suite' | 'milestone' | 'adhoc' | 'manual';