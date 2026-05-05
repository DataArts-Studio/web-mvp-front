import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMilestone } from '@/entities/milestone';
import { UpdateMilestone } from '../model';

export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMilestone) =>
      updateMilestone({
        id: input.id,
        title: input.title,
        description: input.description,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      }),
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
