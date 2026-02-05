'use client';

import { archiveAction } from '@/features/archive/model/archive-actions';
import type { ArchiveCommand, ArchiveTargetType } from '@/features/archive/model/types';
import type { ActionResult } from '@/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type ArchiveResult = ActionResult<{ id: string }>;

interface UseArchiveOptions {
  onSuccess?: (data: ArchiveResult, variables: ArchiveCommand) => void;
  onError?: (error: Error, variables: ArchiveCommand) => void;
}

const QUERY_KEY_MAP: Record<ArchiveTargetType, string[]> = {
  project: ['projects'],
  milestone: ['milestones'],
  case: ['testCases'],
  suite: ['testSuites'],
};

const ENTITY_NAME_MAP: Record<ArchiveTargetType, string> = {
  project: '프로젝트',
  milestone: '마일스톤',
  case: '테스트 케이스',
  suite: '테스트 스위트',
};

export const useArchive = (options?: UseArchiveOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetType, targetId }: ArchiveCommand): Promise<ArchiveResult> => {
      const result = await archiveAction(targetType, targetId);

      if (!result.success) {
        const errorKey = Object.keys(result.errors)[0];
        const errorMessage = result.errors[errorKey]?.[0] ?? `${ENTITY_NAME_MAP[targetType]} 삭제에 실패했습니다.`;
        throw new Error(errorMessage);
      }

      return result;
    },

    onSuccess: async (data, variables) => {
      const queryKeys = QUERY_KEY_MAP[variables.targetType];

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys }),
        queryClient.invalidateQueries({ queryKey: [queryKeys[0], variables.targetId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);

      options?.onSuccess?.(data, variables);
    },

    onError: (error, variables) => {
      options?.onError?.(error as Error, variables);
    },
  });
};

export type { ArchiveCommand, ArchiveTargetType };
