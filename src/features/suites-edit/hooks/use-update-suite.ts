import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestSuite } from '@/entities/test-suite';
import { UpdateTestSuite } from '../model';

export const useUpdateSuite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTestSuite) => updateTestSuite(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['testSuites'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
};
