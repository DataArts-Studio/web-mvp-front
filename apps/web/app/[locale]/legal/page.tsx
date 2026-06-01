import type { ReactNode } from 'react';

import { Metadata } from 'next';

import { buildLocaleMetadata } from '@/i18n/metadata';
import { LegalView } from '@/view/legal';
import { LegalMarkdownContent, slugify } from '@/view/legal/legal-markdown-content';
import type { LegalHeading } from '@/view/legal/legal-markdown-content';
import { readFile } from 'fs/promises';
import { join } from 'path';

type TabType = 'privacy' | 'terms';

interface LegalPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tab?: TabType;
  }>;
}

async function getMarkdownContent(filename: string, locale: string): Promise<string> {
  // ko 는 content/legal/, 그 외 로케일은 content/legal/<locale>/. 번역본이 없으면 ko 로 폴백.
  // (법적 고지 영어판은 법무 검토 후 추가 예정 → 현재 en 은 ko 로 폴백)
  const localizedPath =
    locale === 'ko'
      ? join(process.cwd(), 'content', 'legal', filename)
      : join(process.cwd(), 'content', 'legal', locale, filename);
  try {
    return await readFile(localizedPath, 'utf-8');
  } catch {
    if (locale !== 'ko') {
      return getMarkdownContent(filename, 'ko');
    }
    throw new Error(`legal content not found: ${filename}`);
  }
}

function extractHeadings(markdown: string): LegalHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: LegalHeading[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = slugify(text);
    headings.push({ id, text, level });
  }
  return headings;
}

export default async function LegalPage({ params, searchParams }: LegalPageProps) {
  const { locale } = await params;
  const { tab } = await searchParams;

  const [privacyContent, termsContent] = await Promise.all([
    getMarkdownContent('privacy.md', locale),
    getMarkdownContent('terms.md', locale),
  ]);

  const renderedContents: Record<TabType, ReactNode> = {
    privacy: <LegalMarkdownContent content={privacyContent} />,
    terms: <LegalMarkdownContent content={termsContent} />,
  };

  const headings: Record<TabType, LegalHeading[]> = {
    privacy: extractHeadings(privacyContent),
    terms: extractHeadings(termsContent),
  };

  return (
    <LegalView
      renderedContents={renderedContents}
      headings={headings}
      initialTab={tab === 'terms' ? 'terms' : 'privacy'}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocaleMetadata({
    locale,
    namespace: 'meta.legal',
    path: '/legal',
    extra: { robots: { index: false, follow: true } },
  });
}
