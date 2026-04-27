'use client';

import { cn } from '@/shared/utils';
import type { DetectedFormat } from '../model/schema';

const FORMAT_LABELS: Record<Exclude<DetectedFormat, 'generic'>, string> = {
  testrail: 'TestRail',
  qase: 'Qase',
};

export function FormatBadge({
  format,
  className,
}: {
  format: DetectedFormat;
  className?: string;
}) {
  if (format === 'generic') return null;

  return (
    <span
      className={cn(
        'typo-caption1 rounded-1 inline-flex items-center gap-1 bg-green-500/10 px-2 py-0.5 text-green-400',
        className,
      )}
    >
      {FORMAT_LABELS[format]} 형식이 감지되어 자동 매핑되었습니다
    </span>
  );
}
