import { ReactNode } from 'react';

import { QueryProvider } from '@/app-shell/providers/query-provider';
import { CommandPalette } from '@/features/command-palette';
import { RouteLoadingProvider } from '@/shared/lib/route-loading';
import { Aside } from '@/widgets/aside';
import { Container } from '@testea/ui';

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <RouteLoadingProvider>
        <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
          <Aside />
          {children}
          <CommandPalette />
        </Container>
      </RouteLoadingProvider>
    </QueryProvider>
  );
}
