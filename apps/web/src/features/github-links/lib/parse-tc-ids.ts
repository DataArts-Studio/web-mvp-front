/** 한 PR 에서 연결할 수 있는 TC 개수 상한. 본문에 TC 키를 대량으로 넣어 DB 조회·쓰기를 키우지 못하게 한다. */
export const MAX_TC_IDS_PER_PR = 50;

/** display_id 컬럼(int4) 이 담을 수 있는 최댓값. 넘는 값은 조회해도 일치할 수 없어 버린다. */
const INT4_MAX = 2_147_483_647;

/** PR 제목·본문에서 TC-XXX 패턴을 파싱해 중복 없는 display_id 목록을 돌려준다. */
export function parseTcIds(text: string): number[] {
  const matches = text.match(/TC-(\d{3,})/gi);
  if (!matches) return [];

  const ids = new Set<number>();
  for (const match of matches) {
    const id = Number(match.slice(3));
    if (!Number.isSafeInteger(id) || id > INT4_MAX) continue;
    ids.add(id);
    if (ids.size >= MAX_TC_IDS_PER_PR) break;
  }
  return [...ids];
}
