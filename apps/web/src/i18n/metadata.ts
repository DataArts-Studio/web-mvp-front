import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * 마케팅 page 들의 로케일별 메타데이터를 일관되게 만든다.
 *
 * canonical/hreflang 규칙(ko 무접두, en은 /en 접두)과 og:locale 분기를 한곳에 모아,
 * 페이지마다 같은 로직을 복붙하지 않도록 한다. title/description/og 텍스트는 메시지
 * 카탈로그의 `namespace`(예: meta.landing)에서 읽는다.
 *
 * @param path ko 기준 경로. 랜딩은 '/', 그 외는 '/docs' 등.
 * @param extra robots 등 페이지별 추가 메타데이터(마지막에 병합).
 */
export async function buildLocaleMetadata({
  locale,
  namespace,
  path,
  extra,
}: {
  locale: string;
  namespace: string;
  path: string;
  extra?: Metadata;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  const enPath = path === '/' ? '/en' : `/en${path}`;

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === 'ko' ? path : enPath,
      languages: {
        'ko-KR': path,
        'en-US': enPath,
        'x-default': path,
      },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
    ...extra,
  };
}
