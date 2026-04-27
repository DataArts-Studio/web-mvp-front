'use client';

import React, { useState } from 'react';
import { useVersionDetail } from '../hooks/use-version-detail';
import { RollbackConfirmDialog } from '@/features/version-rollback/ui/rollback-confirm-dialog';
import { LoadingSpinner, DSButton } from '@testea/ui';
import { formatDateTime } from '@/shared/utils/date-format';
import { RotateCcw, GitCompare, Tag } from 'lucide-react';
import type { ChangeType } from '@/entities/test-case-version';

const changeTypeBadge: Record<ChangeType, { label: string; color: string }> = {
  create: { label: '생성', color: 'bg-green-100 text-green-700' },
  edit: { label: '수정', color: 'bg-blue-100 text-blue-700' },
  rollback: { label: '복원', color: 'bg-amber-100 text-amber-700' },
};

interface VersionDetailPanelProps {
  testCaseId: string;
  versionNumber: number;
  onCompare: (oldVersion: number, newVersion: number) => void;
  onBack: () => void;
}

export const VersionDetailPanel = ({
  testCaseId,
  versionNumber,
  onCompare,
  onBack,
}: VersionDetailPanelProps) => {
  const { data, isLoading } = useVersionDetail(testCaseId, versionNumber);
  const [showRollback, setShowRollback] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!data?.success) {
    return <p className="text-text-3 py-8 text-center text-sm">버전 정보를 불러올 수 없습니다.</p>;
  }

  const version = data.data;
  const badge = changeTypeBadge[version.changeType];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary rounded-2 px-3 py-1 text-sm font-semibold">
              v{version.versionNumber}
            </span>
            <span className={`rounded-2 px-2 py-0.5 text-xs ${badge.color}`}>
              {badge.label}
            </span>
            <span className="text-text-3 text-sm">
              {formatDateTime(version.createdAt)}
            </span>
          </div>

          <div className="flex gap-2">
            <DSButton
              size="small"
              variant="ghost"
              onClick={() => onCompare(version.versionNumber, version.versionNumber)}
            >
              <GitCompare className="mr-1 h-4 w-4" />
              현재 버전과 비교
            </DSButton>
            <DSButton
              size="small"
              variant="ghost"
              onClick={() => setShowRollback(true)}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              이 버전으로 복원
            </DSButton>
          </div>
        </div>

        {/* 변경 요약 */}
        {version.changeSummary && (
          <p className="text-text-2 text-sm">{version.changeSummary}</p>
        )}

        {/* 이름 */}
        <section className="flex flex-col gap-2">
          <h3 className="typo-h2-heading">이름</h3>
          <div className={`bg-bg-2 border-line-2 rounded-4 border p-4 ${version.changedFields.includes('name') ? 'ring-2 ring-yellow-300/50' : ''}`}>
            <p className="text-text-2">{version.name}</p>
          </div>
        </section>

        {/* 테스트 유형 */}
        <section className="flex flex-col gap-2">
          <h3 className="typo-h2-heading">테스트 유형</h3>
          <div className={`bg-bg-2 border-line-2 rounded-4 border p-4 ${version.changedFields.includes('test_type') ? 'ring-2 ring-yellow-300/50' : ''}`}>
            <p className="text-text-2">{version.testType || '-'}</p>
          </div>
        </section>

        {/* 태그 */}
        <section className="flex flex-col gap-2">
          <h3 className="typo-h2-heading flex items-center gap-1">
            <Tag className="h-4 w-4" />
            태그
          </h3>
          <div className={`flex flex-wrap gap-2 ${version.changedFields.includes('tags') ? 'ring-2 ring-yellow-300/50 rounded-4 p-2' : ''}`}>
            {version.tags.length > 0 ? (
              version.tags.map((tag, i) => (
                <span key={i} className="bg-bg-3 rounded-2 px-2 py-1 text-sm">{tag}</span>
              ))
            ) : (
              <span className="text-text-3 text-sm">태그 없음</span>
            )}
          </div>
        </section>

        {/* 전제 조건 */}
        <section className="flex flex-col gap-2">
          <h3 className="typo-h2-heading">전제 조건</h3>
          <div className={`bg-bg-2 border-line-2 rounded-4 border p-4 ${version.changedFields.includes('pre_condition') ? 'ring-2 ring-yellow-300/50' : ''}`}>
            <p className="text-text-2 whitespace-pre-wrap">{version.preCondition || '전제 조건이 없습니다.'}</p>
          </div>
        </section>

        {/* 테스트 단계 */}
        <section className="flex flex-col gap-2">
          <h3 className="typo-h2-heading">테스트 단계</h3>
          <div className={`bg-bg-2 border-line-2 rounded-4 border p-4 ${version.changedFields.includes('steps') ? 'ring-2 ring-yellow-300/50' : ''}`}>
            <p className="text-text-2 whitespace-pre-wrap">{version.steps || '테스트 단계가 없습니다.'}</p>
          </div>
        </section>

        {/* 예상 결과 */}
        <section className="flex flex-col gap-2">
          <h3 className="typo-h2-heading">예상 결과</h3>
          <div className={`bg-bg-2 border-line-2 rounded-4 border p-4 ${version.changedFields.includes('expected_result') ? 'ring-2 ring-yellow-300/50' : ''}`}>
            <p className="text-text-2 whitespace-pre-wrap">{version.expectedResult || '예상 결과가 없습니다.'}</p>
          </div>
        </section>
      </div>

      {showRollback && (
        <RollbackConfirmDialog
          testCaseId={testCaseId}
          targetVersionNumber={version.versionNumber}
          onClose={() => setShowRollback(false)}
          onSuccess={() => {
            setShowRollback(false);
            onBack();
          }}
        />
      )}
    </>
  );
};
