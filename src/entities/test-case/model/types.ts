import { z } from 'zod';
import { CreateTestCaseSchema, TestCaseSchema } from './schema';

export type TestCaseDTO = z.infer<typeof TestCaseSchema>;
export type CreateTestCaseDTO = z.infer<typeof CreateTestCaseSchema>;