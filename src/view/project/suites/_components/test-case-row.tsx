import type { TestCaseCardType } from '@/entities/test-case';
import { cn } from '@/shared/utils';
import { TEST_STATUS_CONFIG } from './suite-detail-constants';

type TestCaseRowProps = {
  testCase: TestCaseCardType;
  onSelect: (id: string) => void;
};

export const TestCaseRow = ({ testCase, onSelect }: TestCaseRowProps) => {
  const statusConfig = TEST_STATUS_CONFIG[testCase.resultStatus] ?? TEST_STATUS_CONFIG.untested;

  return (
    <button
      key={testCase.id}
      type="button"
      className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
      onClick={() => onSelect(testCase.id)}
    >
      <div className="flex items-center gap-3">
        <span className="text-primary font-mono text-sm">{testCase.caseKey}</span>
        <span className="text-text-1">{testCase.title}</span>
        <div className="flex gap-1">
          {testCase.tags.slice(0, 2).map((tag: string) => (
            <span key={tag} className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs">{tag}</span>
          ))}
        </div>
      </div>
      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig.style)}>
        {statusConfig.label}
      </span>
    </button>
  );
};
