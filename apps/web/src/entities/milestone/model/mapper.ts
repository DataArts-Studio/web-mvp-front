import { normalizeDateOnly } from '@/shared/lib/date-only';

import type { CreateMilestone, CreateMilestoneDTO, Milestone, MilestoneDTO } from './types';

export const toMilestone = (dto: MilestoneDTO): Milestone => ({
  id: dto.id,
  projectId: dto.project_id,
  title: dto.name,
  description: dto.description,
  startDate: normalizeDateOnly(dto.start_date),
  endDate: normalizeDateOnly(dto.end_date),
  progressStatus: dto.progress_status,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
  archivedAt: dto.archived_at,
  lifecycleStatus: dto.lifecycle_status,
  // 실행 집계는 query 레이어에서 계산해 override 한다. 매퍼 단독으로는 null.
  lastExecutedAt: null,
});

export const toCreateMilestoneDTO = (m: CreateMilestone): CreateMilestoneDTO => ({
  project_id: m.projectId,
  name: m.title,
  description: m.description,
  start_date: m.startDate ?? null,
  end_date: m.endDate ?? null,
  progress_status: 'planned',
});
