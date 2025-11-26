/* ────────────────────────────────────────
 * 인증 없어도 접근 가능한 페이지
 * ────────────────────────────────────────*/
const PUBLIC = {
  ROOT: '/',
  DOCS: '/docs',
  LANDING: '/landing',
} as const;

/* ────────────────────────────────────────
 * 인증 필요 - name: 프로젝트 이름
 * (MVP에서는 세션 대신 UUID 프로젝트 같은 역할)
 * ────────────────────────────────────────*/
const PRIVATE = {
  PROJECT: '/project',
  PROJECT_DETAIL: (name: string) => `/project/${name}`,
  MILESTONE: (name: string) => `/project/${name}/milestone`,
  SUITE: (name: string) => `/project/${name}/suite`,
  CASE: (name: string) => `/project/${name}/case`,
} as const;

/* ────────────────────────────────────────
 * Next.js Route Handlers (API)
 * ────────────────────────────────────────*/
const API = {
  PROJECT: '/api/project',
  PROJECT_DETAIL: (projectId: string) => `/api/project/${projectId}`,
  MILESTONE: '/api/milestone',
  SUITE: '/api/suite',
  CASE: '/api/case',
} as const;

/* ────────────────────────────────────────
 * 정적 자원 (SVG, 이미지, 등)
 * ────────────────────────────────────────*/
const RESOURCE = {
  ICONS: '/icons',
  LOGOS: '/logos',
} as const;

const ROUTES = {
  PUBLIC,
  PRIVATE,
  API,
  RESOURCE,
} as const;

export { ROUTES };
