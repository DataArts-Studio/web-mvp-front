'use client';

import dynamic from 'next/dynamic';

import type { ProjectActivity, TrendPoint } from '@/entities/admin-dashboard';
import { Select } from '@/shared/ui';

import {
  selectContentClassName,
  selectItemClassName,
  selectTriggerClassName,
  selectValueClassName,
} from './select-styles';

const NewProjectsChart = dynamic(
  () => import('./trend-charts').then((mod) => mod.NewProjectsChart),
  {
    ssr: false,
  }
);
const ActiveUsersChart = dynamic(
  () => import('./trend-charts').then((mod) => mod.ActiveUsersChart),
  {
    ssr: false,
  }
);
const ProductivityChart = dynamic(
  () => import('./trend-charts').then((mod) => mod.ProductivityChart),
  {
    ssr: false,
  }
);

type TrendAnalysisSectionProps = {
  projectTrend: TrendPoint[];
  activeUserTrend: TrendPoint[];
  productivityTrend: TrendPoint[];
  activeProjects: ProjectActivity[];
};

export function TrendAnalysisSection({
  projectTrend,
  activeUserTrend,
  productivityTrend,
  activeProjects,
}: TrendAnalysisSectionProps) {
  return (
    <section aria-labelledby="trend-title" className="grid gap-6">
      <h2 id="trend-title" className="tracking-zero text-lg font-bold">
        추이 분석
      </h2>
      <div className="grid gap-6 xl:grid-cols-2">
        <section
          aria-labelledby="new-projects-trend-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="new-projects-trend-title" className="text-xl font-bold">
              신규 프로젝트 추이
            </h3>
            <div className="text-text-secondary flex items-center gap-3 text-xs">
              <span>최근 30일</span>
            </div>
          </div>
          <div className="h-72 w-full" role="img" aria-label="최근 30일 신규 프로젝트 추이 차트">
            <NewProjectsChart data={projectTrend} />
          </div>
        </section>

        <section
          aria-labelledby="active-users-trend-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="active-users-trend-title" className="text-xl font-bold">
              DAU / WAU / MAU 추이
            </h3>
          </div>
          <div className="h-72 w-full" role="img" aria-label="DAU, WAU, MAU 사용자 추이 차트">
            <ActiveUsersChart data={activeUserTrend} />
          </div>
        </section>

        <section
          aria-labelledby="productivity-trend-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="productivity-trend-title" className="text-xl font-bold">
              콘텐츠 생산량
            </h3>
            <div className="w-32">
              <Select.Root defaultValue="누적" size="md" disabled>
                <Select.Trigger
                  aria-label="콘텐츠 생산량 집계 기준"
                  className={selectTriggerClassName}
                >
                  <Select.Value placeholder="집계 기준" className={selectValueClassName} />
                </Select.Trigger>
                <Select.Content className={selectContentClassName}>
                  <Select.Item value="누적" className={selectItemClassName}>
                    누적
                  </Select.Item>
                  <Select.Item value="일별" className={selectItemClassName}>
                    일별
                  </Select.Item>
                  <Select.Item value="주간" className={selectItemClassName}>
                    주간
                  </Select.Item>
                  <Select.Item value="월간" className={selectItemClassName}>
                    월간
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>
          <div
            className="h-72 w-full"
            role="img"
            aria-label="TC, Suite, Run, Milestone 생산량 차트"
          >
            <ProductivityChart data={productivityTrend} />
          </div>
        </section>

        <section
          aria-labelledby="active-projects-title"
          className="border-border overflow-hidden rounded-xl border bg-white"
        >
          <div className="border-border border-b px-5 py-4">
            <h3 id="active-projects-title" className="text-xl font-bold">
              활성 프로젝트 Top 10
            </h3>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">
                활성 프로젝트 상위 10개의 Run 수, TC 수, AI 비용 목록
              </caption>
              <thead className="bg-surface-header text-text-secondary sticky top-0 text-left">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    프로젝트
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Run
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    TC
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    AI 비용
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {activeProjects.map((project, index) => (
                  <tr key={project[0]}>
                    <td className="px-5 py-3 font-medium">
                      {index + 1}. {project[0]}
                    </td>
                    <td className="px-5 py-3">{project[1]}</td>
                    <td className="px-5 py-3">{project[2]}</td>
                    <td className="px-5 py-3">{project[3]}</td>
                  </tr>
                ))}
                {activeProjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-text-secondary px-5 py-10 text-center">
                      없음
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
