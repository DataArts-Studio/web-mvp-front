import { parseSteps, serializeSteps } from './step-utils';

/**
 * Testea CSV 열 이름. 내보내기와 가져오기 자동 매핑이 같은 이름을 써야
 * 내보낸 파일을 그대로 다시 가져올 수 있다 (#382).
 */
export const CASE_CSV_COLUMNS = {
  caseKey: '케이스 키',
  title: '제목',
  testType: '테스트 유형',
  tags: '태그',
  preCondition: '사전조건',
  steps: '단계',
  expectedResult: '기대결과',
  resultStatus: '결과 상태',
  suite: '스위트',
  createdAt: '생성일',
  updatedAt: '수정일',
} as const;

/** 단계(JSON 배열 저장)를 사람이 읽는 번호 목록으로 바꾼다. 단계가 하나면 번호 없이 둔다. */
export function stepsToCsvText(raw: string): string {
  const steps = parseSteps(raw).filter((step) => step.trim());
  if (steps.length <= 1) return steps[0] ?? '';
  return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
}

/** CSV 의 단계 텍스트를 저장 형식으로 되돌린다. 번호 목록이면 단계별로 나눈다. */
export function csvTextToSteps(text: string): string {
  if (!text.trim()) return '';
  return serializeSteps(parseSteps(text.trim()));
}
