import React from 'react';

import Link from 'next/link';
import { SEO } from '@/shared/constants';

const currentYear = new Date().getFullYear();
  const copyright = SEO.BRAND.COPYRIGHT.replace('testea.', `${currentYear} ${SEO.BRAND.NAME}.`);

export const Footer = () => {
  return (
    <footer className="fixed right-0 bottom-0 left-0 border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">
      {copyright} |
      <Link href="/legal?tab=privacy" className="ml-2 hover:text-teal-400">
        Privacy
      </Link>{' '}
      |
      <Link href="/legal?tab=terms" className="ml-2 hover:text-teal-400">
        Terms
      </Link>
    </footer>
  );
};
