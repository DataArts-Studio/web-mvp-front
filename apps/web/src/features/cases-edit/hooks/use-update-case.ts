import { updateTestCase } from '@/entities/test-case/api';
import { CASE_MESSAGE_CODES } from '@/entities/test-case/model/message-codes';
import { testCaseQueryKeys } from '@/features/cases-list';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UpdateTestCase } from '../model';

type MutationInput = UpdateTestCase & { projectId: string };

export const useUpdateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MutationInput) => {
      const result = await updateTestCase(input);
      if (!result.success) {
        const message =
          Object.values(result.errors ?? {})
            .flat()
            .join(', ') || CASE_MESSAGE_CODES.UPDATE_FAILED;
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
