import { updateProject } from '@/entities/project';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { projectId: string; name?: string; description?: string; ownerName?: string }) =>
      updateProject(input.projectId, {
        name: input.name,
        description: input.description,
        ownerName: input.ownerName,
      }),
    onSuccess: async () => {
      await queryClient
        .invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
        .catch(() => {});
    },
  });
};
