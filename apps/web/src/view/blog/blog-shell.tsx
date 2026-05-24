import type { ReactNode } from 'react';

import Link from 'next/link';

import { Footer } from '@/widgets/footer';
import { Logo } from '@testea/ui';

interface BlogShellProps {
  /** breadcrumb 두 번째 라벨 (예: '블로그', '소식·공지') */
  surfaceLabel: string;
  children: ReactNode;
}

/**
 * 블로그·소식 surface 공용 셸 (헤더 + 푸터).
 * docs view 의 헤더와 톤을 맞추되 사이드바·탭은 없다.
 */
export function BlogShell({ surfaceLabel, children }: BlogShellProps) {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-dvh flex-col font-sans">
      <header className="border-line-2 bg-bg-1/80 sticky top-0 z-10 shrink-0 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Logo className="h-5 w-20" />
          </Link>
          <span className="text-text-4">/</span>
          <span className="typo-label-heading text-text-2">{surfaceLabel}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">{children}</main>

      <Footer />
    </div>
  );
}
