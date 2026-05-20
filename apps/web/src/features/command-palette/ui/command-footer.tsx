'use client';

import React from 'react';

export const CommandFooter = () => {
  return (
    <div className="border-line-1 flex items-center gap-4 border-t px-4 py-2">
      <span className="typo-label-normal text-text-4 flex items-center gap-1">
        <kbd className="rounded-1 border-line-2 bg-bg-3 border px-1 py-0.5 text-[10px]">↑↓</kbd>
        이동
      </span>
      <span className="typo-label-normal text-text-4 flex items-center gap-1">
        <kbd className="rounded-1 border-line-2 bg-bg-3 border px-1 py-0.5 text-[10px]">↵</kbd>
        선택
      </span>
      <span className="typo-label-normal text-text-4 flex items-center gap-1">
        <kbd className="rounded-1 border-line-2 bg-bg-3 border px-1 py-0.5 text-[10px]">ESC</kbd>
        닫기
      </span>
      <span className="typo-label-normal text-text-4 ml-auto flex items-center gap-1">
        <kbd className="rounded-1 border-line-2 bg-bg-3 border px-1 py-0.5 text-[10px]">&gt;</kbd>
        액션 모드
      </span>
    </div>
  );
};
