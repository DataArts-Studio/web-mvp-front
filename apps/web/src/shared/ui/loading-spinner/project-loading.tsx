import { MainContainer } from '@/shared/lib/primitives';
import { LoadingSpinner } from './loading-spinner';

export const ProjectLoading = () => (
  <MainContainer className="flex flex-1 items-center justify-center">
    <LoadingSpinner size="lg" />
  </MainContainer>
);
