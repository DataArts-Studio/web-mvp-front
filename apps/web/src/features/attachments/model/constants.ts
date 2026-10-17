export const ATTACHMENT_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_CASE: 10,
  ALLOWED_TYPES: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALLOWED_EXTENSIONS: '.png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx',
} as const;

export const BUCKET_NAME = 'test-attachments';

// 서명 URL 유효 시간. 목록 재조회 주기(ATTACHMENT_URL_REFRESH_MS)보다 길어야 화면의 URL 이 만료되지 않는다.
export const ATTACHMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;
export const ATTACHMENT_URL_REFRESH_MS = 50 * 60 * 1000;
