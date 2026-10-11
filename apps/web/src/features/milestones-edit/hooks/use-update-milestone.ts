import { updateMilestone } from '@/entities/milestone';
import { joinActionErrors } from '@/shared/lib/translate-error-codes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UpdateMilestone } from '../model';

export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 서버 액션은 실패를 { success: false } 로 돌려주므로 오류로 바꿔야 onError 가 실행된다 (#371).
    mutationFn: async (input: UpdateMilestone) => {
      const result = await updateMilestone({
        id: input.id,
        title: input.title,
        description: input.description,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      });
      if (!result.success) {
        throw new Error(joinActionErrors(result.errors) || '마일스톤을 수정하지 못했습니다.');
      }
      return result;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['milestones'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: ['milestone', variables.id],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]).catch(() => {});
    },
  });
};
