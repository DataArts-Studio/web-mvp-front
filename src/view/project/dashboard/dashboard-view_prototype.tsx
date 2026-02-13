import React from 'react';

import { Container, MainContainer } from '@/shared/lib/primitives';
import { ShPieChart } from '@/shared/ui/sh-pie-chart';
import { Aside } from '@/widgets';

export const ProjectDashboardView = () => {
  return (
    <Container
      id="container"
      className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans"
    >
      <Aside />
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 items-center gap-x-5 gap-y-8 px-10 py-8">
        {/* 헤더 */}
        <header className="border-bg-4 col-span-6 flex w-full flex-col gap-3 border-b pb-6">
          <h2 className="typo-title-heading">사용자가 입력한 [Project Name]이 배치됩니다.</h2>
          <p className="typo-body1-normal text-text-3">통합 테스트 현황 및 빠른 작업 허브</p>
        </header>

        {/* 그래프 + 요약 */}
        <section className="bg-bg-2 shadow-2 col-span-6 rounded-md p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="typo-h2-heading">Test Activity (지난 14일)</h2>
            <button className="border-bg-4 text-label-normal text-text-3 hover:bg-bg-3 rounded border px-3 py-1">
              Reports
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
            {/* 그래프 자리 */}
            <div className="border-bg-4 text-label-normal text-text-4 flex h-60 items-center justify-center rounded border border-dashed">
              <ShPieChart
                data={[
                  { status: 'Pass', count: 85 },
                  { status: 'Fail', count: 10 },
                  { status: 'Skipped', count: 5 },
                ]}
                category={'status'}
                value={'count'}
                className='w-full h-full'
              />
            </div>

            {/* 상태 요약 */}
            <ul className="text-body2-normal text-text-2 space-y-3">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  Passed
                </span>
                <span className="text-text-1 font-semibold">2208</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  Failed
                </span>
                <span className="text-text-1 font-semibold">175</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  Blocked
                </span>
                <span className="text-text-1 font-semibold">35</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="bg-text-4 h-3 w-3 rounded-full" />
                  Untested
                </span>
                <span className="text-text-1 font-semibold">50</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Milestones / Test Runs */}
        <section className="col-span-6 grid gap-6 md:grid-cols-2">
          <article className="bg-bg-2 shadow-1 flex flex-col rounded-md p-6">
            <header className="mb-3 flex items-center justify-between">
              <span className="typo-body2-heading">Milestones</span>
              <button className="text-label-normal text-text-4 hover:text-text-2">View all</button>
            </header>
            <ul className="text-body2-normal text-text-2 space-y-2">
              <li>
                <span className="text-text-1 font-semibold">Release 1.0</span> — 2025-01-10 (In
                progress)
              </li>
              <li>
                <span className="text-text-1 font-semibold">Release 1.1</span> — 2025-02-02
                (Planned)
              </li>
            </ul>
          </article>

          <article className="bg-bg-2 shadow-1 flex flex-col rounded-md p-6">
            <header className="mb-3 flex items-center justify-between">
              <span className="typo-body2-heading">Test Runs</span>
              <button className="text-label-normal text-text-4 hover:text-text-2">View all</button>
            </header>
            <ul className="text-body2-normal text-text-2 space-y-2">
              <li>
                <span className="text-text-1 font-semibold">Run 1: Smoke</span> — 73% passed
              </li>
              <li>
                <span className="text-text-1 font-semibold">Run 2: Regression</span> — 52% passed
              </li>
            </ul>
          </article>
        </section>

        {/* Activity */}
        <section className="bg-bg-2 shadow-1 col-span-6 rounded-md p-6">
          <header className="mb-3 flex items-center justify-between">
            <span className="typo-body2-heading">Activity</span>
            <button className="text-label-normal text-text-4 hover:text-text-2">History</button>
          </header>
          <ul className="text-label-normal text-text-2 space-y-2">
            <li>• Test Run "Run 1" updated by admin — 5분 전</li>
            <li>• Test Case "Login with invalid password" edited — 12분 전</li>
            <li>• Milestone "Release 1.0" status changed to In progress — 1시간 전</li>
          </ul>
        </section>

      </MainContainer>
    </Container>
  );
};
