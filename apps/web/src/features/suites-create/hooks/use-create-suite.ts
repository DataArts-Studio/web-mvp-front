import { type CreateTestSuite, createTestSuite } from '@/entities';
import { SUITE_MESSAGE_CODES } from '@/entities/test-suite/model/message-codes';
import { joinActionErrors } from '@/shared/lib/translate-error-codes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateSuite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 서버 액션은 실패를 { success: false } 로 돌려주므로 오류로 바꿔야 onError 가 실행된다 (#371).
    mutationFn: async (input: CreateTestSuite) => {
      const result = await createTestSuite(input);
      if (!result.success) {
        throw new Error(joinActionErrors(result.errors) || SUITE_MESSAGE_CODES.CREATE_FAILED);
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
