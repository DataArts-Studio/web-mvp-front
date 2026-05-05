import { useQuery } from '@tanstack/react-query';
import { versionDetailQueryOptions } from '@/entities/test-case-version/api/query';

export const useVersionDetail = (testCaseId: string, versionNumber: number) => {
  return useQuery(versionDetailQueryOptions(testCaseId, versionNumber));
};
