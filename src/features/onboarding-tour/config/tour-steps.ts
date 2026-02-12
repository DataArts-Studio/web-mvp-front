import type { DriveStep } from 'driver.js';

export const TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="kpi-cards"]',
    popover: {
      title: 'KPI 카드',
      description: '전체 케이스 수, 스위트, 통과율 등 핵심 지표를 한눈에 확인하세요.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="project-info"]',
    popover: {
      title: '프로젝트 정보',
      description: '프로젝트 링크를 복사하거나 환경설정을 관리할 수 있습니다.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="recent-activity"]',
    popover: {
      title: '최근 활동',
      description: '최근 생성된 테스트 케이스와 스위트를 확인하세요.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="test-status-chart"]',
    popover: {
      title: '테스트 현황 차트',
      description: '통과/실패/차단/미실행 비율을 파이 차트로 확인하세요.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="test-cases"]',
    popover: {
      title: '테스트 케이스',
      description: '테스트 케이스 목록을 확인하고, 새로운 케이스를 생성하세요.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="test-suites"]',
    popover: {
      title: '테스트 스위트',
      description: '테스트 스위트 목록을 확인하고, 새로운 스위트를 생성하세요.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="guide-tour-btn"]',
    popover: {
      title: '온보딩',
      description: '이 버튼을 클릭하면 언제든지 대시보드 설명을 다시 확인할 수 있습니다.',
      side: 'bottom',
      align: 'end',
    },
  },
];

export const TOTAL_STEPS = TOUR_STEPS.length;
