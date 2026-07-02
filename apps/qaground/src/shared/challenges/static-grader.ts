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
  /** 요구사항 총 개수 (커버리지 판정 기준). */
  requirementCount?: number;
  /** 충족 추정 개수. */
  covered?: number;
  /** 미작성 추정 요구사항 텍스트 (부분 통과 시 빨간 fail 로 표시). */
  uncovered?: string[];
}

interface TestBlock {
  title: string;
  body: string;
  callbackHeader: string;
}

interface ParsedFunction {
  name: string;
  body: string;
}

interface ParsedFunctionRange extends ParsedFunction {
  start: number;
  bodyEnd: number;
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

function buildFailedResult(startedAt: number, failures: string[]): GradeResult {
  return {
    ok: false,
    status: 'failed',
    durationMs: Date.now() - startedAt,
    errorMessage: `- ${failures.join('\n- ')}`,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 상호작용 신호: 페이지 이동/요소 조회/입력 등 실제 동작을 수행하는 호출. */
const INTERACTION_RE =
  /\b(page\.goto|getByTestId|getByRole|getByLabel|getByPlaceholder|getByText|locator|\.click\(|\.fill\(|\.check\(|\.uncheck\(|\.selectOption\(|\.press\(|\.type\(|\.setInputFiles\()/;

/**
 * 접근성/역할 기반 로케이터. testid 직접 참조 대신 써도 "안정적 셀렉터 사용"으로 인정한다.
 * 실무 권장 방식(getByRole/getByLabel)으로 작성한 정답이 testid 미사용을 이유로 막히지 않게 한다.
 */
const SEMANTIC_LOCATOR_RE = /getBy(Role|Label|Text|Placeholder|Title|AltText)\s*\(/;
const ASSERTION_RE = /\bexpect\s*\(/g;
const AWAITED_ASSERTION_RE = /\bawait\s+expect\s*\(/;
const POM_METHOD_CALL_RE = /\bawait\s+[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\s*\(/;
const POM_ASSERTION_METHOD_CALL_RE = /a^/g;
const ASYNC_ACTION_RE =
  /\bpage\.goto\s*\(|\.(?:click|fill|check|uncheck|selectOption|press|type|setInputFiles)\s*\(/;
const TEST_CALL_RE = /\b(?:test|it)\s*\(/g;

function skipStringLiteral(src: string, start: number): number {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (src[i] === quote) return i;
    i += 1;
  }
  return start;
}

function findMatchingBrace(src: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipStringLiteral(src, i);
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findMatchingParen(src: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipStringLiteral(src, i);
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findFunctionBodyStart(src: string, functionStart: number): number {
  const openParen = src.indexOf('(', functionStart);
  if (openParen < 0) return -1;
  const closeParen = findMatchingParen(src, openParen);
  if (closeParen < 0) return -1;
  return src.indexOf('{', closeParen);
}
function readFirstStringArgument(
  src: string,
  openParen: number
): { value: string; end: number } | undefined {
  for (let i = openParen + 1; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipStringLiteral(src, i);
      return end > i ? { value: src.slice(i + 1, end), end } : undefined;
    }
    if (ch === ')') return undefined;
  }
  return undefined;
}

function findCallbackBodyStart(src: string, openParen: number): number {
  let parenDepth = 1;
  for (let i = openParen + 1; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipStringLiteral(src, i);
      continue;
    }
    if (ch === '(') parenDepth += 1;
    if (ch === ')') {
      parenDepth -= 1;
      if (parenDepth === 0) return -1;
    }
    if (src.startsWith('=>', i)) {
      let bodyStart = i + 2;
      while (/\s/.test(src[bodyStart] ?? '')) bodyStart += 1;
      return src[bodyStart] === '{' ? bodyStart : -1;
    }
    if (src.startsWith('function', i)) {
      return findFunctionBodyStart(src, i);
    }
  }
  return -1;
}

function collectFunctionRanges(src: string): ParsedFunctionRange[] {
  const ranges: ParsedFunctionRange[] = [];
  const patterns = [
    /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b[^{}]*\{/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/g,
    /\b(?:public\s+|private\s+|protected\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g,
  ];

  const addRange = (name: string, start: number, bodyStart: number) => {
    const bodyEnd = findMatchingBrace(src, bodyStart);
    if (bodyEnd < 0) return;
    ranges.push({ name, start, bodyEnd, body: src.slice(bodyStart + 1, bodyEnd) });
  };

  patterns.forEach((pattern) => {
    for (const match of src.matchAll(pattern)) {
      const start = match.index ?? 0;
      const matchText = match[0];
      const bodyStart = matchText.endsWith('{')
        ? start + matchText.length - 1
        : findFunctionBodyStart(src, start);
      if (bodyStart < 0) continue;
      addRange(match[1], start, bodyStart);
    }
  });

  return ranges
    .sort((a, b) => a.start - b.start)
    .filter((range, index, sorted) => index === 0 || range.start !== sorted[index - 1].start);
}

function stripNestedFunctionBodies(src: string): string {
  const ranges = collectFunctionRanges(src);
  let output = '';
  let cursor = 0;

  ranges.forEach((range) => {
    if (range.start < cursor) return;
    output += src.slice(cursor, range.start) + ' ';
    cursor = range.bodyEnd + 1;
  });

  return output + src.slice(cursor);
}

function extractNamedFunctions(src: string): ParsedFunction[] {
  return collectFunctionRanges(src).map(({ name, body }) => ({ name, body }));
}
function extractHookBodies(src: string): string[] {
  const bodies: string[] = [];
  const re = /\btest\.beforeEach\s*\(/g;

  for (const match of src.matchAll(re)) {
    const openParen = src.indexOf('(', match.index ?? 0);
    if (openParen < 0) continue;
    const bodyStart = findCallbackBodyStart(src, openParen);
    if (bodyStart < 0) continue;
    const bodyEnd = findMatchingBrace(src, bodyStart);
    if (bodyEnd < 0) continue;
    bodies.push(src.slice(bodyStart + 1, bodyEnd));
  }

  return bodies;
}

function extractTestBlocks(src: string): TestBlock[] {
  const blocks: TestBlock[] = [];
  for (const match of src.matchAll(TEST_CALL_RE)) {
    const callStart = match.index ?? 0;
    const openParen = src.indexOf('(', callStart);
    if (openParen < 0) continue;

    const bodyStart = findCallbackBodyStart(src, openParen);
    if (bodyStart < 0) continue;

    const bodyEnd = findMatchingBrace(src, bodyStart);
    if (bodyEnd < 0) continue;

    const firstArg = readFirstStringArgument(src, openParen);
    const callbackHeaderStart = firstArg ? firstArg.end + 1 : openParen + 1;

    blocks.push({
      title: firstArg?.value ?? `테스트 #${blocks.length + 1}`,
      body: src.slice(bodyStart + 1, bodyEnd),
      callbackHeader: src.slice(callbackHeaderStart, bodyStart),
    });
  }
  return blocks;
}

function callsHelper(body: string, helperName: string): boolean {
  const name = escapeRegExp(helperName);
  return new RegExp(String.raw`(?:\b|\.)${name}\s*\(`).test(body);
}

function callsHelperSafely(body: string, helperName: string): boolean {
  const name = escapeRegExp(helperName);
  return new RegExp(String.raw`\b(?:await|return(?:\s+await)?)\s+(?:[A-Za-z_$][\w$]*\.)?${name}\s*\(`).test(body);
}

function helperRequiresAwait(helper: ParsedFunction): boolean {
  return (
    /\bawait\b/.test(helper.body) ||
    AWAITED_ASSERTION_RE.test(helper.body) ||
    ASYNC_ACTION_RE.test(helper.body)
  );
}

function stripStaticDeadBranches(src: string): string {
  let output = src;
  let match: RegExpExecArray | null;
  const re = /\bif\s*\(\s*false\s*\)\s*\{/g;
  while ((match = re.exec(output))) {
    const open = output.indexOf('{', match.index);
    const close = findMatchingBrace(output, open);
    if (close < 0) break;
    output = `${output.slice(0, match.index)} ${output.slice(close + 1)}`;
    re.lastIndex = match.index;
  }
  return output;
}
function validateTestBlocks(stripped: string): { failures: string[]; blocks: TestBlock[] } {
  const blocks = extractTestBlocks(stripped);
  const hooks = extractHookBodies(stripped);
  const helpers = extractNamedFunctions(stripped);
  const failures: string[] = [];

  if (blocks.length === 0) {
    failures.push('test(...) 블록이 없습니다. Playwright 테스트를 작성하세요.');
    return { failures, blocks };
  }

  if (/\bpage\.locators\s*\(/.test(stripped)) {
    failures.push('page.locators(...) is not a Playwright API. Use page.locator(...) instead.');
  }

  blocks.forEach((block) => {
    const title = block.title.trim() || '이름 없는 테스트';
    const body = block.body.trim();
    const executableBody = stripStaticDeadBranches(stripNestedFunctionBodies(body));
    const unsafeHelpers = helpers.filter(
      (helper) =>
        callsHelper(executableBody, helper.name) && !callsHelperSafely(executableBody, helper.name)
    );
    const calledHelpers = helpers.filter((helper) =>
      callsHelperSafely(executableBody, helper.name)
    );
    const pomAssertionCalls = countMatches(executableBody, POM_ASSERTION_METHOD_CALL_RE);
    const assertions =
      countMatches(executableBody, ASSERTION_RE) +
      calledHelpers.reduce((sum, helper) => sum + countMatches(helper.body, ASSERTION_RE), 0) +
      pomAssertionCalls;
    const hasInteraction =
      INTERACTION_RE.test(executableBody) ||
      POM_METHOD_CALL_RE.test(executableBody) ||
      hooks.some((hook) => INTERACTION_RE.test(hook)) ||
      calledHelpers.some((helper) => INTERACTION_RE.test(helper.body));

    if (!body) {
      failures.push(`"${title}" 테스트 본문이 비어 있습니다. 실제 동작과 단언을 작성하세요.`);
      return;
    }
    if (/\bawait\b/.test(executableBody) && !/\basync\b/.test(block.callbackHeader)) {
      failures.push(`"${title}" 테스트에서 await 를 사용하지만 콜백이 async 가 아닙니다.`);
    }
    if (/\bpage\./.test(executableBody) && !/\bpage\b/.test(block.callbackHeader)) {
      failures.push(
        `"${title}" 테스트에서 page 를 사용하지만 Playwright page fixture 를 받지 않았습니다.`
      );
    }
    unsafeHelpers
      .filter(helperRequiresAwait)
      .forEach((helper) =>
        failures.push(
          `"${title}" 테스트에서 helper ${helper.name}(...) 호출은 await 또는 return 으로 기다려야 합니다.`
        )
      );

    if (assertions < 1) {
      failures.push(`"${title}" 테스트에 expect(...) 단언이 없습니다.`);
    } else if (
      !AWAITED_ASSERTION_RE.test(executableBody) &&
      pomAssertionCalls < 1 &&
      !calledHelpers.some((helper) => AWAITED_ASSERTION_RE.test(helper.body))
    ) {
      failures.push(`"${title}" 테스트의 Playwright 단언은 await expect(...) 형태로 작성하세요.`);
    }

    const unawaitedAction = executableBody
      .split('\n')
      .map((line) => line.trim())
      .find((line) => ASYNC_ACTION_RE.test(line) && !/\bawait\b/.test(line));
    if (unawaitedAction) {
      failures.push(`"${title}" 테스트의 Playwright 액션은 await 로 기다려야 합니다.`);
    }

    if (!hasInteraction) {
      failures.push(`"${title}" 테스트에 페이지 상호작용이 없습니다.`);
    }
  });

  return { failures, blocks };
}

/**
 * 러너 실행 전에도 항상 적용하는 최소 제출 검증.
 * Playwright 는 빈 test 본문도 통과로 처리하므로, 교육용 채점에서는 의미 없는 green 을 먼저 차단한다.
 */
export function validateAutomationSubmissionShape(code: string): GradeResult | null {
  const startedAt = Date.now();
  const stripped = stripComments(code);
  const { failures } = validateTestBlocks(stripped);
  if (failures.length > 0) return buildFailedResult(startedAt, failures);
  return null;
}

function getSelectorReferenceGroups(challenge: Challenge): string[][] {
  return (challenge.selectors ?? []).map((selector) =>
    Array.from(new Set([selector.testid, ...(selector.options ?? []).map((option) => option.value)]))
  );
}

function countCoveredSelectorGroups(code: string, groups: string[][]): number {
  return groups.filter((values) =>
    values.some((value) => {
      const escaped = escapeRegExp(value);
      return new RegExp(String.raw`['"\`][^'"\`]*${escaped}[^'"\`]*['"\`]`).test(code);
    })
  ).length;
}

function flattenSelectorReferenceGroups(groups: string[][]): string[] {
  return Array.from(new Set(groups.flat()));
}

export function validateChallengeStaticChecks(
  challenge: Challenge,
  code: string
): GradeResult | null {
  const checks = challenge.staticChecks ?? [];
  if (checks.length === 0) return null;

  const startedAt = Date.now();
  const stripped = stripComments(code);
  const failures = checks
    .filter((check) => !new RegExp(check.pattern, check.flags).test(stripped))
    .map((check) => `${check.label}: ${check.message}`);

  if (failures.length > 0) return buildFailedResult(startedAt, failures);
  return null;
}

/**
 * 제출 코드를 정적으로 채점한다. 챌린지의 셀렉터·요구사항을 기준 삼는다.
 */
export function gradeSubmissionStatically(challenge: Challenge, code: string): GradeResult {
  const startedAt = Date.now();
  const stripped = stripComments(code);
  const { failures, blocks } = validateTestBlocks(stripped);

  // 스타터 그대로 제출 / 빈 본문 방지
  if (challenge.starterSpec && normalize(code) === normalize(challenge.starterSpec)) {
    failures.push('스타터 코드를 수정하지 않았습니다. 직접 테스트를 작성해 제출하세요.');
  }

  // 대상 요소를 안정적으로 선택했는지 (셀렉터 있는 챌린지 한정).
  // testid 직접 참조 OR 접근성 기반 로케이터(getByRole/getByLabel 등) 둘 다 인정한다.
  const selectorGroups = getSelectorReferenceGroups(challenge);
  const selectorValues = flattenSelectorReferenceGroups(selectorGroups);
  const coveredSelectorGroups = countCoveredSelectorGroups(stripped, selectorGroups);
  const usesSemanticLocator = SEMANTIC_LOCATOR_RE.test(stripped);
  if (
    selectorGroups.length > 0 &&
    coveredSelectorGroups < selectorGroups.length &&
    !usesSemanticLocator
  ) {
    failures.push(
      `Use stable selectors for every required element. Covered selectors: ${coveredSelectorGroups}/${selectorGroups.length}. Reference values: ${selectorValues.join(', ')}`
    );
  }

  const staticCheckError = validateChallengeStaticChecks(challenge, code);
  if (staticCheckError?.errorMessage) {
    failures.push(staticCheckError.errorMessage.replace(/^- /, ''));
  }

  const durationMs = Date.now() - startedAt;

  if (failures.length > 0) return buildFailedResult(startedAt, failures);

  // 요구사항 대비 커버리지로 통과/부분을 가른다. 정적 채점은 의미 매핑을 못 하므로
  // "작성한 테스트 수"와 "단언 수" 중 큰 값을 커버리지 추정치로 쓴다.
  const reqCount = challenge.requirement?.length ?? 0;
  const testCount = blocks.length;
  const assertions =
    countMatches(stripped, ASSERTION_RE) + countMatches(stripped, POM_ASSERTION_METHOD_CALL_RE);
  const structuralCoverage = (challenge.staticChecks?.length ?? 0) > 0 ? reqCount : 0;
  const coverage = Math.max(testCount, assertions, structuralCoverage);

  const selectorSummary =
    selectorGroups.length === 0
      ? ''
      : coveredSelectorGroups > 0
        ? `, selectors ${coveredSelectorGroups}/${selectorGroups.length}`
        : usesSemanticLocator
          ? ', semantic locator'
          : '';
  // 요구사항을 다 다루지 않은 부분 작성: 통과로 인정하지 않는다.
  if (reqCount > 0 && coverage < reqCount) {
    return {
      ok: false,
      status: 'partial',
      durationMs,
      requirementCount: reqCount,
      covered: coverage,
      // 작성 수를 넘어서는 요구사항을 미작성(추정)으로 본다.
      uncovered: (challenge.requirement ?? []).slice(coverage),
      errorMessage: [
        `부분 작성입니다 (작성한 테스트 ${testCount}개 · 단언 ${assertions}개).`,
        `요구사항 ${reqCount}개를 각각 검증하는 테스트를 모두 작성해야 통과입니다.`,
      ].join('\n'),
    };
  }

  // 요구사항 수만큼 작성한 전체 통과.
  const note = `구조 점검 통과 (테스트 ${testCount}개 · 단언 ${assertions}개${selectorSummary}${
    reqCount > 0 ? `, 요구사항 ${reqCount}개 커버 추정` : ''
  }).`;
  return {
    ok: true,
    status: 'passed',
    durationMs,
    requirementCount: reqCount,
    covered: coverage,
    uncovered: [],
    errorMessage: note,
  };
}
