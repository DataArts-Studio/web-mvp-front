'use server';

import type { ActionResult } from '@/shared/types';
import { getProjectStorageBytes } from '@/shared/lib/db/get-project-storage';
import { LIMITS } from '@/shared/constants/core/limits';

export type StorageInfo = {
  usedBytes: number;
  maxBytes: number;
  usedPercent: number;
};

export async function getStorageInfo(projectId: string): Promise<ActionResult<StorageInfo>> {
  try {
    const usedBytes = await getProjectStorageBytes(projectId);
    const maxBytes = LIMITS.MAX_STORAGE_BYTES;
    const usedPercent = Math.round((usedBytes / maxBytes) * 1000) / 10;

    return {
      success: true,
      data: { usedBytes, maxBytes, usedPercent },
    };
  } catch {
    return {
      success: false,
      errors: { storage: ['용량 정보를 불러올 수 없습니다.'] },
    };
  }
}
