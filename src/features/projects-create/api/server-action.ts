'use server';

import { revalidatePath } from 'next/cache';

import type { CreateProjectDomain, ProjectDomain } from '@/entities';
import { toProjectDto } from '@/entities';
import { getDatabase, projects } from '@/shared/lib/db';
import bcrypt from 'bcryptjs';
import { eq, isNull } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

// ============================================================================
// Types
// ============================================================================
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

// ============================================================================
// Helpers
// ============================================================================
export async function hashIdentifier(identifier: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(identifier, saltRounds);
}

/**
 * 프로젝트 생성
 * - CreateProjectDomain을 받아서 DB에 저장
 * - identifier는 해싱하여 저장
 */
export async function createProject(
  input: CreateProjectDomain
): Promise<ActionResult<ProjectDomain>> {
  try {
    const db = getDatabase();
    const dto = toProjectDto(input);
    const hashedIdentifier = await hashIdentifier(dto.identifier);
    const id = uuidv7();

    const [inserted] = await db
      .insert(projects)
      .values({
        id,
        name: dto.name,
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

    const result: ProjectDomain = {
      id: inserted.id,
      projectName: inserted.name,
      identifier: inserted.identifier,
      description: inserted.description ?? undefined,
      ownerName: inserted.owner_name ?? undefined,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
      deletedAt: inserted.deleted_at,
    };

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

const isNotDeleted = isNull(projects.deleted_at);

/**
 * 프로젝트 목록 조회
 * - 삭제되지 않은 프로젝트만 조회
 */
export async function getProjects(): Promise<ActionResult<ProjectDomain[]>> {
  try {
    const db = getDatabase();

    const rows = await db.select().from(projects).where(isNotDeleted).orderBy(projects.created_at);

    const result: ProjectDomain[] = rows.map((row) => ({
      id: row.id,
      projectName: row.name,
      identifier: row.identifier,
      description: row.description ?? undefined,
      ownerName: row.owner_name ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
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

    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.name, name))
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
