/** 공통 도메인 타입 - 여러 엔티티에서 공유하는 타입 정의 */

import { z } from 'zod';

export const LifecycleStatusEnum = z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']);
export type LifecycleStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type TestCaseResultStatus = 'untested' | 'pass' | 'fail' | 'blocked';
