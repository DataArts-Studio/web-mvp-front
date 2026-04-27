import { useQuery } from '@tanstack/react-query';
import { versionsListQueryOptions } from '@/entities/test-case-version/api/query';

export const useVersionsList = (testCaseId: string) => {
  return useQuery(versionsListQueryOptions(testCaseId));
};
