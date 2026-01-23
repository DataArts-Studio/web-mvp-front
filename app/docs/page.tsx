import { readFile } from 'fs/promises';
import { join } from 'path';
import { Suspense } from 'react';

import { DocsView } from '@/view';

type DocTab = 'getting-started' | 'test-cases' | 'test-suites' | 'test-runs' | 'milestones';

interface DocsPageProps {
  searchParams: Promise<{
    tab?: DocTab;
  }>;
}

const docFiles: Record<DocTab, string> = {
  'getting-started': 'getting-started.md',
  'test-cases': 'test-cases.md',
  'test-suites': 'test-suites.md',
  'test-runs': 'test-runs.md',
  'milestones': 'milestones.md',
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

  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-1" />}>
      <DocsView contents={contents} initialTab={validTab} />
    </Suspense>
  );
}

export const metadata = {
  title: '사용 가이드 | Testea',
  description: 'Testea 사용 가이드 - 테스트 케이스 관리, 테스트 실행, 마일스톤 관리 방법을 안내합니다.',
};
