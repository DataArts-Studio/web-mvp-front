import { readFile } from 'fs/promises';
import { join } from 'path';

import { LegalView } from '@/view/legal';
import { LegalMarkdownContent } from '@/view/legal/legal-markdown-content';

interface LegalPageProps {
  searchParams: Promise<{
    tab?: 'privacy' | 'terms';
  }>;
}

async function getMarkdownContent(filename: string): Promise<string> {
  const filePath = join(process.cwd(), 'content', 'legal', filename);
  const content = await readFile(filePath, 'utf-8');
  return content;
}

export default async function LegalPage({ searchParams }: LegalPageProps) {
  const { tab } = await searchParams;

  const [privacyContent, termsContent] = await Promise.all([
    getMarkdownContent('privacy.md'),
    getMarkdownContent('terms.md'),
  ]);

  const renderedContents = {
    privacy: <LegalMarkdownContent content={privacyContent} />,
    terms: <LegalMarkdownContent content={termsContent} />,
  };

  return (
    <LegalView
      renderedContents={renderedContents}
      initialTab={tab === 'terms' ? 'terms' : 'privacy'}
    />
  );
}

export const metadata = {
  title: '법적 고지',
  description: 'Testea 개인정보 처리방침 및 서비스 이용약관을 확인하세요.',
  alternates: {
    canonical: '/legal',
  },
  robots: {
    index: false,
    follow: true,
  },
};
