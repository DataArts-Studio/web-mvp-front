'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { CreateTestRunSchema } from '@/entities/test-run';
import { createTestRunAction } from '../model/server-action';

export type CreateRunInput = z.infer<typeof CreateTestRunSchema>;

export const useCreateRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRunInput) => {
      const result = await createTestRunAction(input);
      if (!result.success) {
        throw new Error(result.errors?.formErrors?.[0] || '테스트 실행 생성에 실패했습니다.');
      }
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['testRuns'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
};