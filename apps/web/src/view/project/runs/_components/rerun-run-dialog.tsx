'use client';

import React from 'react';

import { Dialog } from '@testea/ui';
import { DSButton } from '@testea/ui';

interface RerunRunDialogProps {
  runName: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RerunRunDialog = ({
  runName,
  isPending,
  onConfirm,
  onCancel,
}: RerunRunDialogProps) => (
  <Dialog.Root
    defaultOpen
    onOpenChange={(open) => {
      if (!open) onCancel();
    }}
  >
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content className="bg-bg-1 rounded-8 w-full max-w-md p-6 shadow-xl">
        <Dialog.Title className="text-text-1 text-lg font-semibold">
          이 실행을 다시 실행하시겠습니까?
        </Dialog.Title>
        <Dialog.Description className="text-text-3 mt-3 text-sm">
          <strong className="text-text-1">&quot;{runName}&quot;</strong>과(와) 동일한 구성으로 새
          테스트 실행을 생성합니다. 케이스 결과는 모두 미실행으로 초기화되며, 원본 실행은 그대로
          유지됩니다.
        </Dialog.Description>
        <div className="mt-6 flex justify-end gap-3">
          <DSButton variant="ghost" onClick={onCancel} disabled={isPending}>
            취소
          </DSButton>
          <DSButton variant="solid" onClick={onConfirm} disabled={isPending}>
            {isPending ? '생성 중...' : '다시 실행'}
          </DSButton>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
