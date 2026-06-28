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

function hasBodyAssertion(attempt: ApiAttemptForGrade): boolean {
  if (
    attempt.assertions.some((assertion) => assertion.kind !== 'status' && assertion.path.trim())
  ) {
    return true;
  }
  const executable = stripNonExecutableJavaScript(attempt.script);
  return /pm\.expect\s*\(\s*pm\.response\.json\s*\(\s*\)\s*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*\s*\)\s*(?:\.to|\.be|\.that|\.have)*\s*\.(?:eql|equal|include|lengthOf|property|a|above|below)\s*\(/i.test(
    executable
  );
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

export function gradeApiAttempts(
  attempts: ApiAttemptForGrade[],
  options?: ApiGradeOptions
): HiddenGradeResult {
  const targetAttempts = getTargetAttempts(attempts, options);
  const cases: HiddenGradeCase[] = [
    {
      id: 'success-path',
      points: 20,
      pass: targetAttempts.some(
        (attempt) => attempt.status >= 200 && attempt.status < 300 && hasPassingUserChecks(attempt)
      ),
    },
    {
      id: 'failure-path',
      points: 20,
      pass: targetAttempts.some(
        (attempt) => attempt.status >= 400 && hasPassingUserChecks(attempt)
      ),
    },
    {
      id: 'request-coverage',
      points: 20,
      pass: hasRequestCoverage(attempts, options),
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
