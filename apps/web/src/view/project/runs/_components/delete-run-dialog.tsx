'use client';

import React from 'react';
import { Dialog } from '@/shared/lib/primitives/dialog/dialog';
import { DSButton } from '@/shared/ui';
import { type ITestRun } from './runs-list-constants';

interface DeleteRunDialogProps {
  deleteTarget: ITestRun;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteRunDialog = ({ deleteTarget, isPending, onConfirm, onCancel }: DeleteRunDialogProps) => (
  <Dialog.Root defaultOpen onOpenChange={(open) => { if (!open) onCancel(); }}>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content className="bg-bg-1 rounded-8 w-full max-w-md p-6 shadow-xl">
        <Dialog.Title className="text-lg font-semibold text-text-1">
          테스트 실행을 삭제하시겠습니까?
        </Dialog.Title>
        <Dialog.Description className="text-text-3 mt-3 text-sm">
          <strong className="text-text-1">&quot;{deleteTarget.name}&quot;</strong>과(와) 관련된 모든 테스트 케이스 실행 결과가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </Dialog.Description>
        <div className="mt-6 flex justify-end gap-3">
          <DSButton variant="ghost" onClick={onCancel} disabled={isPending}>
            취소
          </DSButton>
          <DSButton
            variant="solid"
            className="bg-system-red hover:bg-system-red/90"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? '삭제 중...' : '삭제'}
          </DSButton>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
