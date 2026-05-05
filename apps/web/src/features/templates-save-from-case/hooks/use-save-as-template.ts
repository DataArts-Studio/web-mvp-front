import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTemplateFromCase, templateQueryKeys } from '@/entities/test-case-template/api';

type SaveAsTemplateInput = {
  caseId: string;
  name: string;
  description?: string;
};

export const useSaveAsTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveAsTemplateInput) =>
      createTemplateFromCase(input.caseId, input.name, input.description),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: templateQueryKeys.all,
        refetchType: 'all',
      }).catch(() => {});
    },
  });
};
