import { LIMITS } from '@/shared/constants/core';
import type { ActionResult } from '@/shared/types';
import { getProjectStorageBytes } from './get-project-storage';

/**
 * 프로젝트의 저장 용량이 제한을 초과하는지 확인합니다.
 * 초과 시 에러 결과를 반환하고, 초과하지 않으면 null을 반환합니다.
 */
export async function checkStorageLimit(projectId: string): Promise<ActionResult<null> | null> {
  const bytes = await getProjectStorageBytes(projectId);

  if (bytes >= LIMITS.MAX_STORAGE_BYTES) {
    return {
      success: false,
      errors: { _storage: ['프로젝트 저장 용량(50MB)을 초과하였습니다.'] },
    };
  }

  return null;
}
