import { NextResponse } from 'next/server';

import { verifyAutomationTokenFromRequest } from '@/features/automation-token/lib/verify';
import * as Sentry from '@sentry/nextjs';
import {
  type TestCaseRunResultSource,
  type TestCaseRunStatus,
  type TestRunStatus,
  getDatabase,
  testCaseRuns,
  testCases,
  testRuns,
} from '@testea/db';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const StatusEnum = z.enum(['untested', 'pass', 'fail', 'blocked']);

const CiMetaSchema = z
  .object({
    branch: z.string().max(200).optional(),
    sha: z.string().max(200).optional(),
    url: z.string().url().max(500).optional(),
  })
  .strict();

const ResultItemSchema = z
  .object({
    caseKey: z.string().min(1).max(50),
    status: StatusEnum,
    comment: z.string().max(2000).optional(),
    durationMs: z
      .number()
      .int()
      .nonnegative()
      .max(24 * 60 * 60 * 1000)
      .optional(),
    errorMessage: z.string().max(2000).optional(),
    ci: CiMetaSchema.optional(),
  })
  .strict();

const RequestSchema = z
  .object({
    results: z.array(ResultItemSchema).min(1).max(500),
  })
  .strict();

interface Params {
  params: Promise<{ projectName: string; runId: string }>;
}

/**
 * 자동매핑 결과 수신 라우트 (FDD-TR09 V1 청크 4).
 *
 * - 인증: `Authorization: Bearer testea_pk_<token>` → `project_automation_tokens` 매칭
 * - 본문: `results[]` 배열 (caseKey + status + 선택 메타)
 * - 처리: 사용자가 미리 만든 Run 안의 케이스만 보충 (Run 자동 생성·확장 안 함, V1 보수)
 * - 응답: `{ runId, matched, unmapped[] }`
 *
 * 자세한 명세: Notion FDD-TR09 V1 MVP 섹션.
 */
export async function POST(request: Request, { params }: Params) {
  const { runId } = await params;

  // 1) 토큰 인증
  const auth = await verifyAutomationTokenFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'invalid or missing automation token' }, { status: 401 });
  }

  // 2) runId UUID 형식 검증
  if (!UUID_PATTERN.test(runId)) {
    return NextResponse.json({ error: 'invalid runId' }, { status: 400 });
  }

  // 3) 본문 Zod 검증
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid request body', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const db = getDatabase();

    // 4) Run 조회 + 토큰 프로젝트 소유 검증 + 활성 상태 확인
    const [run] = await db
      .select({
        id: testRuns.id,
        projectId: testRuns.project_id,
        lifecycleStatus: testRuns.lifecycle_status,
      })
      .from(testRuns)
      .where(eq(testRuns.id, runId))
      .limit(1);

    if (!run || run.projectId !== auth.projectId) {
      // 다른 프로젝트의 Run 을 가리켰거나 존재하지 않음 → 정보 노출 최소화 위해 동일 404
      return NextResponse.json({ error: 'run not found' }, { status: 404 });
    }
    if (run.lifecycleStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'run is not active' }, { status: 409 });
    }

    // 5) Run 안의 (caseRun, case_key) 매핑 인덱스
    const existingRows = await db
      .select({
        caseRunId: testCaseRuns.id,
        caseId: testCases.id,
        caseKey: testCases.case_key,
      })
      .from(testCaseRuns)
      .innerJoin(testCases, eq(testCaseRuns.test_case_id, testCases.id))
      .where(and(eq(testCaseRuns.test_run_id, runId), isNull(testCaseRuns.excluded_at)));

    const caseKeyMap = new Map<string, { caseRunId: string; caseId: string }>();
    for (const row of existingRows) {
      if (row.caseKey) {
        caseKeyMap.set(row.caseKey, { caseRunId: row.caseRunId, caseId: row.caseId });
      }
    }

    // 6) 결과 보충 (보수 정책: 매칭 row 만 UPDATE, 새 case_run 자동 생성 안 함)
    const matched: string[] = [];
    const unmapped: string[] = [];
    const now = new Date();

    for (const result of parsed.data.results) {
      const target = caseKeyMap.get(result.caseKey);
      if (!target) {
        unmapped.push(result.caseKey);
        continue;
      }

      const automationMeta = buildAutomationMeta(result);
      const commentValue = result.comment ?? result.errorMessage ?? null;

      await db
        .update(testCaseRuns)
        .set({
          status: result.status satisfies TestCaseRunStatus,
          comment: commentValue,
          executed_at: result.status !== 'untested' ? now : null,
          result_source: 'auto' satisfies TestCaseRunResultSource,
          automation_meta: Object.keys(automationMeta).length ? automationMeta : null,
          updated_at: now,
        })
        .where(eq(testCaseRuns.id, target.caseRunId));

      matched.push(result.caseKey);
    }

    // 7) Run 상태 재계산 (untested 개수 기반 NOT_STARTED / IN_PROGRESS / COMPLETED)
    await recalcRunStatus(db, runId);

    return NextResponse.json(
      { runId, matched: matched.length, unmapped },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'auto-results' } });
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

function buildAutomationMeta(result: z.infer<typeof ResultItemSchema>): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (result.ci?.branch) meta.branch = result.ci.branch;
  if (result.ci?.sha) meta.sha = result.ci.sha;
  if (result.ci?.url) meta.url = result.ci.url;
  if (typeof result.durationMs === 'number') meta.durationMs = result.durationMs;
  if (result.errorMessage) meta.errorMessage = result.errorMessage;
  return meta;
}

async function recalcRunStatus(db: ReturnType<typeof getDatabase>, testRunId: string) {
  const rows = await db
    .select({ status: testCaseRuns.status })
    .from(testCaseRuns)
    .where(and(eq(testCaseRuns.test_run_id, testRunId), isNull(testCaseRuns.excluded_at)));

  if (rows.length === 0) return;

  const untested = rows.filter((r) => r.status === 'untested').length;
  const total = rows.length;

  let next: TestRunStatus;
  if (untested === total) next = 'NOT_STARTED';
  else if (untested === 0) next = 'COMPLETED';
  else next = 'IN_PROGRESS';

  await db
    .update(testRuns)
    .set({ status: next, updated_at: new Date() })
    .where(eq(testRuns.id, testRunId));
}
