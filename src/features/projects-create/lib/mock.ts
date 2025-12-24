'use server';

import { revalidatePath } from 'next/cache';

import type { CreateProjectDomain, ProjectDomain } from '@/entities';
import type { ActionResult } from '@/features';
import { hashIdentifier } from '@/features';
import { v7 as uuidv7 } from 'uuid';

// ============================================================================
// Mock Database (테스트 및 개발용)
// ============================================================================
let mockDatabase: ProjectDomain[] = [];

/** Mock DB 초기화 (테스트용) */
export async function resetMockDatabase(): Promise<void> {
  mockDatabase = [];
}

/** Mock DB 조회 (테스트용) */
export async function getMockDatabase(): Promise<ProjectDomain[]> {
  return [...mockDatabase];
}

// ============================================================================
// Helpers
// ============================================================================
function simulateNetworkDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Mock Actions
// ============================================================================
/**
 * 프로젝트 생성 (Mock)
 * - 실제 DB 대신 인메모리 배열에 저장
 * - 테스트 및 DB 연결 전 개발용
 */
export async function createProjectMock(
  input: CreateProjectDomain
): Promise<ActionResult<ProjectDomain>> {
  try {
    await simulateNetworkDelay(100);

    // Validation
    if (!input.projectName || input.projectName.trim().length === 0) {
      return {
        success: false,
        errors: { projectName: ['프로젝트 이름은 필수입니다'] },
      };
    }

    if (input.projectName.length > 50) {
      return {
        success: false,
        errors: { projectName: ['프로젝트 이름은 50자를 넘을 수 없습니다'] },
      };
    }

    if (!input.identifier || input.identifier.length < 8) {
      return {
        success: false,
        errors: { identifier: ['식별번호는 최소 8자리 이상이어야 합니다'] },
      };
    }

    // 중복 체크
    const isDuplicate = mockDatabase.some(
      (p) => p.projectName.toLowerCase() === input.projectName.toLowerCase()
    );

    if (isDuplicate) {
      return {
        success: false,
        errors: { projectName: [`"${input.projectName}" 프로젝트가 이미 존재합니다`] },
      };
    }

    const hashedIdentifier = await hashIdentifier(input.identifier);
    const newProject: ProjectDomain = {
      id: uuidv7(),
      projectName: input.projectName,
      identifier: hashedIdentifier,
      description: input.description,
      ownerName: input.ownerName,
      createAt: new Date(),
      updateAt: new Date(),
      deleteAt: null,
    };

    mockDatabase.push(newProject);
    revalidatePath('/projects');
    revalidatePath('/');

    return { success: true, data: newProject };
  } catch (error) {
    console.error('프로젝트 생성 실패:', error);
    return {
      success: false,
      errors: { _form: ['프로젝트 생성 중 오류가 발생했습니다'] },
    };
  }
}

/**
 * 프로젝트 목록 조회 (Mock)
 */
export async function getProjectsMock(): Promise<ActionResult<ProjectDomain[]>> {
  try {
    await simulateNetworkDelay(50);

    const activeProjects = mockDatabase
      .filter((p) => !p.deleteAt)
      .sort((a, b) => b.createAt.getTime() - a.createAt.getTime());

    return { success: true, data: activeProjects };
  } catch (error) {
    console.error('목록 조회 실패:', error);
    return {
      success: false,
      errors: { _form: ['프로젝트 목록 조회 실패'] },
    };
  }
}

/**
 * 프로젝트명 중복 체크 (Mock)
 */
export async function checkProjectNameDuplicateMock(name: string): Promise<ActionResult<boolean>> {
  try {
    await simulateNetworkDelay(50);

    const exists = mockDatabase.some((p) => p.projectName.toLowerCase() === name.toLowerCase());

    return { success: true, data: exists };
  } catch (error) {
    return {
      success: false,
      errors: { _form: ['중복 체크 중 오류가 발생했습니다'] },
    };
  }
}
