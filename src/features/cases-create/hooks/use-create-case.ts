import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CreateTestCase } from '@/entities';
import type { TestCaseListItem } from '@/entities/test-case/model/types';
import { createTestCase } from '@/entities/test-case/api';
import { testCaseQueryKeys } from '@/features/cases-list';
import type { ActionResult } from '@/shared/types';

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

    // 서버 응답 전에 즉시 UI에 반영 (Optimistic Update)
    onMutate: async (input) => {
      const queryKey = testCaseQueryKeys.list(input.projectId);

      // 진행 중인 refetch를 취소하여 optimistic 데이터를 덮어쓰지 않도록
      await queryClient.cancelQueries({ queryKey });

      // 현재 캐시 스냅샷 (롤백용)
      const previousData = queryClient.getQueryData<ActionResult<TestCaseListItem[]>>(queryKey);

      // 임시 항목 생성
      const now = new Date();
      const existingItems = previousData?.success ? previousData.data : [];
      const maxDisplayId = existingItems.reduce((max, item) => Math.max(max, item.displayId), 0);
      const nextDisplayId = maxDisplayId + 1;

      const optimisticItem: TestCaseListItem = {
        id: `optimistic-${Date.now()}`,
        projectId: input.projectId,
        testSuiteId: input.testSuiteId,
        sectionId: input.sectionId ?? null,
        displayId: nextDisplayId,
        caseKey: `TC-${String(nextDisplayId).padStart(3, '0')}`,
        title: input.title,
        testType: input.testType ?? '',
        tags: input.tags ?? [],
        sortOrder: input.sortOrder ?? 0,
        resultStatus: 'untested',
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        lifecycleStatus: 'ACTIVE',
      };

      // 캐시에 즉시 추가
      queryClient.setQueryData<ActionResult<TestCaseListItem[]>>(queryKey, {
        success: true,
        data: [...existingItems, optimisticItem],
      });

      return { previousData, queryKey };
    },

    // 실패 시 롤백
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },

    // 성공/실패 무관하게 서버 데이터로 동기화
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
