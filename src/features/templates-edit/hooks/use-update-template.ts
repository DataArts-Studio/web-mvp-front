import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateTestCaseTemplate } from '@/entities/test-case-template';
import { updateTemplate, templateQueryKeys } from '@/entities/test-case-template/api';

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTestCaseTemplate) => updateTemplate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: templateQueryKeys.all,
        refetchType: 'all',
      }).catch(() => {});
    },
  });
};
