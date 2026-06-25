'use client';

import { useState } from 'react';

/**
 * 파일 업로드 샌드박스 (테스트 대상).
 * - 파일 선택 → 파일명 표시 → 업로드 버튼 → 완료 메시지.
 */
export const FileUploadSandbox = () => {
  const [fileName, setFileName] = useState('');
  const [uploaded, setUploaded] = useState(false);

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <h1 className="mb-5 text-xl font-bold">증빙 파일 업로드</h1>

        <input
          data-testid="file-input"
          type="file"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUploaded(false);
            setFileName(e.target.files?.[0]?.name ?? '');
          }}
          className="text-text-2 file:border-line-3 file:bg-bg-3 file:text-text-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-2 file:text-sm"
        />

        {fileName && (
          <p data-testid="file-name" className="text-text-2 mt-4 text-sm">
            선택한 파일: <span className="text-text-1">{fileName}</span>
          </p>
        )}

        <button
          data-testid="upload-submit"
          type="button"
          disabled={!fileName}
          onClick={() => setUploaded(true)}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-5 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          업로드
        </button>

        {uploaded && (
          <p
            data-testid="upload-result"
            role="status"
            className="text-primary mt-4 text-sm font-medium"
          >
            업로드 완료: {fileName}
          </p>
        )}
      </div>
    </main>
  );
};
