import { versionsListQueryOptions } from '@/entities/test-case-version/api/query';
import { useQuery } from '@tanstack/react-query';

export const useVersionsList = (testCaseId: string) => {
  return useQuery(versionsListQueryOptions(testCaseId));
};
