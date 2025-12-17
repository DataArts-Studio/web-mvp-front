'use client'
import React from 'react';
import { SuiteCreateForm } from '@/features/suites-create';
import { Container, DSButton, MainContainer } from '@/shared';
import { Aside } from '@/widgets';
import { AlertCircle, FileText, FolderTree, Layers, PlayCircle, Search } from 'lucide-react';
import { useDisclosure } from '@/shared/hooks';

export const TestSuitesView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* 헤더 영역 */}
        <header className="col-span-6 flex w-full items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="typo-title-heading">테스트 스위트 관리</h1>
            <p className="typo-body1-normal text-text-3">
              흩어진 테스트 케이스를 기능·시나리오 단위 스위트로 묶어 관리하고, 문서 복사 없이 같은
              스위트를 반복 실행하세요.
            </p>
          </div>
          <DSButton type="button" variant="solid" onClick={onOpen}>
            테스트 스위트 생성하기
          </DSButton>
        </header>

        {/* 상단 컨트롤 바: 검색 + 필터 + 요약 */}
        <section
          aria-label="테스트 스위트 컨트롤"
          className="bg-bg-2 shadow-1 col-span-6 flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-3"
        >
          {/* 검색 + 필터 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 검색 */}
            <div className="bg-bg-3 flex items-center gap-2 rounded-lg px-3 py-2">
              <Search className="text-text-3 h-4 w-4" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="스위트 이름 또는 키워드로 검색"
                className="typo-label-normal text-text-1 placeholder:text-text-4 bg-transparent focus:outline-none"
              />
            </div>

            {/* 타입 필터 */}
            <nav className="flex flex-wrap gap-2">
              {['전체', '기능별', '시나리오', '회귀 테스트'].map((label, index) => (
                <button
                  key={label}
                  className={[
                    'typo-label-normal rounded-full px-3 py-1',
                    index === 0
                      ? 'bg-bg-3 text-primary'
                      : 'text-text-3 hover:bg-bg-3 hover:text-text-1',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* 요약 숫자 */}
          <div className="text-label-normal text-text-3 flex flex-wrap gap-4">
            <span>스위트 5개</span>
            <span>테스트 케이스 120개</span>
            <span>오늘 실행 4회</span>
          </div>
        </section>

        {/* 컬럼 헤더 */}
        <div className="text-label-normal text-text-3 col-span-6 mt-2 hidden items-center justify-between md:flex">
          <span className="w-[40%]">스위트</span>
          <span className="w-[30%]">구성</span>
          <span className="w-[30%] text-right">최근 실행</span>
        </div>

        {/* 테스트 스위트 리스트 */}
        <section aria-label="테스트 스위트 리스트" className="col-span-6 flex flex-col gap-3">
          {/* 스위트 1: 기능별 - 인증 플로우 */}
          <article className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            {/* 왼쪽: 이름/타입/설명 */}
            <div className="flex w-full flex-col gap-2 md:w-[40%]">
              <div className="flex items-center gap-3">
                <h2 className="typo-h2-heading">인증 플로우 (로그인/회원가입)</h2>
                <span className="typo-label-heading bg-bg-3 text-text-2 rounded-full px-3 py-1">
                  기능별
                </span>
              </div>
              <p className="typo-body2-normal text-text-2">
                로그인, 회원가입, 비밀번호 재설정 등 인증 관련 핵심 플로우를 묶은 스위트입니다.
              </p>
            </div>

            {/* 가운데: 구성 정보 */}
            <div className="text-label-normal text-text-3 flex w-full flex-col gap-2 md:w-[30%]">
              <div className="flex items-center gap-1.5">
                <FolderTree className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>포함 경로: /auth/*</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>테스트 케이스 32개</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>연결된 마일스톤: v1.0 릴리즈</span>
              </div>
            </div>

            {/* 오른쪽: 최근 실행 요약 */}
            <div className="text-label-normal text-text-3 flex w-full flex-col gap-1 md:w-[30%] md:items-end">
              <div className="flex items-center gap-1.5 md:justify-end">
                <PlayCircle className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>최근 실행: 2024-12-20</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <AlertCircle className="text-system-red h-4 w-4" strokeWidth={1.5} />
                <span>실패 3개 · Blocked 1개</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <FileText className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>실행 히스토리 5회</span>
              </div>
            </div>
          </article>

          {/* 스위트 2: 시나리오 - 결제 플로우 */}
          <article className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 md:w-[40%]">
              <div className="flex items-center gap-3">
                <h2 className="typo-h2-heading">결제 플로우 (장바구니 → 결제 완료)</h2>
                <span className="typo-label-heading bg-bg-3 text-text-2 rounded-full px-3 py-1">
                  시나리오
                </span>
              </div>
              <p className="typo-body2-normal text-text-2">
                장바구니부터 결제 완료까지 전체 사용자 시나리오를 end-to-end로 검증합니다.
              </p>
            </div>

            <div className="text-label-normal text-text-3 flex w-full flex-col gap-2 md:w-[30%]">
              <div className="flex items-center gap-1.5">
                <FolderTree className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>포함 경로: /cart, /checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>테스트 케이스 18개</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>연결된 마일스톤: v1.1 베타</span>
              </div>
            </div>

            <div className="text-label-normal text-text-3 flex w-full flex-col gap-1 md:w-[30%] md:items-end">
              <div className="flex items-center gap-1.5 md:justify-end">
                <PlayCircle className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>최근 실행: 2024-12-22</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <AlertCircle className="text-system-red h-4 w-4" strokeWidth={1.5} />
                <span>실패 1개</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <FileText className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>실행 히스토리 2회</span>
              </div>
            </div>
          </article>

          {/* 스위트 3: 회귀 테스트 */}
          <article className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 md:w-[40%]">
              <div className="flex items-center gap-3">
                <h2 className="typo-h2-heading">주요 기능 회귀 테스트</h2>
                <span className="typo-label-heading bg-bg-3 text-text-2 rounded-full px-3 py-1">
                  회귀 테스트
                </span>
              </div>
              <p className="typo-body2-normal text-text-2">
                배포 전에 항상 돌려야 하는 핵심 기능 회귀 스위트입니다.
              </p>
            </div>

            <div className="text-label-normal text-text-3 flex w-full flex-col gap-2 md:w-[30%]">
              <div className="flex items-center gap-1.5">
                <FolderTree className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>포함 경로: /auth, /dashboard, /settings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>테스트 케이스 40개</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>연결된 마일스톤: v1.0, v1.1</span>
              </div>
            </div>

            <div className="text-label-normal text-text-3 flex w-full flex-col gap-1 md:w-[30%] md:items-end">
              <div className="flex items-center gap-1.5 md:justify-end">
                <PlayCircle className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>최근 실행: 2024-12-19</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <AlertCircle className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                <span>최근 실행: 모두 통과</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <FileText className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <span>실행 히스토리 8회</span>
              </div>
            </div>
          </article>
        </section>
        {isOpen && <SuiteCreateForm onClose={onClose} />}
      </MainContainer>
    </Container>
  );
};
