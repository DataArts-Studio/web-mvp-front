export const ATTACHMENT_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_CASE: 10,
  // SVG 는 스크립트를 담을 수 있어 받지 않는다. 서버는 매직 바이트로 형식을 다시 확인한다.
  ALLOWED_TYPES: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALLOWED_EXTENSIONS: '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx',
} as const;

export const BUCKET_NAME = 'test-attachments';

// 서명 URL 유효 시간. 목록 재조회 주기(ATTACHMENT_URL_REFRESH_MS)보다 길어야 화면의 URL 이 만료되지 않는다.
export const ATTACHMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;
export const ATTACHMENT_URL_REFRESH_MS = 50 * 60 * 1000;
