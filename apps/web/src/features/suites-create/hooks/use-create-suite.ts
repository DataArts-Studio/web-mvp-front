import { type CreateTestSuite, createTestSuite } from '@/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateSuite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestSuite) => createTestSuite(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['testSuites'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]).catch(() => {});
    },
  });
};
