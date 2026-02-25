'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { ATTACHMENT_LIMITS } from '../model/constants';

interface AttachmentUploadZoneProps {
  testCaseId: string;
  projectId: string;
  onUpload: (formData: FormData) => void;
  isUploading: boolean;
  currentCount: number;
}

export const AttachmentUploadZone = ({
  testCaseId,
  projectId,
  onUpload,
  isUploading,
  currentCount,
}: AttachmentUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remaining = ATTACHMENT_LIMITS.MAX_FILES_PER_CASE - currentCount;
      const filesToUpload = Array.from(files).slice(0, remaining);

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('testCaseId', testCaseId);
        formData.append('projectId', projectId);
        onUpload(formData);
      }
    },
    [testCaseId, projectId, onUpload, currentCount],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isFull = currentCount >= ATTACHMENT_LIMITS.MAX_FILES_PER_CASE;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={!isFull && !isUploading ? handleClick : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      onDragOver={!isFull ? handleDragOver : undefined}
      onDragLeave={handleDragLeave}
      onDrop={!isFull ? handleDrop : undefined}
      className={`
        flex flex-col items-center justify-center gap-2 rounded-4 border-2 border-dashed px-6 py-8
        transition-colors
        ${isFull
          ? 'cursor-not-allowed border-line-2 opacity-50'
          : isDragOver
            ? 'border-primary bg-primary/5 cursor-copy'
            : 'border-line-2 hover:border-text-3 cursor-pointer'
        }
        ${isUploading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_LIMITS.ALLOWED_EXTENSIONS}
        onChange={handleChange}
        className="hidden"
        disabled={isFull || isUploading}
      />

      {isUploading ? (
        <>
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="typo-body-normal text-text-2">업로드 중...</p>
        </>
      ) : (
        <>
          <Upload className="h-6 w-6 text-text-3" strokeWidth={1.5} />
          <div className="text-center">
            <p className="typo-body-normal text-text-2">
              {isFull
                ? `최대 ${ATTACHMENT_LIMITS.MAX_FILES_PER_CASE}개 파일 도달`
                : '파일을 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="typo-caption-normal text-text-3 mt-1">
              최대 10MB / PNG, JPG, PDF, DOC, XLS, TXT 등
            </p>
          </div>
        </>
      )}
    </div>
  );
};
