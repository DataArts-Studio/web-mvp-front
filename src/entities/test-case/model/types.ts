import { z } from 'zod';

import { CreateTestCaseDtoSchema, CreateTestCaseSchema, TestCaseDtoSchema } from './schema';

export type TestCaseDTO = z.infer<typeof TestCaseDtoSchema>;
export type CreateTestCaseDTO = z.infer<typeof CreateTestCaseDtoSchema>;
export type CreateTestCase = z.infer<typeof CreateTestCaseSchema>;

export type TestCase = {
  id: string;
  projectId: string;
  testSuiteId: string;
  caseKey: string;
  title: string;
  testType: string;
  tags: string[];
  preCondition: string;
  testSteps: string;
  expectedResult: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type TestCaseExecutionStatus = 'untested' | 'passed' | 'failed' | 'blocked';

export type TestCaseCardType = TestCase & {
  suiteTitle: string;
  status: TestCaseExecutionStatus;
  lastExecutedAt: Date | null;
};
