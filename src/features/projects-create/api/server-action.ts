'use server';

import { revalidatePath } from 'next/cache';

import type { CreateProjectDomain, ProjectDomain } from '@/entities';
import { toProjectDto } from '@/entities';
import { getDatabase, projects } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

import { hashPassword } from '@/access/lib/password-hash';
import { createProjectAccessToken } from '@/access/lib/access-token';
import { setAccessTokenCookie } from '@/access/lib/cookies';

// ============================================================================
// Helpers
// ============================================================================
/**
 * @deprecated hashPassword를 대신 사용하세요 (@/access/lib/password-hash)
 */
export async function hashIdentifier(identifier: string): Promise<string> {
  return hashPassword(identifier);
}

// Server Action에서 클라이언트로 전달할 때 Date 객체는 직렬화 불가능하므로 string으로 변환
// identifier(해시)는 보안상 응답에 포함하지 않음
type SerializableProjectDomain = Omit<ProjectDomain, 'createdAt' | 'updatedAt' | 'archivedAt' | 'identifier'> & {
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

/**
 * 프로젝트 생성
 * - CreateProjectDomain을 받아서 DB에 저장
 * - identifier는 해싱하여 저장
 */
export async function createProject(
  input: CreateProjectDomain
): Promise<ActionResult<SerializableProjectDomain>> {
  try {
    const db = getDatabase();
    const dto = toProjectDto(input);
    const hashedIdentifier = await hashPassword(dto.identifier);
    const id = uuidv7();

    // 프로젝트 이름 정규화: trim + 연속 공백을 단일 공백으로 변환
    const normalizedName = dto.name.trim().replace(/\s+/g, ' ');

    const [inserted] = await db
      .insert(projects)
      .values({
        id,
        name: normalizedName,
        identifier: hashedIdentifier,
        description: dto.description ?? null,
        owner_name: dto.owner_name ?? null,
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _form: ['프로젝트 생성에 실패했습니다.'] },
      };
    }

    const result: SerializableProjectDomain = {
      id: inserted.id,
      projectName: inserted.name,
      description: inserted.description ?? undefined,
      ownerName: inserted.owner_name ?? undefined,
      createdAt: inserted.created_at.toISOString(),
      updatedAt: inserted.updated_at.toISOString(),
      archivedAt: inserted.archived_at?.toISOString() ?? null,
      lifecycleStatus: inserted.lifecycle_status,
    };

    // 프로젝트 생성 후 자동으로 접근 토큰 발급 (생성자는 바로 접근 가능)
    console.log('[createProject] 프로젝트 생성 완료:', inserted.name, inserted.id);
    const token = await createProjectAccessToken(inserted.id, inserted.name);
    console.log('[createProject] 토큰 생성 완료');
    await setAccessTokenCookie(inserted.name, token);
    console.log('[createProject] 쿠키 설정 완료:', inserted.name);

    revalidatePath('/projects');
    revalidatePath('/');

    return { success: true, data: result };
  } catch (error) {
    console.error('프로젝트 생성 실패:', error);
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('에러 원인:', (error as any).cause);
    }
    return {
      success: false,
      errors: { _form: ['프로젝트 생성 중 오류가 발생했습니다.'] },
    };
  }
}

const isActive = eq(projects.lifecycle_status, 'ACTIVE');

/**
 * 프로젝트 목록 조회
 * - 삭제되지 않은 프로젝트만 조회
 */
export async function getProjects(): Promise<ActionResult<SerializableProjectDomain[]>> {
  try {
    const db = getDatabase();

    const rows = await db.select().from(projects).where(isActive).orderBy(projects.created_at);

    const result: SerializableProjectDomain[] = rows.map((row) => ({
      id: row.id,
      projectName: row.name,
      description: row.description ?? undefined,
      ownerName: row.owner_name ?? undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at?.toISOString() ?? null,
      lifecycleStatus: row.lifecycle_status,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('프로젝트 목록 조회 실패:', error);
    return {
      success: false,
      errors: { _form: ['프로젝트 목록 조회에 실패했습니다.'] },
    };
  }
}

/**
 * 프로젝트명 중복 체크
 */
export async function checkProjectNameDuplicate(name: string): Promise<ActionResult<boolean>> {
  try {
    const db = getDatabase();
    // 동일한 정규화 적용
    const normalizedName = name.trim().replace(/\s+/g, ' ');

    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.name, normalizedName))
      .limit(1);

    return { success: true, data: !!existing };
  } catch (error) {
    console.error('중복 체크 실패:', error);
    return {
      success: false,
      errors: { _form: ['중복 체크 중 오류가 발생했습니다.'] },
    };
  }
}
