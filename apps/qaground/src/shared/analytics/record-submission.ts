import { isAllowedAnalyticsHost } from '@/shared/analytics/host';

type SubmissionKind = 'code' | 'api' | 'defect' | 'testcase';

/** 같은 브라우저의 제출을 느슨히 묶는 익명 ID(localStorage). 개인정보 아님. */
function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.localStorage.getItem('qaground_anon_id');
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem('qaground_anon_id', id);
    }
    return id;
  } catch {
    return '';
  }
}

/**
 * 사용자 제출(코드·답안)과 결과를 익명으로 서버에 기록한다(베스트 에포트).
 * 운영 호스트(qaground.gettestea.com) 밖에서는 개발 데이터 오염을 막기 위해 기록하지 않는다.
 *
 * 응답을 기다리지 않고 fire-and-forget 하므로 제출 UX 를 막지 않는다.
 * GA 의 집계 이벤트와 달리 실제 작성 내용을 저장해 분석·통계에 쓴다.
 */
export function recordSubmission(payload: {
  slug: string;
  kind: SubmissionKind;
  content: unknown;
  result?: unknown;
}): void {
  if (typeof window === 'undefined' || !isAllowedAnalyticsHost()) return;
  try {
    void fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, anonId: getAnonId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 기록 실패는 무시(베스트 에포트).
  }
}
