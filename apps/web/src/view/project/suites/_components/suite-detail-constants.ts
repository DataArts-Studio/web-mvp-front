export const TAG_TONE_CONFIG: Record<string, { style: string }> = {
  neutral: { style: 'border border-line-2 text-text-3' },
  info: { style: 'border border-blue-400/30 text-blue-300' },
  success: { style: 'border border-green-400/30 text-green-300' },
  warning: { style: 'border border-amber-400/30 text-amber-300' },
  danger: { style: 'border border-red-400/30 text-red-300' },
};

export const RUN_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  passed: { label: 'Passed', style: 'border border-green-400/30 text-green-300' },
  failed: { label: 'Failed', style: 'border border-red-400/30 text-red-300' },
  blocked: { label: 'Blocked', style: 'border border-amber-400/30 text-amber-300' },
  running: { label: 'Running', style: 'border border-blue-400/30 text-blue-300' },
  not_run: { label: 'Not Run', style: 'border border-line-2 text-text-3' },
};

export const TEST_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pass: { label: 'Passed', style: 'text-green-300' },
  fail: { label: 'Failed', style: 'text-red-300' },
  blocked: { label: 'Blocked', style: 'text-amber-300' },
  untested: { label: 'Untested', style: 'text-text-3' },
};
