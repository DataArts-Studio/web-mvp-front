'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { getTargetSiteForExecution } from '@/features/target-sites/api/get-target-site-for-execution';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases } from '@testea/db';
import { and, eq, isNull } from 'drizzle-orm';

import { buildStorageState } from '../lib/build-storage-state';
import { generateSpec } from '../lib/generate-spec';
import { recordAutoResult } from './record-result';
import { captureSnapshot, runSpecOnRunner } from './runner-client';

/**
 * FDD-TR10 자동 실행 오케스트레이션 (단건).
 *
 * Vercel(서버리스)에서 Playwright 를 못 돌리므로, 접근성 캡처와 spec 실행은 러너가 하고
 * Testea 는 fetch + LLM + DB 만 한다. 흐름:
 *   1) requireProjectAccess 가드
 *   2) 케이스 조회(steps, case_key)
 *   3) target_sites 복호화(baseUrl + auth → storageState)
 *   4) 러너 /capture → 접근성 스냅샷
 *   5) Gemini(2.5-flash-lite) → Playwright spec
 *   6) 러너 /run → pass/fail
 *   7) TR09 방식 결과 기록(result_source='auto')
 *
 * 스코프 밖: username/password 폼 로그인 자동화, 다중 케이스 배치, UI 버튼.
 */

export interface RunAutomatedTestParams {
  projectId: string;
  runId: string;
  caseId: string;
  targetSiteId: string;
  /** 케이스가 가리키는 상대 경로(예: '/dashboard'). 없으면 baseUrl 루트 캡처. */
  path?: string;
}

export interface RunAutomatedTestData {
  /** 생성된 spec 요약(앞 N줄). 전체 spec 은 응답에 싣지 않는다. */
  specPreview: string;
  /** 러너 실행 status: passed | failed | timedOut | ... */
  status: string;
  /** 실행 소요(ms). */
  durationMs: number;
  /** 실패 시 에러 메시지. */
  errorMessage?: string;
  /** case_key 가 Run 안 case_run 과 매칭되어 기록됐는지. */
  recorded: boolean;
  /** 매칭에 사용한 case_key. */
  caseKey: string;
}

function fail(message: string): ActionResult<RunAutomatedTestData> {
  return { success: false, errors: { _general: [message] } };
}

function joinUrl(baseUrl: string, path?: string): string {
  if (!path) return baseUrl;
  const base = baseUrl.replace(/\/+$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${base}${rel}`;
}

export async function runAutomatedTest(
  params: RunAutomatedTestParams
): Promise<ActionResult<RunAutomatedTestData>> {
  try {
    // 1) 접근 가드
    if (!(await requireProjectAccess(params.projectId))) {
      return fail('접근 권한이 없습니다.');
    }

    const db = getDatabase();

    // 2) 케이스 조회 (steps 자연어, case_key)
    const [testCase] = await db
      .select({
        id: testCases.id,
        name: testCases.name,
        steps: testCases.steps,
        caseKey: testCases.case_key,
        projectId: testCases.project_id,
      })
      .from(testCases)
      .where(
        and(
          eq(testCases.id, params.caseId),
          eq(testCases.project_id, params.projectId),
          isNull(testCases.archived_at)
        )
      )
      .limit(1);

    if (!testCase) {
      return fail('케이스를 찾을 수 없습니다.');
    }
    if (!testCase.caseKey) {
      return fail('케이스에 case_key 가 없어 결과를 기록할 수 없습니다.');
    }
    if (!testCase.steps || !testCase.steps.trim()) {
      return fail('케이스에 실행할 단계(steps)가 없습니다.');
    }

    // 3) 대상 사이트 복호화 (baseUrl + auth → storageState)
    const target = await getTargetSiteForExecution(params.projectId, params.targetSiteId);
    if (!target) {
      return fail('테스트 대상을 찾을 수 없습니다.');
    }

    // auth 의 cookies 만 storageState 로 변환한다. username/password 폼 로그인
    // 자동화는 이번 스코프 밖(주석). baseUrl 만으로도(비로그인) 동작한다.
    const storageState = buildStorageState(target.auth, target.baseUrl);
    const captureUrl = joinUrl(target.baseUrl, params.path);

    // 4) 러너 /capture → 접근성 스냅샷
    const captured = await captureSnapshot({
      url: captureUrl,
      storageState: storageState ?? undefined,
    });
    if (!captured.ok || !captured.snapshot) {
      return fail(`대상 페이지 캡처 실패: ${captured.errorMessage ?? '알 수 없는 오류'}`);
    }

    // 5) Gemini → Playwright spec
    const spec = await generateSpec({
      steps: testCase.steps,
      snapshot: captured.snapshot,
      caseTitle: testCase.name,
      path: params.path,
    });

    // 6) 러너 /run → pass/fail
    const runResult = await runSpecOnRunner({
      spec,
      baseUrl: target.baseUrl,
      storageState: storageState ?? undefined,
    });

    // 7) TR09 방식 결과 기록
    const status = runResult.status === 'passed' ? 'pass' : 'fail';
    const { matched } = await recordAutoResult({
      runId: params.runId,
      caseKey: testCase.caseKey,
      status,
      durationMs: runResult.durationMs,
      errorMessage: runResult.errorMessage,
    });

    return {
      success: true,
      data: {
        specPreview: spec.split('\n').slice(0, 12).join('\n'),
        status: runResult.status,
        durationMs: runResult.durationMs,
        errorMessage: runResult.errorMessage,
        recorded: matched,
        caseKey: testCase.caseKey,
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'runAutomatedTest' } });
    const message = error instanceof Error ? error.message : String(error);
    return fail(`자동 실행 중 오류가 발생했습니다: ${message}`);
  }
}
