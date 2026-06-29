export interface ApiAssertionForGrade {
  kind: 'status' | 'json';
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

function hasPassingUserChecks(attempt: ApiAttemptForGrade): boolean {
  const checks = [...attempt.checks, ...attempt.scriptResults];
  return checks.length > 0 && checks.every((check) => check.pass);
}

function stripJavaScriptComments(script: string): string {
  let output = '';
  let quote: 'single' | 'double' | 'template' | null = null;
  let escaped = false;

  for (let i = 0; i < script.length; i += 1) {
    const current = script[i];
    const next = script[i + 1];

    if (quote) {
      output += current;
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
      continue;
    }

    if (current === "'") {
      quote = 'single';
      output += current;
      continue;
    }
    if (current === '"') {
      quote = 'double';
      output += current;
      continue;
    }
    if (current === '`') {
      quote = 'template';
      output += current;
      continue;
    }
    if (current === '/' && next === '/') {
      while (i < script.length && script[i] !== '\n') i += 1;
      output += '\n';
      continue;
    }
    if (current === '/' && next === '*') {
      i += 2;
      while (i < script.length && !(script[i] === '*' && script[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }

    output += current;
  }

  return output;
}

function hasStatusAssertion(attempt: ApiAttemptForGrade): boolean {
  if (attempt.assertions.some((assertion) => assertion.kind === 'status')) return true;
  return /pm\.response\.to\.have\.status\s*\(|pm\.response\.code|response\.status/i.test(
    stripJavaScriptComments(attempt.script)
  );
}

function hasBodyAssertion(attempt: ApiAttemptForGrade): boolean {
  if (attempt.assertions.some((assertion) => assertion.kind === 'json' && assertion.path.trim())) {
    return true;
  }
  return /pm\.response\.json\s*\(\)[\s\S]*(pm\.expect|\.to\.|\.have\.|\.eql\s*\(|\.equal\s*\()/i.test(
    stripJavaScriptComments(attempt.script)
  );
}

function normalizeRequestPath(path: string): string {
  const rawPath = path.trim() || '/';
  try {
    const url = new URL(rawPath, 'https://qaground.local');
    return `${url.pathname}${url.search}`;
  } catch {
    const [withoutHash] = rawPath.split('#');
    return withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  }
}

function normalizeRequestKey(input: ApiAttemptForGrade | ApiTargetForGrade): string {
  return `${input.method.toUpperCase()} ${normalizeRequestPath(input.path)}`;
}

function hasRequestCoverage(attempts: ApiAttemptForGrade[], options?: ApiGradeOptions): boolean {
  const attemptedKeys = new Set(
    attempts.filter(hasPassingUserChecks).map((attempt) => normalizeRequestKey(attempt))
  );
  const targetKeys = options?.targets?.map((target) => normalizeRequestKey(target)) ?? [];

  if (targetKeys.length > 0) {
    return targetKeys.every((targetKey) => attemptedKeys.has(targetKey));
  }

  return attemptedKeys.size >= 2;
}

export function gradeApiAttempts(
  attempts: ApiAttemptForGrade[],
  options?: ApiGradeOptions
): HiddenGradeResult {
  const cases: HiddenGradeCase[] = [
    {
      id: 'success-path',
      points: 20,
      pass: attempts.some(
        (attempt) => attempt.status >= 200 && attempt.status < 300 && hasPassingUserChecks(attempt)
      ),
    },
    {
      id: 'failure-path',
      points: 20,
      pass: attempts.some((attempt) => attempt.status >= 400 && hasPassingUserChecks(attempt)),
    },
    {
      id: 'request-coverage',
      points: 20,
      pass: hasRequestCoverage(attempts, options),
    },
    {
      id: 'status-assertion',
      points: 20,
      pass: attempts.some(
        (attempt) => hasPassingUserChecks(attempt) && hasStatusAssertion(attempt)
      ),
    },
    {
      id: 'body-assertion',
      points: 20,
      pass: attempts.some((attempt) => hasPassingUserChecks(attempt) && hasBodyAssertion(attempt)),
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
