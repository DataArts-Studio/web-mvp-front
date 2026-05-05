import type { TestSuiteCard } from '@/entities/test-suite';
import { ListChecks, PlayCircle } from 'lucide-react';

type SuiteStatsSectionProps = {
  suite: TestSuiteCard;
};

export const SuiteStatsSection = ({ suite }: SuiteStatsSectionProps) => {
  const passedCount = suite.lastRun?.counts.passed ?? 0;
  const totalCount = suite.lastRun?.total ?? suite.caseCount;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <section className="col-span-6 grid grid-cols-4 gap-4">
      {/* 테스트 케이스 수 */}
      <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
        <div className="text-text-3 flex items-center gap-1.5 text-sm">
          <ListChecks className="h-4 w-4" strokeWidth={1.5} />
          <span>테스트 케이스</span>
        </div>
        <span className="text-text-1 text-2xl font-bold">{suite.caseCount}개</span>
      </div>

      {/* 테스트 실행 횟수 */}
      <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
        <div className="text-text-3 flex items-center gap-1.5 text-sm">
          <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
          <span>실행 이력</span>
        </div>
        <span className="text-text-1 text-2xl font-bold">{suite.executionHistoryCount}회</span>
      </div>

      {/* 통과율 */}
      <div className="bg-bg-2 border-line-2 rounded-4 col-span-2 border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-text-3 font-semibold">마지막 실행 통과율</h3>
          <span className="text-primary text-2xl font-bold">{passRate}%</span>
        </div>
        <div className="bg-bg-3 h-3 w-full rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${passRate}%` }}
          />
        </div>
        <p className="text-text-3 mt-2 text-sm">
          {passedCount} / {totalCount} 케이스 통과
        </p>
      </div>
    </section>
  );
};
