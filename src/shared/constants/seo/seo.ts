interface SiteInfo {
  TITLE: string;
  DESCRIPTION: string;
  URL: string;
  OGIMAGE: string;
}

const SITE: SiteInfo = {
  TITLE: 'testea',
  DESCRIPTION: '테스트케이스를 쉽고 빠르게 작성하고 관리할 수 있는 테스트 관리 도구',
  URL: 'https://testea.app',
  OGIMAGE: '/og-default.png',
};

const BRAND = {
  NAME: 'testea',
  SLOGAN: '테스트케이스 작성을 더 빠르게',
  COPYRIGHT: '© testea. All rights reserved.',
};

const METADATA = {
  OG: {
    TYPE: 'website',
    LOCALE: 'ko_KR',
    SITE_NAME: 'testea',
  },
  TWITTER: {
    CARD: 'summary_large_image',
    SITE: '@testea',
    CREATOR: '@testea',
  },
  KEYWORDS: [
    '테스트케이스',
    '테스트 관리',
    'QA',
    '테스트 문서',
    '테스트 시나리오',
    'test management',
    'software testing',
  ],
};

export const SEO = {
  SITE,
  BRAND,
  METADATA,
};
