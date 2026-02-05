'use server';

import type { ProjectDomain } from '@/entities/project';
import { getDatabase, projects } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { eq } from 'drizzle-orm';

export type ProjectBasicInfo = Pick<
  ProjectDomain,
  'id' | 'projectName' | 'identifier' | 'description' | 'ownerName'
>;

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
      identifier: row.identifier,
      description: row.description ?? undefined,
      ownerName: row.owner_name ?? undefined,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error fetching project:', error);
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
      identifier: row.identifier,
      description: row.description ?? undefined,
      ownerName: row.owner_name ?? undefined,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return {
      success: false,
      errors: { _project: ['프로젝트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const archiveProject = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();
    const [archived] = await db
      .update(projects)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'ARCHIVED',
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
      message: '프로젝트가 성공적으로 삭제되었습니다.',
    }
  } catch (error) {
    console.error('Error archiving project:', error);
    return {
      success: false,
      errors: { _project: ['프로젝트를 삭제하는 도중 오류가 발생했습니다.'] },
    }
  }
}