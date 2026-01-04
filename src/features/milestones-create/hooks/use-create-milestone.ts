import { CreateMilestone, createMilestone } from '@/entities/milestone';
import { milestoneQueryKeys } from '@/features/milestones-create/api/query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMilestone) => createMilestone(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: milestoneQueryKeys.all });
    },
  });
};
