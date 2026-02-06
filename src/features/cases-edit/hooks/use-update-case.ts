import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestCase } from '@/entities/test-case/api';
import { UpdateTestCase } from '../model';

export const useUpdateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTestCase) => updateTestCase(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['testCases'] }),
        queryClient.invalidateQueries({ queryKey: ['testSuites'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
};
