import { TeamView } from '@/view/team';

export default function TeamPage() {
  return <TeamView />;
}

export const metadata = {
  title: '팀 소개 | Testea',
  description: '테스티아를 만드는 사람들을 소개합니다. 더 쉽고 즐거운 테스트 관리를 위해 노력하고 있어요.',
  alternates: {
    canonical: '/team',
  },
};
