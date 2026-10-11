import { type CreateTestSuite, createTestSuite } from '@/entities';
import { SUITE_MESSAGE_CODES } from '@/entities/test-suite/model/message-codes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateSuite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTestSuite) => {
      // 네트워크 단절 등 요청 자체가 실패하면 브라우저 원문("Failed to fetch") 대신 실패 코드로 알린다.
      const result = await createTestSuite(input).catch(() => {
        throw new Error(SUITE_MESSAGE_CODES.CREATE_FAILED);
      });
      // 서버 액션은 실패를 예외가 아니라 결과로 돌려주므로 여기서 오류로 바꾼다.
      // 그래야 폼의 onError 가 실행되고 모달이 실패 상태로 남는다.
      if (!result.success) {
        const message =
          Object.values(result.errors ?? {})
            .flat()
            .join(', ') || SUITE_MESSAGE_CODES.CREATE_FAILED;
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
