import { ReactNode } from 'react';
import { QueryProvider } from '@/app-shell/providers/query-provider';

export default function DevLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
