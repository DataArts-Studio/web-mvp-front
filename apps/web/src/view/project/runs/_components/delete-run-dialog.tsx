'use client';

import React from 'react';

import { Dialog } from '@testea/ui';
import { DSButton } from '@testea/ui';

import { type ITestRun } from './runs-list-constants';

interface DeleteRunDialogProps {
  targets: ITestRun[];
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteRunDialog = ({
  targets,
  isPending,
  onConfirm,
  onCancel,
}: DeleteRunDialogProps) => (
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
          {targets.length === 1
            ? '테스트 실행을 휴지통으로 옮길까요?'
            : `테스트 실행 ${targets.length}개를 휴지통으로 옮길까요?`}
        </Dialog.Title>
        <Dialog.Description className="text-text-3 mt-3 text-sm">
          {targets.length === 1 ? (
            <>
              <strong className="text-text-1">&quot;{targets[0].name}&quot;</strong> 실행
            </>
          ) : (
            '선택한 실행'
          )}
          과 기록된 결과가 휴지통으로 이동하며 30일 안에 복원할 수 있습니다.
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
            {isPending ? '옮기는 중...' : '휴지통으로'}
          </DSButton>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
