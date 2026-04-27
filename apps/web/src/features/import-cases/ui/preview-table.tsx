'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@testea/util';
import type { ColumnMapping, ValidatedRow } from '../model/schema';

const PREVIEW_LIMIT = 5;

const FIELD_LABELS: Record<string, string> = {
  name: '이름',
  testType: '테스트 유형',
  tags: '태그',
  preCondition: '사전조건',
  steps: '테스트 스텝',
  expectedResult: '기대 결과',
};

interface PreviewTableProps {
  validatedRows: ValidatedRow[];
  columnMapping: ColumnMapping;
}

export function PreviewTable({
  validatedRows,
  columnMapping,
}: PreviewTableProps) {
  const mappedFields = Object.entries(columnMapping).filter(
    ([, val]) => !!val,
  ) as Array<[keyof ColumnMapping, string]>;

  const previewRows = validatedRows
    .filter((r) => r.errors.length > 0 || r.isValid)
    .slice(0, PREVIEW_LIMIT);

  if (previewRows.length === 0) {
    return (
      <div className="rounded-3 border-line-2 flex items-center justify-center border py-8">
        <p className="typo-body2-normal text-text-3">미리보기 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3 border-line-2 overflow-hidden border">
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Header */}
          <div
            className="border-line-2 bg-bg-3 grid gap-2 border-b px-4 py-2"
            style={{
              gridTemplateColumns: `40px repeat(${mappedFields.length}, 1fr)`,
            }}
          >
            <div className="typo-caption1 text-text-3">상태</div>
            {mappedFields.map(([key]) => (
              <div key={key} className="typo-caption1 text-text-3 truncate">
                {FIELD_LABELS[key] ?? key}
              </div>
            ))}
          </div>

          {/* Rows */}
          {previewRows.map((row) => (
            <div
              key={row.index}
              className={cn(
                'border-line-2 grid gap-2 border-b px-4 py-2 last:border-b-0',
                !row.isValid && row.errors.length > 0 && 'bg-red-500/5',
              )}
              style={{
                gridTemplateColumns: `40px repeat(${mappedFields.length}, 1fr)`,
              }}
            >
              {/* Status Icon */}
              <div className="flex items-center">
                {row.isValid ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <span title={row.errors.join(', ')}>
                    <X className="h-4 w-4 text-red-400" />
                  </span>
                )}
              </div>

              {/* Data cells */}
              {mappedFields.map(([fieldKey, sourceCol]) => {
                const cellValue = row.data[sourceCol] ?? '';
                return (
                  <div
                    key={fieldKey}
                    className="typo-caption1 md:typo-body2-normal text-text-2 truncate"
                    title={cellValue}
                  >
                    {cellValue || '—'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {validatedRows.length > PREVIEW_LIMIT && (
        <div className="bg-bg-2 px-4 py-2 text-center">
          <p className="typo-caption1 text-text-3">
            외 {validatedRows.length - PREVIEW_LIMIT}건 더...
          </p>
        </div>
      )}
    </div>
  );
}
