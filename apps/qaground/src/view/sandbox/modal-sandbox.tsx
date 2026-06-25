'use client';

import { useState } from 'react';

/**
 * 모달/다이얼로그 샌드박스 (테스트 대상).
 * - 열기 → 모달 → 확인(결과 표시) 또는 취소(닫기).
 */
export const ModalSandbox = () => {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <h1 className="mb-5 text-xl font-bold">계정 삭제</h1>

        <button
          data-testid="modal-open"
          type="button"
          onClick={() => {
            setConfirmed(false);
            setOpen(true);
          }}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors"
        >
          계정 삭제 열기
        </button>

        {confirmed && (
          <p
            data-testid="modal-result"
            role="status"
            className="text-primary mt-5 text-sm font-medium"
          >
            계정이 삭제되었습니다.
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            data-testid="modal"
            role="dialog"
            aria-modal="true"
            className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-6"
          >
            <h2 className="text-base font-semibold">정말 삭제할까요?</h2>
            <p className="text-text-2 mt-2 text-sm">이 작업은 되돌릴 수 없습니다.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                data-testid="modal-cancel"
                type="button"
                onClick={() => setOpen(false)}
                className="border-line-3 rounded-button text-text-1 hover:bg-bg-3 h-button-md border px-4 text-sm transition-colors"
              >
                취소
              </button>
              <button
                data-testid="modal-confirm"
                type="button"
                onClick={() => {
                  setConfirmed(true);
                  setOpen(false);
                }}
                className="bg-system-red rounded-button h-button-md inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
