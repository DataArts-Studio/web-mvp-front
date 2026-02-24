import { z } from 'zod';
import {
  CreateTestCaseTemplateDtoSchema,
  TestCaseTemplateDtoSchema,
} from './schema';

export type TestCaseTemplateDTO = z.infer<typeof TestCaseTemplateDtoSchema>;
export type CreateTestCaseTemplateDTO = z.infer<typeof CreateTestCaseTemplateDtoSchema>;

export type TemplateCategory = 'BUILTIN' | 'CUSTOM';
export type LifecycleStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export type TestCaseTemplate = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  category: TemplateCategory;
  testType: string;
  defaultTags: string[];
  preCondition: string;
  testSteps: string;
  expectedResult: string;
  usageCount: number;
  sortOrder: number;
  lifecycleStatus: LifecycleStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTestCaseTemplate = {
  projectId: string;
  name: string;
  description?: string;
  testType?: string;
  defaultTags?: string[];
  preCondition?: string;
  testSteps?: string;
  expectedResult?: string;
  sortOrder?: number;
};

export type UpdateTestCaseTemplate = {
  id: string;
  name?: string;
  description?: string;
  testType?: string;
  defaultTags?: string[];
  preCondition?: string;
  testSteps?: string;
  expectedResult?: string;
  sortOrder?: number;
};
