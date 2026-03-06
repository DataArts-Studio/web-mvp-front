import { ReactNode } from 'react';
import { Container } from '@/shared/lib/primitives';
import { Aside } from '@/widgets/aside';
import { QueryProvider } from '@/app-shell/providers/query-provider';

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        {children}
      </Container>
    </QueryProvider>
  );
}
