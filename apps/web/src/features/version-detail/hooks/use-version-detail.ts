import { versionDetailQueryOptions } from '@/entities/test-case-version/api/query';
import { useQuery } from '@tanstack/react-query';

export const useVersionDetail = (testCaseId: string, versionNumber: number) => {
  return useQuery(versionDetailQueryOptions(testCaseId, versionNumber));
};
