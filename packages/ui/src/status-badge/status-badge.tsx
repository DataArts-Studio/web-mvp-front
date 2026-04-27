import { cn } from '../utils';

export interface StatusBadgeConfig {
  label: string;
  style: string;
}

interface StatusBadgeProps {
  config: StatusBadgeConfig;
  className?: string;
}

export const StatusBadge = ({ config, className }: StatusBadgeProps) => (
  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', config.style, className)}>
    {config.label}
  </span>
);

// --- Test Case Result Status ---
export const TEST_RESULT_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  pass: { label: 'Pass', style: 'bg-green-500/20 text-green-300' },
  fail: { label: 'Fail', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  untested: { label: 'Untested', style: 'bg-slate-500/20 text-slate-300' },
};

// --- Test Run Status ---
export const RUN_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  NOT_STARTED: { label: 'Not Started', style: 'bg-slate-500/20 text-slate-300' },
  IN_PROGRESS: { label: 'In Progress', style: 'bg-blue-500/20 text-blue-300' },
  COMPLETED: { label: 'Completed', style: 'bg-green-500/20 text-green-300' },
};

// --- Milestone Progress Status ---
export const MILESTONE_STATUS_CONFIG: Record<string, StatusBadgeConfig> = {
  inProgress: { label: '진행 중', style: 'bg-amber-500/20 text-amber-300' },
  done: { label: '완료', style: 'bg-green-500/20 text-green-300' },
  planned: { label: '예정', style: 'bg-slate-500/20 text-slate-300' },
};
