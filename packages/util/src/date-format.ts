type DateInput = Date | string | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * 서비스 기준 시간대. 서버는 UTC 로 돌기 때문에 기준을 정하지 않으면
 * KST 00:00~09:00 의 날짜와 하루·한 달 경계가 전날로 계산된다 (#388).
 */
export const APP_TIME_ZONE = 'Asia/Seoul';
const APP_UTC_OFFSET = '+09:00';

const dateOnlyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 서비스 시간대 기준 'YYYY-MM-DD'. */
export function toAppDateOnly(date: Date = new Date()): string {
  return dateOnlyFormatter.format(date);
}

/** 서비스 시간대 기준 오늘 0시. */
export function startOfAppDay(now: Date = new Date()): Date {
  return new Date(`${toAppDateOnly(now)}T00:00:00${APP_UTC_OFFSET}`);
}

/** 서비스 시간대 기준 이번 달 1일 0시. */
export function startOfAppMonth(now: Date = new Date()): Date {
  return new Date(`${toAppDateOnly(now).slice(0, 7)}-01T00:00:00${APP_UTC_OFFSET}`);
}

/** 'YYYY-MM-DD' (서비스 시간대 기준) */
export function formatDate(date: DateInput, fallback = '-'): string {
  const d = toDate(date);
  if (!d) return fallback;
  return toAppDateOnly(d);
}

/** '2025. 01. 15. 14:30' (ko-KR locale) */
export function formatDateTime(date: DateInput, fallback = '-'): string {
  const d = toDate(date);
  if (!d) return fallback;
  return d.toLocaleString('ko-KR', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** '방금 전', '5분 전', '2시간 전', '3일 전' */
export function formatRelativeTime(date: DateInput): string {
  const d = toDate(date);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR', { timeZone: APP_TIME_ZONE });
}

/** '2025. 1. 15.' (ko-KR toLocaleDateString) */
export function formatDateKR(date: DateInput, fallback = '-'): string {
  const d = toDate(date);
  if (!d) return fallback;
  return d.toLocaleDateString('ko-KR', { timeZone: APP_TIME_ZONE });
}
