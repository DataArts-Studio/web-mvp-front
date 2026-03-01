import { queryOptions } from '@tanstack/react-query';
import { getSharedReport } from './share-actions';

export const sharedReportQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['sharedReport', token],
    queryFn: () => getSharedReport(token),
  });
