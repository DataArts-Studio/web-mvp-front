'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  aiUsageLogs,
  getDatabase,
  projects,
  testCaseRuns,
  testCases,
  testRuns,
  testSuites,
} from '@testea/db';
import { and, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';

export interface SharedReportCaseItem {
  code: string;
  title: string;
  status: 'untested' | 'pass' | 'fail' | 'blocked';
  comment: string | null;
  executedAt: string | null;
  suiteName: string | null;
}

export interface SharedReportSuiteBreakdown {
  suiteName: string;
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  untested: number;
  passRate: number;
}

export interface SharedReportData {
  runName: string;
  projectName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  aiSummary: string | null;
  stats: {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
    progressPercent: number;
  };
  suiteBreakdown: SharedReportSuiteBreakdown[];
  allCases: SharedReportCaseItem[];
  failedCases: SharedReportCaseItem[];
  blockedCases: SharedReportCaseItem[];
}

// ─── Gemini AI Summary ──────────────────────────────────────────

const REPORT_SUMMARY_PROMPT = `QA 리포트 분석. 한국어. 3~4개 핵심 인사이트. 수치 포함. 이슈 원인+조치 포함. 150자 이내. 마크다운 문법 절대 사용 금지(*, **, #, - 등). 줄바꿈으로 구분된 평문 문장만 출력.`;

async function generateAiSummary(reportContext: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: REPORT_SUMMARY_PROMPT }] },
          contents: [{ parts: [{ text: reportContext }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
        }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (error) {
    console.error('[generateAiSummary] error:', error);
    return null;
  }
}

function buildReportContext(
  runName: string,
  projectName: string,
  stats: {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
    progressPercent: number;
  },
  suiteBreakdown: SharedReportSuiteBreakdown[],
  failedCases: SharedReportCaseItem[],
  blockedCases: SharedReportCaseItem[]
): string {
  const lines: string[] = [
    `${projectName}/${runName}`,
    `T${stats.total} P${stats.pass} F${stats.fail} B${stats.blocked} U${stats.untested} ${stats.progressPercent}%`,
  ];

  if (suiteBreakdown.length > 0) {
    for (const s of suiteBreakdown.slice(0, 8)) {
      lines.push(`${s.suiteName}:T${s.total} P${s.pass} F${s.fail} B${s.blocked} ${s.passRate}%`);
    }
  }

  for (const c of failedCases.slice(0, 5)) {
    lines.push(`F:${c.code} ${c.title}${c.comment ? `(${c.comment})` : ''}`);
  }

  for (const c of blockedCases.slice(0, 5)) {
    lines.push(`B:${c.code} ${c.title}${c.comment ? `(${c.comment})` : ''}`);
  }

  return lines.join('\n');
}

// ─── 리포트 집계 ─────────────────────────────────────────────────

type Database = ReturnType<typeof getDatabase>;

interface ReportSnapshot {
  projectName: string;
  stats: SharedReportData['stats'];
  suiteBreakdown: SharedReportSuiteBreakdown[];
  allCases: SharedReportCaseItem[];
  failedCases: SharedReportCaseItem[];
  blockedCases: SharedReportCaseItem[];
  /** AI 요약 입력이자 요약이 최신인지 판단하는 기준 (#387) */
  context: string;
}

/** 공유 리포트와 AI 요약이 같은 집계를 쓰도록 한 곳에서 만든다. */
async function loadReportSnapshot(
  db: Database,
  run: { id: string; name: string; projectId: string | null }
): Promise<ReportSnapshot> {
  let projectName = '';
  if (run.projectId) {
    const [project] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, run.projectId))
      .limit(1);
    projectName = project?.name || '';
  }

  // 실행 범위에서 제외된 케이스는 빼고 센다
  const caseRuns = await db
    .select({
      status: testCaseRuns.status,
      comment: testCaseRuns.comment,
      executedAt: testCaseRuns.executed_at,
      caseName: testCases.name,
      displayId: testCases.display_id,
      suiteId: testCases.test_suite_id,
    })
    .from(testCaseRuns)
    .innerJoin(testCases, eq(testCaseRuns.test_case_id, testCases.id))
    .where(and(eq(testCaseRuns.test_run_id, run.id), isNull(testCaseRuns.excluded_at)));

  const suiteIds = [...new Set(caseRuns.map((c) => c.suiteId).filter(Boolean))] as string[];
  const suiteMap = new Map<string, string>();
  if (suiteIds.length > 0) {
    const suites = await db
      .select({ id: testSuites.id, name: testSuites.name })
      .from(testSuites)
      .where(inArray(testSuites.id, suiteIds));
    for (const s of suites) suiteMap.set(s.id, s.name);
  }

  const total = caseRuns.length;
  const pass = caseRuns.filter((c) => c.status === 'pass').length;
  const fail = caseRuns.filter((c) => c.status === 'fail').length;
  const blocked = caseRuns.filter((c) => c.status === 'blocked').length;
  const untested = caseRuns.filter((c) => c.status === 'untested').length;
  const completed = pass + fail + blocked;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const stats = { total, pass, fail, blocked, untested, progressPercent };

  const suiteStatsMap = new Map<string, SharedReportSuiteBreakdown>();
  for (const c of caseRuns) {
    const suiteName = c.suiteId ? suiteMap.get(c.suiteId) || '미분류' : '미분류';
    if (!suiteStatsMap.has(suiteName)) {
      suiteStatsMap.set(suiteName, {
        suiteName,
        total: 0,
        pass: 0,
        fail: 0,
        blocked: 0,
        untested: 0,
        passRate: 0,
      });
    }
    const ss = suiteStatsMap.get(suiteName)!;
    ss.total++;
    if (c.status === 'pass') ss.pass++;
    else if (c.status === 'fail') ss.fail++;
    else if (c.status === 'blocked') ss.blocked++;
    else ss.untested++;
  }
  const suiteBreakdown = Array.from(suiteStatsMap.values())
    .map((s) => ({ ...s, passRate: s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0 }))
    .sort((a, b) => a.suiteName.localeCompare(b.suiteName));

  const toCaseItem = (c: (typeof caseRuns)[number]): SharedReportCaseItem => ({
    code: c.displayId ? `TC-${String(c.displayId).padStart(3, '0')}` : '',
    title: c.caseName,
    status: c.status as SharedReportCaseItem['status'],
    comment: c.comment,
    executedAt: c.executedAt ? new Date(c.executedAt).toISOString() : null,
    suiteName: c.suiteId ? suiteMap.get(c.suiteId) || null : null,
  });

  // 같은 결과면 같은 기준이 나오도록 케이스 순서를 고정한다
  const byCode = (a: SharedReportCaseItem, b: SharedReportCaseItem) =>
    a.code.localeCompare(b.code) || a.title.localeCompare(b.title);
  const allCases = caseRuns.map(toCaseItem);
  const failedCases = allCases.filter((c) => c.status === 'fail').sort(byCode);
  const blockedCases = allCases.filter((c) => c.status === 'blocked').sort(byCode);

  const context = buildReportContext(
    run.name,
    projectName,
    stats,
    suiteBreakdown,
    failedCases,
    blockedCases
  );

  return { projectName, stats, suiteBreakdown, allCases, failedCases, blockedCases, context };
}

