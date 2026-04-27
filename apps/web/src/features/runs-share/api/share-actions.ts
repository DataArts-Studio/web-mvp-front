'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns, testCaseRuns, testCases, testSuites, projects } from '@testea/db';
import { ActionResult } from '@/shared/types';
import { and, eq, isNull, isNotNull, inArray, gte, sql } from 'drizzle-orm';
import { requireProjectAccess } from '@/access/lib/require-access';

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
      },
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
  stats: { total: number; pass: number; fail: number; blocked: number; untested: number; progressPercent: number },
  suiteBreakdown: SharedReportSuiteBreakdown[],
  failedCases: SharedReportCaseItem[],
  blockedCases: SharedReportCaseItem[],
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

const AI_DAILY_LIMIT_PER_PROJECT = 10;

export async function generateShareLink(
  testRunId: string
): Promise<ActionResult<{ token: string; expiresAt: string }>> {
  try {
    const db = getDatabase();

    const [run] = await db
      .select({
        projectId: testRuns.project_id,
        name: testRuns.name,
        existingAiSummary: testRuns.share_ai_summary,
      })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);

    if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // AI summary: reuse existing or generate new (with daily limit)
    let aiSummary: string | null = run.existingAiSummary || null;

    const shouldGenerateAi = !aiSummary && !!process.env.GEMINI_API_KEY;
    if (shouldGenerateAi) {
      // Check daily generation limit for this project
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [{ count: todayCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(testRuns)
        .where(and(
          eq(testRuns.project_id, run.projectId),
          isNotNull(testRuns.share_ai_summary),
          gte(testRuns.updated_at, todayStart),
        ));

      if (todayCount >= AI_DAILY_LIMIT_PER_PROJECT) {
        console.log(`[generateShareLink] AI daily limit reached for project ${run.projectId} (${todayCount}/${AI_DAILY_LIMIT_PER_PROJECT})`);
      } else {
    try {
      // Get project name
      let projectName = '';
      const [project] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, run.projectId))
        .limit(1);
      projectName = project?.name || '';

      // Get case runs
      const caseRuns = await db
        .select({
          status: testCaseRuns.status,
          comment: testCaseRuns.comment,
          caseName: testCases.name,
          displayId: testCases.display_id,
          suiteId: testCases.test_suite_id,
        })
        .from(testCaseRuns)
        .innerJoin(testCases, eq(testCaseRuns.test_case_id, testCases.id))
        .where(and(eq(testCaseRuns.test_run_id, testRunId), isNull(testCaseRuns.excluded_at)));

      const suiteIds = [...new Set(caseRuns.map(c => c.suiteId).filter(Boolean))] as string[];
      const suiteMap = new Map<string, string>();
      if (suiteIds.length > 0) {
        const suites = await db
          .select({ id: testSuites.id, name: testSuites.name })
          .from(testSuites)
          .where(inArray(testSuites.id, suiteIds));
        for (const s of suites) suiteMap.set(s.id, s.name);
      }

      const total = caseRuns.length;
      const pass = caseRuns.filter(c => c.status === 'pass').length;
      const fail = caseRuns.filter(c => c.status === 'fail').length;
      const blocked = caseRuns.filter(c => c.status === 'blocked').length;
      const untested = caseRuns.filter(c => c.status === 'untested').length;
      const progressPercent = total > 0 ? Math.round(((total - untested) / total) * 100) : 0;

      // Build suite breakdown
      const suiteStatsMap = new Map<string, SharedReportSuiteBreakdown>();
      for (const c of caseRuns) {
        const suiteName = c.suiteId ? (suiteMap.get(c.suiteId) || '미분류') : '미분류';
        if (!suiteStatsMap.has(suiteName)) {
          suiteStatsMap.set(suiteName, { suiteName, total: 0, pass: 0, fail: 0, blocked: 0, untested: 0, passRate: 0 });
        }
        const ss = suiteStatsMap.get(suiteName)!;
        ss.total++;
        if (c.status === 'pass') ss.pass++;
        else if (c.status === 'fail') ss.fail++;
        else if (c.status === 'blocked') ss.blocked++;
        else ss.untested++;
      }
      const suiteBreakdown = Array.from(suiteStatsMap.values())
        .map(s => ({ ...s, passRate: s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0 }));

      const toCaseItem = (c: typeof caseRuns[number]): SharedReportCaseItem => ({
        code: c.displayId ? `TC-${String(c.displayId).padStart(3, '0')}` : '',
        title: c.caseName,
        status: c.status as SharedReportCaseItem['status'],
        comment: c.comment,
        executedAt: null,
        suiteName: c.suiteId ? (suiteMap.get(c.suiteId) || null) : null,
      });

      const failedCases = caseRuns.filter(c => c.status === 'fail').map(toCaseItem);
      const blockedCases = caseRuns.filter(c => c.status === 'blocked').map(toCaseItem);

      const context = buildReportContext(
        run.name, projectName,
        { total, pass, fail, blocked, untested, progressPercent },
        suiteBreakdown, failedCases, blockedCases,
      );

      aiSummary = await generateAiSummary(context);
    } catch (aiError) {
      console.error('[generateShareLink] AI summary error (non-blocking):', aiError);
    }
      } // end else (within daily limit)
    } // end if (shouldGenerateAi)

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`공유 링크 생성 중 오류가 발생했습니다: ${errorMessage}`] },
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`공유 해제 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}

export async function getSharedReport(
  token: string
): Promise<ActionResult<SharedReportData>> {
  try {
    const db = getDatabase();

    const [run] = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.share_token, token))
      .limit(1);

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

    // Get project name
    let projectName = '';
    if (run.project_id) {
      const [project] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, run.project_id))
        .limit(1);
      projectName = project?.name || '';
    }

    // Fetch case runs with test case details (논리 삭제 제외)
    const caseRuns = await db
      .select({
        status: testCaseRuns.status,
        comment: testCaseRuns.comment,
        executedAt: testCaseRuns.executed_at,
        sourceId: testCaseRuns.source_id,
        caseName: testCases.name,
        displayId: testCases.display_id,
        suiteId: testCases.test_suite_id,
      })
      .from(testCaseRuns)
      .innerJoin(testCases, eq(testCaseRuns.test_case_id, testCases.id))
      .where(and(eq(testCaseRuns.test_run_id, run.id), isNull(testCaseRuns.excluded_at)));

    // Fetch suite names for lookup
    const suiteIds = [...new Set(caseRuns.map(c => c.suiteId).filter(Boolean))] as string[];
    const suiteMap = new Map<string, string>();
    if (suiteIds.length > 0) {
      const suites = await db
        .select({ id: testSuites.id, name: testSuites.name })
        .from(testSuites)
        .where(inArray(testSuites.id, suiteIds));
      for (const s of suites) suiteMap.set(s.id, s.name);
    }

    // Calculate stats
    const total = caseRuns.length;
    const pass = caseRuns.filter((c) => c.status === 'pass').length;
    const fail = caseRuns.filter((c) => c.status === 'fail').length;
    const blocked = caseRuns.filter((c) => c.status === 'blocked').length;
    const untested = caseRuns.filter((c) => c.status === 'untested').length;
    const completed = pass + fail + blocked;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Build suite breakdown
    const suiteStatsMap = new Map<string, SharedReportSuiteBreakdown>();
    for (const c of caseRuns) {
      const suiteName = c.suiteId ? (suiteMap.get(c.suiteId) || '미분류') : '미분류';
      if (!suiteStatsMap.has(suiteName)) {
        suiteStatsMap.set(suiteName, { suiteName, total: 0, pass: 0, fail: 0, blocked: 0, untested: 0, passRate: 0 });
      }
      const ss = suiteStatsMap.get(suiteName)!;
      ss.total++;
      if (c.status === 'pass') ss.pass++;
      else if (c.status === 'fail') ss.fail++;
      else if (c.status === 'blocked') ss.blocked++;
      else ss.untested++;
    }
    const suiteBreakdown = Array.from(suiteStatsMap.values())
      .map(s => ({ ...s, passRate: s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0 }))
      .sort((a, b) => a.suiteName.localeCompare(b.suiteName));

    // Build case items for failed/blocked
    const toCaseItem = (c: typeof caseRuns[number]): SharedReportCaseItem => ({
      code: c.displayId ? `TC-${String(c.displayId).padStart(3, '0')}` : '',
      title: c.caseName,
      status: c.status as SharedReportCaseItem['status'],
      comment: c.comment,
      executedAt: c.executedAt ? new Date(c.executedAt).toISOString() : null,
      suiteName: c.suiteId ? (suiteMap.get(c.suiteId) || null) : null,
    });

    const allCases = caseRuns.map(toCaseItem);
    const failedCases = caseRuns.filter(c => c.status === 'fail').map(toCaseItem);
    const blockedCases = caseRuns.filter(c => c.status === 'blocked').map(toCaseItem);

    return {
      success: true,
      data: {
        runName: run.name,
        projectName,
        status: run.status,
        createdAt: new Date(run.created_at).toISOString(),
        updatedAt: new Date(run.updated_at).toISOString(),
        expiresAt: new Date(run.share_expires_at).toISOString(),
        aiSummary: run.share_ai_summary || null,
        stats: {
          total,
          pass,
          fail,
          blocked,
          untested,
          progressPercent,
        },
        suiteBreakdown,
        allCases,
        failedCases,
        blockedCases,
      },
    };
  } catch (error) {
    console.error('[getSharedReport] error:', error);
    Sentry.captureException(error, { extra: { action: 'getSharedReport' } });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`리포트를 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}
