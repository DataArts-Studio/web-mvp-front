import type { Metadata } from 'next';

import { LandingView } from '@/view/landing';

export const metadata: Metadata = {
  title: 'qaground 미리보기 — QA 자동화 연습 플레이그라운드',
  description:
    'QA 엔지니어를 위한 자동화 테스트 연습 플레이그라운드와 채용 과제전형. 정식 랜딩 미리보기.',
};

export default function PreviewPage() {
  return <LandingView />;
}
