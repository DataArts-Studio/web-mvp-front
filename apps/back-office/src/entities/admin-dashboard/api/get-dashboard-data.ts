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
 * 성능: 모든 집계를 단일 쿼리(JSON 반환)로 합쳐 DB 라운드트립을 1회로 줄인다.
 * (force-dynamic 페이지가 매 요청 7회 왕복하면 원격 DB 지연에 그대로 노출됨)
 *
 * AI 비용은 ai_usage_logs 에 토큰만 있어 단가 가정으로 추정한다(Gemini Flash 기준 근사).
 */
// 원격 DB 가 느리거나 불통일 때 페이지가 무한정 매달리지 않도록 조기 실패시킨다.
// (운영 동일 리전에서는 1초 미만이라 영향 없음. 실패 시 호출부가 실패 UI 로 처리한다.)
const QUERY_TIMEOUT_MS = 8000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('dashboard query timeout')), ms)
    ),
  ]);
}

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}
function gb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
function intl(n: number): string {
  return n.toLocaleString('en-US');
}
const num = (v: unknown): number => Number(v ?? 0);

type RawData = {
  totalProjects: number;
  newWeek: number;
  newPrev: number;
  totalTcs: number;
  totalRuns: number;
  executedRuns: number;
  funnelCreated: number;
  funnelWithTc: number;
  funnelWithRun: number;
  funnelWithResult: number;
  totalBytes: number;
  totalRows: number;
  projectTrend: { date: string; projects: number }[] | null;
  productivityTrend:
    | { date: string; tc: number; suite: number; run: number; milestone: number }[]
    | null;
  activeProjects: { name: string; runs: number; tcs: number; aiCost: number }[] | null;
  costProjects: { name: string; today: number; yesterday: number; cumulative: number }[] | null;
  storageProjects: { name: string; bytes: number }[] | null;
};

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

  const rows = (await withTimeout(
    db.execute(sql`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS d
    ),
    active_top AS (
      SELECT p.name,
        COUNT(DISTINCT tcr.id) AS runs,
        (SELECT COUNT(*) FROM test_cases tc WHERE tc.project_id = p.id) AS tcs,
        COALESCE((SELECT SUM(input_tokens) * 0.075 / 1000000 + SUM(output_tokens) * 0.3 / 1000000 FROM ai_usage_logs WHERE project_id = p.id), 0) AS ai_cost
      FROM projects p
      LEFT JOIN test_runs tr ON tr.project_id = p.id
      LEFT JOIN test_case_runs tcr ON tcr.test_run_id = tr.id
      GROUP BY p.id, p.name
      ORDER BY runs DESC, tcs DESC
      LIMIT 10
    ),
    cost_top AS (
      SELECT p.name,
        COALESCE(SUM(CASE WHEN l.created_at::date = current_date THEN l.input_tokens END) * 0.075 / 1000000
          + SUM(CASE WHEN l.created_at::date = current_date THEN l.output_tokens END) * 0.3 / 1000000, 0) AS today,
        COALESCE(SUM(CASE WHEN l.created_at::date = current_date - 1 THEN l.input_tokens END) * 0.075 / 1000000
          + SUM(CASE WHEN l.created_at::date = current_date - 1 THEN l.output_tokens END) * 0.3 / 1000000, 0) AS yesterday,
        COALESCE(SUM(l.input_tokens) * 0.075 / 1000000 + SUM(l.output_tokens) * 0.3 / 1000000, 0) AS cumulative
      FROM projects p JOIN ai_usage_logs l ON l.project_id = p.id
      GROUP BY p.id, p.name
      ORDER BY cumulative DESC
      LIMIT 5
    ),
    storage_cand AS (
      SELECT p.id, p.name, COUNT(tc.id) AS tc_count
      FROM projects p LEFT JOIN test_cases tc ON tc.project_id = p.id
      GROUP BY p.id, p.name
      ORDER BY tc_count DESC
      LIMIT 5
    ),
    storage_top AS (
      SELECT t.name,
        COALESCE((SELECT SUM(pg_column_size(tc.*)) FROM test_cases tc WHERE tc.project_id = t.id), 0)
        + COALESCE((SELECT SUM(pg_column_size(tr.*)) FROM test_runs tr WHERE tr.project_id = t.id), 0)
        + COALESCE((SELECT SUM(pg_column_size(tcr.*)) FROM test_case_runs tcr
            JOIN test_runs tr2 ON tcr.test_run_id = tr2.id WHERE tr2.project_id = t.id), 0)
        + COALESCE((SELECT SUM(pg_column_size(ts.*)) FROM test_suites ts WHERE ts.project_id = t.id), 0) AS bytes
      FROM storage_cand t
    )
    SELECT json_build_object(
      'totalProjects', (SELECT COUNT(*) FROM projects),
      'newWeek', (SELECT COUNT(*) FROM projects WHERE created_at >= now() - interval '7 days'),
      'newPrev', (SELECT COUNT(*) FROM projects WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days'),
      'totalTcs', (SELECT COUNT(*) FROM test_cases),
      'totalRuns', (SELECT COUNT(*) FROM test_case_runs),
      'executedRuns', (SELECT COUNT(*) FROM test_case_runs WHERE status <> 'untested'),
      'funnelCreated', (SELECT COUNT(*) FROM projects),
      'funnelWithTc', (SELECT COUNT(DISTINCT project_id) FROM test_cases),
      'funnelWithRun', (SELECT COUNT(DISTINCT project_id) FROM test_runs),
      'funnelWithResult', (SELECT COUNT(DISTINCT tr.project_id) FROM test_runs tr JOIN test_case_runs tcr ON tcr.test_run_id = tr.id WHERE tcr.status <> 'untested'),
      'totalBytes', (
        COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_cases t), 0)
        + COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_runs t), 0)
        + COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_case_runs t), 0)
        + COALESCE((SELECT SUM(pg_column_size(t.*)) FROM test_suites t), 0)
      ),
      'totalRows', (
        (SELECT COUNT(*) FROM test_cases) + (SELECT COUNT(*) FROM test_suites)
        + (SELECT COUNT(*) FROM test_runs) + (SELECT COUNT(*) FROM test_case_runs)
        + (SELECT COUNT(*) FROM milestones)
      ),
      'projectTrend', (
        SELECT json_agg(json_build_object('date', to_char(d, 'FMMM/FMDD'),
          'projects', (SELECT COUNT(*) FROM projects WHERE created_at::date = days.d)) ORDER BY d) FROM days
      ),
      'productivityTrend', (
        SELECT json_agg(json_build_object('date', to_char(d, 'FMMM/FMDD'),
          'tc', (SELECT COUNT(*) FROM test_cases WHERE created_at::date <= days.d),
          'suite', (SELECT COUNT(*) FROM test_suites WHERE created_at::date <= days.d),
          'run', (SELECT COUNT(*) FROM test_runs WHERE created_at::date <= days.d),
          'milestone', (SELECT COUNT(*) FROM milestones WHERE created_at::date <= days.d)) ORDER BY d) FROM days
      ),
      'activeProjects', (
        SELECT json_agg(json_build_object('name', name, 'runs', runs, 'tcs', tcs, 'aiCost', ai_cost)
          ORDER BY runs DESC, tcs DESC) FROM active_top
      ),
      'costProjects', (
        SELECT json_agg(json_build_object('name', name, 'today', today, 'yesterday', yesterday, 'cumulative', cumulative)
          ORDER BY cumulative DESC) FROM cost_top
      ),
      'storageProjects', (
        SELECT json_agg(json_build_object('name', name, 'bytes', bytes) ORDER BY bytes DESC) FROM storage_top
      )
    ) AS data
  `),
    QUERY_TIMEOUT_MS
  )) as unknown as { data: RawData }[];

  const d = rows[0].data;

  const growth = d.newPrev > 0 ? Math.round(((d.newWeek - d.newPrev) / d.newPrev) * 100) : 0;
  const execRate = d.totalRuns > 0 ? ((d.executedRuns / d.totalRuns) * 100).toFixed(1) : '0.0';

  const metrics: Metric[] = [
    {
      label: '전체 프로젝트',
      value: intl(d.totalProjects),
      unit: '',
      helper: `최근 7일 신규: ${d.newWeek}개`,
    },
    {
      label: '신규 프로젝트 (주간)',
      value: intl(d.newWeek),
      unit: growth >= 0 ? `+${growth}%` : `${growth}%`,
      helper: `이전 주: ${d.newPrev}개`,
    },
    {
      label: '테스트 케이스',
      value: intl(d.totalTcs),
      unit: '',
      helper: `실행 기록: ${intl(d.totalRuns)}건`,
    },
    {
      label: '테스트 실행률',
      value: `${execRate}%`,
      unit: '',
      helper: `실행: ${intl(d.executedRuns)} / 전체: ${intl(d.totalRuns)}`,
    },
  ];

  const projectTrend: TrendPoint[] = (d.projectTrend ?? []).map((r) => ({
    date: r.date,
    projects: num(r.projects),
  }));

  const productivityTrend: TrendPoint[] = (d.productivityTrend ?? []).map((r) => ({
    date: r.date,
    tc: num(r.tc),
    suite: num(r.suite),
    run: num(r.run),
    milestone: num(r.milestone),
  }));

  const activeProjects: ProjectActivity[] = (d.activeProjects ?? []).map((r) => [
    r.name,
    intl(num(r.runs)),
    intl(num(r.tcs)),
    usd(num(r.aiCost)),
  ]);

  const costProjects: CostProject[] = (d.costProjects ?? []).map((r) => {
    const today = num(r.today);
    const yesterday = num(r.yesterday);
    const rate = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : 0;
    return [
      r.name,
      usd(today),
      usd(yesterday),
      rate >= 0 ? `+${rate}%` : `${rate}%`,
      usd(num(r.cumulative)),
    ];
  });

  const created = Math.max(1, num(d.funnelCreated));
  const funnelRaw = [
    { label: '프로젝트 생성', count: num(d.funnelCreated) },
    { label: '첫 TC 작성', count: num(d.funnelWithTc) },
    { label: '첫 Run 실행', count: num(d.funnelWithRun) },
    { label: '결과 확인', count: num(d.funnelWithResult) },
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

  const storageList = d.storageProjects ?? [];
  const maxBytes = Math.max(1, ...storageList.map((r) => num(r.bytes)));
  const storageProjects: StorageProject[] = storageList.map((r) => ({
    name: r.name,
    usage: gb(num(r.bytes)),
    percent: Math.round((num(r.bytes) / maxBytes) * 100),
  }));

  const storageSummary: StorageSummary = {
    totalSize: gb(num(d.totalBytes)),
    totalRows: intl(num(d.totalRows)),
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
