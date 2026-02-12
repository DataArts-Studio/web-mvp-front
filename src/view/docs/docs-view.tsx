'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, BookOpen, TestTube, FolderKanban, Play, Flag, Menu, X } from 'lucide-react';

import { cn } from '@/shared/utils';
import { Logo } from '@/shared/ui/logo';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { Footer } from '@/widgets/footer';

type DocTab = 'getting-started' | 'test-cases' | 'test-suites' | 'test-runs' | 'milestones';

interface DocsViewProps {
  renderedContents: Record<DocTab, ReactNode>;
  initialTab?: DocTab;
}

const docTabs: { id: DocTab; label: string; icon: React.ReactNode }[] = [
  { id: 'getting-started', label: '시작하기', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'test-cases', label: '테스트 케이스', icon: <TestTube className="h-4 w-4" /> },
  { id: 'test-suites', label: '테스트 스위트', icon: <FolderKanban className="h-4 w-4" /> },
  { id: 'test-runs', label: '테스트 실행', icon: <Play className="h-4 w-4" /> },
  { id: 'milestones', label: '마일스톤', icon: <Flag className="h-4 w-4" /> },
];

export function DocsView({ renderedContents, initialTab = 'getting-started' }: DocsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as DocTab | null;
  const [activeTab, setActiveTab] = useState<DocTab>(tabParam || initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const content = renderedContents[activeTab] || renderedContents['getting-started'];

  const handleTabChange = (tab: DocTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    router.push(`/docs?tab=${tab}`, { scroll: false });
  };

  return (
    <Container className="flex min-h-screen w-full flex-col bg-bg-1 font-sans text-text-1">
      <MainContainer className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-16 pt-10">
        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg lg:hidden"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div className="flex w-full gap-8">
          {/* 사이드바 */}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-40 w-64 transform bg-bg-2 p-6 shadow-lg transition-transform lg:relative lg:inset-auto lg:z-auto lg:w-56 lg:shrink-0 lg:transform-none lg:bg-transparent lg:p-0 lg:shadow-none',
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
              'pt-24 lg:pt-0'
            )}
          >
            {/* 뒤로가기 */}
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1 text-text-3 transition-colors hover:text-text-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="typo-label-normal">홈으로</span>
            </Link>

            {/* 로고 */}
            <div className="mb-6">
              <Logo className="mb-2 h-6 w-24" />
              <h1 className="typo-h3-heading text-text-1">사용 가이드</h1>
            </div>

            {/* 네비게이션 */}
            <nav className="space-y-1">
              {docTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-4 px-3 py-2.5 text-left transition-colors typo-label-normal',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-2 hover:bg-bg-3 hover:text-text-1'
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
          <main className="min-w-0 flex-1">
            <article className="docs-content rounded-4 border border-line-2 bg-bg-2 p-6 lg:p-8">
              {content}
            </article>
          </main>
        </div>
      </MainContainer>

      <Footer />
    </Container>
  );
}
