'use client';

import React from 'react';
import { Dialog } from '@testea/ui';
import { DSButton } from '@testea/ui';
import { useRollback } from '../hooks/use-rollback';

interface RollbackConfirmDialogProps {
  testCaseId: string;
  targetVersionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const RollbackConfirmDialog = ({
  testCaseId,
  targetVersionNumber,
  onClose,
  onSuccess,
}: RollbackConfirmDialogProps) => {
  const { mutate, isPending } = useRollback();

  const handleConfirm = () => {
    mutate(
      { testCaseId, targetVersionNumber },
      {
        onSuccess: (result) => {
          if (result.success) {
            onSuccess();
          }
        },
      }
    );
  };

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="bg-bg-1 rounded-8 w-full max-w-md p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold">
            v{targetVersionNumber}으로 복원하시겠습니까?
          </Dialog.Title>
          <Dialog.Description className="text-text-3 mt-3 text-sm">
            현재 테스트케이스 내용이 새로운 버전으로 기록된 후, v{targetVersionNumber} 시점의 내용으로 복원됩니다.
            이 작업은 되돌릴 수 있습니다.
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <DSButton variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </DSButton>
            <DSButton onClick={handleConfirm} disabled={isPending}>
              {isPending ? '복원 중...' : '복원'}
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
