import React, { useState } from 'react';

import { useArchive } from '@/features/archive/hooks/use-archive';
import { ArchiveTargetType } from '@/features/archive/model/types';
import { DSButton } from '@/shared';
import { Dialog } from '@/shared/lib/primitives';
import { Loader2, Trash2 } from 'lucide-react';
import { track, TESTCASE_EVENTS, TESTSUITE_EVENTS, MILESTONE_EVENTS } from '@/shared/lib/analytics';
import { toast } from 'sonner';

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

  const label = TARGET_LABEL[targetType] ?? '항목';

  const archive = useArchive({
    onSuccess: () => {
      setIsConfirmOpen(false);
      toast(`${label}이(가) 휴지통으로 이동되었습니다.`, {
        description: '30일 후 자동으로 영구 삭제됩니다.',
        action: {
          label: '휴지통 보기',
          onClick: () => {
            // 현재 URL에서 프로젝트 slug 추출하여 휴지통으로 이동
            const match = window.location.pathname.match(/\/projects\/([^/]+)/);
            if (match) {
              window.location.href = `/projects/${match[1]}/trash`;
            }
          },
        },
      });
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
                휴지통으로 이동
              </Dialog.Title>
              <Dialog.Description className="text-text-3 typo-body2-normal mt-2">
                이 {label}을(를) 휴지통으로 이동하시겠습니까?<br />
                <span className="text-text-2">30일 후 자동으로 영구 삭제되며, 그 전에 복원할 수 있습니다.</span>
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
                      이동 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      휴지통으로 이동
                    </>
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
