'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTestRunAction } from '../model/server-action';

export interface CreateRunInput {
  projectId: string;
  runName: string;
  description?: string;
  sourceType: 'SUITE' | 'MILESTONE' | 'ADHOC';
  sourceId?: string;
}

export const useCreateRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRunInput) => {
      const formData = new FormData();
      formData.append('project_id', input.projectId);
      formData.append('run_name', input.runName);
      formData.append('source_type', input.sourceType);
      if (input.description) {
        formData.append('description', input.description);
      }
      if (input.sourceId) {
        formData.append('source_id', input.sourceId);
      }

      const result = await createTestRunAction(formData);
      if (!result.success) {
        throw new Error(result.errors?.formErrors?.[0] || '테스트 실행 생성에 실패했습니다.');
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['testRuns'] });
    },
  });
};
