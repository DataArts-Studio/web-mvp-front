import type { TestSuiteDTO, CreateTestSuiteDTO, TestSuite, CreateTestSuite } from './types';

const toDate = (v: string | Date): Date => (v instanceof Date ? v : new Date(v));

export const toTestSuite = (dto: TestSuiteDTO): TestSuite => {
  return {
    id: dto.id,
    projectId: dto.project_id,
    title: dto.name,
    description: dto.description ?? undefined,
    sortOrder: dto.sort_order,
    createdAt: dto.create_at,
    updatedAt: dto.update_at,
    deletedAt: dto.delete_at,
  };
};

export const toCreateTestSuite = (dto: CreateTestSuiteDTO): CreateTestSuite => {
  return {
    projectId: dto.project_id,
    title: dto.name,
    description: dto.description ?? undefined,
    sortOrder: dto.sort_order,
  };
};

export const toTestSuiteDTO = (domain: TestSuite): TestSuiteDTO => {
  return {
    id: domain.id,
    project_id: domain.projectId,
    name: domain.title,
    description: domain.description,
    sort_order: domain.sortOrder,
    create_at: domain.createdAt,
    update_at: domain.updatedAt,
    delete_at: domain.deletedAt,
  };
};

export const toCreateTestSuiteDTO = (domain: CreateTestSuite): CreateTestSuiteDTO => {
  return {
    project_id: domain.projectId,
    name: domain.title,
    description: domain.description,
    sort_order: domain.sortOrder ?? 0,
  };
};