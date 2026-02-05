import React from 'react';

import { useArchive } from '@/features/archive/hooks/use-archive';
import { ArchiveTargetType } from '@/features/archive/model/types';
import { DSButton } from '@/shared';
import { Trash2 } from 'lucide-react';

interface ArchiveButtonProps {
  targetType: ArchiveTargetType;
  targetId: string;
  btnType?: 'text' | 'icon';
  onSuccess?: () => void;
}

export const ArchiveButton = ({ targetType, targetId, btnType = 'text', onSuccess }: ArchiveButtonProps) => {
  const archive = useArchive({ onSuccess });

  const handleClick = () => {
    archive.mutate({ targetType, targetId });
  };

  return (
    <DSButton
      variant="text"
      className="flex items-center gap-2 text-red-400"
      onClick={handleClick}
      disabled={archive.isPending}
    >
      <Trash2 className="h-4 w-4" />
      {btnType === 'text' && '삭제'}
    </DSButton>
  );
};
