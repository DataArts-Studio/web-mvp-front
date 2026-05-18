import { test } from '../../fixtures/test';
import { ACCESS_TEST_DATA as DATA } from '../../data/test-data';

/**
 * 대시보드 E2E (FDD-PJT02) — 범위는 tests/dashboard/test-scenario.md 참조.
 *
 * - 이 스펙은 chromium-auth 프로젝트로 라우팅됨 → storageState + setup 의존.
 *   즉 "이미 인증된 세션" 전제 (dashboardPage.goto 가 게이트 안 거치고 바로 진입).
 * - 원칙: presence/네비/상태전환만 검증. 값(KPI 수치·비율·항목 내용)은 단언 금지
 *   → 단위/컴포넌트(useMemo)로. 여기엔 그 테스트를 두지 않는다.
 * - 전부 test.fixme: 보류 중 시드 이슈(PR #88 P2) + 일부 POM 메서드 미구현 상태라
 *   아직 실행 불가. 시드/POM 준비되면 해당 describe 부터 .fixme 제거해 활성화.
 *   (빈 본문은 가짜 통과라서 금지 — fixme 는 "건너뜀"으로 정직하게 표시됨)
 */
const SLUG = DATA.slug;

// 인증된 시드 프로젝트만 있으면 되는 구조/로드 (시드 후 가장 먼저 활성)
test.describe('대시보드 - 로드/구조', () => {
  test.fixme('인증 후 대시보드가 로드된다 (URL + 헤딩)', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    await dashboardPage.expectLoaded(SLUG);
    await dashboardPage.expectSidebarVisible();
  });

  test.fixme('주요 섹션이 렌더된다 (presence-only)', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    await dashboardPage.expectSectionsVisible(); // 값 아님, 렌더 여부만
  });

  test.fixme('프로젝트 정보 카드에 프로젝트명이 노출된다', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    await dashboardPage.expectProjectName(SLUG);
  });
});

// 네비게이션 (사이드메뉴 / 전체보기)
test.describe('대시보드 - 네비게이션', () => {
  test.fixme('사이드 메뉴 클릭 시 해당 라우트로 이동한다', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    await dashboardPage.clickOnNavigation('테스트 케이스');
    await dashboardPage.expectNavigationTo(`/projects/${SLUG}/cases`);
  });

  test.fixme('"전체보기" 클릭 시 목록 페이지로 이동한다', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    // TODO: 전체보기 트리거 → cases/suites 목록 이동 단언
    await dashboardPage.expectNavigationTo(`/projects/${SLUG}/cases`);
  });
});

// 시드 데이터 + teardown 필요 (생성이 대시보드에 반영되는 통합 흐름)
test.describe('대시보드 - 생성 반영', () => {
  test.fixme('케이스 추가 → 모달 → 생성 → 대시보드 갱신', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    await dashboardPage.clickAddButton('test-case');
    // TODO: 모달 입력 → 제출 → 토스트 → 모달 닫힘 → 카운트/목록 갱신 단언
    // 주의: 실제 DB row 생성 → afterEach 정리(teardown) 없으면 재실행 깨짐
  });

  test.fixme('스위트 추가 → 동일 흐름', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    await dashboardPage.clickAddButton('test-suite');
    // TODO: 위와 동일 (생성 → 갱신 확인 + teardown)
  });
});

// 온보딩: 기본 수동. 자동화 시 "본 적 있음" 플래그 initScript 제어
test.describe('대시보드 - 온보딩', () => {
  test.fixme('최초 접근 시 온보딩이 출력된다', async ({ dashboardPage }) => {
    await dashboardPage.goto(SLUG);
    // TODO: 온보딩 노출 단언 (initScript 로 first-visit 플래그 제어 후)
  });
});

// OUT(값 검증: KPI 수치·PassRate·차트 비율·노티스·최근활동 내용)은
// 여기 두지 않는다 → kpiData/testStatusData(useMemo) 단위 테스트로.
