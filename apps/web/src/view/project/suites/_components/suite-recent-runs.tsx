import type { TestSuiteCard } from '@/entities/test-suite';
import { EmptyState } from '@testea/ui';
import { cn } from '@/shared/utils';
import { formatDateTime } from '@/shared/utils/date-format';
import { PlayCircle } from 'lucide-react';
import { RUN_STATUS_CONFIG } from './suite-detail-constants';

type SuiteRecentRunsProps = {
  recentRuns: TestSuiteCard['recentRuns'];
};

export const SuiteRecentRuns = ({ recentRuns }: SuiteRecentRunsProps) => {
  return (
    <section className="col-span-6 flex flex-col gap-4">
      <h2 className="typo-h2-heading">최근 실행 이력</h2>

      {recentRuns.length === 0 ? (
        <div className="bg-bg-2 border-line-2 rounded-4 border-2 border-dashed">
          <EmptyState
            icon={<PlayCircle className="h-8 w-8" />}
            title="테스트 실행 이력이 없습니다."
            description="스위트 기반 테스트 실행을 생성하세요."
          />
        </div>
      ) : (
        <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
          {recentRuns.map((run) => {
            const runStatusConfig = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.not_run;
            const runPassRate = run.total > 0 ? Math.round((run.passed / run.total) * 100) : 0;
            return (
              <div
                key={run.runId}
                className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      runStatusConfig.style
                    )}
                  >
                    {runStatusConfig.label}
                  </span>
                  <span className="text-text-2">{formatDateTime(run.runAt)}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400">{run.passed} passed</span>
                    <span className="text-red-400">{run.failed} failed</span>
                    <span className="text-amber-400">{run.blocked} blocked</span>
                  </div>
                  <div className="w-20">
                    <div className="bg-bg-3 h-2 w-full rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${runPassRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-text-3 w-12 text-right text-sm">{runPassRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