// ─── AI 요약 보관 ────────────────────────────────────────────────

/**
 * 요약은 만들 때의 집계 기준(basis)과 함께 저장한다 (#387).
 * 결과가 바뀌면 기준이 달라지므로 옛 요약은 보여 주지 않고, 다시 만들 때 갱신한다.
 * 기준이 없는 예전 형식(평문)은 어느 결과로 만든 요약인지 알 수 없어 낡은 것으로 본다.
 */
interface StoredSummary {
  basis: string;
  text: string;
}

const basisOf = (context: string) => createHash('sha256').update(context).digest('hex');

function parseStoredSummary(raw: string | null): StoredSummary | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.basis === 'string' && typeof parsed?.text === 'string') return parsed;
  } catch {
    // 예전 평문 요약
  }
  return null;
}

/** 저장된 요약이 지금 결과 기준이면 그 문장을, 아니면 null. */
function currentSummaryText(raw: string | null, context: string): string | null {
  const stored = parseStoredSummary(raw);
  return stored && stored.basis === basisOf(context) ? stored.text : null;
}

const AI_DAILY_LIMIT_PER_PROJECT = 10;
const SHARE_SUMMARY_ACTION = 'share_summary';

/** 오늘 0시(UTC). AI 사용량 집계와 같은 기준을 쓴다. */
const startOfTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * 지금 결과 기준의 요약을 저장 형식으로 돌려준다. 기준이 같으면 저장된 요약을 그대로 쓰고,
 * 다르면 새로 만든다. 만들 수 없으면(키 없음, 일일 한도, 생성 실패) null 이라 옛 요약을 남기지 않는다.
 */
