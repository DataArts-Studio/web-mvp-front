import { z } from 'zod';
import {
  CreateTestCaseDtoSchema,
  TestCaseDtoSchema,
} from './schema';
import type { LifecycleStatus, TestCaseResultStatus } from '@/shared/types';

export type { LifecycleStatus, TestCaseResultStatus } from '@/shared/types';

export type TestCaseDTO = z.infer<typeof TestCaseDtoSchema>;
export type CreateTestCaseDTO = z.infer<typeof CreateTestCaseDtoSchema>;

export type TestCase = {
  id: string;
  projectId: string;
  testSuiteId?: string;
  sectionId?: string | null;
  displayId: number;
  caseKey: string;
  title: string;
  testType: string;
  tags: string[];
  preCondition: string;
  testSteps: string;
  expectedResult: string;
  sortOrder: number;
  resultStatus: TestCaseResultStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  lifecycleStatus: LifecycleStatus;
};

export type CreateTestCase = {
  projectId: string;
  title: string;
  testSuiteId?: string;
  sectionId?: string | null;
  caseKey?: string;
  testType?: string;
  tags?: string[];
  preCondition?: string;
  testSteps?: string;
  expectedResult?: string;
  sortOrder?: number;
};

/** 목록 조회용 경량 타입 (steps, pre_condition, expected_result 제외) */
export type TestCaseListItem = Omit<TestCase, 'preCondition' | 'testSteps' | 'expectedResult'>;

export type TestCaseCardType = TestCaseListItem & {
  status: TestCaseResultStatus;
  lastExecutedAt: Date | null;
  suiteTitle: string;
  isOptimistic?: boolean;
};
