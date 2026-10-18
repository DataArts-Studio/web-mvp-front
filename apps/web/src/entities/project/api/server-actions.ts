'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { deleteAccessTokenCookie, setAccessTokenCookie } from '@/access/lib/cookies';
import { hashPassword, verifyPassword } from '@/access/lib/password-hash';
import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { createProjectSessionToken } from '@/access/lib/project-session';
import { requireProjectAccess } from '@/access/lib/require-access';
import type { ProjectDomain } from '@/entities/project';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import { isUniqueViolation } from '@/shared/lib/db-error';
import { toValidName } from '@/shared/lib/normalize-name';
import { clearRateLimit, consumeRateLimit, getClientIp } from '@/shared/lib/rate-limit';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, projects } from '@testea/db';
import { eq } from 'drizzle-orm';

import { PROJECT_NAME_ERRORS } from '../model/constants';

const PROJECT_NAME_MAX_LENGTH = 50;

/** 비밀번호 변경 시 현재 비밀번호 확인도 접근 폼과 같은 횟수·잠금 시간으로 제한한다 (#471). */
const CHANGE_IDENTIFIER_MAX_ATTEMPTS = 5;
const CHANGE_IDENTIFIER_LOCKOUT_MS = 15 * 60 * 1000;

export type ProjectBasicInfo = Pick<
  ProjectDomain,
  'id' | 'projectName' | 'description' | 'ownerName'
>;

