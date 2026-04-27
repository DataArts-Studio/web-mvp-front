'use client';

import React from 'react';

export const CommandFooter = () => {
  return (
    <div className="flex items-center gap-4 border-t border-line-1 px-4 py-2">
      <span className="flex items-center gap-1 typo-label-normal text-text-4">
        <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">↑↓</kbd>
        이동
      </span>
      <span className="flex items-center gap-1 typo-label-normal text-text-4">
        <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">↵</kbd>
        선택
      </span>
      <span className="flex items-center gap-1 typo-label-normal text-text-4">
        <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">ESC</kbd>
        닫기
      </span>
      <span className="flex items-center gap-1 typo-label-normal text-text-4 ml-auto">
        <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">&gt;</kbd>
        액션 모드
      </span>
    </div>
  );
};
