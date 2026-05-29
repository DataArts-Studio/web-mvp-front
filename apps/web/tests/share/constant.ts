// 베타/DB 장애 안내 dialog 의 sessionStorage dismiss 플래그.
// 두 dialog 가 동시에 뜨면 overlay 가 겹쳐 모든 클릭이 막히므로
// 페이지 hydration 전에 미리 플래그를 박아 아예 안 뜨게 한다.
// (use-beta-notice.ts / use-db-outage-notice.ts 참고)
export const NOTICE_DISMISS_KEYS = [
  'beta-notice-dismissed-v1',
  'db-outage-notice-dismissed-v1',
];
