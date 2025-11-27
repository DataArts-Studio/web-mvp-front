// 상태 관련
const STATE = {
  EXPANDED: 'aria-expanded',        // 토글(accordion, dropdown)
  HIDDEN: 'aria-hidden',            // 비표시 요소
  DISABLED: 'aria-disabled',        // 비활성화
  SELECTED: 'aria-selected',        // 선택
  PRESSED: 'aria-pressed',          // 토글 버튼
  CHECKED: 'aria-checked',          // 체크박스/라디오
  CURRENT: 'aria-current',          // 네비게이션 상태
} as const;


// 관계 관련
const RELATION = {
  CONTROLS: 'aria-controls',        // 제어 중인 요소
  OWNS: 'aria-owns',                // DOM 상 떨어진 요소 소유
  DESCRIBEDBY: 'aria-describedby',  // 설명 요소 참조
  LABELLEDBY: 'aria-labelledby',    // 라벨 요소 참조
} as const;


// 라벨 관련
const LABEL = {
  LABEL: 'aria-label',              // 직접 라벨링
  ROLE_DESCRIPTION: 'aria-roledescription', // 역할 설명
} as const;


// 입력/유효성 관련
const FORM = {
  REQUIRED: 'aria-required',
  INVALID: 'aria-invalid',
} as const;


// 라이브 리전 관련 (스크린리더용 동적 알림)
const LIVE_REGION = {
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
} as const;


// 메뉴/리스트/트리 관련
const COLLECTION = {
  MULTISELECTABLE: 'aria-multiselectable',
  ORIENTATION: 'aria-orientation',
} as const;


// 팝업/메뉴 관련
const POPUP = {
  HASPOPUP: 'aria-haspopup',        // menu, listbox, dialog 등
  CONTEXTMENU: 'aria-contextmenu',
} as const;


// 최종 ARIA 객체
export const ARIA = {
  STATE,
  RELATION,
  LABEL,
  FORM,
  LIVE_REGION,
  COLLECTION,
  POPUP,
} as const;
