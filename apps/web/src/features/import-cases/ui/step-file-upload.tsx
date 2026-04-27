'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@testea/util';
import { useImportWizard } from '../model/use-import-wizard';
import { parseFile, FileValidationError } from '../model/parser';
import { getAutoMapping } from '../model/format-detector';
import { FormatBadge } from './format-badge';

const MAX_ROWS = 500;

export function StepFileUpload() {
  const {
    file,
    parseResult,
    status,
    error,
    setFile,
    setParseResult,
    setColumnMapping,
    setStep,
    setStatus,
    setError,
  } = useImportWizard();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setError(null);
      setStatus('parsing');

      try {
        const result = await parseFile(selectedFile);

        if (result.totalRows > MAX_ROWS) {
          setError(
            `최대 ${MAX_ROWS}건까지 가져올 수 있습니다. 현재 ${result.totalRows}건. 처음 ${MAX_ROWS}건만 처리됩니다.`,
          );
          result.rows = result.rows.slice(0, MAX_ROWS);
          result.totalRows = MAX_ROWS;
        }

        setParseResult(result);

        // Auto-mapping if competitor format detected
        if (result.detectedFormat !== 'generic') {
          const autoMapping = getAutoMapping(result.headers, result.detectedFormat);
          setColumnMapping(autoMapping);
        }

        setStatus('ready');
      } catch (err) {
        setStatus('idle');
        if (err instanceof FileValidationError) {
          setError(err.message);
        } else {
          setError('파일을 읽을 수 없습니다. 파일이 손상되지 않았는지 확인해주세요.');
        }
      }
    },
    [setFile, setError, setStatus, setParseResult, setColumnMapping],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
      // Reset input so same file can be re-selected
      e.target.value = '';
    },
    [handleFile],
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null as unknown as File);
    setParseResult(null as unknown as typeof parseResult & NonNullable<unknown>);
    setStatus('idle');
    setError(null);
  }, [setFile, setParseResult, setStatus, setError]);

  const isParsing = status === 'parsing';
  const isReady = status === 'ready' && parseResult;

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1 md:gap-2">
        <h3 className="typo-body1-heading md:typo-h2-heading text-text-1">파일 업로드</h3>
        <p className="typo-caption1 md:typo-body2-normal text-text-3">
          CSV 또는 Excel(.xlsx) 파일을 업로드하세요. 최대 5MB, {MAX_ROWS}행까지 지원합니다.
        </p>
      </div>

      {/* Drop Zone */}
      {!isReady && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'rounded-4 border-line-2 flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-10 transition-colors md:gap-4 md:px-8 md:py-16',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/50 hover:bg-bg-2',
            isParsing && 'pointer-events-none opacity-50',
          )}
        >
          <div className="rounded-full bg-bg-2 p-3 md:p-4">
            <Upload className="text-text-3 h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="typo-body2-heading md:typo-body1-heading text-text-1 text-center">
              {isParsing ? '파일 분석 중...' : '파일을 드래그하거나 클릭하여 선택'}
            </p>
            <p className="typo-caption1 md:typo-body2-normal text-text-3">
              .csv, .xlsx (최대 5MB)
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* File Info */}
      {isReady && (
        <div className="rounded-3 border-line-2 bg-bg-2 flex items-center gap-4 border p-4">
          <div className="bg-primary/10 rounded-2 p-2">
            <FileText className="text-primary h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="typo-body2-heading text-text-1">{file?.name}</p>
            <p className="typo-caption1 text-text-3">
              {(file!.size / 1024).toFixed(1)} KB · {parseResult.totalRows}행 감지
            </p>
            {parseResult.detectedFormat !== 'generic' && (
              <FormatBadge format={parseResult.detectedFormat} className="mt-1" />
            )}
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-text-3 hover:text-text-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-3 flex items-start gap-3 border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="typo-body2-normal text-red-400">{error}</p>
        </div>
      )}

      {/* Next Button */}
      <div className="mt-auto flex justify-end pt-4">
        <button
          type="button"
          disabled={!isReady}
          onClick={() => setStep('mapping')}
          className={cn(
            'rounded-2 typo-body2-heading px-6 py-2.5 transition-colors',
            isReady
              ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-bg-3 text-text-3 cursor-not-allowed',
          )}
        >
          다음: 컬럼 매핑
        </button>
      </div>
    </div>
  );
}
