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

function hasStatusAssertion(attempt: ApiAttemptForGrade): boolean {
  if (attempt.assertions.some((assertion) => assertion.kind === 'status')) return true;
  return /pm\.response\.to\.have\.status\s*\(|pm\.response\.code|response\.status/i.test(
    attempt.script
  );
}

function hasBodyAssertion(attempt: ApiAttemptForGrade): boolean {
  if (
    attempt.assertions.some((assertion) => assertion.kind !== 'status' && assertion.path.trim())
  ) {
    return true;
  }
  return /pm\.response\.json\s*\(\)[\s\S]*(pm\.expect|\.to\.|\.have\.|\.eql\s*\(|\.equal\s*\()/i.test(
    attempt.script
  );
}

function normalizeRequestKey(attempt: ApiAttemptForGrade): string {
  const rawPath = attempt.path.trim() || '/';
  const [pathname] = rawPath.split('?');
  return `${attempt.method.toUpperCase()} ${pathname}`;
}

export function gradeApiAttempts(attempts: ApiAttemptForGrade[]): HiddenGradeResult {
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
      pass: new Set(attempts.map(normalizeRequestKey)).size >= 2,
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
