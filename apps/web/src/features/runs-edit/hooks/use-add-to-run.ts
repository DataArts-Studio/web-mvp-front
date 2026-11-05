'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { addCasesToRunAction } from '../model/add-cases-to-run';
import { addMilestonesToRunAction } from '../model/add-milestones-to-run';
import { addSuitesToRunAction } from '../model/add-suites-to-run';

export const useAddSuitesToRun = (runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suiteIds: string[]) => addSuitesToRunAction(runId, suiteIds),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ['testRun', runId],
          refetchType: 'all',
        });
        // 실행 목록의 진행률·상태도 범위 변경을 반영해야 한다.
        queryClient.invalidateQueries({ queryKey: ['testRuns'] });
      }
    },
  });
};

export const useAddMilestonesToRun = (runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestoneIds: string[]) => addMilestonesToRunAction(runId, milestoneIds),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ['testRun', runId],
          refetchType: 'all',
        });
        // 실행 목록의 진행률·상태도 범위 변경을 반영해야 한다.
        queryClient.invalidateQueries({ queryKey: ['testRuns'] });
      }
    },
  });
};

export const useAddCasesToRun = (runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseIds: string[]) => addCasesToRunAction(runId, caseIds),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ['testRun', runId],
          refetchType: 'all',
        });
        // 실행 목록의 진행률·상태도 범위 변경을 반영해야 한다.
        queryClient.invalidateQueries({ queryKey: ['testRuns'] });
      }
    },
  });
};
