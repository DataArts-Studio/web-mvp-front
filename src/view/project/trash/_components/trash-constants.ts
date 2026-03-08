import { FileText, FolderOpen, Flag } from 'lucide-react';
import type { TrashItemType } from '@/features/trash';

export const TYPE_CONFIG: Record<
  TrashItemType,
  { label: string; icon: typeof FileText; color: string; bgColor: string }
> = {
  case: {
    label: '테스트 케이스',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  suite: {
    label: '테스트 스위트',
    icon: FolderOpen,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  milestone: {
    label: '마일스톤',
    icon: Flag,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
};

export const FILTER_OPTIONS: { value: 'all' | TrashItemType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'case', label: '테스트 케이스' },
  { value: 'suite', label: '테스트 스위트' },
  { value: 'milestone', label: '마일스톤' },
];

export function formatDeletedDate(date: Date): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}
