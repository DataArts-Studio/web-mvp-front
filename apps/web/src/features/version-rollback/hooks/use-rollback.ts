import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rollbackToVersion } from '@/entities/test-case-version/api/actions';
import { toast } from 'sonner';

export const useRollback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testCaseId, targetVersionNumber }: { testCaseId: string; targetVersionNumber: number }) =>
      rollbackToVersion(testCaseId, targetVersionNumber),
    onSuccess: async (result) => {
      if (result.success) {
        toast.success(result.message || '버전이 복원되었습니다.');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['testCases'] }),
          queryClient.invalidateQueries({ queryKey: ['testCaseVersions'] }),
          queryClient.invalidateQueries({ queryKey: ['testSuites'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ]).catch(() => {});
      } else {
        const errorMsg = Object.values(result.errors).flat().join(', ');
        toast.error(errorMsg || '복원에 실패했습니다.');
      }
    },
    onError: () => {
      toast.error('복원 도중 오류가 발생했습니다.');
    },
  });
};
