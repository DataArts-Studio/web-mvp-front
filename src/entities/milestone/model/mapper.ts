import type { CreateMilestone, CreateMilestoneDTO, Milestone, MilestoneDTO } from './types';

export const toMilestone = (dto: MilestoneDTO): Milestone => ({
  id: dto.id,
  projectId: dto.project_id,
  title: dto.name,
  description: dto.description,
  startDate: dto.start_date,
  endDate: dto.end_date,
  status: dto.status,
  createdAt: dto.create_at,
  updatedAt: dto.update_at,
  deletedAt: dto.delete_at,
});

export const toCreateMilestoneDTO = (m: CreateMilestone): CreateMilestoneDTO => ({
  project_id: m.projectId,
  name: m.name,
  description: m.description,
  start_date: m.startDate,
  end_date: m.endDate,
  status: m.status,
});
