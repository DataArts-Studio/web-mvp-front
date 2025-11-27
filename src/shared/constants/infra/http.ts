/* ────────────────────────────────────────
 * HTTP Status Code
 * ────────────────────────────────────────*/
const SUCCESS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
} as const;

const REDIRECTION = {
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
} as const;

const CLIENT = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
} as const;

const SERVER = {
  INTERNAL: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  UNAVAILABLE: 503,
  TIMEOUT: 504,
} as const;

/* ────────────────────────────────────────
 * HTTP Status 상수
 * ────────────────────────────────────────*/
const STATUS = {
  SUCCESS,
  REDIRECTION,
  CLIENT,
  SERVER,
} as const;

/* ────────────────────────────────────────
 * HTTP Method 상수
 * ────────────────────────────────────────*/
const METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export const HTTP = {
  STATUS,
  METHOD,
} as const;