async function resolveSummary(
  db: Database,
  projectId: string,
  existingRaw: string | null,
  context: string
): Promise<string | null> {
  const basis = basisOf(context);
  if (parseStoredSummary(existingRaw)?.basis === basis) return existingRaw;
  if (!process.env.GEMINI_API_KEY) return null;

  // 실제 생성 호출 수로 하루 한도를 센다
  const [{ count: todayCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiUsageLogs)
    .where(
      and(
        eq(aiUsageLogs.project_id, projectId),
        eq(aiUsageLogs.action_type, SHARE_SUMMARY_ACTION),
        gte(aiUsageLogs.created_at, startOfTodayUtc())
      )
    );
  if (todayCount >= AI_DAILY_LIMIT_PER_PROJECT) {
    console.log(
      `[resolveSummary] AI daily limit reached for project ${projectId} (${todayCount}/${AI_DAILY_LIMIT_PER_PROJECT})`
    );
    return null;
  }

  // 케이스 생성 월 한도(generated_count 합)에는 잡히지 않게 0 으로 기록한다
  await db
    .insert(aiUsageLogs)
    .values({ project_id: projectId, action_type: SHARE_SUMMARY_ACTION, generated_count: 0 });

  const text = await generateAiSummary(context);
  return text ? JSON.stringify({ basis, text } satisfies StoredSummary) : null;
}

/** 접근 권한과 공유할 수 있는(삭제되지 않은) 실행인지를 함께 확인한다. */
async function findShareableRun(db: Database, testRunId: string) {
  const [run] = await db
    .select({
      id: testRuns.id,
      projectId: testRuns.project_id,
      name: testRuns.name,
      lifecycleStatus: testRuns.lifecycle_status,
      shareToken: testRuns.share_token,
      shareExpiresAt: testRuns.share_expires_at,
      shareAiSummary: testRuns.share_ai_summary,
    })
    .from(testRuns)
    .where(eq(testRuns.id, testRunId))
    .limit(1);

  if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
    return { error: '접근 권한이 없습니다.' } as const;
  }
  if (run.lifecycleStatus !== 'ACTIVE') {
    return { error: '삭제된 실행은 공유할 수 없습니다.' } as const;
  }
  return { run: { ...run, projectId: run.projectId } } as const;
}

export async function generateShareLink(
  testRunId: string
): Promise<ActionResult<{ token: string; expiresAt: string }>> {
  try {
    const db = getDatabase();
    const found = await findShareableRun(db, testRunId);
    if ('error' in found) return { success: false, errors: { _general: [found.error] } };
    const { run } = found;

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    let aiSummary: string | null = null;
    try {
      const { context } = await loadReportSnapshot(db, run);
      aiSummary = await resolveSummary(db, run.projectId, run.shareAiSummary, context);
    } catch (aiError) {
      console.error('[generateShareLink] AI summary error (non-blocking):', aiError);
    }

    await db
      .update(testRuns)
      .set({
        share_token: token,
        share_expires_at: expiresAt,
        share_ai_summary: aiSummary,
        updated_at: new Date(),
      })
      .where(eq(testRuns.id, testRunId));

    return { success: true, data: { token, expiresAt: expiresAt.toISOString() } };
  } catch (error) {
    console.error('[generateShareLink] error:', error);
    Sentry.captureException(error, { extra: { action: 'generateShareLink' } });
    return {
      success: false,
      errors: { _general: ['공유 링크 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'] },
    };
  }
}

