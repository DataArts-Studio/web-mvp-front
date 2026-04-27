import React from 'react';







export const ProjectHeader = () => {
  return (
    <header className="flex w-full flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2 text-left">
        <p className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          실시간 테스트 실행 현황
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">프로젝트 대시보드</h1>
        <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          테스트 케이스, 실행 성공률, 이슈 현황을 한 페이지에서 빠르게 확인하세요.
        </p>
      </div>
    </header>
  );
};
