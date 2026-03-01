'use client';

import React from 'react';
import { Paperclip } from 'lucide-react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../hooks';
import { AttachmentUploadZone } from './attachment-upload-zone';
import { AttachmentList } from './attachment-list';
import { ATTACHMENT_LIMITS } from '../model/constants';

interface AttachmentSectionProps {
  testCaseId: string;
  projectId: string;
}

export const AttachmentSection = ({ testCaseId, projectId }: AttachmentSectionProps) => {
  const { data, isLoading } = useAttachments(testCaseId);
  const { mutate: upload, isPending: isUploading } = useUploadAttachment(testCaseId);
  const { mutate: remove, isPending: isDeleting } = useDeleteAttachment(testCaseId);

  const attachments = data?.success ? data.data : [];

  return (
    <section className="col-span-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="typo-h2-heading flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          첨부파일
          {attachments.length > 0 && (
            <span className="typo-caption-normal text-text-3">
              ({attachments.length}/{ATTACHMENT_LIMITS.MAX_FILES_PER_CASE})
            </span>
          )}
        </h2>
      </div>

      <AttachmentUploadZone
        testCaseId={testCaseId}
        projectId={projectId}
        onUpload={upload}
        isUploading={isUploading}
        currentCount={attachments.length}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : (
        <AttachmentList
          attachments={attachments}
          onDelete={remove}
          isDeleting={isDeleting}
        />
      )}
    </section>
  );
};
