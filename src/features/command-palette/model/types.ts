import type { LucideIcon } from 'lucide-react';

export type CommandItemCategory = 'action' | 'testCase' | 'testSuite' | 'milestone' | 'testRun' | 'recent';

export type CommandItem = {
  id: string;
  category: CommandItemCategory;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  onSelect?: () => void;
};

export type RecentVisit = {
  type: 'testCase' | 'testSuite' | 'milestone' | 'testRun';
  id: string;
  title: string;
  path: string;
  visitedAt: number;
};
