export {
  targetSiteKeys,
  useTargetSites,
  useCreateTargetSite,
  useUpdateTargetSite,
  useDeleteTargetSite,
} from './hooks';
export {
  createTargetSite,
  listTargetSites,
  updateTargetSite,
  deleteTargetSite,
} from './api/server-actions';
export {
  CreateTargetSiteSchema,
  UpdateTargetSiteSchema,
  DeleteTargetSiteSchema,
  TargetSiteAuthSecretSchema,
} from './model/schema';
export type {
  CreateTargetSiteInput,
  UpdateTargetSiteInput,
  DeleteTargetSiteInput,
} from './model/schema';
export type { TargetSite, TargetSiteAuthSecret } from './model/types';

// 러너 주입용 복호화 함수는 서버 전용('server-only')이라 클라이언트 번들에 끌려가지
// 않도록 본 배럴에서 노출하지 않는다. 러너 라우트 핸들러는 직접 import 한다:
//   import { getTargetSiteForExecution } from '@/features/target-sites/api/get-target-site-for-execution';
// (TargetSiteExecutionConfig 타입도 동일 경로 또는 model/types 에서 직접 import)
