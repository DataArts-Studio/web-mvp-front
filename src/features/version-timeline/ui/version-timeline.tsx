'use client';

import React from 'react';
import type { TestCaseVersionSummary, ChangeType } from '@/entities/test-case-version';
import { useVersionsList } from '../hooks/use-versions-list';
import { LoadingSpinner, DSButton } from '@/shared/ui';
import { formatRelativeTime } from '@/shared/utils/date-format';
import { Plus, Edit2, RotateCcw, FileText, GitCompare } from 'lucide-react';

const changeTypeConfig: Record<ChangeType, { label: string; color: string; icon: React.ReactNode }> = {
  create: {
    label: '생성',
    color: 'bg-green-100 text-green-700',
    icon: <Plus className="h-3.5 w-3.5" />,
  },
  edit: {
    label: '수정',
    color: 'bg-blue-100 text-blue-700',
    icon: <Edit2 className="h-3.5 w-3.5" />,
  },
  rollback: {
    label: '복원',
    color: 'bg-amber-100 text-amber-700',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
  },
};

interface VersionTimelineProps {
  testCaseId: string;
  onViewDetail: (versionNumber: number) => void;
  onCompare: (versionNumber: number) => void;
}

export const VersionTimeline = ({ testCaseId, onViewDetail, onCompare }: VersionTimelineProps) => {
  const { data, isLoading } = useVersionsList(testCaseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const versions = data?.success ? data.data.versions : [];

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <FileText className="text-text-3 h-10 w-10" />
        <p className="text-text-3 text-sm">아직 변경 이력이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {versions.map((version: TestCaseVersionSummary, index: number) => {
        const config = changeTypeConfig[version.changeType];
        const isLast = index === versions.length - 1;

        return (
          <div key={version.id} className="relative flex gap-4">
            {/* 타임라인 라인 */}
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                {config.icon}
              </div>
              {!isLast && <div className="bg-line-2 w-px flex-1" />}
            </div>

            {/* 콘텐츠 */}
            <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
              <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded-2 px-2 py-0.5 text-xs font-semibold">
                      v{version.versionNumber}
                    </span>
                    <span className={`rounded-2 px-2 py-0.5 text-xs ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-text-3 text-xs">
                      {formatRelativeTime(version.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="text-text-2 mt-2 text-sm">
                  {version.changeSummary || '변경 사항 없음'}
                </p>

                {version.changedFields.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {version.changedFields.map((field: string) => (
                      <span key={field} className="bg-bg-3 text-text-3 rounded-2 px-1.5 py-0.5 text-xs">
                        {field}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <DSButton
                    size="small"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => onViewDetail(version.versionNumber)}
                  >
                    <FileText className="mr-1 h-3.5 w-3.5" />
                    상세 보기
                  </DSButton>
                  {version.versionNumber > 1 && (
                    <DSButton
                      size="small"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => onCompare(version.versionNumber)}
                    >
                      <GitCompare className="mr-1 h-3.5 w-3.5" />
                      비교
                    </DSButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
