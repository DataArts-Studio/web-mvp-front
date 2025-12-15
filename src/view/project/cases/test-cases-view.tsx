import React from 'react';

import { Container, DSButton, MainContainer } from '@/shared';
import { Aside } from '@/widgets';
import { ChevronDown, Filter, MoreHorizontal, Plus, Search } from 'lucide-react';
import { TestCaseSideView } from '@/view/project/cases/test-case-side-view';

export const TestCasesView = () => {
  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans">
      {/* Aside */}
      <Aside />

      {/* Main Content */}
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* Header */}
        <header className="col-span-6 border-line-2 flex flex-col gap-1 border-b pb-6">
          <h2 className="typo-h1-heading text-text-1">테스트 케이스 관리</h2>
          <p className="typo-body2-normal text-text-2">
            프로젝트의 모든 테스트 케이스를 조회하고 관리합니다.
          </p>
        </header>

        {/* Toolbar (Search, Filter, Actions) */}
        <section className="col-span-6 flex items-center justify-between gap-4">
          {/* Left: Search & Filters */}
          <div className="flex flex-1 items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="테스트 케이스 제목을 입력해 주세요."
                className="typo-body2-normal rounded-2 border-line-2 bg-bg-2 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary w-full border py-2 pr-4 pl-10 focus:ring-1 focus:outline-none"
              />
            </div>

            {/* Filter Dropdown Trigger */}
            <DSButton className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center gap-2 border px-3 py-2 transition-colors">
              <Filter className="h-4 w-4" />
              <span>상태: All</span>
              <ChevronDown className="text-text-3 h-4 w-4" />
            </DSButton>

            {/* Sort Dropdown Trigger */}
            <DSButton className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center gap-2 border px-3 py-2 transition-colors">
              <span>정렬: 최근 수정 순</span>
              <ChevronDown className="text-text-3 h-4 w-4" />
            </DSButton>
          </div>

          {/* Right: Advanced Create Button */}
          <button className="typo-body2-heading flex items-center gap-2 rounded-2 bg-primary px-4 py-2 text-text-1 shadow-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            상세 생성
          </button>
        </section>

        {/* Test Case List Container */}
        <section className="col-span-6 rounded-4 border-line-2 bg-bg-2 shadow-1 flex flex-col overflow-hidden border">
          {/* Table Header */}
          <div className="border-line-2 bg-bg-3 grid grid-cols-12 gap-4 border-b px-6 py-3">
            <div className="typo-caption-heading text-text-3 col-span-2 uppercase">
              ID
            </div>
            <div className="typo-caption-heading text-text-3 col-span-4 uppercase">
              제목
            </div>
            <div className="typo-caption-heading text-text-3 col-span-2 text-center uppercase">
              상태
            </div>
            <div className="typo-caption-heading text-text-3 col-span-3 text-right uppercase">
              최종 수정
            </div>
            <div className="col-span-1"></div>
          </div>

          {/* Inline Create Row */}
          <div className="group border-line-2 bg-primary/5 hover:bg-primary/10 grid grid-cols-12 gap-4 border-b px-6 py-3 transition-colors">
            <div className="col-span-12 flex items-center gap-3">
              <div className="rounded-1 bg-primary/20 text-primary flex h-6 w-6 items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="새로운 테스트 케이스 이름을 입력하고 Enter를 누르세요..."
                className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Untested */}
          <div className="group border-line-2 hover:bg-bg-3 grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors">
            <div className='col-span-2'>
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                TC-1001
              </span>
            </div>
            <div className="col-span-4 flex flex-col gap-1">
              {/* Title */}
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                회원가입 - 이메일 형식이 잘못된 경우
              </span>
              {/* Suite Name */}
              <span className="typo-caption-normal text-text-3 hover:underline">
                회원가입 및 인증 프로세스
              </span>
            </div>
            <div className="col-span-2 flex justify-center">
              {/* Badge: Untested (Gray) */}
              <span className="typo-caption-heading rounded-1 bg-bg-4 text-text-3 inline-flex items-center px-2 py-1">
                Untested
              </span>
            </div>
            <div className="typo-caption-normal text-text-3 col-span-3 text-right">방금 전</div>
            <div className="col-span-1 flex justify-end">
              <button className="rounded-1 text-text-3 hover:bg-bg-4 hover:text-text-1 p-1 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Passed */}
          <div className="group border-line-2 hover:bg-bg-3 grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors">
            <div className='col-span-2'>
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                TC-1002
              </span>
            </div>
            <div className="col-span-4 flex flex-col gap-1">
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                로그인 - 정상 로그인 처리
              </span>
              <span className="typo-caption-normal text-text-3 hover:underline">
                회원가입 및 인증 프로세스
              </span>
            </div>
            <div className="col-span-2 flex justify-center">
              {/* Badge: Pass (Primary Green) */}
              <span className="typo-caption-heading rounded-1 bg-primary/10 text-primary inline-flex items-center px-2 py-1">
                Pass
              </span>
            </div>
            <div className="typo-caption-normal text-text-3 col-span-3 text-right">
              2025-12-12 14:30
            </div>
            <div className="col-span-1 flex justify-end">
              <button className="rounded-1 text-text-3 hover:bg-bg-4 hover:text-text-1 p-1 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Failed */}
          <div className="group border-line-2 hover:bg-bg-3 grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors">
            <div className='col-span-2'>
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                TC-1003
              </span>
            </div>
            <div className="col-span-4 flex flex-col gap-1">
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                결제 - 잔액 부족 시 알림 팝업 노출
              </span>
              <span className="typo-caption-normal text-text-3 hover:underline">
                주문 및 결제 스위트
              </span>
            </div>
            <div className="col-span-2 flex justify-center">
              {/* Badge: Fail (System Red) */}
              <span className="typo-caption-heading rounded-1 bg-system-red/10 text-system-red inline-flex items-center px-2 py-1">
                Fail
              </span>
            </div>
            <div className="typo-caption-normal text-text-3 col-span-3 text-right">
              2025-12-11 09:15
            </div>
            <div className="col-span-1 flex justify-end">
              <button className="rounded-1 text-text-3 hover:bg-bg-4 hover:text-text-1 p-1 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Blocked */}
          <div className="group border-line-2 hover:bg-bg-3 grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors">
            <div className='col-span-2'>
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                TC-1004
              </span>
            </div>
            <div className="col-span-4 flex flex-col gap-1">
              <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
                어드민 - 사용자 강제 탈퇴 기능
              </span>
              <span className="typo-caption-normal text-text-3 hover:underline">
                어드민 관리 기능
              </span>
            </div>
            <div className="col-span-2 flex justify-center">
              {/* Badge: Blocked (Text-3 + Inactive Bg) */}
              <span className="typo-caption-heading rounded-1 bg-bg-4 text-text-3 inline-flex items-center decoration-slice px-2 py-1 line-through">
                Blocked
              </span>
            </div>
            <div className="typo-caption-normal text-text-3 col-span-3 text-right">
              2025-12-10 18:00
            </div>
            <div className="col-span-1 flex justify-end">
              <button className="rounded-1 text-text-3 hover:bg-bg-4 hover:text-text-1 p-1 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center p-4">
            <button className="typo-caption-normal text-text-3 hover:text-text-1 transition-colors">
              더 보기
            </button>
          </div>
        </section>
      </MainContainer>
      {/*<TestCaseSideView/>*/}
    </Container>
  );
};
