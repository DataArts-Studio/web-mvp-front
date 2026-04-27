'use client';

import dynamic from 'next/dynamic';

const Toaster = dynamic(
  () => import('sonner').then(mod => ({ default: mod.Toaster })),
  { ssr: false }
);

export const LazyToaster = () => <Toaster position="top-right" richColors closeButton />;
