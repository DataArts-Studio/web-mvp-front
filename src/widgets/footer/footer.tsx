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
      className="w-full border-t border-neutral-800 bg-bg-1 py-4 text-center text-xs text-neutral-500"
    >
      <span aria-label="저작권 정보">{copyright}</span>
      <span aria-hidden="true" className="mx-2"> | </span>
      <nav aria-label="사이트 링크" className="inline">
        <Link
          href="/legal?tab=privacy"
          aria-label="개인정보 처리방침"
          className="hover:text-teal-400"
        >
          개인정보 처리방침
        </Link>
        <span aria-hidden="true" className="mx-2"> | </span>
        <Link
          href="/legal?tab=terms"
          aria-label="이용약관"
          className="hover:text-teal-400"
        >
          이용약관
        </Link>
        <span aria-hidden="true" className="mx-2"> | </span>
        <Link
          href="/team"
          aria-label="팀 소개"
          className="hover:text-teal-400"
        >
          팀 테스티아
        </Link>
      </nav>
    </footer>
  );
};
