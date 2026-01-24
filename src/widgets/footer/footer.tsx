import React from 'react';

import Link from 'next/link';
import { SEO } from '@/shared/constants';

const currentYear = new Date().getFullYear();
  const copyright = SEO.BRAND.COPYRIGHT.replace('testea.', `${currentYear} ${SEO.BRAND.NAME}.`);

export const Footer = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="사이트 정보"
      className="fixed right-0 bottom-0 left-0 border-t border-neutral-800 py-4 text-center text-xs text-neutral-500"
    >
      <span aria-label="저작권 정보">{copyright}</span>
      <span aria-hidden="true"> | </span>
      <nav aria-label="법적 정보 링크" className="inline">
        <Link
          href="/legal?tab=privacy"
          aria-label="개인정보 처리방침"
          className="ml-2 hover:text-teal-400"
        >
          Privacy
        </Link>
        <span aria-hidden="true"> | </span>
        <Link
          href="/legal?tab=terms"
          aria-label="이용약관"
          className="ml-2 hover:text-teal-400"
        >
          Terms
        </Link>
      </nav>
    </footer>
  );
};
