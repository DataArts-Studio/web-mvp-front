'use client';

import React from 'react';
import { HardDrive } from 'lucide-react';

import { SettingsCard } from '@testea/ui';
import { formatBytes } from '@testea/util';

// ─── Section: Storage ────────────────────────────────────────────────────────

interface StorageSectionProps {
  usedBytes: number;
  maxBytes: number;
  usedPercent: number;
}

export const StorageSection = ({ usedBytes, maxBytes, usedPercent }: StorageSectionProps) => {
  const barColor =
    usedPercent >= 95 ? 'bg-red-500'
    : usedPercent >= 80 ? 'bg-amber-500'
    : 'bg-primary';

  const textColor =
    usedPercent >= 95 ? 'text-red-500'
    : usedPercent >= 80 ? 'text-amber-500'
    : 'text-primary';

  const statusLabel =
    usedPercent >= 95 ? '용량 부족'
    : usedPercent >= 80 ? '용량 주의'
    : '정상';

  const statusBg =
    usedPercent >= 95 ? 'bg-red-500/10 text-red-400'
    : usedPercent >= 80 ? 'bg-amber-500/10 text-amber-400'
    : 'bg-primary/10 text-primary';

  return (
    <SettingsCard.Root>
      <SettingsCard.Header
        icon={<HardDrive className="h-5 w-5" />}
        title="스토리지"
        description="프로젝트 데이터 저장 공간 사용 현황입니다."
      />
      <SettingsCard.Divider />
      <SettingsCard.Body className="flex flex-col gap-4">
        <div className="rounded-4 bg-bg-1 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className={`typo-h2-heading ${textColor}`}>
                {formatBytes(usedBytes)}
              </span>
              <span className="typo-caption text-text-3">
                / {formatBytes(maxBytes)}
              </span>
            </div>
            <span className={`typo-caption rounded-full px-2.5 py-1 ${statusBg}`}>
              {statusLabel}
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-bg-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>

          <div className="mt-2 flex justify-end">
            <span className={`typo-caption font-medium ${textColor}`}>
              {usedPercent}% 사용 중
            </span>
          </div>
        </div>
      </SettingsCard.Body>
    </SettingsCard.Root>
  );
};
