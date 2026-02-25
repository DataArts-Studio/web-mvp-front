'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTrashedItems,
  restoreItem,
  permanentDeleteItem,
  emptyTrash,
} from '../api/trash-actions';
import type { TrashCommand } from '../model/types';

export const trashQueryOptions = (projectId: string) => ({
  queryKey: ['trash', projectId],
  queryFn: () => getTrashedItems(projectId),
  enabled: !!projectId,
});

export const useTrashItems = (projectId: string) => {
  return useQuery(trashQueryOptions(projectId));
};

export const useRestoreItem = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetType, targetId }: TrashCommand) => {
      const result = await restoreItem(projectId, targetType, targetId);
      if (!result.success) {
        const errorKey = Object.keys(result.errors)[0];
        throw new Error(result.errors[errorKey]?.[0] ?? '복원에 실패했습니다.');
      }
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trash'] }),
        queryClient.invalidateQueries({ queryKey: ['testCases'] }),
        queryClient.invalidateQueries({ queryKey: ['testSuites'] }),
        queryClient.invalidateQueries({ queryKey: ['milestones'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]).catch(() => {});
    },
  });
};

export const usePermanentDelete = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetType, targetId }: TrashCommand) => {
      const result = await permanentDeleteItem(projectId, targetType, targetId);
      if (!result.success) {
        const errorKey = Object.keys(result.errors)[0];
        throw new Error(result.errors[errorKey]?.[0] ?? '영구 삭제에 실패했습니다.');
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
};

export const useEmptyTrash = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await emptyTrash(projectId);
      if (!result.success) {
        const errorKey = Object.keys(result.errors)[0];
        throw new Error(result.errors[errorKey]?.[0] ?? '휴지통 비우기에 실패했습니다.');
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
};
