'use client';

import React, { useEffect } from 'react';
import { useVersionCompare } from '../hooks/use-version-compare';
import { LoadingSpinner } from '@testea/ui';
import type { FieldDiff } from '@/entities/test-case-version';
import { diffLines, type Change } from 'diff';

interface VersionCompareViewProps {
  testCaseId: string;
  initialOldVersion: number;
  initialNewVersion: number;
}

export const VersionCompareView = ({
  testCaseId,
  initialOldVersion,
  initialNewVersion,
}: VersionCompareViewProps) => {
  const { data, isLoading, setOldVersion, setNewVersion, oldVersion, newVersion } =
    useVersionCompare(testCaseId);

  useEffect(() => {
    if (initialOldVersion > 0) setOldVersion(initialOldVersion);
    if (initialNewVersion > 0) setNewVersion(initialNewVersion);
  }, [initialOldVersion, initialNewVersion, setOldVersion, setNewVersion]);

  if (isLoading && oldVersion > 0 && newVersion > 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!data?.success) {
    return <p className="text-text-3 py-8 text-center text-sm">비교할 데이터를 불러올 수 없습니다.</p>;
  }

  const { oldVersion: oldVer, newVersion: newVer, diffs } = data.data;

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="typo-h2-heading">
          v{oldVer.versionNumber} vs v{newVer.versionNumber} 비교
        </h3>
      </div>

      {/* 필드별 비교 */}
      {diffs.map((diff: FieldDiff) => (
        <FieldDiffRow key={diff.field} diff={diff} />
      ))}
    </div>
  );
};

function FieldDiffRow({ diff }: { diff: FieldDiff }) {
  if (diff.type === 'unchanged') {
    return (
      <details className="border-line-2 rounded-4 border">
        <summary className="text-text-3 cursor-pointer px-4 py-3 text-sm">
          {diff.fieldLabel} — 변경 없음
        </summary>
        <div className="border-line-2 border-t px-4 py-3">
          <p className="text-text-2 whitespace-pre-wrap text-sm">{diff.oldValue || '-'}</p>
        </div>
      </details>
    );
  }

  const isTextDiff = ['pre_condition', 'steps', 'expected_result'].includes(diff.field);

  return (
    <div className="border-line-2 rounded-4 flex flex-col gap-0 overflow-hidden border">
      <div className="bg-bg-2 flex items-center gap-2 px-4 py-2">
        <span className="text-sm font-semibold">{diff.fieldLabel}</span>
        <DiffTypeBadge type={diff.type} />
      </div>

      {isTextDiff ? (
        <LineDiff oldValue={diff.oldValue} newValue={diff.newValue} />
      ) : (
        <div className="grid grid-cols-2 divide-x">
          <div className="bg-red-50/50 p-4">
            <p className="mb-1 text-xs font-medium text-red-600">이전 (Old)</p>
            <p className="text-text-2 whitespace-pre-wrap text-sm line-through decoration-red-300">
              {diff.oldValue || '-'}
            </p>
          </div>
          <div className="bg-green-50/50 p-4">
            <p className="mb-1 text-xs font-medium text-green-600">현재 (New)</p>
            <p className="text-text-2 whitespace-pre-wrap text-sm">{diff.newValue || '-'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DiffTypeBadge({ type }: { type: FieldDiff['type'] }) {
  const config = {
    modified: { label: '수정됨', color: 'bg-blue-100 text-blue-700' },
    added: { label: '추가됨', color: 'bg-green-100 text-green-700' },
    removed: { label: '삭제됨', color: 'bg-red-100 text-red-700' },
    unchanged: { label: '변경 없음', color: 'bg-gray-100 text-gray-500' },
  };
  const c = config[type];
  return <span className={`rounded-2 px-2 py-0.5 text-xs ${c.color}`}>{c.label}</span>;
}

function LineDiff({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const changes: Change[] = diffLines(oldValue || '', newValue || '');

  return (
    <div className="overflow-x-auto font-mono text-sm">
      {changes.map((change, i) => {
        let className = 'px-4 py-1 whitespace-pre-wrap';
        let prefix = ' ';

        if (change.added) {
          className += ' bg-green-50 text-green-800';
          prefix = '+';
        } else if (change.removed) {
          className += ' bg-red-50 text-red-800 line-through';
          prefix = '-';
        } else {
          className += ' text-text-3';
        }

        return (
          <div key={i} className={className}>
            <span className="mr-2 select-none opacity-50">{prefix}</span>
            {change.value}
          </div>
        );
      })}
    </div>
  );
}
