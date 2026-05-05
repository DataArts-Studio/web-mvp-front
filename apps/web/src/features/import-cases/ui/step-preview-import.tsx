'use client';

import { useEffect, useMemo } from 'react';
import { ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { cn } from '@testea/util';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { testSuitesQueryOptions } from '@/entities/test-suite';
import { useImportWizard } from '../model/use-import-wizard';
import { validateRows } from '../model/validator';
import { importTestCases } from '../api/actions';
import { PreviewTable } from './preview-table';
import { ImportResultView } from './import-result';

interface StepPreviewImportProps {
  projectId: string;
}

export function StepPreviewImport({ projectId }: StepPreviewImportProps) {
  const {
    parseResult,
    columnMapping,
    targetSuiteId,
    validatedRows,
    status,
    result,
    error,
    setStep,
    setTargetSuiteId,
    setValidatedRows,
    setStatus,
    setResult,
    setError,
    close,
    reset,
  } = useImportWizard();
  const queryClient = useQueryClient();

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(projectId),
    enabled: !!projectId,
  });

  const suites = useMemo(() => {
    if (!suitesData?.success) return [];
    return suitesData.data;
  }, [suitesData]);

  // Validate rows when entering preview
  useEffect(() => {
    if (parseResult && columnMapping.name) {
      const validated = validateRows(parseResult.rows, columnMapping);
      setValidatedRows(validated);
    }
  }, [parseResult, columnMapping, setValidatedRows]);

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const errorCount = validatedRows.filter(
    (r) => !r.isValid && r.errors.length > 0,
  ).length;
  const skippedCount = validatedRows.filter(
    (r) => !r.isValid && r.errors.length === 0,
  ).length;

  const canImport = validCount > 0 && !!targetSuiteId;
  const isImporting = status === 'importing';
  const isDone = status === 'success' || status === 'error';

  const handleImport = async () => {
    if (!targetSuiteId || validCount === 0) return;

    setStatus('importing');
    setError(null);

    const validRows = validatedRows
      .filter((r) => r.isValid && r.mapped)
      .map((r) => r.mapped!);

    const res = await importTestCases({
      projectId,
      suiteId: targetSuiteId,
      rows: validRows,
    });

    if (res.success) {
      setStatus('success');
      setResult(res.data);
      toast.success(res.message ?? `${res.data.success}건의 테스트케이스가 가져와졌습니다.`);
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['testCases'] });
      await queryClient.invalidateQueries({ queryKey: ['testSuites'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } else {
      setStatus('error');
      const errorMsg =
        Object.values(res.errors).flat()[0] ??
        '가져오기에 실패했습니다. 다시 시도해주세요.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleClose = () => {
    reset();
    close();
  };

  if (isDone && result) {
    return <ImportResultView result={result} onClose={handleClose} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1 md:gap-2">
        <h3 className="typo-body1-heading md:typo-h2-heading text-text-1">미리보기 & 가져오기</h3>
        <p className="typo-caption1 md:typo-body2-normal text-text-3">
          매핑 결과를 확인하고 대상 스위트를 선택한 후 가져오기를 실행하세요.
        </p>
      </div>

      {/* Suite Selection */}
      <div className="flex flex-col gap-2">
        <label className="typo-body2-heading text-text-2">
          대상 테스트 스위트 <span className="text-red-400">*</span>
        </label>
        <select
          value={targetSuiteId ?? ''}
          onChange={(e) => setTargetSuiteId(e.target.value)}
          className={cn(
            'rounded-2 border-line-2 bg-bg-2 text-text-1 typo-body2-normal w-full border px-3 py-2 md:max-w-sm',
            !targetSuiteId && 'text-text-3',
          )}
        >
          <option value="">스위트를 선택하세요</option>
          {suites.map((suite) => (
            <option key={suite.id} value={suite.id}>
              {suite.title}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        {errorCount === 0 ? (
          <div className="rounded-2 flex items-center gap-2 bg-green-500/10 px-3 py-2 text-green-400">
            <Check className="h-4 w-4 shrink-0" />
            <span className="typo-caption1 md:typo-body2-normal">
              오류 없이 {validCount}건을 가져올 수 있습니다
            </span>
          </div>
        ) : (
          <span className="typo-caption1 md:typo-body2-normal text-text-2">
            전체 {validatedRows.length}건 중{' '}
            <span className="text-green-400">{validCount}건 가져오기 가능</span>
            {errorCount > 0 && (
              <>, <span className="text-red-400">{errorCount}건 오류</span></>
            )}
            {skippedCount > 0 && (
              <>, <span className="text-text-3">{skippedCount}건 건너뜀</span></>
            )}
          </span>
        )}
      </div>

      {/* Preview Table */}
      <PreviewTable
        validatedRows={validatedRows}
        columnMapping={columnMapping}
      />

      {/* Error Message */}
      {error && (
        <div className="rounded-3 flex items-start gap-3 border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="typo-body2-normal text-red-400">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <button
          type="button"
          disabled={isImporting}
          onClick={() => setStep('mapping')}
          className="text-text-2 hover:text-text-1 typo-body2-heading flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          뒤로
        </button>
        <button
          type="button"
          disabled={!canImport || isImporting}
          onClick={handleImport}
          className={cn(
            'rounded-2 typo-body2-heading flex items-center gap-2 px-6 py-2.5 transition-colors',
            canImport && !isImporting
              ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-bg-3 text-text-3 cursor-not-allowed',
          )}
        >
          {isImporting ? (
            <>
              <span className="border-white/30 h-4 w-4 animate-spin rounded-full border-2 border-t-white" />
              가져오는 중...
            </>
          ) : (
            `${validCount}건 가져오기`
          )}
        </button>
      </div>
    </div>
  );
}
