import type { Metadata } from 'next';
import { ProjectDashboardView } from '@/view';

export const metadata: Metadata = {
  title: '대시보드',
  description: '프로젝트 대시보드에서 테스트 현황, 케이스, 스위트를 한눈에 확인하세요.',
};

const ProjectDashboardRoute = () => {
  return <ProjectDashboardView />;
};

export default ProjectDashboardRoute;
