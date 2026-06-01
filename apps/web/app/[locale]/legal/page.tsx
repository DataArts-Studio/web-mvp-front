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
  searchParams: Promise<{
    tab?: TabType;
  }>;
}

async function getMarkdownContent(filename: string): Promise<string> {
  const filePath = join(process.cwd(), 'content', 'legal', filename);
  const content = await readFile(filePath, 'utf-8');
  return content;
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

export default async function LegalPage({ searchParams }: LegalPageProps) {
  const { tab } = await searchParams;

  const [privacyContent, termsContent] = await Promise.all([
    getMarkdownContent('privacy.md'),
    getMarkdownContent('terms.md'),
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
