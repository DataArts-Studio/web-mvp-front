import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CreateTestCase } from '@/entities';
import { createTestCase } from '@/entities/test-case/api';
import { testCaseQueryKeys } from '@/features/cases-list';

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

    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: testCaseQueryKeys.all,
      });

      // Snapshot all matching list caches
      const previousQueries = queryClient.getQueriesData<any>({
        queryKey: testCaseQueryKeys.list(variables.projectId),
      });

      const optimisticId = `optimistic-${Date.now()}`;
      const now = new Date();

      // Optimistic item
      const optimisticItem = {
        id: optimisticId,
        projectId: variables.projectId,
        testSuiteId: variables.testSuiteId ?? null,
        sectionId: variables.sectionId ?? null,
        displayId: 0,
        caseKey: '...',
        title: variables.title,
        testType: variables.testType ?? '',
        tags: variables.tags ?? [],
        sortOrder: 0,
        resultStatus: 'untested' as const,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        lifecycleStatus: 'ACTIVE' as const,
        isOptimistic: true,
      };

      // Prepend optimistic item to all matching list caches
      queryClient.setQueriesData<any>(
        { queryKey: testCaseQueryKeys.list(variables.projectId) },
        (old: any) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              items: [optimisticItem, ...old.data.items],
              pagination: {
                ...old.data.pagination,
                totalItems: old.data.pagination.totalItems + 1,
              },
            },
          };
        },
      );

      return { previousQueries };
    },

    onError: (_error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: async (_data, _error, variables) => {
      const { projectId } = variables;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: testCaseQueryKeys.list(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['testSuites', projectId],
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      ]).catch(() => {});
    },
  });
};
