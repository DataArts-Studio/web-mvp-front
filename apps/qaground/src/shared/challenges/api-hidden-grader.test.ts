import { describe, expect, it } from 'vitest';

import { type ApiAttemptForGrade, gradeApiAttempts } from './api-hidden-grader';

const baseAttempt: ApiAttemptForGrade = {
  method: 'GET',
  path: '/status/200',
  status: 200,
  assertions: [{ kind: 'status', path: '', expected: '200' }],
  script: '',
  checks: [{ pass: true }],
  scriptResults: [],
};

describe('gradeApiAttempts', () => {
  it('부분 점수를 계산한다', () => {
    const result = gradeApiAttempts([baseAttempt]);

    expect(result.score).toBe(40);
    expect(result.maxScore).toBe(100);
    expect(result.passed).toBe(2);
  });

  it('성공/실패 경로와 본문 단언을 모두 커버하면 만점이다', () => {
    const result = gradeApiAttempts([
      baseAttempt,
      {
        ...baseAttempt,
        method: 'GET',
        path: '/status/404',
        status: 404,
        assertions: [
          { kind: 'status', path: '', expected: '404' },
          { kind: 'json', path: 'message', expected: 'Not Found' },
        ],
      },
    ]);

    expect(result.score).toBe(100);
    expect(result.passed).toBe(result.total);
  });

  it('실패한 사용자 단언은 성공/실패 경로 채점에 반영하지 않는다', () => {
    const result = gradeApiAttempts([
      {
        ...baseAttempt,
        checks: [{ pass: false }],
      },
    ]);

    expect(result.score).toBe(0);
    expect(result.cases.find((item) => item.id === 'success-path')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'request-coverage')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'status-assertion')?.pass).toBe(false);
  });
});
