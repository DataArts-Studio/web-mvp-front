'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/shared/utils';
import { Logo } from '@/shared/ui/logo';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { Footer } from '@/widgets/footer';
import { GlobalHeader, useBetaBanner } from '@/widgets/global-header';

type TabType = 'privacy' | 'terms';

interface LegalViewProps {
  privacyContent: string;
  termsContent: string;
  initialTab?: TabType;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'privacy', label: '개인정보 처리방침' },
  { id: 'terms', label: '이용약관' },
];

export function LegalView({ privacyContent, termsContent, initialTab = 'privacy' }: LegalViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { isVisible: isBannerVisible } = useBetaBanner();

  const content = activeTab === 'privacy' ? privacyContent : termsContent;

  return (
    <Container className="flex min-h-screen w-full flex-col bg-bg-1 font-sans text-text-1">
      <GlobalHeader />

      <MainContainer
        className={cn(
          'mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-16 transition-[padding-top] duration-200',
          isBannerVisible ? 'pt-26' : 'pt-20'
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-6 border-b border-line-2 pb-4 typo-h1-heading text-text-1">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-4 mt-8 typo-h2-heading text-text-1">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-3 mt-6 typo-h3-heading text-text-1">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 typo-body2-normal text-text-2 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 ml-6 list-disc space-y-2 text-text-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 ml-6 list-decimal space-y-2 text-text-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="typo-body2-normal">{children}</li>
              ),
              table: ({ children }) => (
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full border-collapse border border-line-2 typo-body2-normal">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-bg-3">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-line-2 px-4 py-2 text-left text-text-1">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-line-2 px-4 py-2 text-text-2">{children}</td>
              ),
              hr: () => <hr className="my-8 border-line-2" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-text-1">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="rounded bg-bg-3 px-1.5 py-0.5 typo-caption-normal text-primary">
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-primary pl-4 italic text-text-3">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </MainContainer>

      <Footer />
    </Container>
  );
}
