import { APP_TIME_ZONE } from '@testea/util';

/**
 * 백오피스 시각 입력·표시를 서비스 시간대(KST)로 고정한다 (#342).
 * 운영은 UTC 로 돌기 때문에 Date 의 로컬 메서드를 쓰면 KST 입력이 UTC 로 저장되고
 * 표시도 9시간 어긋난다. KST 는 서머타임이 없어 오프셋을 고정해도 된다.
 */
const KST_OFFSET = '+09:00';

const DATETIME_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export type KstParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** ISO 시각을 KST 기준 연·월·일·시·분·초로 나눈다. 잘못된 값은 null. */
export function toKstParts(iso: string): KstParts | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(partsFormatter.formatToParts(d).find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** datetime-local 입력값(YYYY-MM-DDTHH:mm)을 KST 로 해석해 ISO(UTC)로. 형식이 틀리면 null. */
export function kstInputToIso(value: string): string | null {
  if (!DATETIME_INPUT_PATTERN.test(value)) return null;
  const d = new Date(`${value}:00${KST_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO(UTC)를 datetime-local 입력값(YYYY-MM-DDTHH:mm, KST)으로. */
export function isoToKstInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const p = toKstParts(iso);
  if (!p) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
