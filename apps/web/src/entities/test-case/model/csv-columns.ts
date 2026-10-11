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

/**
 * 단계(JSON 배열 저장)를 "1. ...", "2. ..." 번호 목록으로 바꾼다.
 * 단계가 하나여도 번호를 붙여, 단계 안의 줄바꿈과 단계 경계를 구분할 수 있게 한다.
 */
export function stepsToCsvText(raw: string): string {
  const steps = parseSteps(raw).filter((step) => step.trim());
  return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
}

/**
 * CSV 의 단계 텍스트를 저장 형식으로 되돌린다.
 * "1. " 로 시작하면 1, 2, 3 순서로 이어지는 번호 줄에서만 단계를 나누고, 그 사이 줄은
 * 앞 단계에 줄바꿈으로 붙인다. 그래서 한 단계 안의 줄바꿈이 보존된다.
 * 번호 목록이 아니면 전체를 한 단계로 둔다.
 */
export function csvTextToSteps(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const lines = trimmed.split(/\r?\n/);
  if (!/^1\.\s/.test(lines[0])) return serializeSteps([trimmed]);

  const steps: string[] = [];
  for (const line of lines) {
    const marker = `${steps.length + 1}.`;
    if (line.startsWith(marker) && /\s/.test(line.charAt(marker.length))) {
      steps.push(line.slice(marker.length).trimStart());
    } else {
      steps[steps.length - 1] += `\n${line}`;
    }
  }
  return serializeSteps(steps);
}

// 스프레드시트가 수식으로 해석하는 첫 글자. 작은따옴표는 아래 표식과 구분하려고 함께 막는다.
const FORMULA_TRIGGER = /^[=+\-@\t\r']/;

/**
 * 내보내는 사용자 입력 값이 Excel 등에서 수식으로 실행되지 않도록 앞에 작은따옴표를 붙인다.
 * 원래 작은따옴표로 시작하던 값도 하나 더 붙여, 가져올 때 정확히 하나만 떼면 원래 값이 된다.
 */
export function protectCsvFormula(value: string): string {
  return FORMULA_TRIGGER.test(value) ? `'${value}` : value;
}

/** protectCsvFormula 의 역. Testea 형식 파일을 가져올 때만 쓴다. */
export function unprotectCsvFormula(value: string): string {
  return value.startsWith("'") ? value.slice(1) : value;
}
