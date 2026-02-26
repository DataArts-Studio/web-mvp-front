import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CreateTestCase } from '@/entities';
import { createTestCase } from '@/entities/test-case/api';

export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTestCase) => {
      const result = await createTestCase(input);
      if (!result.success) {
        const message = Object.values(result.errors ?? {}).flat().join(', ')
          || '테스트케이스를 생성하는 도중 오류가 발생했습니다.';
        throw new Error(message);
      }
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['testCases'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: ['testSuites'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]).catch(() => {});
    },
  });
};
