import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CreateTestCase } from '@/entities';
import { createTestCase } from '@/entities/test-case/api';

export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestCase) => createTestCase(input),
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
      ]);
    },
  });
};
