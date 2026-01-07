import { z } from 'zod';
import {
  CreateTestRunSchema,
  CreateTestRunInputSchema,
  TestRunSchema,
  TestRunStatusEnum,
  TestRunSourceTypeEnum,
} from './schema';

export type TestRunDTO = z.infer<typeof TestRunSchema>;
export type CreateTestRunDTO = z.infer<typeof CreateTestRunSchema>;
export type CreateTestRunInput = z.infer<typeof CreateTestRunInputSchema>;
export type TestRunStatus = z.infer<typeof TestRunStatusEnum>;
export type TestRunSourceType = z.infer<typeof TestRunSourceTypeEnum>;