'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/shared/utils';
import { Logo } from '@/shared/ui/logo';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { Footer } from '@/widgets/footer';

type TabType = 'privacy' | 'terms';

interface LegalViewProps {
  renderedContents: Record<TabType, ReactNode>;
  initialTab?: TabType;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'privacy', label: '개인정보 처리방침' },
  { id: 'terms', label: '이용약관' },
];

export function LegalView({ renderedContents, initialTab = 'privacy' }: LegalViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const content = renderedContents[activeTab];

  return (
    <Container className="flex min-h-screen w-full flex-col bg-bg-1 font-sans text-text-1">
      <MainContainer className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-16 pt-10">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-text-3 transition-colors hover:text-text-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="typo-label-normal">홈으로</span>
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <Logo className="mb-4 h-8 w-32" />
          <h1 className="typo-h1-heading text-text-1">법적 고지</h1>
          <p className="mt-2 typo-body2-normal text-text-2">
            서비스 이용에 관한 약관 및 정책을 확인하세요.
          </p>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-8 flex gap-2 border-b border-line-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative px-4 py-3 typo-label-heading transition-colors',
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-text-3 hover:text-text-2'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* 마크다운 컨텐츠 */}
        <article className="legal-content rounded-4 border border-line-2 bg-bg-2 p-8">
          {content}
        </article>
      </MainContainer>

      <Footer />
    </Container>
  );
}
