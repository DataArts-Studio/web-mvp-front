import { MainContainer } from '../primitives';

export const ProjectErrorFallback = () => (
  <MainContainer className="flex flex-1 items-center justify-center">
    <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
  </MainContainer>
);
