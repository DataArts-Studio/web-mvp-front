import type { TestSuiteCard } from '@/entities/test-suite';
import { cn } from '@testea/util';
import { formatDateTime } from '@testea/util';
import { RUN_STATUS_CONFIG } from './suite-detail-constants';

type SuiteLastRunSectionProps = {
  lastRun: NonNullable<TestSuiteCard['lastRun']>;
};

export const SuiteLastRunSection = ({ lastRun }: SuiteLastRunSectionProps) => {
  return (
    <section className="col-span-6">
      <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-text-1 font-semibold">마지막 실행</h3>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              RUN_STATUS_CONFIG[lastRun.status]?.style ?? RUN_STATUS_CONFIG.not_run.style
            )}
          >
            {RUN_STATUS_CONFIG[lastRun.status]?.label ?? lastRun.status}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-text-3 text-sm">실행 일시</p>
            <p className="text-text-1 font-medium">{formatDateTime(lastRun.runAt)}</p>
          </div>
          <div>
            <p className="text-text-3 text-sm">Passed</p>
            <p className="font-medium text-green-400">{lastRun.counts.passed}</p>
          </div>
          <div>
            <p className="text-text-3 text-sm">Failed</p>
            <p className="font-medium text-red-400">{lastRun.counts.failed}</p>
          </div>
          <div>
            <p className="text-text-3 text-sm">Blocked</p>
            <p className="font-medium text-amber-400">{lastRun.counts.blocked}</p>
          </div>
          <div>
            <p className="text-text-3 text-sm">Skipped</p>
            <p className="text-text-2 font-medium">{lastRun.counts.skipped}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
