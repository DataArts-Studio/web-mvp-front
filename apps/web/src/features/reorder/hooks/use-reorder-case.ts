'use client';

import { testCaseQueryKeys } from '@/features/cases-list';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { moveTestCaseOrder } from '../api/actions';

interface ReorderCaseParams {
  id: string;
  /** 새 위치 바로 앞 케이스 (맨 앞으로 옮기면 null) */
  beforeId: string | null;
  /** 새 위치 바로 뒤 케이스 (맨 뒤로 옮기면 null) */
  afterId: string | null;
}

const FAILURE_MESSAGE = '순서 변경에 실패했습니다.';

export function useReorderCase(projectId: string) {
  const queryClient = useQueryClient();
  // 순서는 프로젝트 전체에 하나라 다른 스위트·페이지 보기도 함께 다시 불러온다.
  const refetchLists = () =>
    queryClient.invalidateQueries({ queryKey: testCaseQueryKeys.list(projectId) });

  return useMutation({
    mutationFn: ({ id, beforeId, afterId }: ReorderCaseParams) =>
      moveTestCaseOrder(id, { beforeId, afterId }),
    onSuccess: (result) => {
      // 서버 액션은 실패를 예외가 아니라 결과로 돌려주므로 여기서 알린다 (#380).
      if (!result.success) {
        toast.error(Object.values(result.errors).flat()[0] ?? FAILURE_MESSAGE);
      }
      refetchLists();
    },
    onError: () => {
      toast.error(FAILURE_MESSAGE);
      refetchLists();
    },
  });
}
