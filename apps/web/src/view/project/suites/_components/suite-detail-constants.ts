export const TAG_TONE_CONFIG: Record<string, { style: string }> = {
  neutral: { style: 'bg-slate-500/20 text-slate-300' },
  info: { style: 'bg-blue-500/20 text-blue-300' },
  success: { style: 'bg-green-500/20 text-green-300' },
  warning: { style: 'bg-amber-500/20 text-amber-300' },
  danger: { style: 'bg-red-500/20 text-red-300' },
};

export const RUN_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  passed: { label: 'Passed', style: 'bg-green-500/20 text-green-300' },
  failed: { label: 'Failed', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  running: { label: 'Running', style: 'bg-blue-500/20 text-blue-300' },
  not_run: { label: 'Not Run', style: 'bg-slate-500/20 text-slate-300' },
};

export const TEST_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pass: { label: 'Passed', style: 'bg-green-500/20 text-green-300' },
  fail: { label: 'Failed', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  untested: { label: 'Untested', style: 'bg-slate-500/20 text-slate-300' },
};
