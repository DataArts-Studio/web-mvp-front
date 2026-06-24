import type { ComponentType } from 'react';

import { LoginSandbox } from './login-sandbox';

/** 샌드박스 슬러그 → 테스트 대상 컴포넌트. 챌린지 레지스트리의 sandboxSlug 와 매칭. */
export const SANDBOXES: Record<string, ComponentType> = {
  'login-basic': LoginSandbox,
};
