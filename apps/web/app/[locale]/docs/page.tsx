import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DocsView } from '@/view';
import { DocsMarkdownContent, slugify } from '@/view/docs/docs-markdown-content';
import type { DocHeading } from '@/view/docs/docs-view';
import { readFile } from 'fs/promises';
import { join } from 'path';

type DocTab =
  | 'getting-started'
  | 'dashboard'
  | 'test-cases'
  | 'test-suites'
  | 'test-runs'
  | 'milestones';

interface DocsPageProps {
  searchParams: Promise<{
    tab?: DocTab;
  }>;
}

const docFiles: Record<DocTab, string> = {
  'getting-started': 'getting-started.md',
  dashboard: 'dashboard.md',
  'test-cases': 'test-cases.md',
  'test-suites': 'test-suites.md',
  'test-runs': 'test-runs.md',
  milestones: 'milestones.md',
};

async function getMarkdownContent(filename: string): Promise<string> {
  const filePath = join(process.cwd(), 'content', 'docs', filename);
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch {
    return '# 문서를 찾을 수 없습니다\n\n요청한 문서가 존재하지 않습니다.';
  }
}

function extractHeadings(markdown: string): DocHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: DocHeading[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = slugify(text);
    headings.push({ id, text, level });
  }
  return headings;
}

async function getAllContents(): Promise<Record<DocTab, string>> {
  const entries = await Promise.all(
    Object.entries(docFiles).map(async ([key, filename]) => {
      const content = await getMarkdownContent(filename);
      return [key, content] as [DocTab, string];
    })
  );
  return Object.fromEntries(entries) as Record<DocTab, string>;
}

export default async function DocsPage({ searchParams }: DocsPageProps) {
  const { tab } = await searchParams;
  const contents = await getAllContents();

  const validTab = tab && tab in docFiles ? tab : 'getting-started';

  const renderedContents = Object.fromEntries(
    Object.entries(contents).map(([key, md]) => [
      key,
      <DocsMarkdownContent key={key} content={md} />,
    ])
  ) as Record<DocTab, ReactNode>;

  const headings = Object.fromEntries(
    Object.entries(contents).map(([key, md]) => [key, extractHeadings(md)])
  ) as Record<DocTab, DocHeading[]>;

  return (
    <Suspense fallback={<div className="bg-bg-1 min-h-screen" />}>
      <DocsView renderedContents={renderedContents} headings={headings} initialTab={validTab} />
    </Suspense>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.docs' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === 'ko' ? '/docs' : '/en/docs',
      languages: {
        'ko-KR': '/docs',
        'en-US': '/en/docs',
        'x-default': '/docs',
      },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
  };
}
