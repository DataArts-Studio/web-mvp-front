import React from 'react';

import { useArchive } from '@/features/archive/hooks/use-archive';
import { ArchiveTargetType } from '@/features/archive/model/types';
import { DSButton } from '@/shared';
import { Loader2, Trash2 } from 'lucide-react';
import { track, TESTCASE_EVENTS, TESTSUITE_EVENTS, MILESTONE_EVENTS } from '@/shared/lib/analytics';

interface ArchiveButtonProps {
  targetType: ArchiveTargetType;
  targetId: string;
  btnType?: 'text' | 'icon';
  onSuccess?: () => void;
}

export const ArchiveButton = ({ targetType, targetId, btnType = 'text', onSuccess }: ArchiveButtonProps) => {
  const archive = useArchive({ onSuccess });

  const handleClick = () => {
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
    <DSButton
      variant="text"
      className="flex items-center gap-2 text-red-400"
      onClick={handleClick}
      disabled={archive.isPending}
    >
      {archive.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {btnType === 'text' && (archive.isPending ? '삭제 중...' : '삭제')}
    </DSButton>
  );
};
