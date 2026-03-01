import React, { useState } from 'react';

import { useArchive } from '@/features/archive/hooks/use-archive';
import { ArchiveTargetType } from '@/features/archive/model/types';
import { DSButton } from '@/shared';
import { Dialog } from '@/shared/lib/primitives';
import { Loader2, Trash2 } from 'lucide-react';
import { track, TESTCASE_EVENTS, TESTSUITE_EVENTS, MILESTONE_EVENTS } from '@/shared/lib/analytics';

const TARGET_LABEL: Record<ArchiveTargetType, string> = {
  project: '프로젝트',
  milestone: '마일스톤',
  suite: '테스트 스위트',
  case: '테스트 케이스',
};

interface ArchiveButtonProps {
  targetType: ArchiveTargetType;
  targetId: string;
  btnType?: 'text' | 'icon';
  onSuccess?: () => void;
}

export const ArchiveButton = ({ targetType, targetId, btnType = 'text', onSuccess }: ArchiveButtonProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const archive = useArchive({
    onSuccess: () => {
      setIsConfirmOpen(false);
      onSuccess?.();
    },
    onError: (_error, variables) => {
      setIsConfirmOpen(false);
      const failEventMap = {
        case: TESTCASE_EVENTS.DELETE_FAIL,
        suite: TESTSUITE_EVENTS.DELETE_FAIL,
        milestone: MILESTONE_EVENTS.DELETE_FAIL,
      } as const;
      const eventName = failEventMap[variables.targetType as keyof typeof failEventMap];
      if (eventName) {
        track(eventName, { target_id: variables.targetId, target_type: variables.targetType });
      }
    },
  });

  const handleConfirm = () => {
    const eventMap = {
      case: TESTCASE_EVENTS.DELETE,
      suite: TESTSUITE_EVENTS.DELETE,
      milestone: MILESTONE_EVENTS.DELETE,
    } as const;
    const eventName = eventMap[targetType as keyof typeof eventMap];
    if (eventName) {
      track(eventName, { target_id: targetId, target_type: targetType });
    }
    archive.mutate({ targetType, targetId });
  };

  const label = TARGET_LABEL[targetType] ?? '항목';

  return (
    <>
      <DSButton
        variant="text"
        className="flex items-center gap-2 text-red-400"
        onClick={() => setIsConfirmOpen(true)}
        disabled={archive.isPending}
      >
        {archive.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {btnType === 'text' && (archive.isPending ? '삭제 중...' : '삭제')}
      </DSButton>

      {isConfirmOpen && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay onClick={() => !archive.isPending && setIsConfirmOpen(false)} />
            <Dialog.Content className="bg-bg-2 border-line-2 rounded-4 w-full max-w-[400px] border p-6">
              <Dialog.Title className="typo-h2-heading text-text-1">
                {label} 삭제
              </Dialog.Title>
              <Dialog.Description className="text-text-3 typo-body2-normal mt-2">
                정말 이 {label}을(를) 삭제하시겠습니까?<br />
                삭제된 데이터는 복구할 수 없습니다.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <DSButton
                  variant="ghost"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={archive.isPending}
                >
                  취소
                </DSButton>
                <DSButton
                  variant="text"
                  className="flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  onClick={handleConfirm}
                  disabled={archive.isPending}
                >
                  {archive.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '삭제'
                  )}
                </DSButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
};
