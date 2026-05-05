'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attachmentsQueryOptions, uploadAttachment, deleteAttachment } from '../api';

export function useAttachments(testCaseId: string) {
  return useQuery(attachmentsQueryOptions(testCaseId));
}

export function useUploadAttachment(testCaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => uploadAttachment(formData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || '파일이 업로드되었습니다.');
        queryClient.invalidateQueries({ queryKey: ['attachments', testCaseId] });
      } else {
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
      }
    },
    onError: () => {
      toast.error('파일 업로드 중 오류가 발생했습니다.');
    },
  });
}

export function useDeleteAttachment(testCaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || '첨부파일이 삭제되었습니다.');
        queryClient.invalidateQueries({ queryKey: ['attachments', testCaseId] });
      } else {
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
      }
    },
    onError: () => {
      toast.error('첨부파일 삭제 중 오류가 발생했습니다.');
    },
  });
}
