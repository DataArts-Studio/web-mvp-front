import { connection } from 'next/server';

import { getActivePopupAnnouncement } from '@testea/db';

import { AnnouncementPopupClient } from './announcement-popup-client';

/**
 * 활성 popup 공지가 있으면 첫 진입 모달을 렌더한다. 없으면 null.
 *
 * 서버 컴포넌트에서 직접 DB 를 조회한다. 닫기/표시 상태는 클라이언트에서 처리.
 * critical 배너와 독립적으로, `show_as_popup=true` 공지를 대상으로 한다.
 */
const CATEGORY_LABELS: Record<string, string> = {
  feature: '신규 기능',
  maintenance: '점검 안내',
  policy: '정책',
  event: '이벤트',
  notice: '공지',
};

export async function AnnouncementPopup() {
  // 새 공지 발행·만료가 다음 배포 전에도 즉시 반영되도록 요청 단위 동적 렌더링 강제.
  await connection();

  let announcement: Awaited<ReturnType<typeof getActivePopupAnnouncement>> = null;
  try {
    announcement = await getActivePopupAnnouncement();
  } catch (error) {
    // DB 장애가 페이지 전체를 무너뜨리지 않도록 swallow (관측은 로그/Sentry).
    console.error('[AnnouncementPopup] failed to fetch popup announcement', error);
    return null;
  }

  if (!announcement) return null;

  return (
    <AnnouncementPopupClient
      announcementId={announcement.id}
      label={CATEGORY_LABELS[announcement.category] ?? '공지'}
      title={announcement.title}
      body={announcement.body}
    />
  );
}
