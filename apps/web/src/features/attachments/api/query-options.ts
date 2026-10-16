import { queryOptions } from '@tanstack/react-query';

import { ATTACHMENT_URL_REFRESH_MS } from '../model/constants';
import { getAttachments } from './actions';

// 응답 URL 은 만료되는 서명 URL 이라 만료 전에 다시 받아 둔다.
export const attachmentsQueryOptions = (testCaseId: string) =>
  queryOptions({
    queryKey: ['attachments', testCaseId],
    queryFn: () => getAttachments(testCaseId),
    enabled: !!testCaseId,
    staleTime: ATTACHMENT_URL_REFRESH_MS,
    refetchInterval: ATTACHMENT_URL_REFRESH_MS,
  });
