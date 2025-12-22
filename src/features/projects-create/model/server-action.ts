'use server';
import { revalidatePath } from 'next/cache';

import type { CreateProjectDomain, ProjectDomain } from '@/entities';
import { CreateProjectDtoSchema } from '@/entities';
import { getDatabase, project } from '@/shared/lib/db';
import bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

let mockDatabase: ProjectDomain[] = [];

/**
 * 비밀번호 해싱 (Mock)
 * 실제로는: import bcrypt from 'bcryptjs'; bcrypt.hash(password, 10);
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/** 네트워크 지연 시뮬레이션 */
function simulateNetworkDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO: 빠른 개발용 any 적용
const createProject = async (data: any) => {
  const db = getDatabase();
  return await db.insert(project).values(data).returning();
};

// TODO: 빠른 개발용 any 적용
export const createProjectAction = async (formData: any) => {
  const data = Object.fromEntries(formData.entries());
  const validation = CreateProjectDtoSchema.safeParse(data);
  if (!validation.success) return { success: false, errors: z.flattenError(validation.error) };

  const newProject = await createProject(validation.data);
  return { success: true, project: newProject };
};

/**
 * 프로젝트 생성
 * - 실제 사용자 입력을 받아서 Mock DB에 저장
 * - Supabase 연결 전까지 사용
 */
export async function createProjectMock(
  formData: FormData | CreateProjectDomain
): Promise<ActionResult<ProjectDomain>> {
  try {
    console.log('프로젝트 생성 시작...');
    await simulateNetworkDelay(800);
    let domain: CreateProjectDomain;
    if (formData instanceof FormData) {
      domain = {
        projectName: formData.get('projectName') as string,
        identifier: formData.get('identifier') as string,
        description: formData.get('description') as string | undefined,
        ownerName: formData.get('ownerName') as string | undefined,
      };
    } else {
      domain = formData;
    }

    console.log('받은 입력값:', {
      projectName: domain.projectName,
      ownerName: domain.ownerName,
      description: domain.description,
      passwordLength: domain.identifier?.length,
    });

    // Validation
    if (!domain.projectName || domain.projectName.trim().length === 0) {
      return {
        success: false,
        errors: {
          projectName: ['프로젝트 이름은 필수입니다'],
        },
      };
    }

    if (domain.projectName.length > 50) {
      return {
        success: false,
        errors: {
          name: ['프로젝트 이름은 50자를 넘을 수 없습니다'],
        },
      };
    }

    if (!domain.identifier || domain.identifier.length < 8) {
      return {
        success: false,
        errors: {
          identifier: ['식별번호는 최소 8자리 이상이어야 합니다'],
        },
      };
    }

    // 중복 체크 (실제 DB에서는 UNIQUE 제약조건)
    const isDuplicate = mockDatabase.some(
      (p) => p.projectName.toLowerCase() === domain.projectName.toLowerCase()
    );

    if (isDuplicate) {
      console.log('중복된 프로젝트 이름:', domain.projectName);
      return {
        success: false,
        errors: {
          projectName: [`"${domain.projectName}" 프로젝트가 이미 존재합니다`],
        },
      };
    }

    const hashedPassword = await hashPassword(domain.identifier);
    const newProject: ProjectDomain = {
      id: uuidv7(),
      projectName: domain.projectName,
      identifier: hashedPassword,
      description: domain.description,
      ownerName: domain.ownerName,
      createAt: new Date(),
      updateAt: new Date(),
      deleteAt: null,
    };

    // Mock Database에 INSERT (실제로는 Supabase INSERT)
    mockDatabase.push(newProject);
    console.log('Mock DB에 저장 완료!');
    console.log('저장된 프로젝트:', {
      id: newProject.id,
      name: newProject.projectName,
      ownerName: newProject.ownerName,
      createAt: newProject.createAt.toISOString(),
    });
    console.log('현재 DB에 저장된 프로젝트 수:', mockDatabase.length);
    revalidatePath('/projects');
    revalidatePath('/');
    const { identifier, ...safeProject } = newProject;

    return {
      success: true,
      data: newProject,
    };
  } catch (error) {
    console.error('프로젝트 생성 실패:', error);

    return {
      success: false,
      errors: {
        _form: ['프로젝트 생성 중 오류가 발생했습니다'],
      },
    };
  }
}

/** 프로젝트 목록 조회 (Mock DB에서 조회) */
export async function getProjectsMock(): Promise<ActionResult<ProjectDomain[]>> {
  try {
    await simulateNetworkDelay(300);
    console.log('프로젝트 목록 조회');
    console.log('DB에 저장된 프로젝트 수:', mockDatabase.length);

    // 삭제되지 않은 프로젝트만 조회
    const activeProjects = mockDatabase
      .filter((p) => !p.deleteAt)
      .sort((a, b) => b.createAt.getTime() - a.createAt.getTime());

    return {
      success: true,
      data: activeProjects,
    };
  } catch (error) {
    console.error('목록 조회 실패:', error);
    return {
      success: false,
      errors: {
        _form: ['프로젝트 목록 조회 실패'],
      },
    };
  }
}
