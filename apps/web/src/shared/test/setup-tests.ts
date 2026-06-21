import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 프로젝트 접근 인가 가드는 쿠키(next/headers) 의존이라 jsdom 단위 테스트 환경에서는
// 항상 거부된다. 비즈니스 로직 단위 테스트는 인가 통과를 전제로 작성됐으므로,
// 전역 기본 mock 으로 통과시킨다. 인가 로직 자체는 access/lib 의 전용 테스트에서 검증한다.
// (개별 파일이 같은 모듈을 vi.mock 하면 그 파일에서는 파일 mock 이 우선한다.)
vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: vi.fn(() => Promise.resolve(true)),
}));

// 저장 용량 한도도 교차 관심사다. 한도 통과를 전제하므로 전역 기본 mock 으로 통과(null)시킨다.
// 한도 로직 자체는 shared/lib/storage 의 전용 테스트에서 vi.unmock 후 실제 구현으로 검증한다.
vi.mock('@/shared/lib/storage/check-storage-limit', () => ({
  checkStorageLimit: vi.fn(() => Promise.resolve(null)),
}));
