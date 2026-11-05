/**
 * 날짜만 있는 값(DB date 컬럼)은 'YYYY-MM-DD' 문자열로 주고받는다.
 *
 * Date 로 옮기면 toISOString 의 UTC 변환 때문에 KST 에서 하루 앞당겨 저장되고,
 * 화면에서는 "오전 09:00" 같은 시각이 붙는다 (#381). 시간대 변환이 끼지 않도록
 * 사용자가 고른 연·월·일을 그대로 문자열로 만든다.
 */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** 로컬 시간대 기준 연·월·일로 'YYYY-MM-DD' 를 만든다. */
export const toDateOnly = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** 오늘(로컬 시간대) 날짜. */
export const todayDateOnly = (): string => toDateOnly(new Date());

/** 'YYYY-MM-DD' 이면서 실제 존재하는 날짜인지 확인한다. */
export const isValidDateOnly = (value: string): boolean => {
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/**
 * DB 나 이전 형식에서 온 값을 'YYYY-MM-DD' 로 맞춘다. date 컬럼 값은 이미 이 형식이고,
 * ISO 문자열이 오면 앞 10자리만 쓴다. 해석할 수 없으면 null.
 */
export const normalizeDateOnly = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const head = value.slice(0, 10);
  return isValidDateOnly(head) ? head : null;
};

/** 종료일이 시작일보다 앞서지 않는지. 둘 중 하나라도 없으면 검사하지 않는다. */
export const isDateRangeOrdered = (
  start: string | null | undefined,
  end: string | null | undefined
): boolean => !start || !end || start <= end;
