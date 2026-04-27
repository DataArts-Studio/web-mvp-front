'use client';

import React from 'react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal = ({ open, onClose }: KeyboardShortcutsModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-bg-2 border-line-2 w-96 rounded-2xl border p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-text-1 mb-4 text-lg font-semibold">키보드 단축키</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-2">Pass로 기록</span>
            <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">P</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-2">Fail로 기록</span>
            <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">F</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-2">Blocked로 기록</span>
            <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">B</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-2">Untested로 초기화</span>
            <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">U</kbd>
          </div>
          <div className="border-line-2 my-3 border-t" />
          <div className="flex items-center justify-between">
            <span className="text-text-2">다음 케이스</span>
            <div className="flex gap-1">
              <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">↓</kbd>
              <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">J</kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-2">이전 케이스</span>
            <div className="flex gap-1">
              <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">↑</kbd>
              <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">K</kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-2">단축키 도움말</span>
            <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">?</kbd>
          </div>
        </div>
        <button
          onClick={onClose}
          className="bg-primary mt-6 w-full rounded-lg py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
