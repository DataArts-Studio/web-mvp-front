import Link from 'next/link';

import { IssueReportButton } from './issue-report-button';

export const PlaygroundHeader = ({
  containerClassName = 'max-w-5xl',
}: {
  /** 내부 컨테이너 max-width. 상세 페이지는 콘텐츠 폭에 맞춘다(자동화=full, 매뉴얼=6xl 등). */
  containerClassName?: string;
} = {}) => {
  return (
    <header className="border-line-2 bg-bg-1/80 sticky top-0 z-50 border-b backdrop-blur">
      <div
        className={`mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 ${containerClassName}`}
      >
        <Link href="/" className="text-lg font-bold tracking-tight">
          qa<span className="text-primary">ground</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/learn" className="text-text-2 hover:text-text-1 text-sm transition-colors">
            학습 경로
          </Link>
          <Link href="/guide" className="text-text-2 hover:text-text-1 text-sm transition-colors">
            가이드
          </Link>
          <Link
            href="/challenges"
            className="text-text-2 hover:text-text-1 text-sm transition-colors"
          >
            챌린지
          </Link>
          <IssueReportButton />
        </div>
      </div>
    </header>
  );
};
