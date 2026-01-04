import { z } from 'zod';
import { CreateTestRunSchema, TestRunSchema, TestRunStatusEnum, TestRunSourceTypeEnum } from './schema';

export type TestRunDTO = z.infer<typeof TestRunSchema>;
export type CreateTestRunDTO = z.infer<typeof CreateTestRunSchema>;
export type TestRunStatus = z.infer<typeof TestRunStatusEnum>;
export type TestRunSourceType = z.infer<typeof TestRunSourceTypeEnum>;