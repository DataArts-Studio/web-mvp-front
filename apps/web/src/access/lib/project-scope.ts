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
import { AsyncLocalStorage } from 'node:async_hooks';

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

/**
 * 캐시 바깥에서 이미 쿠키로 권한을 확인한 프로젝트 목록 (요청 단위).
 *
 * unstable_cache 콜백 안에서는 cookies() 를 읽을 수 없다. 그래서 서버 컴포넌트 프리패치는
 * 캐시 바깥에서 먼저 권한을 확인하고, 그 호출 범위에만 "확인 완료" 표시를 실어 캐시 안의
 * 액션이 쿠키 없이 통과하게 한다. 클라이언트가 직접 호출한 서버 액션은 이 범위 밖에서
 * 실행되므로 표시를 위조할 수 없다.
 */
const verifiedProjects = new AsyncLocalStorage<ReadonlySet<string>>();

/** 식별자가 속한 프로젝트에 현재 요청이 접근 권한을 갖는지. 해석 실패도 false. */
export async function canAccess(
  kind: ProjectScopedKind,
  id: string | null | undefined
): Promise<boolean> {
  const projectId = await resolveProjectId(kind, id);
  if (projectId === null) return false;
  if (verifiedProjects.getStore()?.has(projectId)) return true;
  return requireProjectAccess(projectId);
}

/**
 * 쿠키로 권한을 확인한 뒤, 확인된 프로젝트 범위 안에서 fn 을 실행한다.
 * 캐시(unstable_cache) 로 감싼 조회를 서버 컴포넌트에서 부를 때 쓴다. 권한이 없으면 fn 을
 * 부르지 않고 ACCESS_DENIED 를 돌려준다(캐시 조회도 하지 않는다).
 */
export async function withVerifiedAccess<T>(
  kind: ProjectScopedKind,
  id: string | null | undefined,
  fn: () => Promise<T>
): Promise<T | typeof ACCESS_DENIED> {
  const projectId = await resolveProjectId(kind, id);
  if (projectId === null || !(await requireProjectAccess(projectId))) return ACCESS_DENIED;
  const current = verifiedProjects.getStore();
  const next = new Set(current ?? []);
  next.add(projectId);
  return verifiedProjects.run(next, fn);
}

/** 식별자가 주어진 프로젝트 소속인지. 교차 프로젝트 참조(예: 남의 스위트에 케이스 매달기) 차단용. */
export async function belongsToProject(
  kind: ProjectScopedKind,
  id: string | null | undefined,
  projectId: string
): Promise<boolean> {
  return (await resolveProjectId(kind, id)) === projectId;
}
