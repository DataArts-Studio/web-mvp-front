'use client';

import { useAnnouncementDismiss } from './use-announcement-dismiss';

interface CriticalBannerClientProps {
  /** 노출할 공지의 id (dismiss 세션 상태와 짝지음) */
  announcementId: string;
  /** severity 좌측 라벨 (예: '점검', '긴급') */
  label: string;
  /** 짧은 헤드라인 */
  title: string;
  /** 1~2줄 요약 */
  excerpt?: string;
  /** 자세히 보기 링크 (현재는 알림센터가 없으므로 우선 미사용. 향후 모달 연결) */
  detailHref?: string;
}

/**
 * critical 공지를 페이지 최상단에 sticky 로 노출하는 배너.
 *
 * 세션 동안 닫기 가능 (영구 숨김 아님). 비로그인 사용자에게도 노출.
 * BetaBanner / DbOutagePopup 등 다른 알림과 z-index 충돌은 향후 별도 정리.
 */
export function CriticalBannerClient({
  announcementId,
  label,
  title,
  excerpt,
  detailHref,
}: CriticalBannerClientProps) {
  const { isVisible, dismiss } = useAnnouncementDismiss(announcementId);

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="중요 공지"
      className="bg-system-red/15 border-system-red/40 sticky top-0 z-15 flex items-center gap-3 border-b px-4 py-2 backdrop-blur-sm"
    >
      <span className="bg-system-red/25 text-system-red typo-caption-heading rounded-full px-2 py-0.5">
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="typo-label-heading text-text-1 truncate">
          {title}
          {excerpt && (
            <span className="typo-label-normal text-text-2 ml-2 hidden sm:inline">{excerpt}</span>
          )}
        </p>
      </div>
      {detailHref && (
        <a
          href={detailHref}
          className="typo-caption-heading text-text-1 hover:text-system-red shrink-0 underline-offset-4 hover:underline"
        >
          자세히 보기
        </a>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="공지 닫기"
        className="rounded-2 text-text-2 hover:bg-bg-3 hover:text-text-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
