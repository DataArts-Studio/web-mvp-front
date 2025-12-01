import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

export const GlobalHeader = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-10 flex h-16 items-center justify-between px-6">
      <div className="flex items-center space-x-2 text-xl font-bold text-teal-400">
        <Image src="/next.svg" alt="Testeo Logo" width={20} height={20} className="invert" />
        <span>Testea</span>
      </div>
      {/* 테스트용 임시 메뉴 */}
      <div>
        <Link href="/projects/p-name">프로젝트 대시보드</Link>
      </div>
      {/* 임시 상태 표시등 (와이어프레임 오른쪽 상단) */}
      <div className="h-4 w-4 rounded-full bg-green-500 shadow-md shadow-green-500/50"></div>
    </header>
  );
};
