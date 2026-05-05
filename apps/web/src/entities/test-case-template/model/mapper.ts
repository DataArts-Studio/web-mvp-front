import type { CreateTestCaseTemplate, CreateTestCaseTemplateDTO, TestCaseTemplate, TestCaseTemplateDTO } from './types';

const toDate = (v: string | Date): Date => (v instanceof Date ? v : new Date(v));

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const toTestCaseTemplate = (dto: TestCaseTemplateDTO): TestCaseTemplate => {
  return {
    id: dto.id,
    projectId: dto.project_id ?? '',
    name: dto.name,
    description: dto.description ?? '',
    category: dto.category,
    testType: dto.test_type ?? '',
    defaultTags: parseTags(dto.default_tags),
    preCondition: dto.pre_condition ?? '',
    testSteps: dto.test_steps ?? '',
    expectedResult: dto.expected_result ?? '',
    usageCount: dto.usage_count,
    sortOrder: dto.sort_order ?? 0,
    lifecycleStatus: dto.lifecycle_status,
    createdAt: toDate(dto.created_at),
    updatedAt: toDate(dto.updated_at),
  };
};

export const toTestCaseTemplateDto = (domain: TestCaseTemplate): TestCaseTemplateDTO => {
  return {
    id: domain.id,
    project_id: domain.projectId || null,
    name: domain.name,
    description: domain.description,
    category: domain.category,
    test_type: domain.testType,
    default_tags: JSON.stringify(domain.defaultTags),
    pre_condition: domain.preCondition,
    test_steps: domain.testSteps,
    expected_result: domain.expectedResult,
    usage_count: domain.usageCount,
    sort_order: domain.sortOrder,
    created_at: domain.createdAt,
    updated_at: domain.updatedAt,
    lifecycle_status: domain.lifecycleStatus,
  };
};

export const toCreateTemplateDTO = (domain: CreateTestCaseTemplate): CreateTestCaseTemplateDTO => {
  return {
    project_id: domain.projectId || null,
    name: domain.name,
    description: domain.description ?? '',
    test_type: domain.testType ?? '',
    default_tags: JSON.stringify(domain.defaultTags ?? []),
    pre_condition: domain.preCondition ?? '',
    test_steps: domain.testSteps ?? '',
    expected_result: domain.expectedResult ?? '',
    sort_order: domain.sortOrder ?? 0,
  };
};
