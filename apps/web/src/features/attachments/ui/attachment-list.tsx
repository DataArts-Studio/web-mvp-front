'use client';

import React, { useState } from 'react';
import { Download, File, FileImage, FileSpreadsheet, FileText, Trash2, X } from 'lucide-react';
import { DSButton } from '@/shared';
import type { Attachment } from '../model/types';

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType === 'application/pdf') return FileText;
  if (
    fileType.includes('spreadsheet') ||
    fileType.includes('excel') ||
    fileType === 'text/csv'
  )
    return FileSpreadsheet;
  if (fileType.includes('word') || fileType.includes('document') || fileType === 'text/plain')
    return FileText;
  return File;
}

function isImageType(fileType: string | null): boolean {
  return !!fileType && fileType.startsWith('image/');
}

export const AttachmentList = ({
  attachments,
  onDelete,
  isDeleting,
}: AttachmentListProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const handleDelete = (id: string) => {
    onDelete(id);
    setConfirmDeleteId(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map((attachment) => {
          const Icon = getFileIcon(attachment.fileType);
          const isImage = isImageType(attachment.fileType);

          return (
            <div
              key={attachment.id}
              className="bg-bg-2 border-line-2 group relative flex items-center gap-3 rounded-4 border p-3 transition-colors hover:border-text-3"
            >
              {/* Thumbnail or icon */}
              <div
                className="bg-bg-3 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-3"
                onClick={isImage ? () => setPreviewUrl(attachment.url) : undefined}
                role={isImage ? 'button' : undefined}
                style={isImage ? { cursor: 'pointer' } : undefined}
              >
                {isImage ? (
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon className="h-5 w-5 text-text-3" strokeWidth={1.5} />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="typo-body-normal text-text-1 truncate" title={attachment.fileName}>
                  {attachment.fileName}
                </p>
                <p className="typo-caption-normal text-text-3">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={attachment.url}
                  download={attachment.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-3 p-1.5 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                  title="다운로드"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setConfirmDeleteId(attachment.id)}
                  className="rounded-3 p-1.5 text-text-3 transition-colors hover:bg-system-red/10 hover:text-system-red"
                  title="삭제"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Delete confirmation inline */}
              {confirmDeleteId === attachment.id && (
                <div className="bg-bg-2 border-line-2 absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-4 border backdrop-blur-sm">
                  <span className="typo-caption-normal text-text-2">삭제할까요?</span>
                  <DSButton
                    variant="solid"
                    size="small"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={isDeleting}
                    className="!bg-system-red hover:!bg-system-red/80 text-white"
                  >
                    삭제
                  </DSButton>
                  <DSButton
                    variant="ghost"
                    size="small"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    취소
                  </DSButton>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewUrl}
            alt="미리보기"
            className="max-h-[85vh] max-w-[90vw] rounded-4 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
