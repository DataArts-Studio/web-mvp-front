type DateInput = Date | string | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return null;
  return d;
}

/** 'YYYY-MM-DD' */
export function formatDate(date: DateInput, fallback = '-'): string {
  const d = toDate(date);
  if (!d) return fallback;
  return d.toISOString().split('T')[0];
}

/** '2025. 01. 15. 14:30' (ko-KR locale) */
export function formatDateTime(date: DateInput, fallback = '-'): string {
  const d = toDate(date);
  if (!d) return fallback;
  return d.toLocaleString('ko-KR', {
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
  return d.toLocaleDateString('ko-KR');
}

/** '2025. 1. 15.' (ko-KR toLocaleDateString) */
export function formatDateKR(date: DateInput, fallback = '-'): string {
  const d = toDate(date);
  if (!d) return fallback;
  return d.toLocaleDateString('ko-KR');
}
