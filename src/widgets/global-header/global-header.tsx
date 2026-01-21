'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProjectSearchModal } from '@/features/project-search';

export const GlobalHeader = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-10 flex h-16 items-center justify-between bg-bg-1/80 px-12 backdrop-blur-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-teal-400">
          <Image src="/logo.svg" alt="Testea Logo" width={120} height={28} />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            href="/docs"
            className="text-body2 text-text-2 transition-colors hover:text-primary"
          >
            Docs
          </Link>
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="text-body2 text-text-2 transition-colors hover:text-primary cursor-pointer"
          >
            내 프로젝트 찾기
          </button>
        </nav>
      </header>

      {/* Modals */}
      <ProjectSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};
