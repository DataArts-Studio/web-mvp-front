'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/shared/utils';
import { Logo } from '@/shared/ui/logo';
import { Footer } from '@/widgets/footer';
import { ChevronLeft, Shield, FileText, Menu, X } from 'lucide-react';
import type { LegalHeading } from './legal-markdown-content';

type TabType = 'privacy' | 'terms';

interface LegalViewProps {
  renderedContents: Record<TabType, ReactNode>;
  headings: Record<TabType, LegalHeading[]>;
  initialTab?: TabType;
}

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'privacy', label: '개인정보 처리방침', icon: <Shield className="h-4 w-4" /> },
  { id: 'terms', label: '이용약관', icon: <FileText className="h-4 w-4" /> },
];

export function LegalView({ renderedContents, headings, initialTab = 'privacy' }: LegalViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const activeTab: TabType = tabParam || initialTab;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const content = renderedContents[activeTab];
  const currentHeadings = headings[activeTab] || [];

  const handleTabChange = (tab: TabType) => {
    setIsSidebarOpen(false);
    router.push(`/legal?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg-1 font-sans text-text-1">
      {/* ====== 상단 헤더 (sticky) ====== */}
      <header className="sticky top-0 z-10 shrink-0 border-b border-line-2 bg-bg-1/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Logo className="h-5 w-20" />
          </Link>
          <span className="text-text-4">/</span>
          <span className="typo-label-heading text-text-2">법적 고지</span>

          <div className="flex-1" />

          <Link
            href="/"
            className="hidden items-center gap-1 rounded-4 px-3 py-1.5 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1 typo-caption-normal lg:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            홈으로
          </Link>

          {/* 모바일 메뉴 토글 */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center rounded-4 p-2 text-text-3 transition-colors hover:bg-bg-3 lg:hidden"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ====== 3컬럼 본문 영역 ====== */}
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* 왼쪽 사이드바 */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-bg-2 px-4 pb-6 pt-20 shadow-lg transition-transform lg:sticky lg:top-14 lg:z-auto lg:block lg:h-[calc(100dvh-3.5rem)] lg:w-56 lg:shrink-0 lg:transform-none lg:border-r lg:border-line-2 lg:bg-transparent lg:px-4 lg:py-8 lg:shadow-none',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <p className="mb-3 px-3 typo-caption-heading uppercase tracking-[0.18em] text-text-3">
            문서
          </p>
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-4 px-3 py-2.5 text-left transition-colors typo-label-normal cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
                )}
              >
                {tab.icon}
                {tab.label}
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
          <article className="legal-content mx-auto max-w-3xl">
            <p className="mb-8 typo-body2-normal text-text-3">
              서비스 이용에 관한 약관 및 정책을 확인하세요.
            </p>
            {content}
          </article>
        </main>

        {/* 오른쪽 목차 사이드바 (sticky) */}
        {currentHeadings.length > 0 && (
          <aside className="hidden w-52 shrink-0 xl:block">
            <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto px-4 py-8">
              <p className="mb-3 typo-caption-heading uppercase tracking-[0.18em] text-text-3">
                목차
              </p>
              <nav className="flex flex-col gap-0.5">
                {currentHeadings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={cn(
                      'block rounded-3 px-3 py-1.5 transition-colors typo-caption-normal',
                      heading.level === 2
                        ? 'text-text-2 hover:bg-bg-3 hover:text-text-1'
                        : 'pl-6 text-text-3 hover:bg-bg-3 hover:text-text-2'
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
