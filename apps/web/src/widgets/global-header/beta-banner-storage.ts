// 서버 컴포넌트(루트 레이아웃)도 읽어야 하므로 'use client' 를 붙이지 않는다.
// 'use client' 모듈의 export 는 서버에서 값이 아니라 클라이언트 참조가 된다.

export const BETA_BANNER_STORAGE_KEY = 'beta-banner-dismissed-v1';
/** 닫은 세션이면 <html> 에 붙는 속성. 첫 페인트 전에 붙여 배너 높이 CSS 변수를 0으로 만든다. */
export const BETA_BANNER_DISMISSED_ATTR = 'data-beta-banner-dismissed';

/**
 * 첫 페인트 전에 실행하는 인라인 스크립트. 배너를 닫은 세션이면 <html> 에 속성을 붙여
 * 배너 자리(--beta-banner-h)를 처음부터 0으로 잡는다. 이게 없으면 서버 렌더의 배너가
 * hydration 뒤 사라지며 헤더가 위로 튄다 (#438).
 */
export const BETA_BANNER_INIT_SCRIPT = `try{if(sessionStorage.getItem('${BETA_BANNER_STORAGE_KEY}'))document.documentElement.setAttribute('${BETA_BANNER_DISMISSED_ATTR}','')}catch(e){}`;
