import type { TestCaseRunDetail } from '@/entities/test-run';
import { describe, expect, it } from 'vitest';

import { buildIssueDraft } from './run-issue-model';

const makeCase = (overrides: Partial<TestCaseRunDetail>): TestCaseRunDetail => ({
  id: 'cr',
  testCaseId: 'tc',
  code: 'TC-102',
  title: '비밀번호 5회 오류 시 계정이 잠긴다',
  status: 'fail',
  comment: '바로 로그인됨',
  executedAt: null,
  sourceType: 'suite',
  sourceId: null,
  sourceName: null,
  testSuiteId: 'auth',
  testSuiteName: '인증',
  preCondition: null,
  steps: '1. 잘못된 비밀번호 입력\n2. 5회 반복',
  expectedResult: '15분 잠금',
  ...overrides,
});

const run = { name: 'v2.1 회귀 - 2차', createdAt: new Date('2026-10-09T05:20:00Z') };

describe('buildIssueDraft', () => {
  it('한 케이스는 스위트를 머리에 붙인 제목과 재현 단계·기대·실제 결과, 환경을 채운다', () => {
    const draft = buildIssueDraft([makeCase({})], run);
    expect(draft.title).toBe('[인증] 비밀번호 5회 오류 시 계정이 잠긴다 실패');
    expect(draft.body).toContain('### TC-102 비밀번호 5회 오류 시 계정이 잠긴다');
    expect(draft.body).toContain('**재현 단계**\n1. 잘못된 비밀번호 입력\n2. 5회 반복');
    expect(draft.body).toContain('**실제 결과**\n바로 로그인됨');
    expect(draft.body).toContain('- 실행: v2.1 회귀 - 2차 (10.09)');
    expect(draft.body).not.toContain('사전 조건');
  });

  it('여러 케이스는 "외 n건" 제목과 케이스별 블록을 만들고, 스위트가 다르면 머리를 뺀다', () => {
    const draft = buildIssueDraft(
      [makeCase({}), makeCase({ code: 'TC-121', testSuiteName: '결제', comment: null })],
      run
    );
    expect(draft.title).toBe('비밀번호 5회 오류 시 계정이 잠긴다 외 1건 실패');
    expect(draft.body).toContain('### TC-121');
    expect(draft.body).toContain('**실제 결과**\n남긴 메모 없음');
    expect(draft.body.match(/\*\*환경\*\*/g)).toHaveLength(1);
  });
});
