import React from 'react';

import { Check, Share2 } from 'lucide-react';

import { formatDateKR } from '@/shared/utils/date-format';
import { formatBytes } from '@/shared/utils';
import type { ActionResult } from '@/shared/types';

type ProjectInfoCardProps = {
  project?: { name: string; created_at: string };
  isCopied: boolean;
  onCopyLink: () => void;
};

export const ProjectInfoCard = ({ project, isCopied, onCopyLink }: ProjectInfoCardProps) => (
  <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5" data-tour="project-info">
    <span className="typo-body2-heading text-text-3">내 프로젝트 정보</span>
    <div className="rounded-2 bg-bg-3 flex flex-col items-center justify-center gap-2 p-4">
      <div className="flex items-center gap-2">
        <span className="typo-body2-heading text-primary truncate max-w-50">{project?.name}</span>
        <button onClick={onCopyLink} className="text-primary hover:text-primary/80 transition-colors cursor-pointer" title="링크 복사">
          {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </button>
      </div>
      <span className="typo-caption text-text-3">
        {project && formatDateKR(project.created_at)} 생성됨
      </span>
    </div>
  </div>
);

type StorageCardProps = {
  storageData?: ActionResult<{ usedBytes: number; maxBytes: number; usedPercent: number }>;
};

export const StorageCard = ({ storageData }: StorageCardProps) => {
  if (!storageData?.success) return null;
  const { usedBytes, maxBytes, usedPercent } = storageData.data;
  const barColor = usedPercent >= 95 ? 'bg-red-500' : usedPercent >= 80 ? 'bg-amber-500' : 'bg-primary';
  const textColor = usedPercent >= 95 ? 'text-red-500' : usedPercent >= 80 ? 'text-amber-500' : 'text-primary';

  return (
    <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5" data-tour="storage-info">
      <span className="typo-body2-heading text-text-3">저장 용량</span>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className={`typo-caption font-medium ${textColor}`}>{formatBytes(usedBytes)} / {formatBytes(maxBytes)}</span>
          <span className={`typo-caption ${textColor}`}>{usedPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-3">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(usedPercent, 100)}%` }} />
        </div>
      </div>
    </div>
  );
};
