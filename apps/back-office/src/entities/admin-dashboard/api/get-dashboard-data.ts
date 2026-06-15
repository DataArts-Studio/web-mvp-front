import { getDatabase, sql } from '@testea/db';

import type {
  CostProject,
  FunnelStep,
  Metric,
  ProjectActivity,
  StorageProject,
  StorageSummary,
  TrendPoint,
} from '../model/types';

/**
 * 백오피스 대시보드(BO02) 실데이터 조회.
 *
 * 이 제품은 사용자 계정이 없으므로(프로젝트 비밀번호 인증) DAU/WAU/MAU·가입·어뷰징 같은
 * 사용자 분석 지표는 데이터 원천이 없다. 받칠 수 있는 프로젝트·테스트·AI·스토리지 지표만
 * 실데이터로 계산하고, 나머지는 호출부에서 예시 데이터로 둔다.
 *
 * AI 비용은 ai_usage_logs 에 토큰만 있어 단가 가정으로 추정한다(Gemini Flash 기준 근사).
 */
const AI_INPUT_USD_PER_1M = 0.075;
const AI_OUTPUT_USD_PER_1M = 0.3;
const aiCostExpr = sql`COALESCE(SUM(input_tokens), 0) * ${AI_INPUT_USD_PER_1M} / 1000000 + COALESCE(SUM(output_tokens), 0) * ${AI_OUTPUT_USD_PER_1M} / 1000000`;

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function gb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function intl(n: number): string {
  return n.toLocaleString('en-US');
}

type Row = Record<string, unknown>;
const num = (v: unknown): number => Number(v ?? 0);
const str = (v: unknown): string => String(v ?? '');

export type RealDashboardData = {
  metrics: Metric[];
  projectTrend: TrendPoint[];
  productivityTrend: TrendPoint[];
  activeProjects: ProjectActivity[];
  costProjects: CostProject[];
  funnel: FunnelStep[];
  storageProjects: StorageProject[];
  storageSummary: StorageSummary;
};

