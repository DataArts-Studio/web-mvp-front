import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestCase } from '@/entities/test-case/api';
import { testCaseQueryKeys } from '@/features/cases-list';
import { UpdateTestCase } from '../model';

type MutationInput = UpdateTestCase & { projectId: string };

export const useUpdateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MutationInput) => {
      const result = await updateTestCase(input);
      if (!result.success) {
        const message = Object.values(result.errors ?? {}).flat().join(', ')
          || '테스트케이스를 수정하는 도중 오류가 발생했습니다.';
        throw new Error(message);
      }
      return result;
    },

    onSettled: async (_data, _error, variables) => {
      const { projectId } = variables;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: testCaseQueryKeys.list(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: testCaseQueryKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: ['testSuites', projectId],
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
        queryClient.invalidateQueries({
          queryKey: ['testCaseVersions'],
          predicate: (query) => query.queryKey.includes(variables.id),
        }),
      ]).catch(() => {});
    },
  });
};
