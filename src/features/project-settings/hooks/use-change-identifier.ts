import { changeProjectIdentifier } from '@/entities/project';
import { useMutation } from '@tanstack/react-query';

export const useChangeIdentifier = () => {
  return useMutation({
    mutationFn: (input: { projectId: string; currentPassword: string; newPassword: string }) =>
      changeProjectIdentifier(input.projectId, input.currentPassword, input.newPassword),
  });
};
