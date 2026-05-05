import { queryOptions } from '@tanstack/react-query';
import { getAttachments } from './actions';

export const attachmentsQueryOptions = (testCaseId: string) =>
  queryOptions({
    queryKey: ['attachments', testCaseId],
    queryFn: () => getAttachments(testCaseId),
    enabled: !!testCaseId,
  });
