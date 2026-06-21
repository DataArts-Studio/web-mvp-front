import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DocsView } from '@/view';
import {
  buildDocMetadata,
  extractHeadings,
  getDocMarkdown,
  isDocTab,
} from '@/view/docs/docs-loader';
import { DocsMarkdownContent } from '@/view/docs/docs-markdown-content';

const SLUG = 'getting-started' as const;

interface DocsPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function DocsPage({ params, searchParams }: DocsPageProps) {
  const { locale } = await params;

  // 레거시 `/docs?tab=<slug>` 딥링크를 새 경로 기반 라우트로 영속 보존한다.
  const { tab } = (await searchParams) ?? {};
  if (tab && isDocTab(tab) && tab !== SLUG) {
    redirect(locale === 'ko' ? `/docs/${tab}` : `/en/docs/${tab}`);
  }

  const markdown = await getDocMarkdown(SLUG, locale);

  return (
    <DocsView
      content={<DocsMarkdownContent content={markdown} />}
      headings={extractHeadings(markdown)}
      activeSlug={SLUG}
    />
  );
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const markdown = await getDocMarkdown(SLUG, locale);
  return buildDocMetadata({ slug: SLUG, locale, markdown });
}
