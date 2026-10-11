import { updateTestSuite } from '@/entities/test-suite';
import { SUITE_MESSAGE_CODES } from '@/entities/test-suite/model/message-codes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UpdateTestSuite } from '../model';

export const useUpdateSuite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTestSuite) => {
      const result = await updateTestSuite(input).catch(() => {
        throw new Error(SUITE_MESSAGE_CODES.UPDATE_FAILED);
      });
      if (!result.success) {
        const message =
          Object.values(result.errors ?? {})
            .flat()
            .join(', ') || SUITE_MESSAGE_CODES.UPDATE_FAILED;
        throw new Error(message);
      }
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['testSuites'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]).catch(() => {});
    },
  });
};
