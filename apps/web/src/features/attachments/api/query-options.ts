import { queryOptions } from '@tanstack/react-query';

import { ATTACHMENT_URL_REFRESH_MS } from '../model/constants';
import { getAttachments } from './actions';

// 응답 URL 은 만료되는 서명 URL 이라 만료 전에 다시 받아 둔다.
// 백그라운드 탭에서는 주기 재조회가 멈추므로, 돌아왔을 때 오래된 응답이면 바로 다시 받는다
// (전역 기본값은 포커스 재조회를 끈다).
export const attachmentsQueryOptions = (testCaseId: string) =>
  queryOptions({
    queryKey: ['attachments', testCaseId],
    queryFn: () => getAttachments(testCaseId),
    enabled: !!testCaseId,
    staleTime: ATTACHMENT_URL_REFRESH_MS,
    refetchInterval: ATTACHMENT_URL_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
