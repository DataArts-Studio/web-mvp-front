import type { Metadata } from 'next';

import { PostmanV1PlaygroundView } from '@/view/playground';

const DESCRIPTION =
  'Postman 형식 v1 플레이그라운드. 요청, 헤더, 본문, pm.test 스타일 검증 스크립트를 한 흐름으로 연습합니다.';

export const metadata: Metadata = {
  title: 'Postman 형식 v1',
  description: DESCRIPTION,
  alternates: { canonical: '/playground/postman-v1' },
  keywords: ['Postman 형식', 'pm.test', 'API 테스트', 'qaground 플레이그라운드', '테스티아'],
  openGraph: {
    title: 'Postman 형식 v1 | qaground',
    description: DESCRIPTION,
    url: 'https://qaground.gettestea.com/playground/postman-v1',
  },
};

export default function PostmanV1PlaygroundPage() {
  return <PostmanV1PlaygroundView />;
}
