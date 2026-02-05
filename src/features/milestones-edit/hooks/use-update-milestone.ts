import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMilestone } from '@/entities/milestone';
import { UpdateMilestone } from '../model';

export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMilestone) => updateMilestone(input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['milestones'] }),
        queryClient.invalidateQueries({ queryKey: ['milestone', variables.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
};
