'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addSuitesToRunAction } from '../model/add-suites-to-run';
import { addMilestonesToRunAction } from '../model/add-milestones-to-run';
import { addCasesToRunAction } from '../model/add-cases-to-run';

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
      }
    },
  });
};

export const useAddMilestonesToRun = (runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestoneIds: string[]) =>
      addMilestonesToRunAction(runId, milestoneIds),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ['testRun', runId],
          refetchType: 'all',
        });
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
      }
    },
  });
};
