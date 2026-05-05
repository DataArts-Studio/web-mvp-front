/* ────────────────────────────────────────
 * 인증 없어도 접근 가능한 페이지
 * ────────────────────────────────────────*/
const PUBLIC = {
  ROOT: '/',
  DOCS: '/docs',
  LANDING: '/landing',
} as const;

/* ────────────────────────────────────────
 * 인증 필요 - slug: 프로젝트 식별자
 * 프로젝트 접근 시 비밀번호 인증 필요
 * ────────────────────────────────────────*/
const PRIVATE = {
  PROJECTS: '/projects',
  PROJECT_DETAIL: (slug: string) => `/projects/${slug}`,
  PROJECT_ACCESS: (slug: string) => `/projects/${slug}/access`,
  MILESTONE: (slug: string) => `/projects/${slug}/milestones`,
  SUITE: (slug: string) => `/projects/${slug}/suites`,
  CASE: (slug: string) => `/projects/${slug}/cases`,
  RUNS: (slug: string) => `/projects/${slug}/runs`,
  SETTINGS: (slug: string) => `/projects/${slug}/settings`,
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
