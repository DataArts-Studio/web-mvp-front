import type { UpdateTestCaseTemplate } from '@/entities/test-case-template';
import { templateQueryKeys, updateTemplate } from '@/entities/test-case-template/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTestCaseTemplate) => updateTemplate(input),
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