export const getProjectIdBySlug = async (slug: string): Promise<ActionResult<{ id: string }>> => {
  try {
    if (!(await canAccess('slug', slug))) return ACCESS_DENIED;

    const db = getDatabase();
    const decodedSlug = decodeURIComponent(slug);
    const [row] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.name, decodedSlug))
      .limit(1);

    if (!row) {
      return { success: false, errors: { _project: ['프로젝트를 찾을 수 없습니다.'] } };
    }
    return { success: true, data: { id: row.id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getProjectIdBySlug' } });
    return {
      success: false,
      errors: { _project: ['프로젝트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getProjectByName = async (name: string): Promise<ActionResult<ProjectBasicInfo>> => {
  try {
    if (!(await canAccess('slug', name))) return ACCESS_DENIED;

    const db = getDatabase();
    // URL 인코딩된 name을 디코딩
    const decodedName = decodeURIComponent(name);
    const [row] = await db.select().from(projects).where(eq(projects.name, decodedName)).limit(1);

    if (!row) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    const result: ProjectBasicInfo = {
      id: row.id,
      projectName: row.name,
      description: row.description ?? undefined,
      ownerName: row.owner_name ?? undefined,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getProjectByName' } });
    return {
      success: false,
      errors: { _project: ['프로젝트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getProjectById = async (id: string): Promise<ActionResult<ProjectBasicInfo>> => {
  try {
    if (!(await canAccess('project', id))) return ACCESS_DENIED;

    const db = getDatabase();
    const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!row) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    const result: ProjectBasicInfo = {
      id: row.id,
      projectName: row.name,
      description: row.description ?? undefined,
      ownerName: row.owner_name ?? undefined,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getProjectById' } });
    return {
      success: false,
      errors: { _project: ['프로젝트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 프로젝트 보관(소프트 삭제). 프로젝트 삭제와 같은 결과라 같은 이름 재확인을 요구한다.
 * 확인 없이 부르면 설정 화면의 삭제 확인 절차를 건너뛸 수 있기 때문이다 (#471).
 */
export const archiveProject = async (
  id: string,
  confirmName: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(id);
    if (!hasAccess) {
      return { success: false, errors: { _project: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const [target] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!target) {
      return { success: false, errors: { _project: ['프로젝트를 찾을 수 없습니다.'] } };
    }
    if (target.name !== confirmName) {
      return { success: false, errors: { confirmName: ['프로젝트 이름이 일치하지 않습니다.'] } };
    }

    const [archived] = await db
      .update(projects)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'DELETED',
        updated_at: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    if (!archived) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    invalidateCache(INVALIDATE.project);
    return {
      success: true,
      data: { id: archived.id },
      message: '프로젝트가 휴지통으로 이동되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'archiveProject' } });
    return {
      success: false,
      errors: { _project: ['프로젝트를 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const updateProject = async (
  projectId: string,
  data: { name?: string; description?: string; ownerName?: string }
): Promise<ActionResult<{ id: string; name: string }>> => {
  let renamedTo: string | null = null;
  let result: ActionResult<{ id: string; name: string }>;
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _project: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    const [current] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!current) {
      return { success: false, errors: { _project: ['프로젝트를 찾을 수 없습니다.'] } };
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) {
      const name = toValidName(data.name, PROJECT_NAME_MAX_LENGTH);
      if (!name) {
        return { success: false, errors: { _project: ['프로젝트 이름을 입력해주세요.'] } };
      }
      updateData.name = name.replace(/\s+/g, ' ');
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;

    let updated;
    try {
      [updated] = await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, projectId))
        .returning();
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { success: false, errors: { name: [PROJECT_NAME_ERRORS.TAKEN] } };
      }
      throw error;
    }

    if (!updated) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    // 접근 쿠키 이름과 토큰은 프로젝트 이름(주소)에 묶여 있다. 이름이 바뀌면 새 이름으로
    // 세션을 다시 발급하고 옛 쿠키를 지워, 새 주소에서 비밀번호를 다시 묻지 않게 한다 (#403).
    if (updated.name !== current.name) {
      const token = await createProjectSessionToken(updated.id, updated.name, updated.identifier);
      await setAccessTokenCookie(updated.name, token);
      await deleteAccessTokenCookie(current.name);
      renamedTo = updated.name;
    }

    invalidateCache(INVALIDATE.project);
    result = {
      success: true,
      data: { id: updated.id, name: updated.name },
      message: '프로젝트 정보가 수정되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateProject' } });
    return {
      success: false,
      errors: { _project: ['프로젝트 정보를 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
  // 옛 쿠키를 지운 응답이 옛 주소를 다시 그리면 접근 페이지로 튕기므로, 액션 응답에서 바로
  // 새 주소의 설정 화면으로 보낸다. 이름 변경은 설정 화면에서만 일어난다.
  // redirect 는 예외로 동작하므로 try 밖에서 호출한다.
  if (renamedTo) redirect(`/projects/${encodeURIComponent(renamedTo)}/settings?renamed=1`);
  return result;
};

export const changeProjectIdentifier = async (
  projectId: string,
  currentPassword: string,
  newPassword: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _project: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    const [project] = await db
      .select({ id: projects.id, name: projects.name, identifier: projects.identifier })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    // 세션을 가진 사람이 현재 비밀번호를 무제한으로 맞춰 보지 못하게, 검증 전에 먼저 센다.
    const rateLimitKey = `change-identifier:project:${project.id}:ip:${getClientIp(await headers())}`;
    const attempt = await consumeRateLimit(rateLimitKey, {
      limit: CHANGE_IDENTIFIER_MAX_ATTEMPTS,
      windowMs: CHANGE_IDENTIFIER_LOCKOUT_MS,
      sliding: true,
    });
    if (!attempt.allowed) {
      const minutes = Math.max(1, Math.ceil(attempt.retryAfterMs / 60_000));
      return {
        success: false,
        errors: {
          currentPassword: [
            `현재 비밀번호를 ${CHANGE_IDENTIFIER_MAX_ATTEMPTS}회 잘못 입력해 잠겼습니다. ${minutes}분 후에 다시 시도해주세요.`,
          ],
        },
      };
    }

    const isValid = await verifyPassword(currentPassword, project.identifier);
    if (!isValid) {
      return {
        success: false,
        errors: { currentPassword: ['현재 비밀번호가 일치하지 않습니다.'] },
      };
    }
    await clearRateLimit(rateLimitKey);

    const newHash = await hashPassword(newPassword);

    await db
      .update(projects)
      .set({ identifier: newHash, updated_at: new Date() })
      .where(eq(projects.id, projectId));

    // 해시가 바뀌어 기존 세션은 모두 폐기된다. 변경한 본인은 새 해시로 세션을 다시 발급해
    // 설정 화면에서 바로 튕겨 나가지 않게 한다. 다른 브라우저·기기의 세션은 폐기된 채로 둔다.
    const token = await createProjectSessionToken(project.id, project.name, newHash);
    await setAccessTokenCookie(project.name, token);

    return {
      success: true,
      data: { id: project.id },
      message: '비밀번호가 변경되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'changeProjectIdentifier' } });
    return {
      success: false,
      errors: { _project: ['비밀번호를 변경하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const deleteProject = async (
  projectId: string,
  confirmName: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _project: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    const [project] = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    if (project.name !== confirmName) {
      return {
        success: false,
        errors: { confirmName: ['프로젝트 이름이 일치하지 않습니다.'] },
      };
    }

    await db
      .update(projects)
      .set({
        lifecycle_status: 'DELETED',
        archived_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(projects.id, projectId));

    await deleteAccessTokenCookie(project.name);

    invalidateCache(INVALIDATE.project);
    return {
      success: true,
      data: { id: project.id },
      message: '프로젝트가 삭제되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteProject' } });
    return {
      success: false,
      errors: { _project: ['프로젝트를 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};
