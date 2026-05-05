import { FileText, FolderOpen, Play } from 'lucide-react';
import type { CommandItem } from './types';

export const getQuickActions = (projectSlug: string): CommandItem[] => [
  {
    id: 'action:create-tc',
    category: 'action',
    icon: FileText,
    title: '테스트 케이스 생성',
    href: `/projects/${projectSlug}/cases?create=true`,
  },
  {
    id: 'action:create-suite',
    category: 'action',
    icon: FolderOpen,
    title: '테스트 스위트 생성',
    href: `/projects/${projectSlug}/suites?create=true`,
  },
  {
    id: 'action:create-run',
    category: 'action',
    icon: Play,
    title: '테스트 실행 생성',
    href: `/projects/${projectSlug}/runs/create`,
  },
];
