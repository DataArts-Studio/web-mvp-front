import { deleteTemplate, templateQueryKeys } from '@/entities/test-case-template/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: async () => {
      await queryClient
        .invalidateQueries({
          queryKey: templateQueryKeys.all,
          refetchType: 'all',
        })
        .catch(() => {});
    },
  });
};
