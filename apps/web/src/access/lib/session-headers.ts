/**
 * 미들웨어 → 프로젝트 레이아웃으로 넘기는 내부 요청 헤더 (엣지·서버 공용, 의존성 없음).
 *
 * 미들웨어는 엣지에서 DB 를 조회할 수 없어 서명·만료·형식만 본다. 비밀번호 변경·삭제로 폐기된
 * 세션은 레이아웃이 DB 와 대조해 접근 페이지로 보낸다. 미들웨어는 클라이언트가 보낸 같은 이름의
 * 헤더를 항상 지우고, 보호 경로를 통과한 요청에만 이 헤더를 붙인다.
 */
export const SESSION_CHECK_HEADER = 'x-testea-session-check';
export const SESSION_PATH_HEADER = 'x-testea-pathname';