/** 공유 링크는 그대로 두고 AI 요약만 지금 결과 기준으로 다시 만든다 (#387). */
export async function refreshShareSummary(
  testRunId: string
): Promise<ActionResult<{ hasSummary: boolean }>> {
  try {
    const db = getDatabase();
    const found = await findShareableRun(db, testRunId);
    if ('error' in found) return { success: false, errors: { _general: [found.error] } };
    const { run } = found;

    if (!run.shareToken || !run.shareExpiresAt || run.shareExpiresAt < new Date()) {
      return { success: false, errors: { _general: ['공유 중인 링크가 없습니다.'] } };
    }

    const { context } = await loadReportSnapshot(db, run);
    const aiSummary = await resolveSummary(db, run.projectId, run.shareAiSummary, context);

    await db
      .update(testRuns)
      .set({ share_ai_summary: aiSummary })
      .where(eq(testRuns.id, testRunId));

    return { success: true, data: { hasSummary: aiSummary !== null } };
  } catch (error) {
    console.error('[refreshShareSummary] error:', error);
    Sentry.captureException(error, { extra: { action: 'refreshShareSummary' } });
    return {
      success: false,
      errors: { _general: ['AI 요약 갱신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'] },
    };
  }
}

export async function revokeShareLink(
  testRunId: string
): Promise<ActionResult<{ revoked: boolean }>> {
  try {
    const db = getDatabase();

    const [run] = await db
      .select({ projectId: testRuns.project_id })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);

    if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    await db
      .update(testRuns)
      .set({
        share_token: null,
        share_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(testRuns.id, testRunId));

    return { success: true, data: { revoked: true } };
  } catch (error) {
    console.error('[revokeShareLink] error:', error);
    Sentry.captureException(error, { extra: { action: 'revokeShareLink' } });
    return {
      success: false,
      errors: { _general: ['공유 해제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'] },
    };
  }
}

export async function getSharedReport(token: string): Promise<ActionResult<SharedReportData>> {
  try {
    const db = getDatabase();

    // 삭제된 실행이나 삭제된 프로젝트의 실행은 공유 링크로 열지 않는다 (#387)
    const [row] = await db
      .select({ run: testRuns })
      .from(testRuns)
      .innerJoin(projects, eq(projects.id, testRuns.project_id))
      .where(
        and(
          eq(testRuns.share_token, token),
          eq(testRuns.lifecycle_status, 'ACTIVE'),
          eq(projects.lifecycle_status, 'ACTIVE')
        )
      )
      .limit(1);
    const run = row?.run;

    if (!run) {
      return {
        success: false,
        errors: { _general: ['유효하지 않은 공유 링크입니다.'] },
      };
    }

    if (!run.share_expires_at || new Date(run.share_expires_at) < new Date()) {
      return {
        success: false,
        errors: { _general: ['공유 링크가 만료되었습니다.'] },
      };
    }

    const snapshot = await loadReportSnapshot(db, {
      id: run.id,
      name: run.name,
      projectId: run.project_id,
    });

    return {
      success: true,
      data: {
        runName: run.name,
        projectName: snapshot.projectName,
        status: run.status,
        createdAt: new Date(run.created_at).toISOString(),
        updatedAt: new Date(run.updated_at).toISOString(),
        expiresAt: new Date(run.share_expires_at).toISOString(),
        // 결과가 바뀐 뒤의 옛 요약은 보여 주지 않는다
        aiSummary: currentSummaryText(run.share_ai_summary, snapshot.context),
        stats: snapshot.stats,
        suiteBreakdown: snapshot.suiteBreakdown,
        allCases: snapshot.allCases,
        failedCases: snapshot.failedCases,
        blockedCases: snapshot.blockedCases,
      },
    };
  } catch (error) {
    console.error('[getSharedReport] error:', error);
    Sentry.captureException(error, { extra: { action: 'getSharedReport' } });
    return {
      success: false,
      errors: {
        _general: ['리포트를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'],
      },
    };
  }
}
