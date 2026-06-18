import { Metadata } from 'next';

import { DocsView } from '@/view';
import { buildDocMetadata, extractHeadings, getDocMarkdown } from '@/view/docs/docs-loader';
import { DocsMarkdownContent } from '@/view/docs/docs-markdown-content';

const SLUG = 'getting-started' as const;

interface DocsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { locale } = await params;
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
