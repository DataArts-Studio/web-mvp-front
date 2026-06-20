import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DocsView } from '@/view';
import {
  NESTED_DOC_SLUGS,
  buildDocMetadata,
  extractHeadings,
  getDocMarkdown,
  isDocTab,
} from '@/view/docs/docs-loader';
import { DocsMarkdownContent } from '@/view/docs/docs-markdown-content';

interface DocsSlugPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// getting-started 는 `/docs` 에 있으므로 중첩 라우트에서는 제외.
export function generateStaticParams() {
  return NESTED_DOC_SLUGS.map((slug) => ({ slug }));
}

export default async function DocsSlugPage({ params }: DocsSlugPageProps) {
  const { locale, slug } = await params;
  if (!isDocTab(slug) || slug === 'getting-started') {
    notFound();
  }
  const markdown = await getDocMarkdown(slug, locale);

  return (
    <DocsView
      content={<DocsMarkdownContent content={markdown} />}
      headings={extractHeadings(markdown)}
      activeSlug={slug}
    />
  );
}

export async function generateMetadata({ params }: DocsSlugPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isDocTab(slug) || slug === 'getting-started') {
    notFound();
  }
  const markdown = await getDocMarkdown(slug, locale);
  return buildDocMetadata({ slug, locale, markdown });
}
