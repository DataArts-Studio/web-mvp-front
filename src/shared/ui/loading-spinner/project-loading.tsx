import { Container, MainContainer } from '@/shared/lib/primitives';
import { Aside } from '@/widgets';
import { LoadingSpinner } from './loading-spinner';

export const ProjectLoading = () => (
  <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
    <Aside />
    <MainContainer className="flex flex-1 items-center justify-center">
      <LoadingSpinner size="lg" />
    </MainContainer>
  </Container>
);
