'use server';

import * as Sentry from '@sentry/nextjs';
import { v7 as uuidv7 } from 'uuid';
import { and, eq, isNull } from 'drizzle-orm';
import { getDatabase, testCaseAttachments } from '@/shared/lib/db';
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/db';
import { createSupabaseServerClient } from '@/shared/lib/db/supabase/server';
import type { ActionResult } from '@/shared/types';
import type { Attachment } from '../model/types';
import { ATTACHMENT_LIMITS, BUCKET_NAME } from '../model/constants';

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function buildPublicUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
}

function toAttachment(
  row: typeof testCaseAttachments.$inferSelect,
  supabaseUrl: string,
): Attachment {
  return {
    id: row.id,
    testCaseId: row.test_case_id,
    projectId: row.project_id,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    storagePath: row.storage_path,
    url: buildPublicUrl(supabaseUrl, row.storage_path),
    createdAt: row.created_at,
  };
}

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}

export async function getAttachments(
  testCaseId: string,
): Promise<ActionResult<Attachment[]>> {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(testCaseAttachments)
      .where(and(eq(testCaseAttachments.test_case_id, testCaseId), isNull(testCaseAttachments.archived_at)));

    const supabaseUrl = getSupabaseUrl();
    const attachments = rows.map((row) => toAttachment(row, supabaseUrl));

    return { success: true, data: attachments };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getAttachments' } });
    return {
      success: false,
      errors: { _attachment: ['첨부파일을 불러오는 중 오류가 발생했습니다.'] },
    };
  }
}

export async function uploadAttachment(
  formData: FormData,
): Promise<ActionResult<Attachment>> {
  try {
    const file = formData.get('file') as File | null;
    const testCaseId = formData.get('testCaseId') as string | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file || !testCaseId || !projectId) {
      return {
        success: false,
        errors: { _attachment: ['필수 필드가 누락되었습니다.'] },
      };
    }

    // Access check
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return {
        success: false,
        errors: { _attachment: ['접근 권한이 없습니다.'] },
      };
    }

    // Storage limit
    const storageError = await checkStorageLimit(projectId);
    if (storageError) return storageError;

    // File size validation
    if (file.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE) {
      return {
        success: false,
        errors: { _attachment: ['파일 크기는 10MB를 초과할 수 없습니다.'] },
      };
    }

    // File type validation
    if (
      ATTACHMENT_LIMITS.ALLOWED_TYPES.length > 0 &&
      !ATTACHMENT_LIMITS.ALLOWED_TYPES.includes(file.type as (typeof ATTACHMENT_LIMITS.ALLOWED_TYPES)[number])
    ) {
      return {
        success: false,
        errors: { _attachment: ['지원하지 않는 파일 형식입니다.'] },
      };
    }

    // Max files per case
    const db = getDatabase();
    const existingFiles = await db
      .select({ id: testCaseAttachments.id })
      .from(testCaseAttachments)
      .where(and(eq(testCaseAttachments.test_case_id, testCaseId), isNull(testCaseAttachments.archived_at)));

    if (existingFiles.length >= ATTACHMENT_LIMITS.MAX_FILES_PER_CASE) {
      return {
        success: false,
        errors: {
          _attachment: [
            `테스트 케이스당 최대 ${ATTACHMENT_LIMITS.MAX_FILES_PER_CASE}개의 파일만 첨부할 수 있습니다.`,
          ],
        },
      };
    }

    // Upload to Supabase Storage
    const supabase = await createSupabaseServerClient();
    const fileId = uuidv7();
    const ext = getFileExtension(file.name);
    const storagePath = `${projectId}/${testCaseId}/${fileId}${ext ? `.${ext}` : ''}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      Sentry.captureException(uploadError, {
        extra: { action: 'uploadAttachment:storage' },
      });
      return {
        success: false,
        errors: { _attachment: ['파일 업로드에 실패했습니다.'] },
      };
    }

    // Insert DB record
    const [record] = await db
      .insert(testCaseAttachments)
      .values({
        id: fileId,
        test_case_id: testCaseId,
        project_id: projectId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || null,
        storage_path: storagePath,
        created_at: new Date(),
      })
      .returning();

    if (!record) {
      // Cleanup: remove uploaded file if DB insert fails
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return {
        success: false,
        errors: { _attachment: ['첨부파일 정보 저장에 실패했습니다.'] },
      };
    }

    return {
      success: true,
      data: toAttachment(record, getSupabaseUrl()),
      message: '파일이 업로드되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'uploadAttachment' } });
    return {
      success: false,
      errors: { _attachment: ['파일 업로드 중 오류가 발생했습니다.'] },
    };
  }
}

export async function deleteAttachment(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const db = getDatabase();

    const [existing] = await db
      .select()
      .from(testCaseAttachments)
      .where(eq(testCaseAttachments.id, id));

    if (!existing) {
      return {
        success: false,
        errors: { _attachment: ['첨부파일을 찾을 수 없습니다.'] },
      };
    }

    // Access check
    const hasAccess = await requireProjectAccess(existing.project_id);
    if (!hasAccess) {
      return {
        success: false,
        errors: { _attachment: ['접근 권한이 없습니다.'] },
      };
    }

    // 소프트 딜리트 (스토리지 파일 및 DB 레코드 보존)
    await db
      .update(testCaseAttachments)
      .set({ archived_at: new Date() })
      .where(eq(testCaseAttachments.id, id));

    return {
      success: true,
      data: { id },
      message: '첨부파일이 삭제되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteAttachment' } });
    return {
      success: false,
      errors: { _attachment: ['첨부파일 삭제 중 오류가 발생했습니다.'] },
    };
  }
}
