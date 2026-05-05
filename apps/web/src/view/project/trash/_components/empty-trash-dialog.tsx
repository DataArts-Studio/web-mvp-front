'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DSButton } from '@testea/ui';
import { Dialog } from '@testea/ui';

interface EmptyTrashDialogProps {
  itemCount: number;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EmptyTrashDialog({
  itemCount,
  isPending,
  onConfirm,
  onCancel,
}: EmptyTrashDialogProps) {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay onClick={() => !isPending && onCancel()} />
        <Dialog.Content className="bg-bg-2 border-line-2 rounded-4 w-full max-w-[420px] border p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <Dialog.Title className="typo-h2-heading text-text-1">
                휴지통 비우기
              </Dialog.Title>
              <Dialog.Description className="text-text-3 typo-body2-normal mt-1.5">
                휴지통의 모든 항목({itemCount}개)이 영구 삭제됩니다.
                <br />
                <span className="font-medium text-red-400">
                  이 작업은 되돌릴 수 없습니다.
                </span>
              </Dialog.Description>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <DSButton
              variant="ghost"
              size="small"
              onClick={onCancel}
              disabled={isPending}
            >
              취소
            </DSButton>
            <DSButton
              variant="text"
              size="small"
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '전체 영구 삭제'
              )}
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
