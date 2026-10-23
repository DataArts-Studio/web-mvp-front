import { type CaseSpecStatus, caseGeneratedSpecs, getDatabase } from '@testea/db';
import { and, eq, ne, sql } from 'drizzle-orm';
import 'server-only';

/**
 * case_generated_specs 읽기·쓰기. 호출부(서버 액션)가 프로젝트·케이스·대상 소속을
 * 검증한 뒤에 부른다. 모든 조건에 project_id 를 함께 건다.
 */

export interface StoredCaseSpec {
  spec: string;
  status: CaseSpecStatus;
  path: string | null;
  updatedAt: Date;
}

interface CaseSpecKey {
  projectId: string;
  caseId: string;
  targetSiteId: string;
}

function whereKey(key: CaseSpecKey) {
  return and(
    eq(caseGeneratedSpecs.project_id, key.projectId),
    eq(caseGeneratedSpecs.test_case_id, key.caseId),
    eq(caseGeneratedSpecs.target_site_id, key.targetSiteId)
  );
}

export async function findCaseSpec(key: CaseSpecKey): Promise<StoredCaseSpec | null> {
  const [row] = await getDatabase()
    .select({
      spec: caseGeneratedSpecs.spec,
      status: caseGeneratedSpecs.status,
      path: caseGeneratedSpecs.path,
      updatedAt: caseGeneratedSpecs.updated_at,
    })
    .from(caseGeneratedSpecs)
    .where(whereKey(key))
    .limit(1);
  return row ?? null;
}

/**
 * 자동 생성한 spec 을 초안으로 남긴다. 이미 승인된 spec 은 덮어쓰지 않는다.
 * 대상 앱의 회귀를 LLM 이 코드를 고쳐 가리는 일을 막기 위해서다.
 */
export async function saveDraftSpec(
  key: CaseSpecKey & { spec: string; path: string | null }
): Promise<void> {
  await getDatabase()
    .insert(caseGeneratedSpecs)
    .values({
      project_id: key.projectId,
      test_case_id: key.caseId,
      target_site_id: key.targetSiteId,
      spec: key.spec,
      path: key.path,
      status: 'draft',
    })
    .onConflictDoUpdate({
      target: [caseGeneratedSpecs.test_case_id, caseGeneratedSpecs.target_site_id],
      set: { spec: key.spec, path: key.path, updated_at: sql`now()` },
      setWhere: and(
        eq(caseGeneratedSpecs.project_id, key.projectId),
        ne(caseGeneratedSpecs.status, 'approved')
      ),
    });
}

/** 사람이 확인한 spec 을 승인 상태로 저장한다. 수정본이면 그 내용으로 바꾼다. */
export async function approveSpec(key: CaseSpecKey & { spec: string }): Promise<boolean> {
  const rows = await getDatabase()
    .update(caseGeneratedSpecs)
    .set({ spec: key.spec, status: 'approved', approved_at: sql`now()`, updated_at: sql`now()` })
    .where(whereKey(key))
    .returning({ id: caseGeneratedSpecs.id });
  return rows.length > 0;
}

/** 승인을 풀어 다음 실행부터 다시 자동 생성하게 한다. */
export async function revokeSpecApproval(key: CaseSpecKey): Promise<boolean> {
  const rows = await getDatabase()
    .update(caseGeneratedSpecs)
    .set({ status: 'draft', approved_at: null, updated_at: sql`now()` })
    .where(whereKey(key))
    .returning({ id: caseGeneratedSpecs.id });
  return rows.length > 0;
}
