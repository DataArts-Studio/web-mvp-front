import { deleteProject } from '@/entities/project';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeleteProject = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { projectId: string; confirmName: string }) =>
      deleteProject(input.projectId, input.confirmName),
    onSuccess: (result) => {
      if (result.success) {
        router.push('/');
      }
    },
  });
};
