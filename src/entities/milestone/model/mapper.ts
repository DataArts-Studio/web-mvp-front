import type { CreateMilestone, CreateMilestoneDTO, Milestone, MilestoneDTO } from './types';

export const toMilestone = (dto: MilestoneDTO): Milestone => ({
  id: dto.id,
  projectId: dto.project_id,
  title: dto.name,
  description: dto.description,
  startDate: dto.start_date,
  endDate: dto.end_date,
  status: dto.status,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
  deletedAt: dto.deleted_at,
});

export const toCreateMilestoneDTO = (m: CreateMilestone): CreateMilestoneDTO => ({
  project_id: m.projectId,
  name: m.title,
  description: m.description,
  start_date: m.startDate ?? null,
  end_date: m.endDate ?? null,
  status: 'planned',
});
