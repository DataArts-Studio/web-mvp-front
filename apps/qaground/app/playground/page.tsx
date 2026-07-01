import type { Metadata } from 'next';

import { PlaygroundListView } from '@/view/playground';

const DESCRIPTION =
  'qaground 플레이그라운드 목록. 제공된 웹사이트와 API를 자유롭게 호출하고 자동화하며 관찰하는 sandbox catalog입니다.';

export const metadata: Metadata = {
  title: '플레이그라운드',
  description: DESCRIPTION,
  alternates: { canonical: '/playground' },
  keywords: ['QA 플레이그라운드', 'Postman 연습', 'API 테스트 연습', 'qaground', '테스티아'],
  openGraph: {
    title: '플레이그라운드 | qaground',
    description: DESCRIPTION,
    url: 'https://qaground.gettestea.com/playground',
  },
};

export default function PlaygroundPage() {
  return <PlaygroundListView />;
}
