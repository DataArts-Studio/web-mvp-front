import type { Metadata } from 'next';

import { PlaygroundListView } from '@/view/playground';

const DESCRIPTION =
  'qaground 플레이그라운드 목록. Postman 형식 v1부터 실제 API 요청과 응답 검증을 브라우저에서 연습합니다.';

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
