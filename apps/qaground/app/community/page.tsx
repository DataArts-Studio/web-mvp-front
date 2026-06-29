import type { Metadata } from 'next';

import { CommunityView } from '@/view/community';

export const metadata: Metadata = {
  title: '커뮤니티',
  description: 'qaground 문제풀이 질문과 풀이 노트를 공유합니다.',
};

export default function CommunityPage() {
  return <CommunityView />;
}
