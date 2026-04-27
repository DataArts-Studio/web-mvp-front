'use client';

import { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@testea/util';
import { useImportWizard } from '../model/use-import-wizard';
import type { ColumnMapping } from '../model/schema';
import { FormatBadge } from './format-badge';
import { MappingRow } from './mapping-row';

const TESTEA_FIELDS: Array<{
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
}> = [
  { key: 'name', label: '이름 (name)', required: true },
  { key: 'testType', label: '테스트 유형 (test_type)', required: false },
  { key: 'tags', label: '태그 (tags)', required: false },
  { key: 'preCondition', label: '사전조건 (pre_condition)', required: false },
  { key: 'steps', label: '테스트 스텝 (steps)', required: false },
  { key: 'expectedResult', label: '기대 결과 (expected_result)', required: false },
];

export function StepColumnMapping() {
  const { parseResult, columnMapping, setColumnMapping, setStep } =
    useImportWizard();

  const sampleRows = parseResult?.rows.slice(0, 3) ?? [];

  const sourceOptions = useMemo(
    () => {
      const headers = parseResult?.headers ?? [];
      return [
        { value: '', label: '(무시)' },
        ...headers.map((h) => ({ value: h, label: h })),
      ];
    },
    [parseResult?.headers],
  );

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping({ ...columnMapping, [field]: value || undefined });
  };

  const isNameMapped = !!columnMapping.name;

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1 md:gap-2">
        <h3 className="typo-body1-heading md:typo-h2-heading text-text-1">컬럼 매핑</h3>
        <p className="typo-caption1 md:typo-body2-normal text-text-3">
          파일의 컬럼을 Testea 필드에 매핑하세요. 이름 필드는 필수입니다.
        </p>
      </div>

      {parseResult?.detectedFormat !== 'generic' && (
        <FormatBadge format={parseResult!.detectedFormat} />
      )}

      {/* Mapping List */}
      <div className="rounded-3 border-line-2 overflow-hidden border">
        {/* Desktop Header - hidden on mobile */}
        <div className="border-line-2 bg-bg-3 hidden border-b px-4 py-3 md:grid md:grid-cols-12 md:gap-4">
          <div className="typo-caption1 text-text-3 col-span-3">
            Testea 필드
          </div>
          <div className="typo-caption1 text-text-3 col-span-1 text-center">
            &nbsp;
          </div>
          <div className="typo-caption1 text-text-3 col-span-3">
            소스 컬럼
          </div>
          <div className="typo-caption1 text-text-3 col-span-5">
            샘플 데이터
          </div>
        </div>

        {/* Rows */}
        {TESTEA_FIELDS.map((field) => (
          <MappingRow
            key={field.key}
            field={field}
            value={(columnMapping as Record<string, string | undefined>)[field.key] ?? ''}
            options={sourceOptions}
            sampleRows={sampleRows}
            onChange={(val) => handleMappingChange(field.key, val)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep('upload')}
          className="text-text-2 hover:text-text-1 typo-body2-heading flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          뒤로
        </button>
        <button
          type="button"
          disabled={!isNameMapped}
          onClick={() => setStep('preview')}
          className={cn(
            'rounded-2 typo-body2-heading px-6 py-2.5 transition-colors',
            isNameMapped
              ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-bg-3 text-text-3 cursor-not-allowed',
          )}
        >
          다음: 미리보기
        </button>
      </div>
    </div>
  );
}
