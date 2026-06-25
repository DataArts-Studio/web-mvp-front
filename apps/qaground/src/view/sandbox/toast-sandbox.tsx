'use client';

import { useState } from 'react';

/**
 * 토스트 자동 소멸 샌드박스 (테스트 대상).
 * - 버튼을 누르면 토스트가 나타나고 2초 후 자동으로 사라진다.
 *   나타남과 사라짐을 모두 적절히 대기해 검증하는 연습.
 */
export const ToastSandbox = () => {
  const [show, setShow] = useState(false);

  const trigger = () => {
    setShow(true);
    setTimeout(() => setShow(false), 2000);
  };

  return (
    <main className="bg-bg-1 text-text-1 relative flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <button
        data-testid="show-toast"
        onClick={trigger}
        className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
      >
        저장하기
      </button>
      {show && (
        <div
          data-testid="toast"
          role="status"
          className="border-line-2 bg-bg-2 text-text-1 fixed bottom-8 left-1/2 -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-lg"
        >
          저장되었습니다.
        </div>
      )}
    </main>
  );
};
