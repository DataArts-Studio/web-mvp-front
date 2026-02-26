import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestCase } from '@/entities/test-case/api';
import { UpdateTestCase } from '../model';

export const useUpdateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTestCase) => {
      const result = await updateTestCase(input);
      if (!result.success) {
        const message = Object.values(result.errors ?? {}).flat().join(', ')
          || '테스트케이스를 수정하는 도중 오류가 발생했습니다.';
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
        queryClient.invalidateQueries({ queryKey: ['testCaseVersions'] }),
      ]).catch(() => {});
    },
  });
};
