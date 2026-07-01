import type { Metadata } from 'next';

import { PostmanV1PlaygroundView } from '@/view/playground';

const DESCRIPTION =
  'Postman 형식 API Sandbox v1. qaground가 제공하는 데모 API를 자유롭게 호출하고 응답을 관찰하는 플레이그라운드입니다.';

export const metadata: Metadata = {
  title: 'Postman 형식 API Sandbox v1',
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
