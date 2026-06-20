import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { slugify } from '@testea/util';
import { readFile } from 'fs/promises';
import { join } from 'path';
import 'server-only';

import type { DocHeading } from './docs-view';

export type DocTab =
  | 'getting-started'
  | 'dashboard'
  | 'test-cases'
  | 'test-suites'
  | 'test-runs'
  | 'milestones';

const docFiles: Record<DocTab, string> = {
  'getting-started': 'getting-started.md',
  dashboard: 'dashboard.md',
  'test-cases': 'test-cases.md',
  'test-suites': 'test-suites.md',
  'test-runs': 'test-runs.md',
  milestones: 'milestones.md',
};

/** `/docs/[slug]` 로 정적 생성하는 슬러그 (getting-started 는 `/docs` 에 있으므로 제외). */
export const NESTED_DOC_SLUGS: Exclude<DocTab, 'getting-started'>[] = [
  'dashboard',
  'test-cases',
  'test-suites',
  'test-runs',
  'milestones',
];

export function isDocTab(value: string): value is DocTab {
  // `in` 은 프로토타입 체인까지 포함하므로 `toString` 등이 통과해 500 으로 샐 수 있다. 자체 키만 검사.
  return Object.prototype.hasOwnProperty.call(docFiles, value);
}

/** ko 는 content/docs/, 그 외 로케일은 content/docs/<locale>/. 번역본이 없으면 ko 로 폴백. */
export async function getMarkdownContent(filename: string, locale: string): Promise<string> {
  const localizedPath =
    locale === 'ko'
      ? join(process.cwd(), 'content', 'docs', filename)
      : join(process.cwd(), 'content', 'docs', locale, filename);
  try {
    return await readFile(localizedPath, 'utf-8');
  } catch (error) {
    // 파일 부재(ENOENT)만 ko 로 폴백한다. 권한·배포 오류까지 정상 안내문으로 숨기면
    // sitemap 에 실린 문서가 200 으로 깨진 콘텐츠를 노출하므로 그 외 오류는 그대로 드러낸다.
    const isMissingFile = (error as NodeJS.ErrnoException).code === 'ENOENT';
    if (locale !== 'ko' && isMissingFile) {
      return getMarkdownContent(filename, 'ko');
    }
    throw error;
  }
}

/** 슬러그에 해당하는 (로케일별 폴백 적용된) 마크다운 원문을 읽는다. */
export function getDocMarkdown(slug: DocTab, locale: string): Promise<string> {
  return getMarkdownContent(docFiles[slug], locale);
}

export function extractHeadings(markdown: string): DocHeading[] {
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

/**
 * 마크다운 본문에서 H1 다음 첫 일반 문단을 description 후보로 뽑아낸다.
 * 마크다운 강조 기호를 걷어내고 단일 라인으로 정리한다. 없으면 null.
 */
function extractFirstParagraph(markdown: string): string | null {
  const lines = markdown.split('\n');
  let sawH1 = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('# ')) {
      sawH1 = true;
      continue;
    }
    if (!sawH1) continue;
    if (line.startsWith('#') || line.startsWith('---') || line.startsWith('>')) continue;
    if (line.startsWith('-') || line.startsWith('*') || /^\d+\.\s/.test(line)) continue;
    if (line.startsWith('|')) continue;
    const cleaned = line
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크/이미지 텍스트만 남김
      .replace(/[*_`#>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned) return cleaned;
  }
  return null;
}

/**
 * 문서별 메타데이터. buildLocaleMetadata 와 동일한 canonical/hreflang/og 규칙을 따르되,
 * title 은 로케일 탭 라벨, description 은 해당 문서 첫 문단에서 만든다.
 */
export async function buildDocMetadata({
  slug,
  locale,
  markdown,
}: {
  slug: DocTab;
  locale: string;
  markdown: string;
}): Promise<Metadata> {
  const tDocs = await getTranslations({ locale, namespace: 'docs' });
  const tMeta = await getTranslations({ locale, namespace: 'meta.docs' });

  const path = slug === 'getting-started' ? '/docs' : `/docs/${slug}`;
  const enPath = `/en${path}`;

  const title = tDocs(`tabs.${slug}`);
  const description = extractFirstParagraph(markdown)?.slice(0, 160) ?? tMeta('description');

  return {
    title,
    description,
    alternates: {
      canonical: locale === 'ko' ? path : enPath,
      languages: {
        'ko-KR': path,
        'en-US': enPath,
        'x-default': path,
      },
    },
    openGraph: {
      title,
      description,
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
  };
}
