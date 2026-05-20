import type { CreateTestCaseTemplate } from '@/entities/test-case-template';
import { createTemplate, templateQueryKeys } from '@/entities/test-case-template/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestCaseTemplate) => createTemplate(input),
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
