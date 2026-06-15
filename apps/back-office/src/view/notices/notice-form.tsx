'use client';

import { useActionState } from 'react';

import Link from 'next/link';

import { type NoticeFormState } from '@/features/notices/api/actions';
import {
  CATEGORY_LABELS,
  NOTICE_CATEGORIES,
  NOTICE_SEVERITIES,
  SEVERITY_LABELS,
} from '@/features/notices/model/validation';
import type { AdminAnnouncement } from '@testea/db';

type NoticeAction = (prev: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;

const fieldClass =
  'border-border text-text-primary placeholder:text-text-secondary rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#155DFC]';
const labelClass = 'text-text-primary text-sm font-medium';

/** ISO(UTC) → datetime-local 입력값(YYYY-MM-DDTHH:mm, 로컬). */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NoticeForm({
  action,
  initial,
  submitLabel,
}: {
  action: NoticeAction;
  initial?: AdminAnnouncement;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<NoticeFormState, FormData>(action, {});
  const errors = state.errors ?? {};

  return (
    <form
      action={formAction}
      className="border-border flex flex-col gap-5 rounded-xl border bg-white p-6"
    >
      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errors.form}</p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className={labelClass}>
          제목
        </label>
        <input
          id="title"
          name="title"
          defaultValue={initial?.title}
          maxLength={80}
          className={fieldClass}
          placeholder="공지 제목 (최대 80자)"
        />
        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="body" className={labelClass}>
          본문
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={initial?.body}
          rows={6}
          maxLength={2000}
          className={`${fieldClass} resize-y`}
          placeholder="본문 (마크다운 지원, 최대 2000자)"
        />
        {errors.body && <p className="text-xs text-red-600">{errors.body}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className={labelClass}>
            카테고리
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.category ?? 'notice'}
            className={fieldClass}
          >
            {NOTICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="severity" className={labelClass}>
            심각도
          </label>
          <select
            id="severity"
            name="severity"
            defaultValue={initial?.severity ?? 'info'}
            className={fieldClass}
          >
            {NOTICE_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>
          {errors.severity && <p className="text-xs text-red-600">{errors.severity}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="publishedAt" className={labelClass}>
            시작 시각
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.publishedAt)}
            className={fieldClass}
          />
          <span className="text-text-secondary text-xs">비우면 즉시 시작</span>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="expiresAt" className={labelClass}>
            종료 시각
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.expiresAt)}
            className={fieldClass}
          />
          <span className="text-text-secondary text-xs">비우면 무기한</span>
          {errors.expiresAt && <p className="text-xs text-red-600">{errors.expiresAt}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-text-primary flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="showAsPopup"
            defaultChecked={initial?.showAsPopup ?? false}
            className="size-4 accent-[#2563eb]"
          />
          <span>팝업으로 노출 (첫 진입 시 모달)</span>
        </label>
        <label className="text-text-primary flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={initial?.pinned ?? false}
            className="size-4 accent-[#2563eb]"
          />
          <span>알림센터 상단 고정</span>
        </label>
        <p className="text-text-secondary text-xs">
          상단 배너는 심각도 &lsquo;긴급&rsquo;을 선택하면 노출됩니다.
        </p>
      </div>

      <div className="border-border flex items-center justify-end gap-2 border-t pt-5">
        <Link
          href="/notices"
          className="text-text-secondary hover:text-text-primary rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-100"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {pending ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
