'use client';

import { useState } from 'react';

/**
 * 드래그앤드롭 샌드박스 (테스트 대상).
 * - HTML5 네이티브 DnD. 위젯을 드롭존으로 끌어다 놓으면 배치된다.
 */
export const DndSandbox = () => {
  const [dropped, setDropped] = useState(false);
  const [over, setOver] = useState(false);

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <h1 className="mb-6 text-xl font-bold">위젯 배치</h1>

        {!dropped && (
          <div
            data-testid="drag-item"
            draggable
            onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
              e.dataTransfer.setData('text/plain', 'payment-widget');
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="border-line-3 bg-bg-3 mb-6 inline-flex cursor-grab items-center rounded-xl border px-4 py-3 text-sm active:cursor-grabbing"
          >
            결제 위젯
          </div>
        )}

        <div
          data-testid="drop-zone"
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOver(false);
            setDropped(true);
          }}
          className={[
            'flex min-h-28 items-center justify-center rounded-xl border-2 border-dashed px-4 text-sm transition-colors',
            over ? 'border-primary bg-primary/10' : 'border-line-3 text-text-3',
          ].join(' ')}
        >
          {dropped ? (
            <span data-testid="drop-result" className="text-primary font-medium">
              결제 위젯이 배치되었습니다.
            </span>
          ) : (
            '여기에 위젯을 끌어다 놓으세요'
          )}
        </div>
      </div>
    </main>
  );
};
