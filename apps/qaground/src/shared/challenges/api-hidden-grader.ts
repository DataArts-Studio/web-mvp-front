export interface ApiAssertionForGrade {
  kind: 'status' | 'json' | 'exists' | 'type' | 'arrayLength';
  path: string;
  expected: string;
}

export interface ApiCheckForGrade {
  pass: boolean;
}

export interface ApiScriptResultForGrade {
  pass: boolean;
}

export interface ApiAttemptForGrade {
  method: string;
  path: string;
  status: number;
  assertions: ApiAssertionForGrade[];
  script: string;
  checks: ApiCheckForGrade[];
  scriptResults: ApiScriptResultForGrade[];
}

export interface ApiTargetForGrade {
  method: string;
  path: string;
  desc?: string;
  auth?: boolean;
}

export interface ApiGradeOptions {
  targets?: ApiTargetForGrade[];
}

export interface HiddenGradeCase {
  id: string;
  points: number;
  pass: boolean;
}

export interface HiddenGradeResult {
  score: number;
  maxScore: number;
  passed: number;
  total: number;
  cases: HiddenGradeCase[];
}

interface NormalizedRequest {
  method: string;
  pathname: string;
  search: string;
  segments: string[];
}

interface ExpectedStatusSet {
  success: Set<number>;
  failure: Set<number>;
}

function hasPassingUserChecks(attempt: ApiAttemptForGrade): boolean {
  const checks = [...attempt.checks, ...attempt.scriptResults];
  return checks.length > 0 && checks.every((check) => check.pass);
}

