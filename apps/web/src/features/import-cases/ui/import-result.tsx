'use client';

import { CheckCircle, XCircle } from 'lucide-react';

import type { ImportResult } from '../model/schema';

interface ImportResultViewProps {
  result: ImportResult;
  onClose: () => void;
}

export function ImportResultView({ result, onClose }: ImportResultViewProps) {
  const allSuccess = result.failed === 0;
  const nothingImported = result.success === 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {allSuccess ? (
        <div className="rounded-full bg-green-500/10 p-6">
          <CheckCircle className="h-12 w-12 text-green-400" />
        </div>
      ) : (
        <div className="rounded-full bg-yellow-500/10 p-6">
          <XCircle className="h-12 w-12 text-yellow-400" />
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <h3 className="typo-h2-heading text-text-1">
          {allSuccess ? '가져오기 완료' : nothingImported ? '가져오지 못함' : '부분 성공'}
        </h3>
        <p className="typo-body1-normal text-text-2">
          {result.success}건의 테스트케이스가 성공적으로 가져와졌습니다.
        </p>
        {result.failed > 0 && (
          <p className="typo-body2-normal text-red-400">{result.failed}건 오류</p>
        )}
        {result.skipped > 0 && (
          <p className="typo-body2-normal text-text-3">{result.skipped}건 건너뜀 (빈 행)</p>
        )}
      </div>

      {/* 행별 오류: 파일의 몇 번째 행이 왜 빠졌는지 보여 준다 (#382). */}
      {result.errors.length > 0 && (
        <div className="rounded-3 border-line-2 w-full max-w-lg border">
          <p className="typo-caption1 text-text-3 border-line-2 border-b px-4 py-2">
            오류가 난 행 (머리글을 1행으로 센 파일 기준)
          </p>
          <ul aria-label="가져오기 오류 목록" className="max-h-48 overflow-y-auto">
            {result.errors.map((error) => (
              <li
                key={`${error.row}-${error.message}`}
                className="typo-body2-normal border-line-2 flex gap-3 border-b px-4 py-2 last:border-b-0"
              >
                <span className="text-text-2 shrink-0">{error.row}행</span>
                <span className="text-red-400">{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="bg-primary hover:bg-primary/90 rounded-2 typo-body2-heading mt-4 px-8 py-2.5 text-white transition-colors"
      >
        닫기
      </button>
    </div>
  );
}
