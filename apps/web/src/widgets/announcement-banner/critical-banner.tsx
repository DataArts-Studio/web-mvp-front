import { connection } from 'next/server';

import { getCriticalAnnouncement } from '@testea/db';

import { CriticalBannerClient } from './critical-banner-client';

/**
 * 활성 critical 공지가 있을 때만 상단 배너를 렌더한다. 없으면 null.
 *
 * 서버 컴포넌트에서 직접 DB 를 조회해 SSR 초기 페인트에 포함시킨다 (flash 방지).
 * 닫기 / 세션 상태는 클라이언트 컴포넌트(`CriticalBannerClient`) 에서 처리.
 */
export async function CriticalBanner() {
  // 정적 프리렌더에 배너 상태가 빌드 시점으로 고정되지 않도록 요청 단위 동적 렌더링을
  // 강제한다. 새 critical 공지 등록·만료가 다음 배포 전에도 즉시 반영된다.
  await connection();

  let announcement: Awaited<ReturnType<typeof getCriticalAnnouncement>> = null;
  try {
    announcement = await getCriticalAnnouncement();
  } catch (error) {
    // DB 장애 시 배너 노출 실패가 페이지 전체를 무너뜨리지 않도록 swallow.
    // 운영 알림이 우선이므로 에러 자체는 Sentry/log 로 흘려보낸다.
    console.error('[CriticalBanner] failed to fetch critical announcement', error);
    return null;
  }

  if (!announcement) return null;

  return (
    <CriticalBannerClient
      announcementId={announcement.id}
      label={CATEGORY_LABELS[announcement.category] ?? '공지'}
      title={announcement.title}
      excerpt={excerptOf(announcement.body)}
    />
  );
}

/**
 * 카테고리별 좌측 라벨. severity = critical 한정으로 노출되므로 톤은 모두 강조.
 */
const CATEGORY_LABELS: Record<string, string> = {
  feature: '신규 기능',
  maintenance: '점검',
  policy: '정책',
  event: '이벤트',
  notice: '공지',
};

function excerptOf(body: string): string {
  const firstLine = body.split('\n').find((line) => line.trim().length > 0) ?? body;
  return firstLine.length > 80 ? `${firstLine.slice(0, 80).trim()}…` : firstLine.trim();
}
