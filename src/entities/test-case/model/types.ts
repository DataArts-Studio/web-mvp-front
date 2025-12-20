import { z } from 'zod';

import { CreateTestCaseSchema, TestCaseSchema } from './schema';

export type TestCaseDTO = z.infer<typeof TestCaseSchema>;
export type CreateTestCaseDTO = z.infer<typeof CreateTestCaseSchema>;

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

export type CreateTestCase = {
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
};

export type TestCaseExecutionStatus = 'untested' | 'passed' | 'failed' | 'blocked';

export type TestCaseCardType = TestCase & {
  suiteTitle: string;
  status: TestCaseExecutionStatus;
  lastExecutedAt: Date | null;
};