function stripNonExecutableJavaScript(script: string): string {
  let output = '';
  let quote: 'single' | 'double' | 'template' | null = null;
  let escaped = false;

  for (let i = 0; i < script.length; i += 1) {
    const current = script[i];
    const next = script[i + 1];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (current === '\\') {
        escaped = true;
      } else if (
        (quote === 'single' && current === "'") ||
        (quote === 'double' && current === '"') ||
        (quote === 'template' && current === '`')
      ) {
        quote = null;
      }
      output += current === '\n' ? '\n' : ' ';
      continue;
    }

    if (current === "'") {
      quote = 'single';
      output += ' ';
      continue;
    }
    if (current === '"') {
      quote = 'double';
      output += ' ';
      continue;
    }
    if (current === '`') {
      quote = 'template';
      output += ' ';
      continue;
    }
    if (current === '/' && next === '/') {
      while (i < script.length && script[i] !== '\n') i += 1;
      output += '\n';
      continue;
    }
    if (current === '/' && next === '*') {
      i += 2;
      while (i < script.length && !(script[i] === '*' && script[i + 1] === '/')) {
        output += script[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      i += 1;
      continue;
    }

    output += current;
  }

  return output;
}

function stripCommentsPreserveStrings(script: string): string {
  let output = '';
  let quote: 'single' | 'double' | 'template' | null = null;
  let escaped = false;

  for (let i = 0; i < script.length; i += 1) {
    const current = script[i];
    const next = script[i + 1];

    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (
        (quote === 'single' && current === "'") ||
        (quote === 'double' && current === '"') ||
        (quote === 'template' && current === '`')
      ) {
        quote = null;
      }
      output += current;
      continue;
    }

    if (current === "'") quote = 'single';
    if (current === '"') quote = 'double';
    if (current === '`') quote = 'template';
    if (current === '/' && next === '/') {
      while (i < script.length && script[i] !== '\n') i += 1;
      output += '\n';
      continue;
    }
    if (current === '/' && next === '*') {
      i += 2;
      while (i < script.length && !(script[i] === '*' && script[i + 1] === '/')) {
        output += script[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      i += 1;
      continue;
    }

    output += current;
  }

  return output;
}
function hasStatusAssertion(attempt: ApiAttemptForGrade): boolean {
  if (attempt.assertions.some((assertion) => assertion.kind === 'status')) return true;
  const executable = stripNonExecutableJavaScript(attempt.script);
  return (
    /pm\.response\.to\.have\.status\s*\(/i.test(executable) ||
    /pm\.expect\s*\(\s*(?:pm\.response\.code|response\.status)\s*\)\s*(?:\.to|\.be|\.that|\.have)*\s*\.(?:eql|equal|above|below)\s*\(/i.test(
      executable
    )
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasBodyAssertion(attempt: ApiAttemptForGrade): boolean {
  if (
    attempt.assertions.some(
      (assertion) =>
        assertion.kind !== 'status' &&
        (assertion.path.trim() || assertion.kind === 'type' || assertion.kind === 'arrayLength')
    )
  ) {
    return true;
  }
  const executable = stripNonExecutableJavaScript(attempt.script);
  const matcherChain = String.raw`(?:\.to|\.be|\.that|\.have)*\s*\.(?:eql|equal|include|lengthOf|property|a|above|below)\s*\(`;
  const jsonAccess = String.raw`(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])`;
  const directJsonAssert = new RegExp(
    String.raw`pm\.expect\s*\(\s*pm\.response\.json\s*\(\s*\)\s*${jsonAccess}*\s*\)\s*${matcherChain}`,
    'i'
  ).test(executable);
  if (directJsonAssert) return true;

  const aliases = [
    ...executable.matchAll(
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*pm\.response\.json\s*\(\s*\)/gi
    ),
  ].map((match) => match[1]);

  return aliases.some((alias) => {
    const escapedAlias = escapeRegExp(alias);
    const aliasPathAssert = new RegExp(
      String.raw`pm\.expect\s*\(\s*${escapedAlias}${jsonAccess}+\s*\)\s*${matcherChain}`,
      'i'
    ).test(executable);
    const aliasPropertyAssert = new RegExp(
      String.raw`pm\.expect\s*\(\s*${escapedAlias}\s*\)\s*(?:\.to|\.be|\.that|\.have)*\s*\.property\s*\(`,
      'i'
    ).test(executable);
    return aliasPathAssert || aliasPropertyAssert;
  });
}
function normalizeRequest(input: ApiAttemptForGrade | ApiTargetForGrade): NormalizedRequest {
  const rawPath = input.path.trim() || '/';
  let pathname = '/';
  let search = '';

  try {
    const url = new URL(rawPath, 'https://qaground.local');
    pathname = url.pathname || '/';
    search = url.search;
  } catch {
    const [withoutHash] = rawPath.split('#');
    const [rawPathname, rawSearch] = withoutHash.split('?');
    pathname = rawPathname.startsWith('/') ? rawPathname : `/${rawPathname}`;
    search = rawSearch ? `?${rawSearch}` : '';
  }

  return {
    method: input.method.toUpperCase(),
    pathname,
    search,
    segments: pathname.split('/').filter(Boolean),
  };
}

function matchesTarget(attempt: ApiAttemptForGrade, target: ApiTargetForGrade): boolean {
  const actual = normalizeRequest(attempt);
  const expected = normalizeRequest(target);
  if (actual.method !== expected.method) return false;
  if (actual.search !== expected.search) return false;
  if (actual.segments.length !== expected.segments.length) return false;

  return expected.segments.every((segment, index) => {
    if (segment.startsWith(':')) return actual.segments[index].length > 0;
    return segment === actual.segments[index];
  });
}

function explicitStatusesForTarget(target: ApiTargetForGrade): number[] {
  return `${target.desc ?? ''} ${target.path}`.match(/\b[1-5]\d{2}\b/g)?.map(Number) ?? [];
}

function expectedStatusesForTarget(target: ApiTargetForGrade): ExpectedStatusSet {
  const statuses = explicitStatusesForTarget(target);
  const success = new Set(statuses.filter((status) => status >= 200 && status < 300));
  const failure = new Set(statuses.filter((status) => status >= 400));

  if (success.size === 0) {
    const method = target.method.toUpperCase();
    if (method === 'DELETE') success.add(204);
    else if (method === 'POST' && !/\/auth\//.test(target.path)) success.add(201);
    else success.add(200);
  }
  if (target.auth) failure.add(401);

  return { success, failure };
}

function statusMatchesExpected(attempt: ApiAttemptForGrade, target: ApiTargetForGrade): boolean {
  if (explicitStatusesForTarget(target).length === 0 && !target.auth) return true;
  const expected = expectedStatusesForTarget(target);
  return expected.success.has(attempt.status) || expected.failure.has(attempt.status);
}
function hasExpectedStatusAttempt(
  attempts: ApiAttemptForGrade[],
  target: ApiTargetForGrade,
  statuses: Set<number>
): boolean {
  return attempts.some(
    (attempt) =>
      statuses.has(attempt.status) && matchesTarget(attempt, target) && hasPassingUserChecks(attempt)
  );
}

function hasExpectedSuccessPath(
  attempts: ApiAttemptForGrade[],
  targets: ApiTargetForGrade[]
): boolean {
  if (targets.length === 0) {
    return attempts.some(
      (attempt) => attempt.status >= 200 && attempt.status < 300 && hasPassingUserChecks(attempt)
    );
  }

  return targets.some((target) =>
    hasExpectedStatusAttempt(attempts, target, expectedStatusesForTarget(target).success)
  );
}

function hasExpectedFailurePath(
  attempts: ApiAttemptForGrade[],
  targets: ApiTargetForGrade[]
): boolean {
  if (targets.length === 0) {
    return attempts.some((attempt) => attempt.status >= 400 && hasPassingUserChecks(attempt));
  }

  return targets.some((target) => {
    const expected = expectedStatusesForTarget(target).failure;
    return expected.size > 0 && hasExpectedStatusAttempt(attempts, target, expected);
  });
}

function hasExpectedRequestCoverage(
  attempts: ApiAttemptForGrade[],
  options?: ApiGradeOptions
): boolean {
  const targets = options?.targets ?? [];
  if (targets.length === 0) return hasRequestCoverage(attempts, options);
  const passingAttempts = attempts.filter(hasPassingUserChecks);

  return targets.every((target) =>
    passingAttempts.some(
      (attempt) => matchesTarget(attempt, target) && statusMatchesExpected(attempt, target)
    )
  );
}

function getTargetAttempts(
  attempts: ApiAttemptForGrade[],
  options?: ApiGradeOptions
): ApiAttemptForGrade[] {
  const targets = options?.targets ?? [];
  if (targets.length === 0) return attempts;
  return attempts.filter((attempt) => targets.some((target) => matchesTarget(attempt, target)));
}

function hasRequestCoverage(attempts: ApiAttemptForGrade[], options?: ApiGradeOptions): boolean {
  const targets = options?.targets ?? [];
  const passingAttempts = attempts.filter(hasPassingUserChecks);

  if (targets.length > 0) {
    return targets.every((target) =>
      passingAttempts.some((attempt) => matchesTarget(attempt, target))
    );
  }

  const attemptedKeys = new Set(
    passingAttempts.map((attempt) => {
      const normalized = normalizeRequest(attempt);
      return `${normalized.method} ${normalized.pathname}${normalized.search}`;
    })
  );
  return attemptedKeys.size >= 2;
}

function concretePathPattern(path: string): RegExp {
  const [pathname, search = ''] = path.split('?');
  const escapedPath = pathname
    .split('/')
    .map((segment) => {
      if (!segment) return '';
      if (segment.startsWith(':')) return '[^/?#]+';
      return escapeRegExp(segment);
    })
    .join('/');
  const escapedSearch = search ? `\\?${escapeRegExp(search)}` : '(?:\\?[^\\s)]*)?';
  return new RegExp(`${escapedPath}${escapedSearch}`, 'i');
}

function sendRequestBlocks(code: string): string[] {
  const blocks: string[] = [];
  const re = /\bpm\.sendRequest\s*\(/gi;
  const matches = [...code.matchAll(re)];
  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? code.length;
    blocks.push(code.slice(start, end));
  });
  return blocks;
}

function hasRequiredRequestDetails(block: string, target: ApiTargetForGrade): boolean {
  const method = target.method.toUpperCase();
  const hasAuth =
    !target.auth || /\b(?:Authorization|x-api-key)\b/i.test(block) || /\bheaders\s*:/i.test(block);
  const needsBody = method !== 'GET' && method !== 'DELETE' && !/\/auth\//.test(target.path);
  const hasBody = !needsBody || /\b(?:body|raw)\s*:/i.test(block);
  return hasAuth && hasBody;
}

function hasRequestCall(code: string, target: ApiTargetForGrade): boolean {
  const method = target.method.toUpperCase();
  const methodPattern = new RegExp(
    String.raw`\bmethod\s*:\s*['"\`]${method}['"\`]|\bmethod\s*:\s*['"\`]${target.method.toLowerCase()}['"\`]`,
    'i'
  );
  const pathPattern = concretePathPattern(target.path);

  return sendRequestBlocks(code).some(
    (block) =>
      methodPattern.test(block) && pathPattern.test(block) && hasRequiredRequestDetails(block, target)
  );
}

function hasExpectedStatusInCode(code: string, statuses: Set<number>): boolean {
  if (statuses.size === 0) return false;
  return [...statuses].some((status) => {
    const statusText = String(status);
    const expectStatus = new RegExp(
      String.raw`pm\.expect\s*\(\s*(?:res|response|pm\.response)\.(?:code|status)\s*\)\s*(?:\.to|\.be|\.that|\.have)*\s*\.(?:eql|equal|above|below)\s*\(\s*${statusText}\s*\)`,
      'i'
    );
    const responseHaveStatus = new RegExp(
      String.raw`pm\.response\.to\.have\.status\s*\(\s*${statusText}\s*\)`,
      'i'
    );
    return expectStatus.test(code) || responseHaveStatus.test(code);
  });
}

function hasJsonBodyAssertionInCode(code: string): boolean {
  const matcherChain = String.raw`(?:\.to|\.be|\.that|\.have)*\s*\.(?:eql|equal|include|lengthOf|property|a|above|below)\s*\(`;
  const directJsonAssert = new RegExp(
    String.raw`pm\.expect\s*\(\s*(?:res|response)\.json\s*\(\s*\)(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*\s*\)\s*${matcherChain}`,
    'i'
  ).test(code);
  if (directJsonAssert) return true;

  const aliases = [
    ...code.matchAll(
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:res|response)\.json\s*\(\s*\)/gi
    ),
  ].map((match) => match[1]);

  return aliases.some((alias) => {
    const escapedAlias = escapeRegExp(alias);
    return new RegExp(
      String.raw`pm\.expect\s*\(\s*${escapedAlias}(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])+`,
      'i'
    ).test(code);
  });
}

function hasApiCodeShape(code: string): boolean {
  return /\bpm\.sendRequest\s*\(/i.test(code) && /\bpm\.test\s*\(/i.test(code);
}

export function gradeApiCodeSubmission(
  code: string,
  options?: ApiGradeOptions
): HiddenGradeResult {
  const targets = options?.targets ?? [];
  const executableCode = stripCommentsPreserveStrings(code);
  const hasFailureTarget = targets.some((target) => expectedStatusesForTarget(target).failure.size > 0);
  const cases: HiddenGradeCase[] = [
    {
      id: 'success-path',
      points: 20,
      pass:
        hasApiCodeShape(executableCode) &&
        targets.some((target) => {
          const expected = expectedStatusesForTarget(target).success;
          return hasRequestCall(executableCode, target) && hasExpectedStatusInCode(executableCode, expected);
        }),
    },
    {
      id: 'failure-path',
      points: 20,
      pass:
        !hasFailureTarget ||
        (hasApiCodeShape(executableCode) &&
          targets.some((target) => {
            const expected = expectedStatusesForTarget(target).failure;
            return (
              expected.size > 0 &&
              hasRequestCall(executableCode, target) &&
              hasExpectedStatusInCode(executableCode, expected)
            );
          })),
    },
    {
      id: 'request-coverage',
      points: 20,
      pass: targets.length > 0 && targets.every((target) => hasRequestCall(executableCode, target)),
    },
    {
      id: 'status-assertion',
      points: 20,
      pass: hasExpectedStatusInCode(executableCode, new Set([200, 201, 204, 400, 401, 404])),
    },
    {
      id: 'body-assertion',
      points: 20,
      pass: hasJsonBodyAssertionInCode(executableCode),
    },
  ];
  const score = cases.filter((item) => item.pass).reduce((sum, item) => sum + item.points, 0);
  const maxScore = cases.reduce((sum, item) => sum + item.points, 0);

  return {
    score,
    maxScore,
    passed: cases.filter((item) => item.pass).length,
    total: cases.length,
    cases,
  };
}
export function gradeApiAttempts(
  attempts: ApiAttemptForGrade[],
  options?: ApiGradeOptions
): HiddenGradeResult {
  const targets = options?.targets ?? [];
  const targetAttempts = getTargetAttempts(attempts, options);
  const hasFailureTarget = targets.some((target) => expectedStatusesForTarget(target).failure.size > 0);
  const cases: HiddenGradeCase[] = [
    {
      id: 'success-path',
      points: 20,
      pass: hasExpectedSuccessPath(attempts, targets),
    },
    {
      id: 'failure-path',
      points: 20,
      pass: (!hasFailureTarget && targets.length > 0 && hasExpectedRequestCoverage(attempts, options)) || hasExpectedFailurePath(attempts, targets),
    },
    {
      id: 'request-coverage',
      points: 20,
      pass: hasExpectedRequestCoverage(attempts, options),
    },
    {
      id: 'status-assertion',
      points: 20,
      pass: targetAttempts.some(
        (attempt) => hasPassingUserChecks(attempt) && hasStatusAssertion(attempt)
      ),
    },
    {
      id: 'body-assertion',
      points: 20,
      pass: targetAttempts.some(
        (attempt) => hasPassingUserChecks(attempt) && hasBodyAssertion(attempt)
      ),
    },
  ];

  const score = cases.filter((item) => item.pass).reduce((sum, item) => sum + item.points, 0);
  const maxScore = cases.reduce((sum, item) => sum + item.points, 0);

  return {
    score,
    maxScore,
    passed: cases.filter((item) => item.pass).length,
    total: cases.length,
    cases,
  };
}



