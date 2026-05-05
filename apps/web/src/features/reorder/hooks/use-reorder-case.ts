'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reorderTestCase, rebalanceSortOrder } from '../api/actions';
import { testCaseQueryKeys } from '@/features/cases-list';
import { calculateMiddleSortOrder } from '../model/sort-utils';
import type { TestCasesListParams } from '@/features/cases-list/api/query';

interface ReorderCaseParams {
  id: string;
  /** sort_order of the item before the new position (null if moving to first) */
  beforeOrder: number | null;
  /** sort_order of the item after the new position (null if moving to last) */
  afterOrder: number | null;
  /** All item IDs in current order (for rebalance fallback) */
  orderedIds: string[];
  projectId: string;
  scopeId: string;
}

export function useReorderCase(projectId: string, queryParams: TestCasesListParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, beforeOrder, afterOrder, orderedIds, scopeId }: ReorderCaseParams) => {
      const newSortOrder = calculateMiddleSortOrder(beforeOrder, afterOrder);

      if (newSortOrder === -1) {
        // Gap exhausted, need rebalance
        return rebalanceSortOrder('testCase', scopeId, orderedIds);
      }

      return reorderTestCase(id, newSortOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseQueryKeys.list(projectId, queryParams) });
    },
    onError: () => {
      toast.error('순서 변경에 실패했습니다.');
      queryClient.invalidateQueries({ queryKey: testCaseQueryKeys.list(projectId, queryParams) });
    },
  });
}
