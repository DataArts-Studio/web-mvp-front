export {
  useAutomationTokenStatus,
  useIssueAutomationToken,
  useRevokeAutomationToken,
} from './hooks';
export type { AutomationTokenStatus } from './api/server-actions';

// 서버 전용 verifier 는 클라이언트 번들에 끌려가지 않도록 본 배럴에서 노출하지 않는다.
// 라우트 핸들러는 다음 경로로 직접 import 한다:
//   import { verifyAutomationTokenFromRequest } from '@/features/automation-token/lib/verify';
