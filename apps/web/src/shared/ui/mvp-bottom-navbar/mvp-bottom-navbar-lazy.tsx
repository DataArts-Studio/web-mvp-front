'use client';

import dynamic from 'next/dynamic';

const MvpBottomNavbar = dynamic(
  () => import('@/shared/ui/mvp-bottom-navbar').then(m => ({ default: m.MvpBottomNavbar })),
  { ssr: false }
);

export function MvpBottomNavbarLazy() {
  return <MvpBottomNavbar />;
}
