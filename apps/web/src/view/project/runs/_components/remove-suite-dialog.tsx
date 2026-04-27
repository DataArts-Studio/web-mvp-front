'use client';

import React from 'react';
import { Dialog } from '@/shared/lib/primitives/dialog/dialog';
import { DSButton } from '@/shared/ui';

interface RemoveSuiteDialogProps {
  target: { id: string; name: string };
  isPending: boolean;
  onConfirm: (suiteId: string) => void;
  onClose: () => void;
}

export const RemoveSuiteDialog = ({
  target,
  isPending,
  onConfirm,
  onClose,
}: RemoveSuiteDialogProps) => {
  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="bg-bg-1 rounded-8 w-full max-w-md p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-text-1">
            스위트를 제거하시겠습니까?
          </Dialog.Title>
          <Dialog.Description className="text-text-3 mt-3 text-sm">
            <strong className="text-text-1">&quot;{target.name}&quot;</strong> 스위트와 해당 스위트에서 추가된 모든 테스트 케이스 실행 결과가 이 테스트 실행에서 제거됩니다.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <DSButton variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </DSButton>
            <DSButton
              variant="solid"
              className="bg-system-red hover:bg-system-red/90"
              onClick={() => onConfirm(target.id)}
              disabled={isPending}
            >
              {isPending ? '제거 중...' : '제거'}
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
