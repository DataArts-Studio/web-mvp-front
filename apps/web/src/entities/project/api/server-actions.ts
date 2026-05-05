'use server';

import * as Sentry from '@sentry/nextjs';
import type { ProjectDomain } from '@/entities/project';
import { getDatabase, projects } from '@testea/db';
import type { ActionResult } from '@/shared/types';
import { eq } from 'drizzle-orm';
import { requireProjectAccess } from '@/access/lib/require-access';
import { hashPassword, verifyPassword } from '@/access/lib/password-hash';
import { deleteAccessTokenCookie } from '@/access/lib/cookies';

export type ProjectBasicInfo = Pick<
  ProjectDomain,
  'id' | 'projectName' | 'description' | 'ownerName'
>;

export const getProjectIdBySlug = async (slug: string): Promise<ActionResult<{ id: string }>> => {
  try {
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
    return { success: false, errors: { _project: ['프로젝트를 불러오는 도중 오류가 발생했습니다.'] } };
  }
};

export const getProjectByName = async (name: string): Promise<ActionResult<ProjectBasicInfo>> => {
  try {
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

export const archiveProject = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(id);
    if (!hasAccess) {
      return { success: false, errors: { _project: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
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
      }
    }

    return {
      success: true,
      data: { id: archived.id },
      message: '프로젝트가 휴지통으로 이동되었습니다.',
    }
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'archiveProject' } });
    return {
      success: false,
      errors: { _project: ['프로젝트를 삭제하는 도중 오류가 발생했습니다.'] },
    }
  }
}

export const updateProject = async (
  projectId: string,
  data: { name?: string; description?: string; ownerName?: string },
): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _project: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;

    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    return {
      success: true,
      data: { id: updated.id },
      message: '프로젝트 정보가 수정되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateProject' } });
    return {
      success: false,
      errors: { _project: ['프로젝트 정보를 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const changeProjectIdentifier = async (
  projectId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _project: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    const [project] = await db
      .select({ id: projects.id, identifier: projects.identifier })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    const isValid = await verifyPassword(currentPassword, project.identifier);
    if (!isValid) {
      return {
        success: false,
        errors: { currentPassword: ['현재 비밀번호가 일치하지 않습니다.'] },
      };
    }

    const newHash = await hashPassword(newPassword);

    await db
      .update(projects)
      .set({ identifier: newHash, updated_at: new Date() })
      .where(eq(projects.id, projectId));

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
  confirmName: string,
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