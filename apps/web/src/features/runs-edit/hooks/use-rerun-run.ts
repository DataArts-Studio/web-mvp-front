'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rerunTestRunAction } from '../model/rerun-test-run';

/**
 * 회귀 반복 실행 유도 (FDD-TR12): 원본 Run 을 동일 구성으로 다시 실행하는 새 Run 을 만든다.
 *
 * 성공 시 `['testRuns', projectId]` 와 `['dashboard']` 무효화. projectId 는
 * 서버 액션이 돌려준 새 Run 의 project_id 를 사용한다.
 */
export const useRerunRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      const result = await rerunTestRunAction(runId);
      if (!result.success) {
        throw new Error(result.error || '회귀 재실행 생성에 실패했습니다.');
      }
      return result;
    },
    onSuccess: async (result) => {
      const projectId = result.testRun.project_id;
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
