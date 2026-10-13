import { updateMilestone } from '@/entities/milestone';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UpdateMilestone } from '../model';

const MILESTONE_UPDATE_FAILED = '마일스톤 수정에 실패했습니다.';

export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMilestone) => {
      const result = await updateMilestone({
        id: input.id,
        title: input.title,
        description: input.description,
        // 'YYYY-MM-DD' 그대로 넘긴다. Date 로 바꾸면 UTC 변환으로 하루 앞당겨진다 (#381).
        startDate: input.startDate || null,
        endDate: input.endDate || null,
      }).catch(() => {
        throw new Error(MILESTONE_UPDATE_FAILED);
      });
      // 서버 액션은 실패를 예외가 아니라 결과로 돌려주므로 여기서 오류로 바꾼다.
      if (!result.success) {
        const message =
          Object.values(result.errors ?? {})
            .flat()
            .join(', ') || MILESTONE_UPDATE_FAILED;
        throw new Error(message);
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
