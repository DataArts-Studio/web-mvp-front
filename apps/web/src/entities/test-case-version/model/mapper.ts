import type { ChangeType, TestCaseVersion, TestCaseVersionSummary } from './types';
import type { TestCaseVersionDTO } from './schema';

const toDate = (v: string | Date): Date => (v instanceof Date ? v : new Date(v));

export const toTestCaseVersion = (dto: TestCaseVersionDTO): TestCaseVersion => {
  return {
    id: dto.id,
    testCaseId: dto.test_case_id,
    versionNumber: dto.version_number,
    name: dto.name,
    testType: dto.test_type ?? '',
    tags: (dto.tags as string[]) ?? [],
    preCondition: dto.pre_condition ?? '',
    steps: dto.steps ?? '',
    expectedResult: dto.expected_result ?? '',
    changeSummary: dto.change_summary ?? '',
    changeType: dto.change_type as ChangeType,
    changedFields: (dto.changed_fields as string[]) ?? [],
    createdAt: toDate(dto.created_at),
  };
};

export const toTestCaseVersionSummary = (dto: TestCaseVersionDTO): TestCaseVersionSummary => {
  return {
    id: dto.id,
    testCaseId: dto.test_case_id,
    versionNumber: dto.version_number,
    changeSummary: dto.change_summary ?? '',
    changeType: dto.change_type as ChangeType,
    changedFields: (dto.changed_fields as string[]) ?? [],
    createdAt: toDate(dto.created_at),
  };
};
