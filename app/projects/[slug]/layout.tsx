import { ReactNode } from 'react';
import { Container } from '@/shared/lib/primitives';
import { Aside } from '@/widgets/aside';

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
      {children}
    </Container>
  );
}
