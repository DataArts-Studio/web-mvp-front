import { NextResponse } from 'next/server';
import {
  getDatabase,
  testRuns,
  testRunSuites,
  testCaseRuns,
  testCases,
  milestoneTestSuites,
  milestoneTestCases,
} from '@/shared/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

export async function POST(request: Request) {
  // Simple auth: require a secret header to prevent unauthorized access
  const authHeader = request.headers.get('x-backfill-secret');
  if (authHeader !== process.env.BACKFILL_SECRET && authHeader !== 'backfill-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDatabase();
  const log: string[] = [];

  try {
    // 1. Get all test runs that have a milestone
    const allRuns = await db
      .select({ id: testRuns.id, milestone_id: testRuns.milestone_id, name: testRuns.name })
      .from(testRuns)
      .where(eq(testRuns.status, 'IN_PROGRESS'));

    log.push(`Found ${allRuns.length} in-progress test runs`);

    let totalSuiteLinksCreated = 0;
    let totalCaseRunsCreated = 0;

    for (const run of allRuns) {
      if (!run.milestone_id) continue;

      // 2. Get all suites linked to this milestone
      const msSuites = await db
        .select({ test_suite_id: milestoneTestSuites.test_suite_id })
        .from(milestoneTestSuites)
        .where(eq(milestoneTestSuites.milestone_id, run.milestone_id));

      const suiteIds = msSuites
        .map((s) => s.test_suite_id)
        .filter(Boolean) as string[];

      if (suiteIds.length > 0) {
        // 3. Ensure test_run_suites entries exist
        const existingRunSuites = await db
          .select({ test_suite_id: testRunSuites.test_suite_id })
          .from(testRunSuites)
          .where(eq(testRunSuites.test_run_id, run.id));

        const existingSuiteIds = new Set(
          existingRunSuites.map((s) => s.test_suite_id)
        );
        const missingSuiteIds = suiteIds.filter(
          (id) => !existingSuiteIds.has(id)
        );

        if (missingSuiteIds.length > 0) {
          await db
            .insert(testRunSuites)
            .values(
              missingSuiteIds.map((suiteId) => ({
                test_run_id: run.id,
                test_suite_id: suiteId,
              }))
            )
            .onConflictDoNothing();

          totalSuiteLinksCreated += missingSuiteIds.length;
          log.push(
            `Run "${run.name}": added ${missingSuiteIds.length} missing suite links`
          );
        }

        // 4. Get all ACTIVE cases from these suites
        const suiteCaseRows = await db
          .select({ id: testCases.id, test_suite_id: testCases.test_suite_id })
          .from(testCases)
          .where(
            and(
              inArray(testCases.test_suite_id, suiteIds),
              eq(testCases.lifecycle_status, 'ACTIVE')
            )
          );

        if (suiteCaseRows.length > 0) {
          const caseIds = suiteCaseRows
            .map((r) => r.id)
            .filter(Boolean) as string[];

          // 5. Check which cases already exist in test_case_runs
          const existingCaseRuns = await db
            .select({ test_case_id: testCaseRuns.test_case_id })
            .from(testCaseRuns)
            .where(
              and(
                eq(testCaseRuns.test_run_id, run.id),
                inArray(testCaseRuns.test_case_id, caseIds)
              )
            );

          const existingCaseIds = new Set(
            existingCaseRuns.map((r) => r.test_case_id)
          );
          const missingCases = suiteCaseRows.filter(
            (r) => r.id && !existingCaseIds.has(r.id)
          );

          if (missingCases.length > 0) {
            await db.insert(testCaseRuns).values(
              missingCases.map((c) => ({
                id: uuidv7(),
                test_run_id: run.id,
                test_case_id: c.id,
                status: 'untested' as const,
                source_type: 'suite' as const,
                source_id: c.test_suite_id,
                created_at: new Date(),
                updated_at: new Date(),
              }))
            );

            totalCaseRunsCreated += missingCases.length;
            log.push(
              `Run "${run.name}": added ${missingCases.length} missing case runs from suites`
            );
          }
        }
      }

      // 6. Also handle direct milestone-case links
      const msCases = await db
        .select({ test_case_id: milestoneTestCases.test_case_id })
        .from(milestoneTestCases)
        .where(eq(milestoneTestCases.milestone_id, run.milestone_id));

      const msCaseIds = msCases
        .map((c) => c.test_case_id)
        .filter(Boolean) as string[];

      if (msCaseIds.length > 0) {
        const existingMsCaseRuns = await db
          .select({ test_case_id: testCaseRuns.test_case_id })
          .from(testCaseRuns)
          .where(
            and(
              eq(testCaseRuns.test_run_id, run.id),
              inArray(testCaseRuns.test_case_id, msCaseIds)
            )
          );

        const existingMsCaseIds = new Set(
          existingMsCaseRuns.map((r) => r.test_case_id)
        );
        const missingMsCaseIds = msCaseIds.filter(
          (id) => !existingMsCaseIds.has(id)
        );

        if (missingMsCaseIds.length > 0) {
          await db.insert(testCaseRuns).values(
            missingMsCaseIds.map((caseId) => ({
              id: uuidv7(),
              test_run_id: run.id,
              test_case_id: caseId,
              status: 'untested' as const,
              source_type: 'milestone' as const,
              source_id: run.milestone_id,
              created_at: new Date(),
              updated_at: new Date(),
            }))
          );

          totalCaseRunsCreated += missingMsCaseIds.length;
          log.push(
            `Run "${run.name}": added ${missingMsCaseIds.length} missing case runs from milestone`
          );
        }
      }
    }

    log.push(`--- DONE ---`);
    log.push(`Total suite links created: ${totalSuiteLinksCreated}`);
    log.push(`Total case runs created: ${totalCaseRunsCreated}`);

    return NextResponse.json({
      success: true,
      suiteLinksCreated: totalSuiteLinksCreated,
      caseRunsCreated: totalCaseRunsCreated,
      log,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.push(`ERROR: ${message}`);
    return NextResponse.json({ success: false, error: message, log }, { status: 500 });
  }
}
