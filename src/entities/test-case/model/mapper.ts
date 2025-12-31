import type { CreateTestCase, CreateTestCaseDTO, TestCase, TestCaseDTO } from './types';







const toDate = (v: string | Date): Date => (v instanceof Date ? v : new Date(v));

export const toTestCase = (dto: TestCaseDTO): TestCase => {
  if (!dto.project_id) {
    throw new Error('Invalid TestCase row');
  }

  return {
    id: dto.id,
    projectId: dto.project_id,
    testSuiteId: dto.test_suite_id ?? '',
    caseKey: dto.case_key ?? '',
    title: dto.name,
    testType: dto.test_type ?? '',
    tags: dto.tags ?? [],
    preCondition: dto.pre_condition ?? '',
    testSteps: dto.steps ?? '',
    expectedResult: dto.expected_result ?? '',
    sortOrder: dto.sort_order ?? 0,
    createdAt: toDate(dto.created_at),
    updatedAt: toDate(dto.updated_at),
    deletedAt: dto.deleted_at ? toDate(dto.deleted_at) : null,
  };
};

export const toCreateTestCase = (dto: CreateTestCaseDTO): CreateTestCase => {
  return {
    projectId: dto.project_id,
    testSuiteId: dto.test_suite_id || null,
    caseKey: dto.case_key,
    title: dto.name,
    testType: dto.test_type ?? '',
    tags: dto.tags ?? [],
    preCondition: dto.pre_condition ?? '',
    testSteps: dto.steps ?? '',
    expectedResult: dto.expected_result ?? '',
    sortOrder: dto.sort_order ?? 0,
  };
};

export const toTestCaseDto = (domain: TestCase): TestCaseDTO => {
  return {
    id: domain.id,
    project_id: domain.projectId,
    test_suite_id: domain.testSuiteId,
    case_key: domain.caseKey,
    name: domain.title,
    test_type: domain.testType,
    tags: domain.tags,
    pre_condition: domain.preCondition,
    steps: domain.testSteps,
    expected_result: domain.expectedResult,
    sort_order: domain.sortOrder,
    created_at: domain.createdAt,
    updated_at: domain.updatedAt,
    deleted_at: domain.deletedAt,
  };
};

export const toCreateTestCaseDTO = (domain: CreateTestCase): CreateTestCaseDTO => {
  return {
    project_id: domain.projectId,
    test_suite_id: domain.testSuiteId || null,
    case_key: `TC-${Date.now()}`,
    name: domain.title,
    test_type: 'untested',
    tags: domain.tags ?? [],
    pre_condition: domain.preCondition ?? '',
    steps: domain.testSteps ?? '',
    expected_result: domain.expectedResult ?? '',
    sort_order: domain.sortOrder ?? 0,
  };
};
