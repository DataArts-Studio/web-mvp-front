import type { ChecklistStatus } from '@/shared/lib/db/schema/checklists';

export type ChecklistItem = {
  id: string;
  content: string;
  isChecked: boolean;
  sortOrder: number;
  checkedAt: string | null;
  createdAt: string;
};

export type Checklist = {
  id: string;
  projectId: string;
  title: string;
  status: ChecklistStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistWithItems = Checklist & {
  items: ChecklistItem[];
};

export type ChecklistWithProgress = Checklist & {
  totalItems: number;
  checkedItems: number;
};
