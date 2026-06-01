'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import { Link } from '@/i18n/navigation';
import { Footer } from '@/widgets/footer';
import { Logo } from '@testea/ui';
import { cn } from '@testea/util';
import {
  BookOpen,
  ChevronLeft,
  Flag,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Play,
  TestTube,
  X,
} from 'lucide-react';

type DocTab =
  | 'getting-started'
  | 'dashboard'
  | 'test-cases'
  | 'test-suites'
  | 'test-runs'
  | 'milestones';

export type DocHeading = { id: string; text: string; level: 2 | 3 };

interface DocsViewProps {
  renderedContents: Record<DocTab, ReactNode>;
  headings: Record<DocTab, DocHeading[]>;
  initialTab?: DocTab;
}

const docTabs: { id: DocTab; icon: React.ReactNode }[] = [
  { id: 'getting-started', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'test-cases', icon: <TestTube className="h-4 w-4" /> },
  { id: 'test-suites', icon: <FolderKanban className="h-4 w-4" /> },
  { id: 'test-runs', icon: <Play className="h-4 w-4" /> },
  { id: 'milestones', icon: <Flag className="h-4 w-4" /> },
];

export function DocsView({
  renderedContents,
  headings,
  initialTab = 'getting-started',
}: DocsViewProps) {
  const t = useTranslations('docs');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as DocTab | null;
  const activeTab: DocTab = tabParam || initialTab;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const content = renderedContents[activeTab] || renderedContents['getting-started'];
  const currentHeadings = headings[activeTab] || [];

  const handleTabChange = (tab: DocTab) => {
    setIsSidebarOpen(false);
    router.push(`/docs?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-dvh flex-col font-sans">
      {/* ====== 상단 헤더 (sticky) ====== */}
      <header className="border-line-2 bg-bg-1/80 sticky top-0 z-10 shrink-0 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Logo className="h-5 w-20" />
          </Link>
          <span className="text-text-4">/</span>
          <span className="typo-label-heading text-text-2">{t('headerLabel')}</span>

          <div className="flex-1" />

          <Link
            href="/"
            className="rounded-4 text-text-3 hover:bg-bg-3 hover:text-text-1 typo-caption-normal hidden items-center gap-1 px-3 py-1.5 transition-colors lg:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t('backHome')}
          </Link>

          {/* 모바일 메뉴 토글 */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-4 text-text-3 hover:bg-bg-3 flex items-center justify-center p-2 transition-colors lg:hidden"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ====== 3컬럼 본문 영역 ====== */}
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* 왼쪽 사이드바 (sticky) */}
        <aside
          className={cn(
            'bg-bg-2 lg:border-line-2 fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto px-4 pt-20 pb-6 shadow-lg transition-transform lg:sticky lg:top-14 lg:z-auto lg:block lg:h-[calc(100dvh-3.5rem)] lg:w-56 lg:shrink-0 lg:transform-none lg:border-r lg:bg-transparent lg:px-4 lg:py-8 lg:shadow-none',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <p className="typo-caption-heading text-text-3 mb-3 px-3 tracking-[0.18em] uppercase">
            {t('sidebarHeading')}
          </p>
          <nav className="flex flex-col gap-1">
            {docTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'rounded-4 typo-label-normal flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
                )}
              >
                {tab.icon}
                {t(`tabs.${tab.id}`)}
              </button>
            ))}
          </nav>
        </aside>

        {/* 오버레이 (모바일) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 메인 컨텐츠 */}
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
          <article className="docs-content mx-auto max-w-3xl">{content}</article>
        </main>

        {/* 오른쪽 목차 사이드바 (sticky) */}
        {currentHeadings.length > 0 && (
          <aside className="hidden w-52 shrink-0 xl:block">
            <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto px-4 py-8">
              <p className="typo-caption-heading text-text-3 mb-3 tracking-[0.18em] uppercase">
                {t('tocHeading')}
              </p>
              <nav className="flex flex-col gap-0.5">
                {currentHeadings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={cn(
                      'rounded-3 typo-caption-normal block px-3 py-1.5 transition-colors',
                      heading.level === 2
                        ? 'text-text-2 hover:bg-bg-3 hover:text-text-1'
                        : 'text-text-3 hover:bg-bg-3 hover:text-text-2 pl-6'
                    )}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>

      {/* ====== 푸터 ====== */}
      <Footer />
    </div>
  );
}
