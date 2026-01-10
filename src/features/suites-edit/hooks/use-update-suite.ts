import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTestSuite } from '@/entities/test-suite';
import { UpdateTestSuite } from '../model';

export const useUpdateSuite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTestSuite) => updateTestSuite(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['testSuite'] });
    },
  });
};
