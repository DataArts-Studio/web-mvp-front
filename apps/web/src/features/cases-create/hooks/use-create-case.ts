import { CreateTestCase } from '@/entities';
import type { TestCaseListItem } from '@/entities/test-case';
import { createTestCase, getTestCasesList } from '@/entities/test-case/api';
import { CASE_MESSAGE_CODES } from '@/entities/test-case/model/message-codes';
import { testCaseQueryKeys } from '@/features/cases-list';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type TestCasesListCache = Awaited<ReturnType<typeof getTestCasesList>>;

export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTestCase) => {
      const result = await createTestCase(input);
      if (!result.success) {
        const message =
          Object.values(result.errors ?? {})
            .flat()
            .join(', ') || CASE_MESSAGE_CODES.CREATE_FAILED;
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
      const previousQueries = queryClient.getQueriesData<TestCasesListCache>({
        queryKey: testCaseQueryKeys.list(variables.projectId),
      });

      const optimisticId = `optimistic-${Date.now()}`;
      const now = new Date();

      // Optimistic item
      const optimisticItem: TestCaseListItem & { isOptimistic: true } = {
        id: optimisticId,
        projectId: variables.projectId,
        testSuiteId: variables.testSuiteId ?? undefined,
        sectionId: variables.sectionId ?? null,
        displayId: 0,
        caseKey: '...',
        title: variables.title,
        testType: variables.testType ?? '',
        tags: variables.tags ?? [],
        sortOrder: 0,
        resultStatus: 'untested',
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        lifecycleStatus: 'ACTIVE',
        isOptimistic: true,
      };

      // Prepend optimistic item to all matching list caches
      queryClient.setQueriesData<TestCasesListCache>(
        { queryKey: testCaseQueryKeys.list(variables.projectId) },
        (old) => {
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
        }
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
