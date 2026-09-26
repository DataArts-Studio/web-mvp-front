/**
 * 서버 액션 권한 가드용 소유 프로젝트 해석기.
 *
 * 서버 액션은 어느 경로로든 POST 할 수 있어 미들웨어의 /projects/[slug] 보호를 받지 않는다.
 * 그래서 액션마다 "이 식별자가 속한 프로젝트에 접근 토큰이 있는가"를 직접 확인해야 한다.
 * 여기서는 식별자 → project_id 해석과 접근 확인을 한곳에 모은다.
 *
 * 주의: 이 모듈은 'use server' 가 아니다. 클라이언트에서 직접 호출할 수 없는 서버 전용 헬퍼다.
 */
import {
  checklistItems,
  checklists,
  getDatabase,
  milestones,
  projects,
  testCaseTemplates,
  testCases,
  testRuns,
  testSuiteSections,
  testSuites,
} from '@testea/db';
import { eq } from 'drizzle-orm';

import { requireProjectAccess } from './require-access';

export type ProjectScopedKind =
  | 'project'
  | 'slug'
  | 'testRun'
  | 'milestone'
  | 'testSuite'
  | 'testCase'
  | 'checklist'
  | 'checklistItem'
  | 'template'
  | 'section';

/** 권한 없음 응답. 존재 여부를 흘리지 않도록 "없음"과 "권한 없음"을 구분하지 않는다. */
export const ACCESS_DENIED = {
  success: false as const,
  errors: { _general: ['접근 권한이 없습니다.'] },
};

/** 식별자가 속한 project_id 를 찾는다. 없으면 null. */
export async function resolveProjectId(
  kind: ProjectScopedKind,
  id: string | null | undefined
): Promise<string | null> {
  if (!id) return null;
  const db = getDatabase();

  switch (kind) {
    case 'project':
      return id;
    case 'slug': {
      const [row] = await db
        .select({ projectId: projects.id })
        .from(projects)
        .where(eq(projects.name, decodeURIComponent(id)))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'testRun': {
      const [row] = await db
        .select({ projectId: testRuns.project_id })
        .from(testRuns)
        .where(eq(testRuns.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'milestone': {
      const [row] = await db
        .select({ projectId: milestones.project_id })
        .from(milestones)
        .where(eq(milestones.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'testSuite': {
      const [row] = await db
        .select({ projectId: testSuites.project_id })
        .from(testSuites)
        .where(eq(testSuites.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'testCase': {
      const [row] = await db
        .select({ projectId: testCases.project_id })
        .from(testCases)
        .where(eq(testCases.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'checklist': {
      const [row] = await db
        .select({ projectId: checklists.project_id })
        .from(checklists)
        .where(eq(checklists.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'checklistItem': {
      const [row] = await db
        .select({ projectId: checklists.project_id })
        .from(checklistItems)
        .innerJoin(checklists, eq(checklists.id, checklistItems.checklist_id))
        .where(eq(checklistItems.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'template': {
      const [row] = await db
        .select({ projectId: testCaseTemplates.project_id })
        .from(testCaseTemplates)
        .where(eq(testCaseTemplates.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
    case 'section': {
      const [row] = await db
        .select({ projectId: testSuites.project_id })
        .from(testSuiteSections)
        .innerJoin(testSuites, eq(testSuites.id, testSuiteSections.suite_id))
        .where(eq(testSuiteSections.id, id))
        .limit(1);
      return row?.projectId ?? null;
    }
  }
}

/** 식별자가 속한 프로젝트에 현재 요청이 접근 권한을 갖는지. 해석 실패도 false. */
export async function canAccess(
  kind: ProjectScopedKind,
  id: string | null | undefined
): Promise<boolean> {
  const projectId = await resolveProjectId(kind, id);
  return projectId !== null && (await requireProjectAccess(projectId));
}

/** 식별자가 주어진 프로젝트 소속인지. 교차 프로젝트 참조(예: 남의 스위트에 케이스 매달기) 차단용. */
export async function belongsToProject(
  kind: ProjectScopedKind,
  id: string | null | undefined,
  projectId: string
): Promise<boolean> {
  return (await resolveProjectId(kind, id)) === projectId;
}
