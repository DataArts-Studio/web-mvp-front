import { z } from 'zod';
import { CreateTestRunSchema, TestRunSchema } from './schema';

export type TestRunDTO = z.infer<typeof TestRunSchema>;
export type CreateTestRunDTO = z.infer<typeof CreateTestRunSchema>;