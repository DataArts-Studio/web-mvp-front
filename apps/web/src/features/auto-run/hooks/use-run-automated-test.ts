'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type RunAutomatedTestParams, runAutomatedTest } from '../api/run-automated-test';

/**
 * FDD-TR10 자동 실행 트리거 (단건). frontend 버튼이 이 훅으로 서버액션을 호출한다.
 *
 * 성공 시 해당 Run·대시보드 쿼리를 무효화해 기록된 결과가 화면에 반영되게 한다.
 */
export const useRunAutomatedTest = (projectId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RunAutomatedTestParams) => {
      const result = await runAutomatedTest(params);
      if (!result.success) {
        throw new Error(result.errors._general?.[0] ?? '자동 실행에 실패했습니다.');
      }
      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: projectId ? ['testRuns', projectId] : ['testRuns'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]).catch(() => {});
    },
  });
};
