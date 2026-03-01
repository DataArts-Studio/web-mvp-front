import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestCase } from '@/entities/test-case/api';
import type { TestCaseListItem } from '@/entities/test-case/model/types';
import { testCaseQueryKeys } from '@/features/cases-list';
import type { ActionResult } from '@/shared/types';
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

    // 서버 응답 전에 목록 캐시에 즉시 반영
    onMutate: async (input) => {
      const queryKey = testCaseQueryKeys.list(input.projectId);

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<ActionResult<TestCaseListItem[]>>(queryKey);

      if (previousData?.success) {
        const updatedList = previousData.data.map((item) => {
          if (item.id !== input.id) return item;
          return {
            ...item,
            title: input.title ?? item.title,
            testSuiteId: input.testSuiteId !== undefined ? (input.testSuiteId ?? undefined) : item.testSuiteId,
            testType: input.testType ?? item.testType,
            tags: input.tags ?? item.tags,
            updatedAt: new Date(),
          };
        });

        queryClient.setQueryData<ActionResult<TestCaseListItem[]>>(queryKey, {
          success: true,
          data: updatedList,
        });
      }

      return { previousData, queryKey };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
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
