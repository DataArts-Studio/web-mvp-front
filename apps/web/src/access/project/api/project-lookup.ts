/**
 * 프로젝트 접근 정보 조회 (서버 전용)
 *
 * 'use server' 파일에 두면 이름만으로 존재 여부를 묻는 공개 엔드포인트가 되어
 * 프로젝트 이름 열거에 쓰일 수 있으므로, 서버 컴포넌트·액션 내부에서만 쓰는 일반 모듈로 둔다 (#471).
 */
import * as Sentry from '@sentry/nextjs';
import { getDatabase, projects } from '@testea/db';
import { eq } from 'drizzle-orm';
import 'server-only';

import type { ProjectAccessInfo } from '../model/types';

export async function getProjectAccessInfo(projectName: string): Promise<ProjectAccessInfo | null> {
  const db = getDatabase();

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      identifier: projects.identifier,
      lifecycleStatus: projects.lifecycle_status,
    })
    .from(projects)
    .where(eq(projects.name, projectName))
    .limit(1);

  if (!project || project.lifecycleStatus !== 'ACTIVE') {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    identifierHash: project.identifier,
  };
}

/**
 * 프로젝트 비밀번호 존재 여부 확인 (접근 제어 활성화 여부)
 */
export async function hasProjectPassword(projectName: string): Promise<boolean> {
  const project = await getProjectAccessInfo(projectName);
  if (!project) {
    return false;
  }

  return !!project.identifierHash;
}

/**
 * 프로젝트 존재 여부 확인
 */
export async function checkProjectExists(projectName: string): Promise<boolean> {
  try {
    const project = await getProjectAccessInfo(projectName);
    return project !== null;
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'checkProjectExists' } });
    return false;
  }
}
