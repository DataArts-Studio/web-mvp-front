import { deleteProject } from '@/entities/project';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeleteProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { projectId: string; confirmName: string }) =>
      deleteProject(input.projectId, input.confirmName),
    onSuccess: async (result) => {
      if (result.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
          queryClient.invalidateQueries({ queryKey: ['project'] }),
        ]).catch(() => {});
        router.push('/');
      }
    },
  });
};