export async function getDashboardData(): Promise<RealDashboardData> {
  const db = getDatabase();

  // 1) 핵심 지표
  const [m] = (await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM projects)::int AS total_projects,
      (SELECT COUNT(*) FROM projects WHERE created_at >= now() - interval '7 days')::int AS new_week,
      (SELECT COUNT(*) FROM projects WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days')::int AS new_prev,
      (SELECT COUNT(*) FROM test_cases)::int AS total_tcs,
      (SELECT COUNT(*) FROM test_case_runs)::int AS total_runs,
      (SELECT COUNT(*) FROM test_case_runs WHERE status <> 'untested')::int AS executed_runs
  `)) as unknown as Row[];

  const newWeek = num(m.new_week);
  const newPrev = num(m.new_prev);
  const growth = newPrev > 0 ? Math.round(((newWeek - newPrev) / newPrev) * 100) : 0;
  const totalRuns = num(m.total_runs);
  const executed = num(m.executed_runs);
  const execRate = totalRuns > 0 ? ((executed / totalRuns) * 100).toFixed(1) : '0.0';

  const metrics: Metric[] = [
    {
      label: '전체 프로젝트',
      value: intl(num(m.total_projects)),
      unit: '',
      helper: `최근 7일 신규: ${newWeek}개`,
    },
    {
      label: '신규 프로젝트 (주간)',
      value: intl(newWeek),
      unit: growth >= 0 ? `+${growth}%` : `${growth}%`,
      helper: `이전 주: ${newPrev}개`,
    },
    {
      label: '테스트 케이스',
      value: intl(num(m.total_tcs)),
      unit: '',
      helper: `실행 기록: ${intl(totalRuns)}건`,
    },
    {
      label: '테스트 실행률',
      value: `${execRate}%`,
      unit: '',
      helper: `실행: ${intl(executed)} / 전체: ${intl(totalRuns)}`,
    },
  ];

  // 2) 프로젝트 생성 추이 (최근 14일, 일별)
  const projectTrendRows = (await db.execute(sql`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS d
    )
    SELECT to_char(d, 'FMMM/FMDD') AS date,
      (SELECT COUNT(*) FROM projects WHERE created_at::date = days.d)::int AS projects
    FROM days ORDER BY d
  `)) as unknown as Row[];
  const projectTrend: TrendPoint[] = projectTrendRows.map((r) => ({
    date: str(r.date),
    projects: num(r.projects),
  }));

  // 3) 콘텐츠 생산량 추이 (최근 14일, 누적)
  const productivityRows = (await db.execute(sql`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS d
    )
    SELECT to_char(d, 'FMMM/FMDD') AS date,
      (SELECT COUNT(*) FROM test_cases WHERE created_at::date <= days.d)::int AS tc,
      (SELECT COUNT(*) FROM test_suites WHERE created_at::date <= days.d)::int AS suite,
      (SELECT COUNT(*) FROM test_runs WHERE created_at::date <= days.d)::int AS run,
      (SELECT COUNT(*) FROM milestones WHERE created_at::date <= days.d)::int AS milestone
    FROM days ORDER BY d
  `)) as unknown as Row[];
  const productivityTrend: TrendPoint[] = productivityRows.map((r) => ({
    date: str(r.date),
    tc: num(r.tc),
    suite: num(r.suite),
    run: num(r.run),
    milestone: num(r.milestone),
  }));

  // 4) 활성 프로젝트 Top 10 (실행 기록 수 기준)
  const activeRows = (await db.execute(sql`
    SELECT p.name,
      COUNT(DISTINCT tcr.id)::int AS runs,
      (SELECT COUNT(*) FROM test_cases tc WHERE tc.project_id = p.id)::int AS tcs,
      COALESCE((SELECT SUM(input_tokens) * ${AI_INPUT_USD_PER_1M} / 1000000 + SUM(output_tokens) * ${AI_OUTPUT_USD_PER_1M} / 1000000 FROM ai_usage_logs WHERE project_id = p.id), 0) AS ai_cost
    FROM projects p
    LEFT JOIN test_runs tr ON tr.project_id = p.id
    LEFT JOIN test_case_runs tcr ON tcr.test_run_id = tr.id
    GROUP BY p.id, p.name
    ORDER BY runs DESC, tcs DESC
    LIMIT 10
  `)) as unknown as Row[];
  const activeProjects: ProjectActivity[] = activeRows.map((r) => [
    str(r.name),
    intl(num(r.runs)),
    intl(num(r.tcs)),
    usd(num(r.ai_cost)),
  ]);

  // 5) 비용 급증 프로젝트 (AI 비용 오늘 vs 어제, ai_usage_logs)
  const costRows = (await db.execute(sql`
    SELECT p.name,
      COALESCE(SUM(CASE WHEN l.created_at::date = current_date THEN l.input_tokens END) * ${AI_INPUT_USD_PER_1M} / 1000000
        + SUM(CASE WHEN l.created_at::date = current_date THEN l.output_tokens END) * ${AI_OUTPUT_USD_PER_1M} / 1000000, 0) AS today,
      COALESCE(SUM(CASE WHEN l.created_at::date = current_date - 1 THEN l.input_tokens END) * ${AI_INPUT_USD_PER_1M} / 1000000
        + SUM(CASE WHEN l.created_at::date = current_date - 1 THEN l.output_tokens END) * ${AI_OUTPUT_USD_PER_1M} / 1000000, 0) AS yesterday,
      (${aiCostExpr}) AS cumulative
    FROM projects p
    JOIN ai_usage_logs l ON l.project_id = p.id
    GROUP BY p.id, p.name
    ORDER BY cumulative DESC
    LIMIT 5
  `)) as unknown as Row[];
  const costProjects: CostProject[] = costRows.map((r) => {
    const today = num(r.today);
    const yesterday = num(r.yesterday);
    const growthRate = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : 0;
    return [
      str(r.name),
      usd(today),
      usd(yesterday),
      growthRate >= 0 ? `+${growthRate}%` : `${growthRate}%`,
      usd(num(r.cumulative)),
    ];
  });

  // 6) 퍼널 (사용자 가입 대신 프로젝트 단계로 재정의)
  const [f] = (await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM projects)::int AS created,
      (SELECT COUNT(DISTINCT project_id) FROM test_cases)::int AS with_tc,
      (SELECT COUNT(DISTINCT project_id) FROM test_runs)::int AS with_run,
      (SELECT COUNT(DISTINCT tr.project_id) FROM test_runs tr
        JOIN test_case_runs tcr ON tcr.test_run_id = tr.id WHERE tcr.status <> 'untested')::int AS with_result
  `)) as unknown as Row[];
  const created = Math.max(1, num(f.created));
  const funnelRaw = [
    { label: '프로젝트 생성', count: num(f.created) },
    { label: '첫 TC 작성', count: num(f.with_tc) },
    { label: '첫 Run 실행', count: num(f.with_run) },
    { label: '결과 확인', count: num(f.with_result) },
  ];
  const funnel: FunnelStep[] = funnelRaw.map((step, i) => {
    const percent = Math.round((step.count / created) * 1000) / 10;
    const prev = i > 0 ? funnelRaw[i - 1].count : step.count;
    const churn =
      i > 0 && prev > 0 ? `${(((prev - step.count) / prev) * 100).toFixed(1)}% 이탈` : '';
    return {
      label: step.label,
      count: intl(step.count),
      rate: `${percent.toFixed(1)}%`,
      percent,
      churn,
    };
  });

  // 7) 스토리지 사용량 (프로젝트별 근사: 주요 콘텐츠 테이블 pg_column_size 합)
  // 후보를 TC 수로 먼저 5개 추린 뒤(저렴), 그 5개만 pg_column_size 합산(전체 134개 스캔 회피).
  const storageRows = (await db.execute(sql`
    WITH top AS (
      SELECT p.id, p.name, COUNT(tc.id) AS tc_count
      FROM projects p LEFT JOIN test_cases tc ON tc.project_id = p.id
      GROUP BY p.id, p.name
      ORDER BY tc_count DESC
      LIMIT 5
    )
    SELECT t.name,
      COALESCE((SELECT SUM(pg_column_size(tc.*)) FROM test_cases tc WHERE tc.project_id = t.id), 0)
      + COALESCE((SELECT SUM(pg_column_size(tr.*)) FROM test_runs tr WHERE tr.project_id = t.id), 0)
      + COALESCE((SELECT SUM(pg_column_size(tcr.*)) FROM test_case_runs tcr
          JOIN test_runs tr2 ON tcr.test_run_id = tr2.id WHERE tr2.project_id = t.id), 0)
      + COALESCE((SELECT SUM(pg_column_size(ts.*)) FROM test_suites ts WHERE ts.project_id = t.id), 0) AS bytes
    FROM top t
    ORDER BY bytes DESC
  `)) as unknown as Row[];
  const maxBytes = Math.max(1, ...storageRows.map((r) => num(r.bytes)));
  const storageProjects: StorageProject[] = storageRows.map((r) => ({
    name: str(r.name),
    usage: gb(num(r.bytes)),
    percent: Math.round((num(r.bytes) / maxBytes) * 100),
  }));

  const [s] = (await db.execute(sql`
    SELECT
      COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_cases t), 0)
      + COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_runs t), 0)
      + COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_case_runs t), 0)
      + COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_suites t), 0) AS total_bytes,
      ((SELECT COUNT(*) FROM test_cases) + (SELECT COUNT(*) FROM test_suites)
        + (SELECT COUNT(*) FROM test_runs) + (SELECT COUNT(*) FROM test_case_runs)
        + (SELECT COUNT(*) FROM milestones))::int AS total_rows
  `)) as unknown as Row[];
  const storageSummary: StorageSummary = {
    totalSize: gb(num(s.total_bytes)),
    totalRows: intl(num(s.total_rows)),
  };

  return {
    metrics,
    projectTrend,
    productivityTrend,
    activeProjects,
    costProjects,
    funnel,
    storageProjects,
    storageSummary,
  };
}
