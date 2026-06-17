import type { AnnouncementInput } from '@testea/db';

export const NOTICE_CATEGORIES = ['feature', 'maintenance', 'policy', 'event', 'notice'] as const;
export const NOTICE_SEVERITIES = ['info', 'warning', 'critical'] as const;

export const CATEGORY_LABELS: Record<(typeof NOTICE_CATEGORIES)[number], string> = {
  feature: '신규 기능',
  maintenance: '점검',
  policy: '정책',
  event: '이벤트',
  notice: '일반 공지',
};

export const SEVERITY_LABELS: Record<(typeof NOTICE_SEVERITIES)[number], string> = {
  info: '기본',
  warning: '강조',
  critical: '긴급(상단 배너)',
};

export type NoticeFieldErrors = Partial<
  Record<'title' | 'body' | 'category' | 'severity' | 'expiresAt' | 'form', string>
>;

export type ParseResult =
  | { ok: true; value: AnnouncementInput }
  | { ok: false; errors: NoticeFieldErrors };

/** datetime-local 입력(로컬 시각, 타임존 없음)을 ISO 로. 빈 값은 null. */
function toIso(raw: FormDataEntryValue | null): string | null {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * 공지 작성/편집 폼 FormData 를 검증해 AnnouncementInput 으로 변환한다.
 * FDD-BO03 유효성 규칙(제목 1~80, 본문 1~2000, start<end)을 따른다.
 */
export function parseNoticeForm(formData: FormData): ParseResult {
  const errors: NoticeFieldErrors = {};

  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const category = String(formData.get('category') ?? '');
  const severity = String(formData.get('severity') ?? '');
  const pinned = formData.get('pinned') === 'on';
  const showAsPopup = formData.get('showAsPopup') === 'on';
  const publishedAt = toIso(formData.get('publishedAt'));
  const expiresAt = toIso(formData.get('expiresAt'));

  if (title.length < 1) errors.title = '제목을 입력해주세요.';
  else if (title.length > 80) errors.title = '제목은 80자를 초과할 수 없습니다.';

  if (body.length < 1) errors.body = '본문을 입력해주세요.';
  else if (body.length > 2000) errors.body = '본문은 2000자를 초과할 수 없습니다.';

  if (!NOTICE_CATEGORIES.includes(category as (typeof NOTICE_CATEGORIES)[number]))
    errors.category = '카테고리를 선택해주세요.';

  if (!NOTICE_SEVERITIES.includes(severity as (typeof NOTICE_SEVERITIES)[number]))
    errors.severity = '심각도를 선택해주세요.';

  const startMs = publishedAt ? new Date(publishedAt).getTime() : Date.now();
  if (expiresAt && new Date(expiresAt).getTime() <= startMs)
    errors.expiresAt = '종료 시각은 시작 시각보다 이후여야 합니다.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      title,
      body,
      category: category as AnnouncementInput['category'],
      severity: severity as AnnouncementInput['severity'],
      pinned,
      showAsPopup,
      publishedAt,
      expiresAt,
    },
  };
}
