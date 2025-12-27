'use client';
import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams } from 'next/navigation';

import { dashboardStatsQueryOptions } from '@/features';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { DSButton } from '@/shared/ui';
import { Aside } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Plus, Settings } from 'lucide-react';

export const ProjectDashboardView = () => {
  const params = useParams();
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  console.log(params, params.slug, typeof params, typeof params.slug);
  const option = dashboardStatsQueryOptions(params.slug as string);
  const { data: dashboardData, isLoading, isError } = useQuery(option);

  if (isLoading) {
    return <div>로딩중...</div>;
  }

  if (isError || !dashboardData || !dashboardData.success) {
    return <div>에러 발생</div>
  }

  const { project } = dashboardData.data;

  return (
    <Container
      id="container"
      className="bg-bg-1 text-text-1 flex min-h-screen items-start justify-start font-sans"
    >
      <Aside />
      <MainContainer className="flex min-h-screen w-full flex-1 flex-col gap-20 px-10 py-20">
        {/* 섹션 1: 헤더 + 프로젝트 정보/최근 활동 */}
        <section className="flex w-full max-w-[1200px] flex-col gap-9">
          {/* 헤더 텍스트 */}
          <h1 className="text-text-1 text-[32px] leading-[1.4] font-bold tracking-tight">
            클릭 몇 번이면 뚝딱!
            <br />
            테스트 케이스를 자동으로 만들어보세요.
          </h1>

          {/* 프로젝트 정보 + 최근 활동 카드 */}
          <div className="flex w-full gap-3">
            {/* 내 프로젝트 정보 카드 */}
            <div className="bg-bg-2 relative flex w-[350px] flex-col gap-4 overflow-hidden rounded-lg p-4">
              <span className="text-text-3 text-xs">내 프로젝트 정보</span>

              <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/5 p-4">
                <div className="flex items-center gap-1">
                  <span className="text-primary text-base font-semibold">{url}</span>
                  {/* 공유 아이콘 placeholder */}
                  <div className="text-primary size-4">{/* icon placeholder */}</div>
                </div>
                <span className="text-text-2 text-xs">{project.created_at.toISOString()} 생성됨</span>
              </div>

              <div className="flex justify-end">
                <DSButton variant="text" className="text-text-2 flex items-center gap-2">
                  <Settings className="size-4" />
                  <span>환경설정</span>
                </DSButton>
              </div>

              {/* 배경 데코레이션 placeholder */}
              <div className="bg-primary/10 absolute top-12 -left-[228px] size-64 rounded-full blur-3xl" />
            </div>

            {/* 최근 활동 카드 */}
            <div className="bg-bg-2 flex flex-1 flex-col gap-4 rounded-lg p-4">
              <span className="text-text-3 text-xs">최근 활동</span>

              <ul className="flex flex-col gap-1">
                {[1, 2, 3, 4].map((item) => (
                  <li key={item} className="flex items-center gap-1">
                    <span className="text-text-1 text-base">
                      <span className="mr-2">•</span>
                      ipsum Loremipsum Loremipsum Loremipsum
                    </span>
                    <span className="text-text-2 mx-1">•</span>
                    <span className="text-text-2 text-base font-semibold">3일전</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 섹션 2: 테스트 케이스 한눈에 보기 */}
        <section className="flex w-full max-w-[1200px] flex-col gap-9">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2">
            <h2 className="text-text-1 text-[32px] leading-[1.4] font-bold tracking-tight">
              테스트 케이스 한눈에 보기
            </h2>
            <ChevronRight className="text-text-1 size-6" />
          </div>

          {/* 빈 상태 카드 */}
          <div className="bg-bg-2 relative gap-4 overflow-hidden rounded-2xl px-6 pt-6 pb-12">
            <div className="flex flex-col items-center justify-center gap-4">
              {/* 이미지 placeholder */}
              <Image
                src="/teacup/tea-cup-not-found.svg"
                width={383.27}
                height={488.57}
                alt="테스트 케이스 없음"
              />

              {/* 텍스트 + CTA */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-4">
                  <h3 className="text-text-1 text-2xl font-bold">테스트 케이스를 생성해보세요!</h3>
                  <p className="text-text-1 text-center text-lg">
                    아직 생성된 테스트 케이스가 없습니다.
                    <br />
                    테스트 케이스를 만들면 여기에서 빠르게 확인할 수 있어요.
                  </p>
                </div>

                <DSButton
                  variant="solid"
                  className="flex h-14 cursor-pointer items-center gap-2 px-5"
                >
                  <Plus className="size-6" />
                  <span className="text-lg font-semibold">테스트 케이스 만들기</span>
                </DSButton>
              </div>
            </div>

            {/* 배경 데코레이션 placeholder */}
            <div className="bg-primary/10 absolute right-[25%] bottom-[-200px] size-[500px] rounded-full blur-3xl" />
          </div>
        </section>

        {/* 섹션 3: 테스트 스위트 */}
        <section className="flex w-full max-w-[1200px] flex-col gap-9">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2">
            <h2 className="text-text-1 text-[32px] leading-[1.4] font-bold tracking-tight">
              테스트 스위트
            </h2>
            <ChevronRight className="text-text-1 size-6" />
          </div>

          {/* 빈 상태 카드 */}
          <div className="bg-bg-2 flex flex-col items-center gap-4 rounded-lg px-0 py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-text-1 text-2xl font-bold">테스트 스위트를 생성해보세요!</h3>
                <p className="text-text-1 text-center text-lg">
                  아직 생성된 테스트 스위트가 없습니다.
                  <br />
                  테스트 스위트로, 테스트 케이스를 더 쉽게 관리해보세요!
                </p>
              </div>

              <DSButton
                variant="solid"
                className="flex h-14 cursor-pointer items-center gap-2 px-5"
              >
                <Plus className="size-6" />
                <span className="text-lg font-semibold">테스트 스위트 만들기</span>
              </DSButton>
            </div>
          </div>
        </section>
      </MainContainer>
    </Container>
  );
};
