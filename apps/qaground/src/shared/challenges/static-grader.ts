import type { Challenge } from './registry';

/**
 * 임시 정적 채점기 (러너 미연결 구간 한정).
 *
 * 자체 러너(apps/runner)가 배포·연결되기 전까지, 제출한 Playwright 코드를 "실행"하지
 * 않고 구조·관련성만 정적으로 점검해 통과/실패를 돌려준다. 러너가 연결되면 라우트가
 * 실제 실행 채점으로 자동 전환하므로 이 모듈은 그때 제거 대상이다.
 *
 * 한계(의도적):
 * - 코드를 실행하지 않으므로 단언이 "실제로 통과하는지"는 검증하지 못한다.
 * - 구조(테스트 블록·단언·상호작용)와 챌린지 셀렉터 사용 여부만 본다.
 * - 따라서 "형식상 유효하고 과제와 관련된 시도"를 통과로 본다. 정답 보증이 아니다.
 */

/** 러너 RunResult 와 동형. UI(automation-code-exercise) 가 그대로 소비한다. */
export interface GradeResult {
  ok: boolean;
  status: string;
  durationMs: number;
  errorMessage?: string;
}

/** 라인/블록 주석 제거. 주석 속 TODO 힌트(`// expect ...`)가 채점에 끼지 않게 한다. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // 블록 주석
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // 라인 주석 (http:// 오탐 회피)
}

function normalize(src: string): string {
  return src.replace(/\s+/g, ' ').trim();
}

function countMatches(src: string, re: RegExp): number {
  return (src.match(re) ?? []).length;
}

/** 상호작용 신호: 페이지 이동/요소 조회/입력 등 실제 동작을 수행하는 호출. */
const INTERACTION_RE =
  /\b(page\.goto|getByTestId|getByRole|getByLabel|getByPlaceholder|getByText|locator|\.click\(|\.fill\(|\.check\(|\.uncheck\(|\.selectOption\(|\.press\(|\.type\(|\.setInputFiles\()/;

/**
 * 접근성/역할 기반 로케이터. testid 직접 참조 대신 써도 "안정적 셀렉터 사용"으로 인정한다.
 * 실무 권장 방식(getByRole/getByLabel)으로 작성한 정답이 testid 미사용을 이유로 막히지 않게 한다.
 */
const SEMANTIC_LOCATOR_RE = /getBy(Role|Label|Text|Placeholder|Title|AltText)\s*\(/;

/**
 * 제출 코드를 정적으로 채점한다. 챌린지의 셀렉터·요구사항을 기준 삼는다.
 */
export function gradeSubmissionStatically(challenge: Challenge, code: string): GradeResult {
  const startedAt = Date.now();
  const stripped = stripComments(code);
  const failures: string[] = [];

  // R1: 테스트 블록 존재
  const hasTest = /\b(test|it)\s*\(/.test(stripped);
  if (!hasTest) failures.push('test(...) 블록이 없습니다. Playwright 테스트를 작성하세요.');

  // R2: 단언 1개 이상
  const assertions = countMatches(stripped, /\bexpect\s*\(/g);
  if (assertions < 1) failures.push('expect(...) 단언이 없습니다. 결과를 검증하세요.');

  // R3: 상호작용 존재
  const hasInteraction = INTERACTION_RE.test(stripped);
  if (!hasInteraction)
    failures.push(
      '페이지 상호작용이 없습니다. goto·getByTestId·click·fill 등으로 대상을 조작하세요.'
    );

  // R4: 스타터 그대로 제출 / 빈 본문 방지
  if (challenge.starterSpec && normalize(code) === normalize(challenge.starterSpec)) {
    failures.push('스타터 코드를 수정하지 않았습니다. 직접 테스트를 작성해 제출하세요.');
  }

  // R5: 대상 요소를 안정적으로 선택했는지 (셀렉터 있는 챌린지 한정).
  // testid 직접 참조 OR 접근성 기반 로케이터(getByRole/getByLabel 등) 둘 다 인정한다.
  const selectorIds = (challenge.selectors ?? []).map((s) => s.testid);
  const usedTestids = selectorIds.filter((id) =>
    new RegExp(`['"\`]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`).test(stripped)
  ).length;
  const usesSemanticLocator = SEMANTIC_LOCATOR_RE.test(stripped);
  if (selectorIds.length > 0 && usedTestids < 1 && !usesSemanticLocator) {
    failures.push(
      `대상 요소를 안정적으로 선택하지 않았습니다. getByTestId('${selectorIds[0]}') 같은 testid 나 getByRole/getByLabel 등 접근성 기반 셀렉터를 사용하세요. 참고 testid: ${selectorIds.join(', ')}`
    );
  }

  const durationMs = Date.now() - startedAt;

  if (failures.length > 0) {
    return {
      ok: false,
      status: 'failed',
      durationMs,
      errorMessage: `- ${failures.join('\n- ')}`,
    };
  }

  // 요구사항 대비 커버리지로 통과/부분을 가른다. 정적 채점은 의미 매핑을 못 하므로
  // "작성한 테스트 수"와 "단언 수" 중 큰 값을 커버리지 추정치로 쓴다.
  const reqCount = challenge.requirement?.length ?? 0;
  const testCount = countMatches(stripped, /\b(?:test|it)\s*\(/g);
  const coverage = Math.max(testCount, assertions);

  const selectorSummary =
    selectorIds.length === 0
      ? ''
      : usedTestids > 0
        ? `, 셀렉터 ${usedTestids}/${selectorIds.length}개`
        : usesSemanticLocator
          ? ', 접근성 기반 셀렉터'
          : '';

  // 요구사항을 다 다루지 않은 부분 작성: 통과로 인정하지 않는다.
  if (reqCount > 0 && coverage < reqCount) {
    return {
      ok: false,
      status: 'partial',
      durationMs,
      errorMessage: [
        `부분 작성입니다 (작성한 테스트 ${testCount}개 · 단언 ${assertions}개).`,
        `요구사항 ${reqCount}개를 각각 검증하는 테스트를 모두 작성해야 통과입니다.`,
      ].join('\n'),
    };
  }

  // 요구사항 수만큼 작성한 전체 통과.
  const note = `구조 점검 통과 (단언 ${assertions}개${selectorSummary}${
    reqCount > 0 ? `, 요구사항 ${reqCount}개 커버 추정` : ''
  }).`;
  return { ok: true, status: 'passed', durationMs, errorMessage: note };
}
