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
      className="w-full border-t border-neutral-800 bg-bg-1 px-4 py-4 text-center text-xs text-neutral-500"
    >
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-0">
        <span aria-label="저작권 정보">{copyright}</span>
        <span aria-hidden="true" className="mx-2 hidden sm:inline"> | </span>
        <nav aria-label="사이트 링크" className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <Link
            href="/legal?tab=privacy"
            aria-label="개인정보 처리방침"
            className="hover:text-teal-400"
          >
            개인정보 처리방침
          </Link>
          <span aria-hidden="true" className="mx-1 sm:mx-2"> | </span>
          <Link
            href="/legal?tab=terms"
            aria-label="이용약관"
            className="hover:text-teal-400"
          >
            이용약관
          </Link>
          <span aria-hidden="true" className="mx-1 sm:mx-2"> | </span>
          <Link
            href="/team"
            aria-label="팀 소개"
            className="hover:text-teal-400"
          >
            팀 테스티아
          </Link>
        </nav>
      </div>
    </footer>
  );
};
