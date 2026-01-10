import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMilestone } from '@/entities/milestone';
import { UpdateMilestone } from '../model';

export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMilestone) => updateMilestone(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
};
