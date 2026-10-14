import { getDatabase } from '@testea/db';
import { sql } from 'drizzle-orm';
import 'server-only';

type Database = ReturnType<typeof getDatabase>;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * 프로젝트의 케이스 번호(display_id) 할당을 트랜잭션 끝까지 한 요청씩만 하게 잠근다.
 *
 * 다음 번호를 "최댓값 + 1" 로 정하므로, 잠그지 않으면 동시에 만든 요청들이 같은 번호를 읽고
 * 유니크 제약에 걸려 실패한다 (#390). 최댓값 조회와 삽입을 같은 트랜잭션에서 이 잠금 뒤에 한다.
 */
export async function lockCaseNumbers(tx: Transaction, projectId: string): Promise<void> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext('case_display_id'), hashtext(${projectId}))`
  );
}

/** 'TC-001' 형식의 케이스 키. */
export const toCaseKey = (displayId: number): string => `TC-${String(displayId).padStart(3, '0')}`;
