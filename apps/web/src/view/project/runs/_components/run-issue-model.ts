import type { TestCaseRunDetail } from '@/entities/test-run';

import { shortDateOf } from './run-complete-model';

const TITLE_MAX = 256;

export interface IssueDraft {
  title: string;
  body: string;
}

const section = (label: string, text: string | null | undefined) =>
  text?.trim() ? `**${label}**\n${text.trim()}\n` : '';

/**
 * 실행 결과로 GitHub 이슈 초안을 만든다 (06i). 사용자가 고친 뒤 보낸다.
 * 여러 케이스면 케이스마다 재현 단계를 나누고, 환경은 한 번만 적는다.
 */
export const buildIssueDraft = (
  cases: TestCaseRunDetail[],
  run: { name: string; createdAt: Date }
): IssueDraft => {
  const suites = [...new Set(cases.map((tc) => tc.testSuiteName ?? '미분류'))];
  const prefix = suites.length === 1 ? `[${suites[0]}] ` : '';
  const first = cases[0]?.title || '제목 없음';
  const rawTitle = `${prefix}${first}${cases.length > 1 ? ` 외 ${cases.length - 1}건` : ''} 실패`;
  const title = rawTitle.length > TITLE_MAX ? `${rawTitle.slice(0, TITLE_MAX - 1)}…` : rawTitle;

  const caseBlocks = cases.map((tc) =>
    [
      `### ${tc.code} ${tc.title || '제목 없음'}\n`,
      section('사전 조건', tc.preCondition),
      section('재현 단계', tc.steps),
      section('기대 결과', tc.expectedResult),
      section('실제 결과', tc.comment || '남긴 메모 없음'),
    ]
      .filter(Boolean)
      .join('\n')
  );

  const body = [
    ...caseBlocks,
    '---',
    `**환경**\n- 실행: ${run.name} (${shortDateOf(new Date(run.createdAt))})`,
    '',
    '_Testea 실행 결과로 작성한 이슈입니다._',
  ].join('\n');

  return { title, body };
};

/** 이슈 등록 대상이 되는 변화 탭 (실패 계열) */
export const isFailTransition = (transition: string) =>
  transition === 'newFail' || transition === 'stillFail';
