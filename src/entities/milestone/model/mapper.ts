import type { CreateMilestone, CreateMilestoneDTO, Milestone, MilestoneDTO } from './types';

const toDateString = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  return date;
};

export const toMilestone = (dto: MilestoneDTO): Milestone => ({
  id: dto.id,
  projectId: dto.project_id,
  title: dto.name,
  description: dto.description,
  startDate: dto.start_date ? new Date(dto.start_date) : null,
  endDate: dto.end_date ? new Date(dto.end_date) : null,
  progressStatus: dto.progress_status,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
  archivedAt: dto.archived_at,
  lifecycleStatus: dto.lifecycle_status,
});

export const toCreateMilestoneDTO = (m: CreateMilestone): CreateMilestoneDTO => ({
  project_id: m.projectId,
  name: m.title,
  description: m.description,
  start_date: toDateString(m.startDate),
  end_date: toDateString(m.endDate),
  progress_status: 'planned',
});
