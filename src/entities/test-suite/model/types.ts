import {TestSuiteSchema, CreateTestSuiteSchema} from './schema';
import { z } from 'zod';

export type TestSuiteDTO = z.infer<typeof TestSuiteSchema>;
export type CreateTestSuiteDTO = z.infer<typeof CreateTestSuiteSchema>;