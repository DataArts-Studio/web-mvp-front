import { z } from 'zod';
import type { TestSuite } from './types';
import { TestSuiteDtoSchema, CreateTestSuiteDtoSchema } from './schema';

type TestSuiteDTO = z.infer<typeof TestSuiteDtoSchema>;
type CreateTestSuiteDTO = z.infer<typeof CreateTestSuiteDtoSchema>;

export type CreateTestSuite = {
  projectId: string;
  title: string;
  description?: string;
  sortOrder?: number;
};

export const toTestSuite = (dto: TestSuiteDTO): TestSuite => {
  return {
    id: dto.id,
    projectId: dto.project_id,
    title: dto.name,
    description: dto.description ?? undefined,
    sortOrder: dto.sort_order,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    archivedAt: dto.archived_at,
    lifecycleStatus: dto.lifecycle_status,
  };
};

export const toTestSuiteDTO = (domain: TestSuite): TestSuiteDTO => {
  return {
    id: domain.id,
    project_id: domain.projectId,
    name: domain.title,
    description: domain.description,
    sort_order: domain.sortOrder,
    created_at: domain.createdAt,
    updated_at: domain.updatedAt,
    archived_at: domain.archivedAt,
    lifecycle_status: domain.lifecycleStatus,
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
